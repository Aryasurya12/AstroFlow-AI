# AstroFlow-AI — Operational Workflow

> **Document Version:** 0.1.0-draft  
> **Status:** Planning / Pre-Development  
> **Last Updated:** 2026-08-29  
> **Related Documents:** [TRD.md](./TRD.md) · [Schema Doc.md](./Schema%20Doc.md) · [PRD.md](./PRD.md)

---

## Table of Contents

1. [End-to-End Pipeline Workflow](#1-end-to-end-pipeline-workflow)
2. [Operator Journey](#2-operator-journey)
3. [AI Decision Flow](#3-ai-decision-flow)
4. [Protocol Validation Flow](#4-protocol-validation-flow)
5. [FSM State Diagram — Generic Example](#5-fsm-state-diagram--generic-example)
6. [Error & Anomaly Flow](#6-error--anomaly-flow)
7. [Voice Prompt Flow](#7-voice-prompt-flow)
8. [Logging Flow](#8-logging-flow)
9. [Recovery Flow](#9-recovery-flow)
10. [UI State Synchronization](#10-ui-state-synchronization)
11. [Session Lifecycle](#11-session-lifecycle)

---

## 1. End-to-End Pipeline Workflow

The following describes the full data and control flow from physical event to operator feedback, for a single frame-cycle.

```
┌──────────────────────────────────────────────────────────────────┐
│  PHYSICAL WORLD                                                  │
│                                                                  │
│  Operator performs action at experiment rig                      │
│       ↓                                                          │
│  Fixed payload camera captures frame                             │
└──────────────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────────┐
│  MODULE 1 — VIDEO INGESTION & PIPELINE                           │
│                                                                  │
│  OpenCV VideoCapture → Frame (BGR, 1920×1080)                    │
│       ├── Archive branch: NVENC H.264 → MP4 (async)             │
│       └── Inference branch: Frame + timestamp → Module 2         │
└──────────────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────────┐
│  MODULE 2 — COMPUTER VISION & HAR ENGINE                        │
│                                                                  │
│  [2A] YOLOv8s/YOLOv11s Object Detection (GPU)                   │
│       → DetectionResult: {person, vial, syringe, ...}            │
│                         ↓                                        │
│  [2B] MediaPipe Hands / YOLO-Pose (Hand + Keypoints)            │
│       → PoseResult: {hands[21 keypoints], body}                  │
│                         ↓                                        │
│  [2C] Coordinate Normalization                                   │
│       → Anchor-relative spatial coordinates                      │
│                         ↓                                        │
│  [2D] HOI Matrix Computation                                     │
│       → HOIMatrix: {hand-object pairs, distance, IoU, class}     │
│                         ↓                                        │
│  [2E] Event Abstraction Layer                                    │
│       HOIMatrix → ProtocolEvent: {event_name, confidence, ...}   │
└──────────────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────────┐
│  MODULE 3 — DETERMINISTIC EXPERIMENT VALIDATOR (FSM)             │
│                                                                  │
│  ProtocolEvent + protocol_rules.json → FSM validation            │
│       ↓                                                          │
│  Transition result:                                              │
│       Valid transition → FSM advances to next state             │
│       Anomaly detected → Anomaly classified + logged            │
└──────────────────────────────────────────────────────────────────┘
                         ↓
          ┌──────────────┬───────────────┬─────────────┐
          ↓              ↓               ↓             ↓
   [MODULE 4]     [MODULE 5]      [MODULE 6]     [MODULE 6]
   Offline Voice  Telemetry &     WebSocket      Video Feed
   Module         Log Engine      Push           Annotation
   TTS prompt     JSON + TXT      → Dashboard    + MJPEG
   → Speaker      audit write     update         → Dashboard
```

### 1.1 Concurrency Model

| Thread | Responsibility |
|---|---|
| `capture_thread` | Camera frame acquisition (Module 1) |
| `archive_thread` | NVENC encoding + MP4 write (Module 1) |
| `inference_thread` | Detection + Pose + HOI + Event abstraction (Module 2) |
| `fsm_thread` | FSM event processing (Module 3) |
| `voice_thread` | Async TTS queue consumer (Module 4) |
| `log_thread` | Async log write queue consumer (Module 5) |
| `api_process` | FastAPI + Uvicorn (Module 6) |

All inter-thread data transfer uses thread-safe queues. No shared mutable state outside queue primitives.

---

## 2. Operator Journey

### 2.1 Pre-Session

1. **System Administrator** powers on the Edge Inference Server.
2. System self-check runs automatically:
   - Camera connectivity verified.
   - GPU detected; CUDA runtime available.
   - ML models loaded successfully.
   - `protocol_rules.json` loaded and validated.
   - Audio output confirmed.
3. Mission Dashboard (Next.js) connects via local subnet to the FastAPI Async Hub.
4. Dashboard shows **INITIALIZING** state.
5. Once all modules are ready, the system transitions to **SYSTEM_IDLE**.
6. Dashboard shows **READY** state with the loaded protocol name displayed.

### 2.2 Session Start

1. Experiment Supervisor (or Operator) initiates a session via the Mission Dashboard (`POST /session/start`) or a hardware button (optional).
2. FSM transitions: `SYSTEM_IDLE → SESSION_INITIALIZING`.
3. Voice prompt: *"Session initialized. Protocol [protocol name] loaded. Ready when you are."*
4. FSM transitions: `SESSION_INITIALIZING → STEP_01_READY` (or first protocol step).
5. Voice prompt: *"Step one ready. [Step instruction]."*

### 2.3 During Active Experiment

For each protocol step:
1. Operator receives voice prompt describing the next action.
2. Operator performs the action at the experiment rig.
3. Camera captures the action.
4. Module 2 detects the interaction and produces a ProtocolEvent.
5. Module 3 FSM validates the event against the current expected state.
6. **If valid:**
   - FSM advances to next step state.
   - Protocol checklist on dashboard updates (previous step → ✓ Complete, next step → In Progress).
   - Voice prompt: *"[Step N] complete. Step [N+1] ready..."*
7. **If anomaly:**
   - Anomaly classified and logged.
   - Dashboard anomaly panel activates with severity indicator.
   - Voice warning delivered.
   - FSM remains in current state (or enters anomaly handling path per protocol rules).
8. Repeat for each step.

### 2.4 Session Pause (Operator-Initiated)

1. Operator signals pause via Mission Dashboard.
2. `POST /session/pause` → FSM enters `SESSION_PAUSED`.
3. Voice prompt: *"Session paused. Protocol state preserved."*
4. Dashboard shows **PAUSED** indicator.
5. Inference continues; no protocol events are submitted to FSM while paused.
6. Operator signals resume → FSM returns to last active step state.

### 2.5 Session Completion

1. Final protocol step completed.
2. FSM transitions to `SESSION_COMPLETE`.
3. Voice prompt: *"Protocol complete. All steps verified."*
4. Dashboard shows completion summary with step list and any logged anomalies.
5. All logs are flushed and closed.
6. Video archive finalized.
7. System returns to `SYSTEM_IDLE` upon operator acknowledgment.

---

## 3. AI Decision Flow

This section describes how a physical action by the operator becomes a recognized protocol event.

### 3.1 Step-by-Step: *"Operator picks up a vial"*

```
PHYSICAL:  Operator's gloved hand moves toward and grips the vial

CAMERA:    Frame captured at t₀

[Module 2A — Object Detection]
  → Person detected: confidence 0.96
  → Vial detected: bbox=[420, 310, 480, 390], confidence 0.91
  → Gloves detected: bbox=[400, 290, 510, 400], confidence 0.84

[Module 2B — Hand Tracking]
  → Right hand detected: 21 keypoints
  → Wrist position: pixel (455, 380)
  → Index finger tip: pixel (465, 325)

[Module 2C — Coordinate Normalization]
  → Wrist normalized: (0.47, 0.72) relative to rack anchor
  → Vial center normalized: (0.49, 0.68)

[Module 2D — HOI Matrix]
  → Hand-Vial pair:
      distance_normalized: 0.04          ← very close
      bbox_iou: 0.31                     ← significant overlap
      interaction_class: "hold_object"   ← threshold met
      confidence: 0.88
      duration_frames: 12                ← sustained over 12 frames

[Module 2E — Event Abstraction]
  → HOI entry mapped to protocol event name: "PICK_UP_VIAL"
  → ProtocolEvent emitted:
      event_name: "PICK_UP_VIAL"
      confidence: 0.88
      objects_involved: ["vial"]

[Module 3 — FSM]
  → Current state: STEP_01_READY
  → Expected event for STEP_01_READY: "PICK_UP_VIAL"
  → Received: "PICK_UP_VIAL" ← MATCH
  → Transition: STEP_01_READY → STEP_01_COMPLETE
  → Transition logged
  → Voice prompt triggered: "Step one complete."
```

### 3.2 Confidence Filtering Policy

Low-confidence detections are handled as follows:

| Confidence Range | Action |
|---|---|
| ≥ configured threshold | Normal processing |
| Below threshold | Detection logged at DEBUG/WARNING level; not submitted to HOI engine |
| Borderline (configurable margin) | Detection included with LOW_CONFIDENCE flag; HOI computed but flagged |

Low-confidence HOI events do **not** advance the FSM. They are logged for later analysis.

### 3.3 Temporal Consistency

Single-frame detections are not sufficient to trigger a protocol event. The Event Abstraction Layer requires:
- Minimum consecutive frame count (`min_duration_frames`) before emitting a ProtocolEvent.
- This prevents transient false detections (e.g., hand briefly near vial during reach) from triggering unwanted FSM transitions.

Configurable per interaction type in `protocol_rules.json`.

---

## 4. Protocol Validation Flow

### 4.1 Valid Action

```
FSM State: STEP_02_READY
Expected event: "INSERT_SYRINGE_TO_VIAL"
Received event: "INSERT_SYRINGE_TO_VIAL" (confidence 0.92)

→ FSM validates: expected event matches received event
→ Timing check: event received within step time window ✓
→ Transition: STEP_02_READY → STEP_02_COMPLETE
→ Log: TransitionRecord{type=VALID}
→ Voice: "Step two complete. Proceed to step three."
→ Dashboard: Step 2 → ✓ Complete; Step 3 → In Progress
```

### 4.2 Invalid Action

```
FSM State: STEP_01_READY
Expected event: "PICK_UP_VIAL"
Received event: "PICK_UP_SYRINGE"  ← wrong object

→ FSM validates: received event does not match any valid transition from STEP_01_READY
→ Anomaly classified: INVALID_ACTION
→ FSM stays in: STEP_01_READY
→ Log: TransitionRecord{type=ANOMALY, anomaly_type=INVALID_ACTION}
→ Voice: "Warning: incorrect action detected. Please pick up the vial."
→ Dashboard: Anomaly panel activates (ORANGE severity)
```

### 4.3 Skipped Step

```
FSM State: STEP_02_READY
Expected event for step 2: "POSITION_SYRINGE"
Received event: "ACTIVATE_OBSERVATION_PORT"  ← step 3 action

→ FSM detects: received event matches step 3, not step 2
→ Anomaly classified: SKIPPED_STEP (step 2 not completed)
→ FSM behavior: configurable — halt, warn, or allow (per protocol_rules.json)
→ Log: ANOMALY / SKIPPED_STEP
→ Voice: "Warning: step two may have been skipped. Verify vial is positioned correctly."
→ Dashboard: Anomaly panel — RED severity
```

### 4.4 Out-of-Order Action

```
FSM State: STEP_04_READY
Received event: "RETURN_VIAL"  ← step 6 action (future step) received too early

→ FSM detects: received event is a valid event but for a future state
→ Anomaly classified: OUT_OF_ORDER
→ Log: ANOMALY / OUT_OF_ORDER
→ Voice: "Warning: action is out of sequence."
→ Dashboard: Anomaly panel — ORANGE severity
```

### 4.5 Premature Action

```
FSM State: STEP_03_READY
Step 3 has a minimum dwell time of 30 seconds
Received event: "COMPLETE_OBSERVATION" at t+8s (too early)

→ FSM detects: timing constraint not satisfied
→ Anomaly classified: PREMATURE_ACTION
→ Log: ANOMALY / PREMATURE_ACTION (elapsed: 8s, required: 30s)
→ Voice: "Warning: action performed too early. Hold position for observation."
→ Dashboard: Countdown timer shown
```

### 4.6 Repeated Action

```
FSM State: STEP_01_COMPLETE (already completed)
Received event: "PICK_UP_VIAL" again

→ FSM detects: STEP_01 already completed
→ Anomaly classified: REPEATED_ACTION
→ Log: ANOMALY / REPEATED_ACTION
→ Voice: "Warning: step one has already been completed."
→ Dashboard: Anomaly notification
```

### 4.7 Step Timeout

```
FSM State: STEP_02_READY
Maximum allowed time for STEP_02: 60 seconds
Time elapsed: 62 seconds, no completion event received

→ FSM detects: step timeout
→ Anomaly classified: STEP_TIMEOUT
→ FSM behavior: configurable — auto-advance, flag, or halt
→ Log: ANOMALY / STEP_TIMEOUT
→ Voice: "Warning: step two time limit exceeded."
→ Dashboard: Anomaly panel — RED severity; step timer shows overrun
```

---

## 5. FSM State Diagram — Generic Example

> **Important:** The following is a **generic, illustrative example** of an FSM structure for a 3-step protocol. Real protocol states are loaded from `protocol_rules.json` and will vary per experiment. No specific experiment procedure is assumed by the FSM engine itself.

```
                  ┌─────────────────┐
                  │   SYSTEM_IDLE   │
                  └────────┬────────┘
                           │ session.start
                           ▼
                  ┌─────────────────────┐
                  │ SESSION_INITIALIZING │
                  └────────┬────────────┘
                           │ system.ready
                           ▼
                  ┌─────────────────┐
             ┌──► │  STEP_01_READY  │
             │    └────────┬────────┘
             │             │ PICK_UP_VIAL (expected event)
             │             ▼
             │    ┌──────────────────┐
             │    │ STEP_01_COMPLETE │
             │    └────────┬─────────┘
             │             │ auto-advance or next-step trigger
             │             ▼
             │    ┌─────────────────┐
             │    │  STEP_02_READY  │
             │    └────────┬────────┘
             │             │ INSERT_SYRINGE (expected event)
             │             ▼
             │    ┌──────────────────┐
             │    │ STEP_02_COMPLETE │
             │    └────────┬─────────┘
             │             │
             │             ▼
             │    ┌─────────────────┐
             │    │  STEP_03_READY  │
             │    └────────┬────────┘
             │             │ ACTIVATE_OBSERVATION_PORT (expected event)
             │             ▼
             │    ┌──────────────────┐
             │    │ STEP_03_COMPLETE │
             │    └────────┬─────────┘
             │             │ protocol.done
             │             ▼
             │    ┌───────────────────┐
             └────│ SESSION_COMPLETE  │
                  └───────────────────┘

  ─ ─ ─ ─ ─ GLOBAL TRANSITIONS (from any step state) ─ ─ ─ ─ ─

  Any state  →  SESSION_PAUSED      (trigger: session.pause)
  SESSION_PAUSED  →  [previous state]  (trigger: session.resume)

  Any state  →  SESSION_ABORTED     (trigger: session.abort | CRITICAL anomaly)
  Any state  →  CAMERA_DISCONNECTED  (trigger: camera.lost)
  CAMERA_DISCONNECTED  →  [reconnect to previous state]  (trigger: camera.restored)
  Any state  →  SYSTEM_ERROR        (trigger: unhandled exception)
```

### 5.1 FSM Configuration in `protocol_rules.json`

The FSM is built programmatically at startup from `protocol_rules.json`. No step name, expected event, or transition is hardcoded in the FSM module source.

```json
{
  "states": [
    {"name": "STEP_01_READY", "step_index": 1},
    {"name": "STEP_01_COMPLETE", "step_index": 1},
    {"name": "STEP_02_READY", "step_index": 2}
  ],
  "transitions": [
    {
      "trigger": "PICK_UP_VIAL",
      "source": "STEP_01_READY",
      "dest": "STEP_01_COMPLETE",
      "conditions": ["confidence_above_threshold"],
      "timing": {"min_seconds": 0, "max_seconds": 120}
    }
  ]
}
```

---

## 6. Error & Anomaly Flow

### 6.1 Anomaly Detection → Response Chain

```
Anomaly condition detected by FSM
    ↓
AnomalyRecord created:
    - anomaly_type
    - severity (WARNING | ERROR | CRITICAL)
    - affected_step
    - trigger_event
    - expected_event
    - recommended_action
    ↓
Immediately:
    ├── Module 5: AnomalyRecord written to JSON event log (async)
    ├── Module 4: Voice prompt queued (priority insert for CRITICAL)
    └── Module 6: Anomaly WebSocket message pushed to Mission Dashboard

Mission Dashboard receives anomaly:
    ├── Anomaly panel activates with severity color
    ├── Affected step highlighted in protocol checklist
    ├── Anomaly event appended to event terminal
    └── (Optional) Audio alert from browser if voice module not configured
```

### 6.2 Severity Levels

| Severity | Color Code | Examples | Response |
|---|---|---|---|
| WARNING | Orange | Out-of-order action, repeated action | Log, voice warn, dashboard notify |
| ERROR | Red | Skipped step, invalid action, timeout | Log, voice warn, dashboard alert, step highlight |
| CRITICAL | Flashing Red | Unrecoverable protocol deviation, system failure | Log, voice alert, session abort recommended |

### 6.3 Camera Disconnection

```
Camera feed lost (Module 1 detects no frames)
    ↓
FSM: → CAMERA_DISCONNECTED
Voice: "Warning: camera connection lost. Experiment monitoring suspended."
Dashboard: DISCONNECTED state banner
All inference suspended
Reconnect polling: Module 1 attempts reconnect every 5 seconds (configurable)

On reconnect:
FSM: → [previous protocol state]
Voice: "Camera reconnected. Monitoring resumed at step [N]."
Dashboard: Previous state restored
```

---

## 7. Voice Prompt Flow

```
Triggering condition:
    - FSM state entry (step ready, step complete)
    - Anomaly event
    - Session lifecycle event

    ↓
Module 4: VoicePromptRequest created:
    - text: looked up from protocol_rules.json voice_prompts
    - priority: NORMAL | HIGH | CRITICAL
    - interrupt_current: bool (CRITICAL only)

    ↓
Async voice queue:
    - CRITICAL: inserted at front; interrupts current synthesis if supported
    - NORMAL: appended to back
    - If queue full + NORMAL priority: oldest NORMAL discarded

    ↓
Voice worker thread:
    - Dequeues request
    - Piper TTS synthesis: text → .wav audio
    - Audio played via system audio interface → local speaker

    ↓
Module 5: VoiceEvent logged:
    - text
    - trigger_event
    - timestamp
    - synthesis_latency_ms
```

---

## 8. Logging Flow

```
Any module generates a loggable event:
    ↓
Log message constructed (Python dict / dataclass):
    {
        log_id, session_id, timestamp_iso,
        source_module, event_type, severity,
        fsm_state, data: {}
    }
    ↓
Async log queue (thread-safe, bounded)
    ↓
Log writer thread (Module 5):
    ├── Append to: logs/session_{id}_events.json  (JSONL)
    └── Append to: logs/session_{id}_audit.txt    (human-readable)

At session end:
    ├── Flush all pending log entries
    ├── Write session summary record
    └── Close file handles

Log files are NEVER opened in overwrite mode during a session.
Log files are NEVER modified after session close.
```

---

## 9. Recovery Flow

### 9.1 Operator-Initiated Recovery (Step Retry)

If the operator needs to retry a step (e.g., object was dropped), the supervisor can issue a retry command from the Mission Dashboard:

```
Supervisor: POST /session/retry_step?step_id=STEP_02
    ↓
FSM: Transition to STEP_02_READY (re-entry)
Voice: "Step two reset. Please repeat the action."
Dashboard: Step 2 returns to In Progress state
Log: RetryRecord logged with supervisor acknowledgment
```

### 9.2 Protocol Abort and Restart

```
Supervisor or Operator: POST /session/abort
    ↓
FSM: → SESSION_ABORTED
Voice: "Session aborted. Protocol halted."
All logs flushed and closed.
Video archive finalized.
System: → SYSTEM_IDLE
Dashboard: Abort confirmation displayed
```

To restart from the beginning:
```
POST /session/start  (with same or new protocol)
```

### 9.3 System Error Recovery

```
Unhandled exception in inference pipeline:
    ↓
Exception caught by global handler
FSM: → SYSTEM_ERROR
Voice: "System error detected. Please check the edge server."
Dashboard: SYSTEM_ERROR banner
Logs: Full exception traceback written

Recovery: Manual restart of the inference server
Session state is lost; only logs and video archive are preserved.
```

---

## 10. UI State Synchronization

The Mission Dashboard maintains its display state from two real-time data sources:

| Source | Data Type | Transport | Update Frequency |
|---|---|---|---|
| `/video_feed` (MJPEG) | Annotated video frames | HTTP multipart | Per inference frame |
| `/ws/telemetry` (WebSocket) | Telemetry, events, anomalies | WebSocket JSON | ~1 Hz telemetry; immediate for events |

### 10.1 Dashboard State Machine (Frontend)

```
DISCONNECTED
    ↓ (WebSocket connected)
CONNECTING
    ↓ (SYSTEM_STATUS: INITIALIZING)
INITIALIZING
    ↓ (SYSTEM_STATUS: READY)
READY (awaiting session start)
    ↓ (PROTOCOL_EVENT: session started)
RUNNING (active protocol execution)
    ↓
    ├── (ANOMALY message) → WARNING or ANOMALY overlay active
    ├── (SYSTEM_STATUS: PAUSED) → PAUSED overlay
    ├── (SYSTEM_STATUS: DISCONNECTED) → DISCONNECTED banner
    └── (PROTOCOL_EVENT: session complete) → COMPLETE view
```

### 10.2 Video Feed Annotation Layer

The annotated MJPEG stream from `/video_feed` contains the following overlays applied in Module 6:

| Overlay Element | Source Data |
|---|---|
| Object bounding boxes + labels | Module 2A detection results |
| Confidence score labels | Module 2A |
| Hand skeleton / keypoint overlay | Module 2B pose results |
| HOI interaction indicators (lines / glow) | Module 2D HOI matrix |
| FSM state text (corner HUD) | Module 3 current state |
| Anomaly indicator (border flash) | Module 3 anomaly state |
| Recording indicator + elapsed | Module 1 archive state |
| Inference FPS | Module 2 FPS counter |

---

## 11. Session Lifecycle

```
SYSTEM START
    ↓
Self-check (camera, GPU, models, config, audio)
    ↓
SYSTEM_IDLE  ←──────────────────────────────────┐
    ↓ session.start                              │
SESSION_INITIALIZING                             │
    ↓ system.ready                               │
STEP_01_READY                                    │
    ↓ protocol execution...                      │
    │                                            │
    ├─ Normal completion ──►  SESSION_COMPLETE    │
    │                              ↓             │
    │                    Session cleanup          │
    │                    Log flush                │
    │                    Archive close            │
    │                              └─────────────┘
    │
    ├─ Operator abort ───► SESSION_ABORTED
    │                              ↓
    │                    Session cleanup ─────────┘
    │
    └─ Critical failure ─► SYSTEM_ERROR
                                   ↓
                         Manual restart required
```

---

*End of Workflow — AstroFlow-AI v0.1.0-draft*

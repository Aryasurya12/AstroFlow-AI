# AstroFlow-AI — Technical Requirements Document (TRD)

> **Document Version:** 0.1.0-draft  
> **Status:** Planning / Pre-Development  
> **Last Updated:** 2026-08-29  
> **Related Documents:** [PRD.md](./PRD.md) · [workflow.md](./workflow.md) · [Schema Doc.md](./Schema%20Doc.md) · [Implementation Doc.md](./Implementation%20Doc.md)

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Hardware Specification](#2-hardware-specification)
3. [Software Stack](#3-software-stack)
4. [Module 1 — Video Ingestion & Pipeline](#4-module-1--video-ingestion--pipeline)
5. [Module 2 — Computer Vision & HAR Engine](#5-module-2--computer-vision--har-engine)
6. [Module 3 — Deterministic Experiment Validator (FSM)](#6-module-3--deterministic-experiment-validator-fsm)
7. [Module 4 — Offline Voice Module](#7-module-4--offline-voice-module)
8. [Module 5 — Telemetry & Log Engine](#8-module-5--telemetry--log-engine)
9. [Module 6 — FastAPI Async Hub](#9-module-6--fastapi-async-hub)
10. [AI Pipeline — End-to-End Data Flow](#10-ai-pipeline--end-to-end-data-flow)
11. [API Reference](#11-api-reference)
12. [Performance Requirements](#12-performance-requirements)
13. [Deployment Architecture](#13-deployment-architecture)
14. [Dependencies](#14-dependencies)
15. [Constraints](#15-constraints)
16. [Technology Trade-offs](#16-technology-trade-offs)

---

## 1. System Architecture Overview

AstroFlow-AI is organized as a pipeline of six discrete backend modules executing on a single NVIDIA RTX 3050 Edge Inference Server. Each module has a defined input contract, internal processing responsibility, and output contract. Modules communicate through internal Python queues and/or shared memory structures, minimizing inter-process latency.

```
PHYSICAL EXPERIMENT RIG / PAYLOAD
        ↓
FIXED PAYLOAD CAMERA  (USB / CSI, 1080p @ 60 FPS)
        ↓
┌──────────────────────────────────────────────────────────────┐
│               EDGE INFERENCE SERVER (RTX 3050)               │
│                                                              │
│  Module 1: Video Ingestion & Pipeline                        │
│      OpenCV VideoCapture → NVENC H.264 → MP4 Archive         │
│      MJPEG / RTSP / WebRTC local bridge                      │
│                  ↓ (frame buffer)                            │
│  Module 2: Computer Vision & HAR Engine                      │
│      YOLOv8s/YOLOv11s Object Detection                       │
│      MediaPipe Hands / YOLO-Pose                             │
│      Coordinate Normalization (anchor-relative)              │
│      HOI Matrix (proximity, overlap, confidence)             │
│                  ↓ (interaction events)                      │
│  ── Event Abstraction Layer ──────────────────────────────── │
│      Named protocol events from raw HOI results              │
│                  ↓ (named events)                            │
│  Module 3: Deterministic Experiment Validator                │
│      Finite State Machine (transitions library)              │
│      protocol_rules.json                                     │
│      Sequence / Timing / Anomaly Validation                  │
│                  ↓ (state transitions / anomalies)           │
│  Module 4: Offline Voice Module                              │
│      Piper TTS → Local Speaker                               │
│      Pyttsx3 Fallback                                        │
│                                                              │
│  Module 5: Telemetry & Log Engine                            │
│      JSON Event Log / Flat Audit Trail                       │
│      System Metrics Collection                               │
│                                                              │
│  Module 6: FastAPI Async Hub                                 │
│      GET /video_feed  (MJPEG)                                │
│      WS  /ws/telemetry  (WebSocket)                          │
└──────────────────────────────────────────────────────────────┘
        ↓  (isolated local network)
MISSION DASHBOARD (Next.js + TypeScript)
        Live Video · Protocol Checklist · Telemetry · Logs
```

### 1.1 Architectural Invariants

The following invariants must be maintained across all development:

| Invariant | Description |
|---|---|
| PERCEPTION is not VALIDATION | The AI pipeline (Module 2) determines *what is happening*. The FSM (Module 3) determines *whether it is correct*. These must never be merged. |
| Protocol logic lives in config | No protocol-specific logic (step ordering, timing, allowed objects) shall appear in Module 2 source code. |
| Inference is non-blocking | The video ingestion and inference pipeline shall not be blocked by voice synthesis, API I/O, or logging operations. |
| Logging is append-only | Log files shall not be opened in write-overwrite mode during an active session. |
| Offline-first | No module in the core inference path shall make network calls outside the isolated local subnet. |

---

## 2. Hardware Specification

### 2.1 Edge Inference Server

| Component | Specification |
|---|---|
| GPU | NVIDIA RTX 3050 (Laptop or Desktop variant) |
| GPU Architecture | Ampere |
| GPU Memory | 4 GB or 8 GB GDDR6 (variant-dependent) |
| CUDA Support | CUDA 11.x / 12.x |
| TensorRT Support | Yes (Ampere generation) |
| NVENC | Supported — H.264 / H.265 hardware encoding |
| Host CPU | x86-64 (minimum 6-core recommended) |
| Host RAM | Minimum 16 GB system RAM recommended |
| Host Storage | SSD recommended for video archival throughput |
| OS | Linux (Ubuntu 22.04 LTS recommended) or Windows 11 |

> **Note:** VRAM headroom on the 4 GB variant requires careful model sizing. Running concurrent YOLOv8s and MediaPipe will require profiling. See [Section 12 — Performance Requirements](#12-performance-requirements).

### 2.2 Camera

| Property | Specification |
|---|---|
| Connection | USB 3.0 or CSI (platform-dependent) |
| Target Resolution | 1920 × 1080 (1080p) |
| Target Framerate | 60 FPS |
| Mounting | Fixed — payload rack mount; no pan/tilt required |
| Field of View | To cover full experiment workspace (to be determined per rig configuration) |
| Lens type | Wide-angle or standard, protocol-rig-appropriate |

### 2.3 Local Speaker

| Property | Specification |
|---|---|
| Connection | USB or 3.5mm audio jack |
| Purpose | Offline TTS voice prompt delivery |
| Positioning | Audible from experiment operator position |

### 2.4 Experiment Rig / Payload

- Physical workspace containing experiment equipment (vials, syringes, plunger, observation port, gloves, etc.).
- Defined physical bounding anchor (reference marker or workspace edge) used for coordinate normalization.
- Objects within the rig must be representable by the trained object detection model.

### 2.5 Optional Networking (Local Subnet Only)

| Property | Specification |
|---|---|
| Network type | Isolated Ethernet LAN or local Wi-Fi |
| Purpose | MJPEG stream and WebSocket telemetry to Mission Dashboard display |
| External connectivity | NOT required; NOT permitted in core inference path |

---

## 3. Software Stack

### 3.1 Backend

| Layer | Technology | Role |
|---|---|---|
| Runtime | Python 3.10+ | Backend inference server |
| Video capture | OpenCV (cv2) `VideoCapture` | Camera frame acquisition |
| Video encoding | OpenCV + NVENC (via FFmpeg backend) | H.264 hardware archival |
| Object detection | Ultralytics YOLOv8s or YOLOv11s | Experiment object and person detection |
| Pose/hand tracking | MediaPipe Hands, MediaPipe Pose or YOLO-Pose | Keypoint and hand tracking |
| HOI engine | Custom Python (numpy, scipy) | HOI matrix computation |
| Event abstraction | Custom Python | HOI → named event mapping |
| Protocol FSM | Python `transitions` library | Finite State Machine |
| Protocol config | JSON (`protocol_rules.json`) | Configurable protocol rules |
| Voice (primary) | Piper TTS | Offline neural TTS |
| Voice (fallback) | Pyttsx3 | System TTS fallback |
| API framework | FastAPI (async) | REST + WebSocket hub |
| ASGI server | Uvicorn | FastAPI server process |
| Telemetry | Custom Python + pynvml | GPU/system metrics |
| Logging | Python `logging` + JSON | Structured event log |
| GPU acceleration | PyTorch + CUDA | Model inference |
| Model optimization | TensorRT (optional, Phase 15+) | Inference acceleration |

### 3.2 Frontend

| Layer | Technology | Role |
|---|---|---|
| Framework | Next.js 14+ (App Router) | Mission Dashboard SPA |
| Language | TypeScript | Type-safe frontend |
| Styling | Vanilla CSS / CSS Modules | Mission-control aesthetics |
| Video display | MJPEG `<img>` stream or WebRTC | Live annotated video viewport |
| Real-time data | Native WebSocket client | Telemetry and event stream |
| State management | React Context / Zustand | Dashboard state |
| Fonts | Google Fonts (offline-bundled) | Typography |

### 3.3 Tooling

| Tool | Purpose |
|---|---|
| Git | Version control |
| Docker (optional) | Containerized deployment on edge server |
| pytest | Backend unit and integration testing |
| Jest / Playwright | Frontend testing |
| CVAT / Label Studio | Dataset annotation |
| Weights & Biases (local mode) or TensorBoard | Training metrics (no cloud dependency) |

---

## 4. Module 1 — Video Ingestion & Pipeline

### 4.1 Responsibility

Module 1 is responsible for camera frame acquisition, concurrent hardware-accelerated video archival, and local stream delivery. It is the only module that directly interfaces with the camera hardware.

### 4.2 Architecture

```
Camera Hardware
    ↓
OpenCV VideoCapture (USB/CSI)
    ↓
Frame Buffer (thread-safe queue)
    ├── → Archive Branch: NVENC H.264 → MP4 (local storage)
    └── → Inference Branch: → Module 2
    └── → Stream Branch: MJPEG encoder → FastAPI /video_feed
```

### 4.3 Key Technical Choices

- **OpenCV VideoCapture** with V4L2 (Linux) or DirectShow (Windows) backend.
- **NVENC H.264 encoding** via OpenCV's FFmpeg backend or direct FFmpeg subprocess for archive branch.
- **Threaded architecture:** Frame capture runs in a dedicated thread; archive encoding runs in a separate thread to avoid blocking the inference pipeline.
- **Frame queue:** Bounded queue between capture and inference; if inference falls behind, older frames are dropped to prevent memory accumulation. Dropped frame events are logged.

### 4.4 Outputs

- **Frame:** BGR numpy array (H × W × 3), timestamp, frame index.
- **Archive file:** `recordings/session_{session_id}_{timestamp}.mp4`
- **MJPEG stream:** Per-frame JPEG bytes served via `/video_feed`

### 4.5 Configuration Parameters

```json
{
  "camera_index": 0,
  "resolution": [1920, 1080],
  "target_fps": 60,
  "archive_codec": "h264_nvenc",
  "archive_bitrate": "8M",
  "archive_path": "recordings/",
  "inference_frame_skip": 1
}
```

---

## 5. Module 2 — Computer Vision & HAR Engine

### 5.1 Responsibility

Module 2 processes raw camera frames through a multi-stage perception pipeline:
1. Object detection (experiment objects + person)
2. Hand/pose keypoint tracking
3. Coordinate normalization
4. HOI matrix computation
5. Event abstraction (HOI → named protocol events)

Module 2 outputs **named protocol events** — never raw FSM commands. It does not interpret protocol rules.

### 5.2 Human Activity Recognition (HAR) in Context

In AstroFlow-AI, HAR does not refer to generic activity recognition (walking, running, sitting). HAR refers to the recognition of **protocol-relevant interactions and actions** that can be mapped to meaningful experiment steps.

Recognized interaction types (configurable per experiment):

| Interaction Class | Description |
|---|---|
| `approach_object` | Hand/body spatial trajectory moving toward an experiment object |
| `reach_toward_object` | Hand keypoints moving within proximity zone of object bounding box |
| `touch_object` | Hand bounding box overlapping object bounding box above threshold |
| `hold_object` | Sustained overlap with consistent relative position over time |
| `pick_up_object` | Transition from touch to hold with vertical displacement |
| `transfer_object` | Object position change correlated with hand movement trajectory |
| `position_at_port` | Object bounding box centered near observation port bounding box |
| `insert_into_object` | Syringe-to-vial or similar object-object proximity + axis alignment |
| `return_object` | Object movement toward initial/rest position |
| `disengage_object` | Hand separation from previously held object |

These are examples of configurable interaction classes. The actual set for a given experiment is defined in `protocol_rules.json`.

### 5.3 Sub-Module 2A — Object Detection

| Property | Value |
|---|---|
| Model | YOLOv8s or YOLOv11s (custom fine-tuned) |
| Input | RGB frame (resized per model spec) |
| Output | List of: `{class_id, class_label, bbox_xyxy, confidence}` |
| Inference device | CUDA (RTX 3050) |
| Detection classes | Configurable; minimum: `person`, `vial`, `syringe`, `plunger`, `observation_port`, `gloves` |
| Confidence filtering | Detections below `min_confidence` threshold are flagged (not silently dropped) |

**Interface Contract:**
```python
DetectionResult = {
    "frame_id": int,
    "timestamp_ms": float,
    "detections": [
        {
            "class_id": int,
            "class_label": str,
            "bbox": [x1, y1, x2, y2],   # pixel coordinates
            "confidence": float
        }
    ]
}
```

### 5.4 Sub-Module 2B — Hand & Pose Tracking

| Property | Value |
|---|---|
| Primary | MediaPipe Hands (21 keypoints per hand) |
| Alternative | YOLO-Pose (17 COCO keypoints for full body) |
| Mode | Real-time, per-frame |
| Output | Normalized keypoint coordinates + visibility scores |
| Device | CPU (MediaPipe) or CUDA (YOLO-Pose) |

**Interface Contract:**
```python
PoseResult = {
    "frame_id": int,
    "timestamp_ms": float,
    "hands": [
        {
            "hand_id": int,
            "handedness": str,             # "Left" / "Right"
            "keypoints": [                  # 21 points
                {"id": int, "x": float, "y": float, "z": float, "visibility": float}
            ],
            "wrist_position_normalized": [float, float]
        }
    ],
    "body_keypoints": [...]               # Optional, from YOLO-Pose
}
```

### 5.5 Sub-Module 2C — Coordinate Normalization

All pixel-space coordinates from detection and pose results are normalized relative to a **payload rack bounding anchor**. This anchor is a defined region of the workspace (a physical reference marker or the rack boundary itself).

Normalization enables:
- Orientation-agnostic spatial reasoning (correct operation in microgravity postures).
- Consistent spatial thresholds regardless of camera zoom or position drift.
- Portability of interaction definitions across different physical rig configurations.

**Anchor Definition:**
```json
{
  "anchor_region": {
    "type": "bounding_box",
    "x1_pct": 0.05,
    "y1_pct": 0.05,
    "x2_pct": 0.95,
    "y2_pct": 0.95
  }
}
```

### 5.6 Sub-Module 2D — HOI Matrix

The HOI (Human-Object Interaction) matrix encodes pairwise spatial relationships between tracked hands and all detected experiment objects.

For each hand-object pair:
- **Euclidean distance** (normalized workspace coordinates)
- **Bounding box IoU / intersection ratio**
- **Interaction confidence** (composite score from distance + overlap + temporal consistency)
- **Interaction class** (from configurable classification thresholds)

**HOI Matrix Structure:**
```python
HOIMatrix = {
    "frame_id": int,
    "timestamp_ms": float,
    "interactions": [
        {
            "interaction_id": str,            # UUID per interaction event
            "hand_id": int,
            "object_label": str,
            "object_instance_id": int,
            "distance_normalized": float,     # 0.0 = touching, 1.0 = max workspace
            "iou": float,
            "interaction_class": str,         # e.g., "hold_object"
            "confidence": float,
            "duration_frames": int            # how many consecutive frames
        }
    ]
}
```

### 5.7 Sub-Module 2E — Event Abstraction Layer

The Event Abstraction Layer converts HOI matrix entries into **named protocol events** using a mapping defined in `protocol_rules.json`. This layer is the strict boundary between CV perception and protocol validation.

**Event structure:**
```python
ProtocolEvent = {
    "event_id": str,               # UUID
    "timestamp_ms": float,
    "event_name": str,             # e.g., "PICK_UP_VIAL", "POSITION_AT_PORT"
    "source_interaction_id": str,  # links back to HOI matrix entry
    "objects_involved": [str],
    "confidence": float,
    "metadata": {}                 # optional additional context
}
```

---

## 6. Module 3 — Deterministic Experiment Validator (FSM)

### 6.1 Responsibility

Module 3 receives named protocol events from Module 2's Event Abstraction Layer and validates them against the current experiment protocol state. It maintains the Finite State Machine that represents protocol progress.

**The FSM does not know anything about computer vision. It only knows about named events and protocol rules.**

### 6.2 Implementation

```python
# Technology
from transitions import Machine

# Protocol rules are loaded from protocol_rules.json at startup
# FSM states and transitions are constructed programmatically
# No protocol-specific code exists in Module 3 source
```

### 6.3 FSM States

Every FSM instance has at minimum the following system states plus the protocol-defined step states:

| System State | Description |
|---|---|
| `SYSTEM_IDLE` | System running; no active experiment session |
| `SESSION_INITIALIZING` | Protocol loaded; waiting for operator ready signal |
| `SESSION_ACTIVE` | Active protocol execution in progress |
| `SESSION_PAUSED` | Operator-initiated hold; FSM state preserved |
| `SESSION_COMPLETE` | All protocol steps successfully completed |
| `SESSION_ABORTED` | Experiment terminated by operator or critical anomaly |
| `SYSTEM_ERROR` | Internal system failure |
| `CAMERA_DISCONNECTED` | Camera feed lost |

Protocol step states are generated dynamically from `protocol_rules.json`.

### 6.4 Anomaly Classification

| Anomaly Type | Trigger Condition |
|---|---|
| `INVALID_ACTION` | Received event not expected in current state and not a valid alternative |
| `SKIPPED_STEP` | Valid step-N+2 event received while step N+1 has not been completed |
| `OUT_OF_ORDER` | Event corresponds to a future or already-completed step |
| `PREMATURE_ACTION` | Event received before the step's minimum timing constraint |
| `REPEATED_ACTION` | Same event received twice for a step that expects it once |
| `STEP_TIMEOUT` | Maximum step duration exceeded without completion event |
| `UNKNOWN_INTERACTION` | HOI event received that has no mapping in current protocol |

### 6.5 State Transition Record

Every state transition (valid or anomalous) produces a structured log entry:

```python
TransitionRecord = {
    "record_id": str,
    "session_id": str,
    "timestamp_iso": str,
    "from_state": str,
    "to_state": str,
    "trigger_event": str,
    "trigger_event_confidence": float,
    "transition_type": str,     # "VALID" / "ANOMALY"
    "anomaly_type": str | None,
    "voice_prompt_triggered": str | None
}
```

---

## 7. Module 4 — Offline Voice Module

### 7.1 Responsibility

Module 4 delivers voice prompts to the local speaker in response to FSM state transitions and anomaly events. All voice synthesis is performed locally — no network calls are made.

### 7.2 Architecture

```
FSM Event / Anomaly
    ↓
Voice Prompt Lookup (protocol_rules.json → voice_prompts section)
    ↓
Async Voice Queue (non-blocking)
    ↓
Piper TTS Engine (primary)
    │   └── Local voice model file (.onnx)
    └── Pyttsx3 Fallback (if Piper unavailable)
    ↓
Local Speaker Output
```

### 7.3 Voice Queue Design

- Voice prompts are enqueued in a thread-safe async queue.
- A dedicated worker thread consumes the queue and invokes TTS synthesis.
- The queue has a configurable maximum depth; if the queue is full, lower-priority prompts are discarded (anomaly-level prompts are never discarded).
- The inference pipeline is never blocked waiting for voice synthesis.

### 7.4 Piper TTS

- Piper uses local `.onnx` voice model files.
- No internet connection required.
- Supports multiple language/voice models.
- Audio output via system audio interface.

### 7.5 Voice Prompt Configuration

Voice messages are defined per FSM state transition and anomaly type in `protocol_rules.json`:

```json
{
  "voice_prompts": {
    "on_step_entry": {
      "STEP_01_READY": "Step one ready. Please pick up the vial.",
      "STEP_02_READY": "Step two ready. Insert the syringe."
    },
    "on_step_complete": {
      "STEP_01": "Step one complete.",
      "STEP_02": "Step two complete."
    },
    "on_anomaly": {
      "SKIPPED_STEP": "Warning: step may have been skipped. Please verify.",
      "OUT_OF_ORDER": "Warning: action performed out of sequence.",
      "STEP_TIMEOUT": "Warning: step time limit exceeded."
    }
  }
}
```

---

## 8. Module 5 — Telemetry & Log Engine

### 8.1 Responsibility

Module 5 collects, structures, and persists all system telemetry and experiment event data. It maintains the authoritative audit trail for the session.

### 8.2 Log Outputs

#### 8.2.1 JSON Event Log

Per-session structured log file: `logs/session_{session_id}_events.json`

Each entry is a JSON object on a single line (JSONL format) containing:

```json
{
  "log_id": "uuid-v4",
  "session_id": "string",
  "timestamp_iso": "2026-08-29T12:00:00.000Z",
  "source_module": "MODULE_2_HOI | MODULE_3_FSM | MODULE_1_INGESTION | SYSTEM",
  "event_type": "DETECTION | HOI_EVENT | PROTOCOL_EVENT | STATE_TRANSITION | ANOMALY | SYSTEM",
  "severity": "INFO | WARNING | ERROR | CRITICAL",
  "fsm_state": "string",
  "data": {}
}
```

#### 8.2.2 Flat Text Audit Log

Per-session human-readable log: `logs/session_{session_id}_audit.txt`

Format:
```
[2026-08-29T12:05:34.123Z] [INFO   ] [FSM     ] STEP_01_READY → STEP_01_ACTIVE (trigger: PICK_UP_VIAL, conf: 0.87)
[2026-08-29T12:05:52.007Z] [WARNING] [FSM     ] ANOMALY: STEP_TIMEOUT — step STEP_01 exceeded 60s limit
[2026-08-29T12:06:01.443Z] [INFO   ] [VOICE   ] Prompt delivered: "Warning: step time limit exceeded."
```

### 8.3 System Telemetry

Collected metrics (sampled at configurable interval, default 1 Hz):

| Metric | Source |
|---|---|
| Inference FPS | Module 2 frame counter |
| Frame latency | Capture timestamp vs. inference completion timestamp |
| VRAM used / total | `pynvml` |
| GPU utilization % | `pynvml` |
| CPU utilization % | `psutil` |
| System RAM used | `psutil` |
| Active model | Config state |
| FSM current state | Module 3 |
| Session duration | Session start timestamp |
| Active anomaly count | Module 3 running count |
| Camera connected | Module 1 health |
| Archive file size | File system |
| Log file size | File system |

---

## 9. Module 6 — FastAPI Async Hub

### 9.1 Responsibility

Module 6 exposes the edge inference server's outputs to the Mission Dashboard and optionally to other local-subnet consumers. All routes are async; no blocking I/O may occur in route handlers.

### 9.2 Endpoints

#### `GET /video_feed`

- **Protocol:** HTTP + multipart/x-mixed-replace (MJPEG)
- **Description:** Streams annotated video frames as JPEG images in MJPEG format.
- **Annotations applied:** Object bounding boxes, class labels, confidence scores, hand/keypoint skeleton, HOI interaction indicators, FSM state overlay.
- **Frame rate:** Determined by inference pipeline throughput; not artificially limited.
- **Access:** Local subnet only.

#### `WS /ws/telemetry`

- **Protocol:** WebSocket (JSON messages)
- **Description:** Pushes real-time telemetry and event data to connected clients.
- **Message types:**

```json
// Telemetry heartbeat (every ~1 second)
{
  "msg_type": "TELEMETRY",
  "timestamp": "ISO-8601",
  "inference_fps": 0.0,
  "frame_latency_ms": 0.0,
  "vram_used_mb": 0,
  "vram_total_mb": 0,
  "gpu_util_pct": 0.0,
  "cpu_util_pct": 0.0,
  "fsm_state": "string",
  "session_id": "string",
  "camera_connected": true,
  "active_anomaly_count": 0,
  "recording_active": true
}

// Protocol event
{
  "msg_type": "PROTOCOL_EVENT",
  "timestamp": "ISO-8601",
  "event_name": "string",
  "from_state": "string",
  "to_state": "string",
  "transition_type": "VALID | ANOMALY",
  "anomaly_type": "string | null",
  "confidence": 0.0,
  "objects_involved": ["string"]
}

// Detection update (per-frame)
{
  "msg_type": "DETECTION",
  "timestamp": "ISO-8601",
  "frame_id": 0,
  "detections": [],
  "hoi_active": [],
  "hands_detected": 0
}

// Anomaly alert
{
  "msg_type": "ANOMALY",
  "timestamp": "ISO-8601",
  "anomaly_type": "string",
  "severity": "WARNING | ERROR | CRITICAL",
  "affected_step": "string",
  "description": "string",
  "recommended_action": "string"
}

// System status
{
  "msg_type": "SYSTEM_STATUS",
  "timestamp": "ISO-8601",
  "status": "INITIALIZING | READY | RUNNING | WARNING | ANOMALY | PAUSED | ERROR | DISCONNECTED"
}
```

#### `GET /health`

- **Protocol:** HTTP JSON
- **Description:** Basic health check endpoint for local monitoring tools.
- **Response:**
```json
{
  "status": "ok",
  "session_active": false,
  "fsm_state": "SYSTEM_IDLE",
  "camera_connected": true,
  "uptime_seconds": 0
}
```

#### `GET /session/status`

- **Protocol:** HTTP JSON
- **Description:** Returns current session metadata and protocol progress.

#### `POST /session/pause` / `POST /session/resume`

- **Protocol:** HTTP
- **Description:** Operator-initiated session pause/resume. Triggers FSM state transition.

---

## 10. AI Pipeline — End-to-End Data Flow

```
Camera Frame (BGR, 1920×1080, ~16ms per frame @ 60 FPS)
    ↓
[Module 1] Frame capture + timestamp + frame_id assignment
    ↓
[Module 2A] YOLO Object Detection (GPU, CUDA)
    Output: DetectionResult {detections[class, bbox, confidence]}
    ↓
[Module 2B] MediaPipe/YOLO-Pose Hand + Keypoint Tracking
    Output: PoseResult {hands[keypoints, handedness]}
    ↓
[Module 2C] Coordinate Normalization
    Input: pixel-space bboxes + keypoints
    Output: anchor-relative normalized coordinates
    ↓
[Module 2D] HOI Matrix Computation
    Input: normalized detections + normalized hand keypoints
    Output: HOIMatrix {interactions[distance, iou, class, confidence]}
    ↓
[Module 2E] Event Abstraction
    Input: HOIMatrix
    Output: ProtocolEvent {event_name, confidence, objects_involved}
    ↓
[Module 3] FSM Validation
    Input: ProtocolEvent
    Validates against: protocol_rules.json
    Output: TransitionRecord {from, to, type, anomaly?}
    ↓
    ├── [Module 4] Voice Prompt (if triggered)
    ├── [Module 5] Telemetry & Audit Log
    └── [Module 6] WebSocket Push to Mission Dashboard
```

**Critical data flow rule:** No data flows backward from Module 3 to Module 2. Protocol state does not influence perception. The pipeline is strictly forward.

---

## 11. API Reference

### 11.1 Complete Endpoint Table

| Method | Path | Type | Description |
|---|---|---|---|
| GET | `/video_feed` | HTTP (MJPEG) | Live annotated video stream |
| WS | `/ws/telemetry` | WebSocket | Real-time telemetry and events |
| GET | `/health` | HTTP JSON | System health check |
| GET | `/session/status` | HTTP JSON | Current session and protocol state |
| POST | `/session/pause` | HTTP | Pause active session |
| POST | `/session/resume` | HTTP | Resume paused session |
| POST | `/session/start` | HTTP | Start a new experiment session |
| POST | `/session/abort` | HTTP | Abort active session |
| GET | `/protocols` | HTTP JSON | List available protocol configurations |
| GET | `/logs/{session_id}` | HTTP JSON | Retrieve event log for session |

### 11.2 Error Responses

All API errors return structured JSON:
```json
{
  "error": "string",
  "error_code": "string",
  "detail": "string",
  "timestamp": "ISO-8601"
}
```

---

## 12. Performance Requirements

> **Important:** The following are architectural targets. No measured values exist. All performance claims are to be validated during Phase 15 (Performance Benchmarking) on target hardware.

### 12.1 Inference Pipeline

| Metric | Target | Notes |
|---|---|---|
| Object detection inference time | To be measured | YOLOv8s on RTX 3050 CUDA |
| Pose tracking inference time | To be measured | MediaPipe (CPU) or YOLO-Pose (GPU) |
| HOI matrix computation | To be measured | Numpy/SciPy operations |
| Event abstraction | < 1 ms (target) | Pure Python mapping |
| FSM transition | < 1 ms (target) | `transitions` library |
| End-to-end frame-to-event | To be measured | Aggregate of above |

### 12.2 Video Pipeline

| Metric | Target |
|---|---|
| Archive encoding throughput | Sustain 60 FPS at 1080p via NVENC |
| MJPEG stream quality | Configurable JPEG quality (default 80) |
| Frame drop rate | Target < 1% under normal operation |

### 12.3 Memory

| Metric | Target |
|---|---|
| VRAM peak during inference | To be measured; must fit within available VRAM |
| System RAM | Stable, no memory leaks over session duration |

### 12.4 Latency Budget (Target, Not Measured)

| Component | Target Latency |
|---|---|
| Camera to frame buffer | ~16 ms @ 60 FPS |
| Object detection | To be measured |
| Pose tracking | To be measured |
| HOI + event abstraction | < 5 ms (target) |
| FSM transition + log | < 2 ms (target) |
| WebSocket push to dashboard | < 50 ms (LAN, target) |
| Total frame-to-dashboard-update | To be measured |

---

## 13. Deployment Architecture

### 13.1 Process Model

```
Edge Inference Server
├── Main inference process (Python)
│   ├── Module 1: Video capture thread
│   ├── Module 2: Inference thread (CUDA)
│   ├── Module 3: FSM thread
│   ├── Module 4: Voice worker thread
│   └── Module 5: Log writer thread
└── Module 6: FastAPI + Uvicorn (separate process or thread)

Mission Dashboard (separate machine on local subnet)
└── Next.js dev server (development) or static export (production)
    Connects to: http://{edge_server_ip}:8000/video_feed
                 ws://{edge_server_ip}:8000/ws/telemetry
```

### 13.2 Startup Sequence

1. System health check (camera, GPU, audio).
2. Load protocol configuration from `protocol_rules.json` with schema validation.
3. Load ML models (YOLO, MediaPipe).
4. Initialize FSM from protocol config.
5. Start video ingestion (Module 1).
6. Start inference pipeline (Module 2).
7. Start FSM (Module 3) — enters `SYSTEM_IDLE`.
8. Start voice worker (Module 4).
9. Start log engine (Module 5).
10. Start FastAPI server (Module 6).
11. System ready — Mission Dashboard can connect.

### 13.3 Directory Layout

```
/
├── backend/
│   ├── ingestion/         # Module 1
│   ├── vision/            # Module 2: detection, pose
│   ├── hoi/               # Module 2: HOI engine + event abstraction
│   ├── protocol/          # Module 3: FSM
│   ├── voice/             # Module 4
│   ├── telemetry/         # Module 5
│   └── api/               # Module 6: FastAPI
├── frontend/              # Next.js Mission Dashboard
├── models/                # YOLO weights, MediaPipe models, Piper voice models
├── datasets/              # Custom training dataset (not in repo, documented separately)
├── configs/
│   └── protocol_rules.json
├── recordings/            # Video archive
├── logs/                  # Event logs + audit logs
├── tests/                 # pytest test suites
└── docs/                  # Documentation set
```

---

## 14. Dependencies

### 14.1 Python Dependencies (Core)

```
ultralytics>=8.0.0          # YOLOv8s / YOLOv11s
opencv-python>=4.8.0        # Video capture + MJPEG
mediapipe>=0.10.0            # Hand and pose tracking
torch>=2.0.0                 # PyTorch (CUDA)
torchvision>=0.15.0
fastapi>=0.110.0             # Async API
uvicorn[standard]>=0.29.0    # ASGI server
websockets>=12.0
transitions>=0.9.0           # FSM
piper-tts>=1.2.0             # Offline TTS
pyttsx3>=2.90                # TTS fallback
pynvml>=11.5.0               # NVIDIA GPU metrics
psutil>=5.9.0                # System metrics
numpy>=1.24.0
scipy>=1.11.0
python-json-logger>=2.0.7
pydantic>=2.0.0              # Config and data validation
```

### 14.2 Frontend Dependencies (Core)

```json
{
  "next": "^14.0.0",
  "react": "^18.0.0",
  "react-dom": "^18.0.0",
  "typescript": "^5.0.0",
  "@types/react": "^18.0.0",
  "@types/node": "^20.0.0"
}
```

### 14.3 System Dependencies

- NVIDIA CUDA Toolkit (11.x or 12.x)
- NVIDIA drivers
- FFmpeg with NVENC support
- Node.js 18+ (for Next.js frontend)

---

## 15. Constraints

| Constraint | Description |
|---|---|
| Hardware-bound | System targets NVIDIA RTX 3050; model selection must fit within available VRAM |
| Offline-first | No network egress permitted from inference pipeline |
| Single camera | Current architecture supports one fixed camera per session |
| Single protocol | One active protocol FSM per session |
| Linux/Windows | Backend must support both OS environments |
| Real-time operation | Inference pipeline must sustain real-time throughput; offline batch processing is not the target use case |
| No biometrics | Operator identification must not use facial recognition or biometric systems |
| Config-driven | All protocol logic must live in configuration, not source code |

---

## 16. Technology Trade-offs

### 16.1 YOLOv8s vs. YOLOv11s

| Factor | YOLOv8s | YOLOv11s |
|---|---|---|
| Maturity | Production-stable | Newer |
| Custom training tooling | Excellent (Ultralytics) | Excellent (Ultralytics) |
| VRAM footprint | Lower (preferred for 4 GB variant) | Similar range |
| Accuracy | Good | Comparable or improved |
| Decision | Either; configurable model path; YOLOv8s for initial development |

### 16.2 MediaPipe Hands vs. YOLO-Pose

| Factor | MediaPipe Hands | YOLO-Pose |
|---|---|---|
| Deployment | CPU-native; no GPU required | CUDA GPU optional |
| Hand keypoints | 21 (full hand) | 17 COCO (body; no fine hand detail) |
| VRAM impact | Minimal (runs on CPU) | Shares GPU with YOLO detection |
| Occlusion robustness | Good | Good |
| Decision | MediaPipe Hands (primary) for fine hand detail; YOLO-Pose (full body) as supplement |

### 16.3 MJPEG vs. WebRTC

| Factor | MJPEG | WebRTC |
|---|---|---|
| Complexity | Low | High |
| Latency | Higher (~100-300 ms over LAN) | Lower (~50 ms) |
| Browser support | Universal | Universal |
| Implementation | Simple HTTP multipart | Signaling server required |
| Decision | MJPEG for initial development; WebRTC as P1 enhancement |

### 16.4 Python `transitions` vs. Custom FSM

| Factor | `transitions` | Custom FSM |
|---|---|---|
| Development speed | Fast | Slow |
| Flexibility | High | Maximum |
| Debuggability | Good (state diagrams) | Variable |
| Decision | `transitions` library; only replace if performance profiling reveals bottleneck |

---

*End of TRD — AstroFlow-AI v0.1.0-draft*

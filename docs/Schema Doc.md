# AstroFlow-AI — Data Schema & Protocol Configuration Document

> **Document Version:** 0.1.0-draft  
> **Status:** Planning / Pre-Development  
> **Last Updated:** 2026-08-29  
> **Related Documents:** [TRD.md](./TRD.md) · [workflow.md](./workflow.md) · [Implementation Doc.md](./Implementation%20Doc.md)

---

## Table of Contents

1. [Schema Overview](#1-schema-overview)
2. [Core Configuration: `protocol_rules.json`](#2-core-configuration-protocol_rulesjson)
3. [Detection Schemas](#3-detection-schemas)
4. [Tracking Schemas](#4-tracking-schemas)
5. [Interaction Schemas](#5-interaction-schemas)
6. [Event Schemas](#6-event-schemas)
7. [FSM Schemas](#7-fsm-schemas)
8. [Telemetry Schemas](#8-telemetry-schemas)
9. [Log Schemas](#9-log-schemas)
10. [Video Recording Schema](#10-video-recording-schema)
11. [Schema Relationships](#11-schema-relationships)
12. [Validation and Normalization Rules](#12-validation-and-normalization-rules)

---

## 1. Schema Overview

AstroFlow-AI is a local, offline system. It does not use a centralized database. All data is persisted to the local file system in two formats:

| Format | Files | Purpose |
|---|---|---|
| JSON Lines (JSONL) | `logs/session_{id}_events.json` | Structured, machine-readable event log |
| Plain text | `logs/session_{id}_audit.txt` | Human-readable audit trail |
| JSON | `configs/protocol_rules.json` | Experiment protocol configuration |
| MP4 | `recordings/session_{id}_{ts}.mp4` | Video archive |

All in-flight data structures are Python dataclasses or Pydantic models used in memory during operation. They are serialized to JSONL at log write time.

**Key principle:** No relational database is required or appropriate for this system. All queries are sequential reads of JSONL files by session ID.

---

## 2. Core Configuration: `protocol_rules.json`

`protocol_rules.json` is the single source of truth for all protocol-specific logic. The FSM engine, Event Abstraction Layer, Voice Module, and Anomaly rules all read from this file. **No protocol logic exists anywhere else in the codebase.**

### 2.1 Top-Level Structure

```json
{
  "schema_version": "1.0.0",
  "protocol_id": "string",
  "protocol_version": "string",
  "protocol_name": "string",
  "description": "string",
  "author": "string",
  "created_at": "ISO-8601 date",
  "last_modified": "ISO-8601 date",
  "checksum": "sha256-hex (populated by config validator)",

  "camera_config": { ... },
  "detection_config": { ... },
  "hoi_config": { ... },
  "event_mapping": { ... },
  "steps": [ ... ],
  "transitions": [ ... ],
  "anomaly_rules": { ... },
  "voice_prompts": { ... }
}
```

### 2.2 `camera_config`

```json
{
  "camera_config": {
    "camera_index": 0,
    "resolution": [1920, 1080],
    "target_fps": 60,
    "archive_codec": "h264_nvenc",
    "archive_bitrate": "8M",
    "archive_path": "recordings/",
    "anchor_region": {
      "type": "bounding_box",
      "x1_pct": 0.05,
      "y1_pct": 0.05,
      "x2_pct": 0.95,
      "y2_pct": 0.95
    }
  }
}
```

### 2.3 `detection_config`

```json
{
  "detection_config": {
    "model_path": "models/yolov8s_bas_v1.pt",
    "model_type": "yolov8s",
    "inference_device": "cuda:0",
    "input_size": [640, 640],
    "confidence_threshold": 0.60,
    "low_confidence_threshold": 0.40,
    "nms_iou_threshold": 0.45,
    "object_classes": [
      {"class_id": 0, "label": "person",           "role": "operator"},
      {"class_id": 1, "label": "vial",             "role": "experiment_object"},
      {"class_id": 2, "label": "syringe",          "role": "experiment_object"},
      {"class_id": 3, "label": "plunger",          "role": "experiment_object"},
      {"class_id": 4, "label": "observation_port", "role": "experiment_fixture"},
      {"class_id": 5, "label": "gloves",           "role": "operator_equipment"}
    ]
  }
}
```

### 2.4 `hoi_config`

```json
{
  "hoi_config": {
    "pose_model": "mediapipe_hands",
    "pose_model_path": "models/hand_landmarker.task",
    "interaction_classes": [
      {
        "class_name": "near_object",
        "distance_threshold_normalized": 0.15,
        "iou_threshold": 0.0,
        "min_duration_frames": 3
      },
      {
        "class_name": "touch_object",
        "distance_threshold_normalized": 0.05,
        "iou_threshold": 0.05,
        "min_duration_frames": 5
      },
      {
        "class_name": "hold_object",
        "distance_threshold_normalized": 0.04,
        "iou_threshold": 0.15,
        "min_duration_frames": 12
      },
      {
        "class_name": "transfer_object",
        "description": "object position changes while hand-object distance maintained",
        "min_duration_frames": 8
      }
    ]
  }
}
```

### 2.5 `event_mapping`

Maps HOI interaction patterns to named protocol events.

```json
{
  "event_mapping": [
    {
      "event_name": "PICK_UP_VIAL",
      "description": "Operator picks up the vial",
      "required_interactions": [
        {
          "hand_interaction_class": "hold_object",
          "object_label": "vial",
          "min_confidence": 0.75
        }
      ],
      "temporal_pattern": "sustained",
      "min_duration_frames": 12
    },
    {
      "event_name": "INSERT_SYRINGE_TO_VIAL",
      "description": "Syringe brought into proximity with vial, axis-aligned",
      "required_interactions": [
        {
          "hand_interaction_class": "hold_object",
          "object_label": "syringe",
          "min_confidence": 0.75
        },
        {
          "object_pair_proximity": {
            "object_a": "syringe",
            "object_b": "vial",
            "distance_threshold_normalized": 0.08
          }
        }
      ],
      "min_duration_frames": 8
    },
    {
      "event_name": "POSITION_AT_OBSERVATION_PORT",
      "description": "Object positioned at observation port",
      "required_interactions": [
        {
          "object_pair_proximity": {
            "object_a": "vial",
            "object_b": "observation_port",
            "distance_threshold_normalized": 0.06
          }
        }
      ],
      "min_duration_frames": 15
    }
  ]
}
```

### 2.6 `steps`

```json
{
  "steps": [
    {
      "step_id": "STEP_01",
      "step_index": 1,
      "name": "Retrieve Vial",
      "description": "Operator picks up the experiment vial from the rack.",
      "fsm_ready_state": "STEP_01_READY",
      "fsm_complete_state": "STEP_01_COMPLETE",
      "expected_event": "PICK_UP_VIAL",
      "min_time_seconds": 0,
      "max_time_seconds": 120,
      "allowed_objects": ["vial", "gloves"],
      "required_objects_present": ["vial"],
      "optional_objects": ["gloves"],
      "notes": "Operator must be wearing gloves before this step."
    },
    {
      "step_id": "STEP_02",
      "step_index": 2,
      "name": "Insert Syringe",
      "description": "Operator inserts the syringe into the held vial.",
      "fsm_ready_state": "STEP_02_READY",
      "fsm_complete_state": "STEP_02_COMPLETE",
      "expected_event": "INSERT_SYRINGE_TO_VIAL",
      "min_time_seconds": 5,
      "max_time_seconds": 60,
      "allowed_objects": ["vial", "syringe", "plunger", "gloves"],
      "required_objects_present": ["vial", "syringe"]
    }
  ]
}
```

### 2.7 `transitions`

```json
{
  "transitions": [
    {
      "trigger": "PICK_UP_VIAL",
      "source": "STEP_01_READY",
      "dest": "STEP_01_COMPLETE",
      "min_confidence": 0.75,
      "timing_check": true
    },
    {
      "trigger": "auto_advance",
      "source": "STEP_01_COMPLETE",
      "dest": "STEP_02_READY",
      "delay_seconds": 1.0
    },
    {
      "trigger": "INSERT_SYRINGE_TO_VIAL",
      "source": "STEP_02_READY",
      "dest": "STEP_02_COMPLETE",
      "min_confidence": 0.75,
      "timing_check": true
    }
  ]
}
```

### 2.8 `anomaly_rules`

```json
{
  "anomaly_rules": {
    "on_invalid_action": {
      "severity": "ERROR",
      "halt_session": false,
      "auto_retry": false,
      "require_supervisor_acknowledge": false
    },
    "on_skipped_step": {
      "severity": "ERROR",
      "halt_session": false,
      "allow_override": true
    },
    "on_timeout": {
      "severity": "ERROR",
      "auto_advance": false,
      "halt_session": false
    },
    "on_critical_deviation": {
      "severity": "CRITICAL",
      "halt_session": true
    }
  }
}
```

### 2.9 `voice_prompts`

```json
{
  "voice_prompts": {
    "session_start": "Session initialized. Protocol loaded. Ready when you are.",
    "session_complete": "Protocol complete. All steps verified.",
    "session_pause": "Session paused. Protocol state preserved.",
    "session_resume": "Session resumed.",
    "on_step_entry": {
      "STEP_01_READY": "Step one ready. Please retrieve the vial.",
      "STEP_02_READY": "Step two ready. Please insert the syringe into the vial."
    },
    "on_step_complete": {
      "STEP_01": "Step one complete.",
      "STEP_02": "Step two complete."
    },
    "on_anomaly": {
      "INVALID_ACTION": "Warning: incorrect action detected. Please verify the current step.",
      "SKIPPED_STEP": "Warning: a step may have been skipped. Please verify protocol compliance.",
      "OUT_OF_ORDER": "Warning: action performed out of sequence.",
      "PREMATURE_ACTION": "Warning: action performed too early. Please wait.",
      "REPEATED_ACTION": "Warning: this step has already been completed.",
      "STEP_TIMEOUT": "Warning: step time limit exceeded. Please proceed or notify supervisor."
    }
  }
}
```

---

## 3. Detection Schemas

### 3.1 `DetectionResult`

Produced by Module 2A (YOLO) per frame.

```python
@dataclass
class BoundingBox:
    x1: float   # pixel
    y1: float
    x2: float
    y2: float

@dataclass
class Detection:
    class_id: int
    class_label: str
    bbox: BoundingBox
    confidence: float
    low_confidence_flag: bool  # True if below main threshold but above low threshold

@dataclass
class DetectionResult:
    frame_id: int
    session_id: str
    timestamp_ms: float
    detections: list[Detection]
    inference_time_ms: float
```

**JSON Example:**
```json
{
  "frame_id": 3842,
  "session_id": "ses-20260829-001",
  "timestamp_ms": 1724923200342.0,
  "detections": [
    {
      "class_id": 1,
      "class_label": "vial",
      "bbox": {"x1": 420, "y1": 310, "x2": 480, "y2": 390},
      "confidence": 0.91,
      "low_confidence_flag": false
    }
  ],
  "inference_time_ms": 18.4
}
```

---

## 4. Tracking Schemas

### 4.1 `Keypoint`

```python
@dataclass
class Keypoint:
    id: int
    x: float        # pixel
    y: float        # pixel
    z: float        # depth estimate (if available)
    visibility: float
```

### 4.2 `HandTrack`

```python
@dataclass
class HandTrack:
    hand_id: int
    handedness: str   # "Left" | "Right"
    keypoints: list[Keypoint]  # 21 MediaPipe keypoints
    wrist_px: tuple[float, float]
    index_tip_px: tuple[float, float]
    tracking_confidence: float
```

### 4.3 `PoseResult`

```python
@dataclass
class PoseResult:
    frame_id: int
    session_id: str
    timestamp_ms: float
    hands: list[HandTrack]
    body_keypoints: list[Keypoint] | None  # from YOLO-Pose if available
    inference_time_ms: float
```

### 4.4 `NormalizedCoordinates`

After anchor-relative normalization:

```python
@dataclass
class NormalizedBBox:
    x1_n: float   # [0.0, 1.0] relative to anchor region
    y1_n: float
    x2_n: float
    y2_n: float
    cx_n: float   # center x
    cy_n: float   # center y

@dataclass
class NormalizedKeypoint:
    id: int
    x_n: float
    y_n: float
    visibility: float
```

---

## 5. Interaction Schemas

### 5.1 `HOIEntry`

```python
@dataclass
class HOIEntry:
    interaction_id: str          # UUID
    hand_id: int
    hand_position_normalized: tuple[float, float]
    object_label: str
    object_instance_id: int
    object_bbox_normalized: NormalizedBBox
    distance_normalized: float   # hand wrist to object center
    iou: float                   # hand bbox IoU with object bbox
    interaction_class: str       # e.g., "hold_object"
    confidence: float
    duration_frames: int         # consecutive frames this interaction has been classified
```

### 5.2 `HOIMatrix`

```python
@dataclass
class HOIMatrix:
    frame_id: int
    session_id: str
    timestamp_ms: float
    interactions: list[HOIEntry]
    computation_time_ms: float
```

**JSON Example:**
```json
{
  "frame_id": 3860,
  "session_id": "ses-20260829-001",
  "timestamp_ms": 1724923200645.0,
  "interactions": [
    {
      "interaction_id": "hoi-uuid-0001",
      "hand_id": 0,
      "hand_position_normalized": [0.47, 0.72],
      "object_label": "vial",
      "object_instance_id": 0,
      "object_bbox_normalized": {"x1_n": 0.44, "y1_n": 0.65, "x2_n": 0.52, "y2_n": 0.78, "cx_n": 0.48, "cy_n": 0.715},
      "distance_normalized": 0.04,
      "iou": 0.31,
      "interaction_class": "hold_object",
      "confidence": 0.88,
      "duration_frames": 12
    }
  ],
  "computation_time_ms": 2.1
}
```

---

## 6. Event Schemas

### 6.1 `ProtocolEvent`

Produced by Module 2E (Event Abstraction Layer).

```python
@dataclass
class ProtocolEvent:
    event_id: str          # UUID
    session_id: str
    timestamp_ms: float
    event_name: str        # e.g., "PICK_UP_VIAL"
    source_interaction_id: str   # links to HOIEntry.interaction_id
    objects_involved: list[str]  # e.g., ["vial"]
    confidence: float
    metadata: dict         # optional additional context
```

**JSON Example:**
```json
{
  "event_id": "evt-uuid-0001",
  "session_id": "ses-20260829-001",
  "timestamp_ms": 1724923201200.0,
  "event_name": "PICK_UP_VIAL",
  "source_interaction_id": "hoi-uuid-0001",
  "objects_involved": ["vial"],
  "confidence": 0.88,
  "metadata": {}
}
```

---

## 7. FSM Schemas

### 7.1 `FSMState`

```python
@dataclass
class FSMState:
    state_name: str
    step_id: str | None
    step_index: int | None
    is_system_state: bool    # True for SYSTEM_IDLE, SESSION_PAUSED, etc.
    entry_timestamp_ms: float
    expected_events: list[str]
```

### 7.2 `StateTransition`

```python
@dataclass
class StateTransition:
    record_id: str       # UUID
    session_id: str
    timestamp_ms: float
    timestamp_iso: str
    from_state: str
    to_state: str
    trigger_event: str
    trigger_event_id: str      # links to ProtocolEvent.event_id
    trigger_confidence: float
    transition_type: str       # "VALID" | "ANOMALY"
    anomaly_type: str | None
    time_in_previous_state_ms: float
    voice_prompt_triggered: str | None
```

### 7.3 `AnomalyRecord`

```python
@dataclass
class AnomalyRecord:
    anomaly_id: str       # UUID
    session_id: str
    timestamp_ms: float
    timestamp_iso: str
    anomaly_type: str     # INVALID_ACTION | SKIPPED_STEP | OUT_OF_ORDER | etc.
    severity: str         # WARNING | ERROR | CRITICAL
    affected_step_id: str
    trigger_event_name: str
    trigger_event_confidence: float
    expected_event_name: str
    current_fsm_state: str
    description: str
    recommended_action: str
    acknowledged: bool    # True once supervisor acknowledges via dashboard
    acknowledged_at_ms: float | None
```

**JSON Example:**
```json
{
  "anomaly_id": "ano-uuid-0001",
  "session_id": "ses-20260829-001",
  "timestamp_ms": 1724923205000.0,
  "timestamp_iso": "2026-08-29T12:07:05.000Z",
  "anomaly_type": "OUT_OF_ORDER",
  "severity": "WARNING",
  "affected_step_id": "STEP_02",
  "trigger_event_name": "POSITION_AT_OBSERVATION_PORT",
  "trigger_event_confidence": 0.79,
  "expected_event_name": "INSERT_SYRINGE_TO_VIAL",
  "current_fsm_state": "STEP_02_READY",
  "description": "Action POSITION_AT_OBSERVATION_PORT received while in STEP_02_READY; this action belongs to STEP_03.",
  "recommended_action": "Verify step 2 is complete before proceeding to step 3.",
  "acknowledged": false,
  "acknowledged_at_ms": null
}
```

---

## 8. Telemetry Schemas

### 8.1 `TelemetrySnapshot`

Emitted by Module 5 at configurable interval (default 1 Hz).

```python
@dataclass
class TelemetrySnapshot:
    snapshot_id: str
    session_id: str
    timestamp_ms: float
    timestamp_iso: str

    # Inference
    inference_fps: float
    frame_latency_ms: float
    detection_inference_ms: float
    pose_inference_ms: float
    hoi_computation_ms: float

    # GPU
    vram_used_mb: int
    vram_total_mb: int
    gpu_util_pct: float
    gpu_temp_c: float | None

    # System
    cpu_util_pct: float
    ram_used_mb: int
    ram_total_mb: int

    # Session
    fsm_current_state: str
    session_elapsed_ms: float
    active_anomaly_count: int
    steps_completed: int
    steps_total: int

    # Hardware
    camera_connected: bool
    recording_active: bool
    recording_file_size_mb: float
    log_file_size_mb: float
```

**WebSocket JSON Representation:**
```json
{
  "msg_type": "TELEMETRY",
  "snapshot_id": "tel-uuid-0001",
  "session_id": "ses-20260829-001",
  "timestamp_iso": "2026-08-29T12:10:00.000Z",
  "inference_fps": 0.0,
  "frame_latency_ms": 0.0,
  "vram_used_mb": 0,
  "vram_total_mb": 4096,
  "gpu_util_pct": 0.0,
  "cpu_util_pct": 0.0,
  "fsm_current_state": "STEP_02_READY",
  "session_elapsed_ms": 300000,
  "active_anomaly_count": 1,
  "steps_completed": 1,
  "steps_total": 7,
  "camera_connected": true,
  "recording_active": true
}
```

> **Note:** `inference_fps`, `frame_latency_ms`, and GPU metrics show 0.0 as placeholder here. Actual values are populated at runtime and should not be displayed as 0 in the UI — the UI should show "Measuring..." until valid data arrives.

### 8.2 `VoiceEvent`

```python
@dataclass
class VoiceEvent:
    voice_event_id: str
    session_id: str
    timestamp_ms: float
    text: str
    trigger_event: str
    trigger_state: str
    engine_used: str        # "piper" | "pyttsx3"
    synthesis_latency_ms: float | None
    delivered: bool
```

---

## 9. Log Schemas

### 9.1 `EventLogEntry` (JSONL)

Root structure for every line in `session_{id}_events.json`:

```python
@dataclass
class EventLogEntry:
    log_id: str
    session_id: str
    timestamp_ms: float
    timestamp_iso: str
    source_module: str    # MODULE_1 | MODULE_2 | MODULE_3 | MODULE_4 | MODULE_5 | MODULE_6 | SYSTEM
    event_type: str       # DETECTION | HOI_EVENT | PROTOCOL_EVENT | STATE_TRANSITION | ANOMALY | VOICE | TELEMETRY | SYSTEM
    severity: str         # DEBUG | INFO | WARNING | ERROR | CRITICAL
    fsm_state: str
    data: dict            # The relevant schema object serialized
```

### 9.2 Audit Log Format (Plain Text)

```
[{timestamp_iso}] [{severity:7}] [{source_module:8}] {message}
```

Example:
```
[2026-08-29T12:05:34.123Z] [INFO   ] [FSM     ] STEP_01_READY → STEP_01_COMPLETE — trigger:PICK_UP_VIAL conf:0.88
[2026-08-29T12:05:52.007Z] [WARNING] [FSM     ] ANOMALY:OUT_OF_ORDER step:STEP_02 recv:POSITION_AT_OBSERVATION_PORT exp:INSERT_SYRINGE
[2026-08-29T12:06:01.443Z] [INFO   ] [VOICE   ] Delivered: "Warning: action is out of sequence." (engine:piper latency:82ms)
```

### 9.3 Session Summary Record

Written at session end as the final JSONL entry:

```json
{
  "log_id": "sum-uuid-final",
  "session_id": "ses-20260829-001",
  "timestamp_iso": "2026-08-29T12:30:00.000Z",
  "event_type": "SESSION_SUMMARY",
  "severity": "INFO",
  "data": {
    "protocol_id": "bas-protocol-001",
    "protocol_version": "1.0.0",
    "session_start_iso": "2026-08-29T12:00:00.000Z",
    "session_end_iso": "2026-08-29T12:30:00.000Z",
    "session_duration_seconds": 1800,
    "steps_total": 7,
    "steps_completed": 7,
    "session_outcome": "COMPLETE",
    "anomaly_count": 1,
    "anomalies_by_type": {"OUT_OF_ORDER": 1},
    "voice_prompts_delivered": 18,
    "video_archive_path": "recordings/session_ses-20260829-001_2026-08-29T120000.mp4",
    "log_path": "logs/session_ses-20260829-001_events.json"
  }
}
```

---

## 10. Video Recording Schema

### 10.1 `VideoRecordingMetadata`

Stored alongside or embedded in the MP4 file as a companion JSON:

```json
{
  "recording_id": "rec-uuid-0001",
  "session_id": "ses-20260829-001",
  "file_path": "recordings/session_ses-20260829-001_2026-08-29T120000.mp4",
  "start_timestamp_iso": "2026-08-29T12:00:00.000Z",
  "end_timestamp_iso": "2026-08-29T12:30:00.000Z",
  "duration_seconds": 1800,
  "resolution": [1920, 1080],
  "fps_target": 60,
  "codec": "h264_nvenc",
  "bitrate": "8M",
  "file_size_bytes": 0,
  "protocol_id": "bas-protocol-001",
  "checksum_sha256": "to be computed at session end"
}
```

---

## 11. Schema Relationships

```
                 protocol_rules.json
                        │
            ┌───────────┼───────────┐
            ▼           ▼           ▼
       steps[]    event_mapping   voice_prompts
            │           │
            ▼           ▼
        FSMState    ProtocolEvent
            │       (from HOIEntry)
            ▼               │
      StateTransition ◄─────┘
            │
     AnomalyRecord (if anomaly)
            │
     EventLogEntry (persisted)
            │
     VoiceEvent (if voice triggered)

 DetectionResult
      │
 PoseResult
      │
 NormalizedCoordinates
      │
 HOIMatrix → HOIEntry
      │
 ProtocolEvent ────────────────► StateTransition
                                       │
                              TelemetrySnapshot (periodic)
```

---

## 12. Validation and Normalization Rules

### 12.1 `protocol_rules.json` Validation

On system startup, before loading into the FSM, `protocol_rules.json` must pass:

1. **JSON Schema validation:** Against a defined Pydantic model or JSON Schema document.
2. **Step index uniqueness:** No two steps may share the same `step_index`.
3. **FSM state completeness:** Every `fsm_ready_state` and `fsm_complete_state` in `steps` must appear in `transitions`.
4. **Event mapping coverage:** Every `expected_event` in `steps` must appear in `event_mapping`.
5. **Voice prompt coverage:** Every step ID in `steps` must have corresponding `on_step_entry` and `on_step_complete` entries in `voice_prompts`.
6. **Checksum verification:** The loaded file's SHA-256 hash must match `checksum` field (if field is present; exempt during initial development).

If validation fails, the system must **halt startup** and log a CRITICAL error. The FSM must not be initialized with an invalid protocol.

### 12.2 Coordinate Normalization Rules

- Pixel-space bounding boxes are normalized by dividing by the anchor region width/height.
- Coordinates are clamped to [0.0, 1.0].
- If an object's bounding box extends outside the anchor region, it is clipped at the anchor boundary and flagged.
- Normalization is applied to all detection bboxes and all keypoint coordinates before HOI computation.

### 12.3 Confidence Aggregation

HOI interaction confidence is computed as a weighted combination:
- Detection confidence of the object (weight: configurable, default 0.5)
- Interaction class fit (distance/IoU relative to threshold) (weight: configurable, default 0.5)

Final HOI confidence is not simply the raw YOLO confidence score.

### 12.4 Temporal Smoothing

- HOI interaction classes are not emitted on the first qualifying frame.
- The `min_duration_frames` parameter in `hoi_config` specifies how many consecutive frames an interaction must be classified before a HOI entry is emitted.
- This prevents single-frame transients from generating protocol events.

### 12.5 Session ID Generation

Session IDs are formatted as:
```
ses-{YYYYMMDD}-{HHmmss}-{random-4-char}
```

Example: `ses-20260829-120000-a7f3`

Session IDs are unique within the scope of the local machine and are embedded in all log filenames, video filenames, and in-memory data structures.

---

*End of Schema Doc — AstroFlow-AI v0.1.0-draft*

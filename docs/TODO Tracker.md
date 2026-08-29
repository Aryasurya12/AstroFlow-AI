# AstroFlow-AI — Engineering TODO Tracker

> **Document Version:** 0.1.0-draft  
> **Status:** Active — Updated as development progresses  
> **Last Updated:** 2026-08-29  
> **Related Documents:** [Implementation Doc.md](./Implementation%20Doc.md) · [TRD.md](./TRD.md)

---

## Status Key

| Status | Meaning |
|---|---|
| `TODO` | Not started |
| `IN PROGRESS` | Actively being worked on |
| `BLOCKED` | Waiting on dependency or external factor |
| `DONE` | Complete and verified |

## Priority Key

| Priority | Meaning |
|---|---|
| `P0` | Critical path — system cannot run without this |
| `P1` | Core feature — required for meaningful operation |
| `P2` | Important — degrades system quality if missing |
| `P3` | Enhancement — non-blocking improvement |

---

## Backend

| ID | Task | Priority | Status | Owner | Dependencies | Notes |
|---|---|---|---|---|---|---|
| BE-01 | Set up Python project structure with `pyproject.toml` / `requirements.txt` | P0 | TODO | TBD | — | |
| BE-02 | Create `configs/protocol_rules.json` scaffold with schema validation | P0 | TODO | TBD | — | |
| BE-03 | Create `configs/protocol_rules.schema.json` (Pydantic or JSON Schema) | P0 | TODO | TBD | — | |
| BE-04 | Implement module entry points and unified startup script | P0 | TODO | TBD | BE-01 | |
| BE-05 | Implement shared session state (session ID, FSM state) across modules | P0 | TODO | TBD | BE-04 | |
| BE-06 | Implement internal inter-module event bus (thread-safe queue wrappers) | P1 | TODO | TBD | BE-04 | |
| BE-07 | Implement global exception handler with full traceback logging | P1 | TODO | TBD | BE-04 | |
| BE-08 | Implement graceful shutdown handler (SIGINT / SIGTERM) | P1 | TODO | TBD | BE-04 | |

---

## Computer Vision

| ID | Task | Priority | Status | Owner | Dependencies | Notes |
|---|---|---|---|---|---|---|
| CV-01 | Implement `CameraCapture` class (OpenCV VideoCapture) | P0 | TODO | TBD | BE-01 | |
| CV-02 | Implement frame timestamping and frame ID assignment | P0 | TODO | TBD | CV-01 | |
| CV-03 | Implement thread-safe frame queue (capture → inference) | P0 | TODO | TBD | CV-01 | |
| CV-04 | Implement NVENC H.264 archive branch (FFmpeg subprocess or OpenCV FFmpeg backend) | P0 | TODO | TBD | CV-01 | Requires FFmpeg with NVENC |
| CV-05 | Implement MP4 file naming convention (`session_{id}_{ts}.mp4`) | P0 | TODO | TBD | CV-04 | |
| CV-06 | Implement frame drop logging when inference queue full | P1 | TODO | TBD | CV-03 | |
| CV-07 | Implement camera disconnection detection + DISCONNECTED state signal | P1 | TODO | TBD | CV-01 | |
| CV-08 | Implement camera reconnection polling (configurable interval) | P1 | TODO | TBD | CV-07 | |
| CV-09 | Implement `ObjectDetector` class (Ultralytics YOLO wrapper) | P0 | TODO | TBD | BE-01 | |
| CV-10 | Implement `DetectionResult` dataclass parsing from YOLO output | P0 | TODO | TBD | CV-09 | |
| CV-11 | Implement dual confidence threshold: main and low-confidence flag | P0 | TODO | TBD | CV-09 | |
| CV-12 | Log low-confidence detections at WARNING level (do not silently drop) | P0 | TODO | TBD | CV-11 | |
| CV-13 | Implement inference FPS measurement | P1 | TODO | TBD | CV-09 | |
| CV-14 | Implement `HandTracker` class (MediaPipe Hands) | P0 | TODO | TBD | BE-01 | |
| CV-15 | Parse MediaPipe output to `HandTrack` dataclass (21 keypoints) | P0 | TODO | TBD | CV-14 | |
| CV-16 | Extract wrist and fingertip pixel coordinates from keypoints | P0 | TODO | TBD | CV-15 | |
| CV-17 | Implement `PoseTracker` class (YOLO-Pose, optional) | P2 | TODO | TBD | CV-09 | Optional full-body pose |
| CV-18 | Implement `CoordinateNormalizer` class (anchor-relative normalization) | P0 | TODO | TBD | CV-14 | |
| CV-19 | Load anchor region from `protocol_rules.json` | P0 | TODO | TBD | CV-18 | |
| CV-20 | Normalize all pixel-space bboxes and keypoints to [0, 1] range | P0 | TODO | TBD | CV-18 | |
| CV-21 | Clamp and flag out-of-bounds detections at anchor boundary | P1 | TODO | TBD | CV-20 | |

---

## Dataset

| ID | Task | Priority | Status | Owner | Dependencies | Notes |
|---|---|---|---|---|---|---|
| DS-01 | Define all object classes for initial experiment protocol | P0 | TODO | TBD | — | |
| DS-02 | Define all interaction labels (Layer C) aligned with HOI config | P0 | TODO | TBD | — | |
| DS-03 | Define action/activity labels (Layer D) aligned with event_mapping | P0 | TODO | TBD | — | |
| DS-04 | Write annotation guidelines document | P0 | TODO | TBD | DS-01, DS-02 | |
| DS-05 | Deploy CVAT or Label Studio locally for annotation | P0 | TODO | TBD | — | |
| DS-06 | Set up recording rig (camera at target angle, lighting) | P0 | TODO | TBD | — | Physical rig required |
| DS-07 | Collect correct execution footage (multiple operators) | P0 | TODO | TBD | DS-06 | |
| DS-08 | Collect incorrect execution footage (deliberate errors) | P0 | TODO | TBD | DS-06 | Skips, OOO, wrong objects |
| DS-09 | Collect footage with lighting/occlusion/orientation variation | P1 | TODO | TBD | DS-06 | |
| DS-10 | Annotate object bounding boxes (Layer B) | P0 | TODO | TBD | DS-07, DS-08, DS-05 | |
| DS-11 | Annotate human/hand detections (Layer A) | P0 | TODO | TBD | DS-07, DS-05 | |
| DS-12 | Annotate HOI interaction labels (Layer C) | P0 | TODO | TBD | DS-07, DS-05 | |
| DS-13 | Annotate temporal action segments (Layer D) | P1 | TODO | TBD | DS-07, DS-05 | |
| DS-14 | Implement train/val/test split | P0 | TODO | TBD | DS-10 | |
| DS-15 | Implement data augmentation pipeline | P1 | TODO | TBD | DS-14 | Flip, brightness, crop, rotation |
| DS-16 | Export dataset to YOLO format | P0 | TODO | TBD | DS-14 | |
| DS-17 | Verify class distribution statistics | P1 | TODO | TBD | DS-16 | |

---

## Model Training

| ID | Task | Priority | Status | Owner | Dependencies | Notes |
|---|---|---|---|---|---|---|
| MT-01 | Configure Ultralytics training pipeline on custom dataset | P0 | TODO | TBD | DS-16 | |
| MT-02 | Train object detection model (YOLOv8s or YOLOv11s) | P0 | TODO | TBD | MT-01 | |
| MT-03 | Evaluate trained model: mAP@0.5, P/R per class | P0 | TODO | TBD | MT-02 | Record actual values |
| MT-04 | Perform iterative fine-tuning based on evaluation | P1 | TODO | TBD | MT-03 | |
| MT-05 | Export trained model to `.pt` format at configured path | P0 | TODO | TBD | MT-04 | |
| MT-06 | Run inference on held-out test set and document metrics | P0 | TODO | TBD | MT-05 | |
| MT-07 | Replace stock model in CV pipeline with custom-trained model | P0 | TODO | TBD | MT-05, CV-09 | |
| MT-08 | Document training run parameters and evaluation results | P1 | TODO | TBD | MT-06 | No fabricated metrics |

---

## HAR (Human Activity Recognition)

| ID | Task | Priority | Status | Owner | Dependencies | Notes |
|---|---|---|---|---|---|---|
| HAR-01 | Define interaction class vocabulary for initial protocol | P0 | TODO | TBD | — | In `hoi_config` |
| HAR-02 | Implement `HOIEngine` class | P0 | TODO | TBD | CV-20 | |
| HAR-03 | Compute per-hand per-object Euclidean distance (normalized) | P0 | TODO | TBD | HAR-02 | |
| HAR-04 | Compute bounding box IoU (hand vs object) | P0 | TODO | TBD | HAR-02 | |
| HAR-05 | Apply interaction class thresholds from `protocol_rules.json` | P0 | TODO | TBD | HAR-02 | |
| HAR-06 | Apply temporal consistency filter (`min_duration_frames`) | P0 | TODO | TBD | HAR-02 | |
| HAR-07 | Compute composite HOI confidence score | P0 | TODO | TBD | HAR-03, HAR-04 | |
| HAR-08 | Produce `HOIMatrix` dataclass per frame | P0 | TODO | TBD | HAR-05, HAR-06, HAR-07 | |

---

## HOI (Human-Object Interaction) Event Abstraction

| ID | Task | Priority | Status | Owner | Dependencies | Notes |
|---|---|---|---|---|---|---|
| HOI-01 | Implement `EventAbstractor` class | P0 | TODO | TBD | HAR-08 | |
| HOI-02 | Load `event_mapping` from `protocol_rules.json` | P0 | TODO | TBD | HOI-01 | |
| HOI-03 | Evaluate `HOIMatrix` against all event mapping rules per frame | P0 | TODO | TBD | HOI-01 | |
| HOI-04 | Emit `ProtocolEvent` when event conditions satisfied | P0 | TODO | TBD | HOI-01 | |
| HOI-05 | Handle compound events (multiple simultaneous HOI conditions) | P1 | TODO | TBD | HOI-03 | |
| HOI-06 | Include source `interaction_id` in every `ProtocolEvent` | P0 | TODO | TBD | HOI-04 | |
| HOI-07 | Ensure no hardcoded event names in `EventAbstractor` source | P0 | TODO | TBD | HOI-01 | Architectural rule |

---

## FSM (Finite State Machine / Protocol Validator)

| ID | Task | Priority | Status | Owner | Dependencies | Notes |
|---|---|---|---|---|---|---|
| FSM-01 | Implement `ProtocolFSM` class using `transitions.Machine` | P0 | TODO | TBD | HOI-04 | |
| FSM-02 | Load states and transitions programmatically from `protocol_rules.json` | P0 | TODO | TBD | FSM-01 | |
| FSM-03 | Implement `protocol_rules.json` schema validation on load | P0 | TODO | TBD | FSM-01 | |
| FSM-04 | Implement INVALID_ACTION anomaly detection | P0 | TODO | TBD | FSM-01 | |
| FSM-05 | Implement SKIPPED_STEP anomaly detection | P0 | TODO | TBD | FSM-01 | |
| FSM-06 | Implement OUT_OF_ORDER anomaly detection | P0 | TODO | TBD | FSM-01 | |
| FSM-07 | Implement PREMATURE_ACTION anomaly detection (min_time) | P0 | TODO | TBD | FSM-01 | |
| FSM-08 | Implement REPEATED_ACTION anomaly detection | P0 | TODO | TBD | FSM-01 | |
| FSM-09 | Implement STEP_TIMEOUT anomaly (max_time) | P0 | TODO | TBD | FSM-01 | |
| FSM-10 | Implement PAUSED / SESSION_ABORTED system states | P1 | TODO | TBD | FSM-01 | |
| FSM-11 | Produce `StateTransition` record per event | P0 | TODO | TBD | FSM-01 | |
| FSM-12 | Produce `AnomalyRecord` on anomaly events | P0 | TODO | TBD | FSM-04-09 | |
| FSM-13 | Implement FSM diagram export (Graphviz) for debugging | P2 | TODO | TBD | FSM-01 | |
| FSM-14 | Ensure FSM contains no hardcoded protocol logic | P0 | TODO | TBD | FSM-01 | Architectural invariant |
| FSM-15 | Startup halts if `protocol_rules.json` fails validation | P0 | TODO | TBD | FSM-03 | |

---

## Voice Module

| ID | Task | Priority | Status | Owner | Dependencies | Notes |
|---|---|---|---|---|---|---|
| VM-01 | Install and verify Piper TTS with local `.onnx` voice model | P1 | TODO | TBD | — | |
| VM-02 | Implement `VoiceModule` class with async voice queue | P1 | TODO | TBD | FSM-11 | |
| VM-03 | Implement Piper TTS synthesis (text → `.wav` → playback) | P1 | TODO | TBD | VM-01 | |
| VM-04 | Implement Pyttsx3 fallback synthesis | P1 | TODO | TBD | VM-02 | Auto-activates if Piper fails |
| VM-05 | Implement voice queue priority system (NORMAL/HIGH/CRITICAL) | P1 | TODO | TBD | VM-02 | |
| VM-06 | Load voice prompt text from `protocol_rules.json` `voice_prompts` | P1 | TODO | TBD | VM-02 | |
| VM-07 | Subscribe to FSM state transitions and anomaly events | P1 | TODO | TBD | VM-02, FSM-11 | |
| VM-08 | Emit `VoiceEvent` log record on each delivery | P1 | TODO | TBD | VM-07 | |
| VM-09 | Ensure CRITICAL priority prompts are never discarded by queue overflow | P0 | TODO | TBD | VM-05 | |

---

## Telemetry & Logging

| ID | Task | Priority | Status | Owner | Dependencies | Notes |
|---|---|---|---|---|---|---|
| TL-01 | Implement `LogEngine` class with async write queue | P0 | TODO | TBD | BE-04 | |
| TL-02 | Implement JSONL event log writer (`session_{id}_events.json`) | P0 | TODO | TBD | TL-01 | |
| TL-03 | Implement flat text audit log writer (`session_{id}_audit.txt`) | P0 | TODO | TBD | TL-01 | |
| TL-04 | Implement `TelemetryCollector` using `pynvml` and `psutil` | P1 | TODO | TBD | BE-01 | |
| TL-05 | Implement `TelemetrySnapshot` emission at configurable interval | P1 | TODO | TBD | TL-04 | Default 1 Hz |
| TL-06 | Implement session summary record at session end | P1 | TODO | TBD | TL-02 | |
| TL-07 | Enforce append-only log writes during session | P0 | TODO | TBD | TL-01 | Never open in overwrite mode |
| TL-08 | Implement log flush and file close on session end | P0 | TODO | TBD | TL-01 | |

---

## API (FastAPI Async Hub)

| ID | Task | Priority | Status | Owner | Dependencies | Notes |
|---|---|---|---|---|---|---|
| API-01 | Set up FastAPI application with Uvicorn | P0 | TODO | TBD | BE-01 | |
| API-02 | Implement `GET /video_feed` (MJPEG multipart stream) | P0 | TODO | TBD | CV-01, API-01 | |
| API-03 | Implement CV annotation overlay on MJPEG frames | P1 | TODO | TBD | API-02, CV-10 | bboxes, labels, skeleton, HOI |
| API-04 | Implement `WS /ws/telemetry` WebSocket endpoint | P0 | TODO | TBD | TL-05, FSM-11, API-01 | |
| API-05 | Implement TELEMETRY message type in WebSocket | P0 | TODO | TBD | API-04 | |
| API-06 | Implement PROTOCOL_EVENT message type in WebSocket | P0 | TODO | TBD | API-04, FSM-11 | |
| API-07 | Implement DETECTION message type in WebSocket | P1 | TODO | TBD | API-04, CV-10 | |
| API-08 | Implement ANOMALY message type in WebSocket | P0 | TODO | TBD | API-04, FSM-12 | |
| API-09 | Implement SYSTEM_STATUS message type in WebSocket | P0 | TODO | TBD | API-04 | |
| API-10 | Implement `GET /health` endpoint | P1 | TODO | TBD | API-01 | |
| API-11 | Implement `GET /session/status` endpoint | P1 | TODO | TBD | API-01, FSM-11 | |
| API-12 | Implement `POST /session/start` | P1 | TODO | TBD | API-01, FSM-01 | |
| API-13 | Implement `POST /session/pause` and `/session/resume` | P1 | TODO | TBD | API-01, FSM-10 | |
| API-14 | Implement `POST /session/abort` | P1 | TODO | TBD | API-01, FSM-10 | |
| API-15 | Implement `GET /protocols` (list protocol configs) | P2 | TODO | TBD | API-01 | |
| API-16 | Implement `GET /logs/{session_id}` | P2 | TODO | TBD | API-01, TL-02 | |
| API-17 | CORS configuration for local subnet only | P0 | TODO | TBD | API-01 | |
| API-18 | Structured error responses (all endpoints) | P1 | TODO | TBD | API-01 | |
| API-19 | Ensure all route handlers are async (no blocking I/O) | P0 | TODO | TBD | API-01 | Architectural rule |

---

## Frontend (Mission Dashboard)

| ID | Task | Priority | Status | Owner | Dependencies | Notes |
|---|---|---|---|---|---|---|
| FE-01 | Set up Next.js App Router project in `frontend/` | P0 | TODO | TBD | — | |
| FE-02 | Implement CSS design token system (Design Doc Section 5.2) | P0 | TODO | TBD | FE-01 | |
| FE-03 | Bundle offline fonts (Inter + JetBrains Mono) | P1 | TODO | TBD | FE-01 | No external font loading |
| FE-04 | Implement global layout (top bar, nav rail, main, right panel, bottom console) | P0 | TODO | TBD | FE-01, FE-02 | |
| FE-05 | Implement MJPEG video viewport component | P0 | TODO | TBD | API-02, FE-01 | |
| FE-06 | Implement WebSocket client with reconnect logic | P0 | TODO | TBD | API-04, FE-01 | |
| FE-07 | Implement `<StatusBadge>` component | P0 | TODO | TBD | FE-02 | |
| FE-08 | Implement `<TelemetryCard>` component | P1 | TODO | TBD | FE-02 | |
| FE-09 | Implement `<BoundingBoxOverlay>` (SVG/Canvas overlay on video) | P1 | TODO | TBD | FE-05 | |
| FE-10 | Implement `<HandSkeletonOverlay>` (MediaPipe skeleton) | P1 | TODO | TBD | FE-05 | |
| FE-11 | Implement `<HOIIndicator>` (interaction line between hand and object) | P1 | TODO | TBD | FE-09 | |
| FE-12 | Implement `<ProtocolChecklist>` with step status icons | P0 | TODO | TBD | FE-02, FE-06 | |
| FE-13 | Implement `<AnomalyAlert>` card component | P0 | TODO | TBD | FE-02 | |
| FE-14 | Implement `<EventTerminal>` (auto-scrolling monospace log) | P0 | TODO | TBD | FE-02, FE-06 | |
| FE-15 | Implement `<RecordingIndicator>` (pulsing REC + elapsed) | P1 | TODO | TBD | FE-02 | |
| FE-16 | Implement Live Video / HAR View screen | P0 | TODO | TBD | FE-05, FE-09, FE-12 | Primary operational screen |
| FE-17 | Implement Mission Dashboard (home) screen | P1 | TODO | TBD | FE-07, FE-08, FE-14 | |
| FE-18 | Implement Telemetry screen | P1 | TODO | TBD | FE-08 | |
| FE-19 | Implement Alerts / Anomalies screen | P1 | TODO | TBD | FE-13 | |
| FE-20 | Implement Protocol / SOP screen | P1 | TODO | TBD | FE-12 | |
| FE-21 | Implement Logs / Event History screen | P1 | TODO | TBD | FE-14 | |
| FE-22 | Implement Module Architecture screen | P2 | TODO | TBD | FE-07 | |
| FE-23 | Implement System Diagnostics screen | P2 | TODO | TBD | FE-08 | |
| FE-24 | Implement all UX states (INITIALIZING through ERROR) | P0 | TODO | TBD | FE-04, FE-06 | |
| FE-25 | Verify dashboard loads from local assets only (no external HTTP) | P0 | TODO | TBD | FE-03 | Offline-first requirement |

---

## UI/UX

| ID | Task | Priority | Status | Owner | Dependencies | Notes |
|---|---|---|---|---|---|---|
| UX-01 | Define and finalize CSS design token values (colors, spacing, fonts) | P0 | TODO | TBD | — | Per Design Doc |
| UX-02 | Design bounding box color coding scheme per object type | P1 | TODO | TBD | — | |
| UX-03 | Design severity color scheme (WARNING=amber, ERROR=red, CRITICAL=red-flash) | P0 | TODO | TBD | — | |
| UX-04 | Design FSM state HUD overlay layout on video | P1 | TODO | TBD | — | |
| UX-05 | Design anomaly alert card layout | P1 | TODO | TBD | — | |
| UX-06 | Define keyboard navigation spec for dashboard | P2 | TODO | TBD | — | Accessibility |
| UX-07 | Add ARIA labels to all interactive elements | P2 | TODO | TBD | FE-07 onwards | Accessibility |
| UX-08 | Implement `prefers-reduced-motion` media query for animations | P2 | TODO | TBD | FE-04 | Accessibility |

---

## Testing

| ID | Task | Priority | Status | Owner | Dependencies | Notes |
|---|---|---|---|---|---|---|
| TE-01 | Set up `pytest` project with coverage reporting | P0 | TODO | TBD | BE-01 | |
| TE-02 | Unit tests: `CameraCapture` (frame timestamping, queue, disconnect) | P1 | TODO | TBD | CV-01 | |
| TE-03 | Unit tests: `ObjectDetector` (confidence filtering, DetectionResult) | P1 | TODO | TBD | CV-09 | |
| TE-04 | Unit tests: `CoordinateNormalizer` (normalization math, clamping) | P1 | TODO | TBD | CV-18 | |
| TE-05 | Unit tests: `HOIEngine` (distance, IoU, threshold, temporal) | P1 | TODO | TBD | HAR-02 | |
| TE-06 | Unit tests: `EventAbstractor` (single + compound event mapping) | P1 | TODO | TBD | HOI-01 | |
| TE-07 | Unit tests: `ProtocolFSM` (all valid transitions) | P0 | TODO | TBD | FSM-01 | |
| TE-08 | Unit tests: `ProtocolFSM` (all anomaly types) | P0 | TODO | TBD | FSM-04-09 | |
| TE-09 | Unit tests: `ProtocolFSM` (timing constraints) | P0 | TODO | TBD | FSM-07-09 | |
| TE-10 | Unit tests: `LogEngine` (JSONL format, audit format, append-only) | P1 | TODO | TBD | TL-01 | |
| TE-11 | Integration test: frame → detection → pose → HOI → event pipeline | P1 | TODO | TBD | HOI-04 | |
| TE-12 | Integration test: event → FSM → state transition + log | P1 | TODO | TBD | FSM-11, TL-02 | |
| TE-13 | Integration test: MJPEG stream + WebSocket telemetry (live) | P1 | TODO | TBD | API-02, API-04 | |
| TE-14 | Fault injection: all 7 anomaly types (Phase 14) | P0 | TODO | TBD | FSM-01, Phase 13 | |
| TE-15 | False positive rate: correct sequence produces zero anomaly events | P0 | TODO | TBD | TE-14 | |
| TE-16 | Frontend: component render tests (Jest) | P2 | TODO | TBD | FE-07 onwards | |
| TE-17 | Frontend: E2E tests (Playwright) for critical flows | P2 | TODO | TBD | FE-16 | |

---

## Hardware

| ID | Task | Priority | Status | Owner | Dependencies | Notes |
|---|---|---|---|---|---|---|
| HW-01 | Verify CUDA availability and version on target edge server | P0 | TODO | TBD | — | |
| HW-02 | Verify NVENC support (FFmpeg with NVENC) on target hardware | P0 | TODO | TBD | — | |
| HW-03 | Connect and test payload camera on target hardware | P0 | TODO | TBD | — | |
| HW-04 | Connect and test local speaker (Piper TTS output) | P1 | TODO | TBD | — | |
| HW-05 | Set up isolated local network (edge server ↔ dashboard display) | P1 | TODO | TBD | — | |
| HW-06 | Set up Mission Dashboard on separate display machine | P1 | TODO | TBD | HW-05 | |
| HW-07 | Calibrate anchor region for physical rig camera angle | P0 | TODO | TBD | Phase 16 | |
| HW-08 | Verify `pynvml` and `psutil` on target OS | P1 | TODO | TBD | TL-04 | |

---

## Documentation

| ID | Task | Priority | Status | Owner | Dependencies | Notes |
|---|---|---|---|---|---|---|
| DOC-01 | PRD.md — complete and reviewed | P0 | DONE | TBD | — | |
| DOC-02 | TRD.md — complete and reviewed | P0 | DONE | TBD | — | |
| DOC-03 | workflow.md — complete and reviewed | P0 | DONE | TBD | — | |
| DOC-04 | Design Doc.md — complete and reviewed | P0 | DONE | TBD | — | |
| DOC-05 | Schema Doc.md — complete and reviewed | P0 | DONE | TBD | — | |
| DOC-06 | Implementation Doc.md — complete and reviewed | P0 | DONE | TBD | — | |
| DOC-07 | TODO Tracker.md — complete and reviewed | P0 | DONE | TBD | — | |
| DOC-08 | Rules Doc.md — complete and reviewed | P0 | DONE | TBD | — | |
| DOC-09 | Security.md — complete and reviewed | P0 | DONE | TBD | — | |
| DOC-10 | README.md — complete and reviewed | P0 | DONE | TBD | — | |
| DOC-11 | docs/SETUP.md — environment setup guide | P1 | TODO | TBD | Phase 0 | |
| DOC-12 | docs/PROTOCOL_GUIDE.md — how to write a `protocol_rules.json` | P1 | TODO | TBD | FSM-01 | |
| DOC-13 | docs/DATASET_GUIDE.md — annotation guidelines | P1 | TODO | TBD | DS-04 | |
| DOC-14 | Performance benchmark report (Phase 15 output) | P1 | TODO | TBD | Phase 15 | Actual measured values |
| DOC-15 | Hardware deployment guide | P1 | TODO | TBD | Phase 16 | |

---

## Demo Preparation

| ID | Task | Priority | Status | Owner | Dependencies | Notes |
|---|---|---|---|---|---|---|
| DM-01 | Prepare demo `protocol_rules.json` for showcase protocol | P1 | TODO | TBD | FSM-01 | |
| DM-02 | Record demo session video (correct execution) | P1 | TODO | TBD | Phase 13 | |
| DM-03 | Record demo session video (anomaly detection scenarios) | P1 | TODO | TBD | Phase 14 | |
| DM-04 | Prepare Mission Dashboard screenshot set for documentation | P2 | TODO | TBD | FE-16 | |
| DM-05 | Prepare slide deck summary for technical presentation | P2 | TODO | TBD | All docs | |

---

*End of TODO Tracker — AstroFlow-AI v0.1.0-draft*

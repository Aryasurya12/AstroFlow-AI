# AstroFlow-AI — Implementation Roadmap

> **Document Version:** 0.1.0-draft  
> **Status:** Planning / Pre-Development  
> **Last Updated:** 2026-08-29  
> **Related Documents:** [TRD.md](./TRD.md) · [TODO Tracker.md](./TODO%20Tracker.md) · [Schema Doc.md](./Schema%20Doc.md)

---

## Table of Contents

- [Phase Overview](#phase-overview)
- [Phase 0 — Project Setup](#phase-0--project-setup)
- [Phase 1 — Camera & Video Ingestion](#phase-1--camera--video-ingestion)
- [Phase 2 — Object Detection Pipeline](#phase-2--object-detection-pipeline)
- [Phase 3 — Human & Hand/Pose Detection](#phase-3--human--handpose-detection)
- [Phase 4 — Custom Dataset Creation](#phase-4--custom-dataset-creation)
- [Phase 5 — Model Training & Validation](#phase-5--model-training--validation)
- [Phase 6 — HOI Engine](#phase-6--hoi-engine)
- [Phase 7 — Event Abstraction Layer](#phase-7--event-abstraction-layer)
- [Phase 8 — FSM / Protocol Validator](#phase-8--fsm--protocol-validator)
- [Phase 9 — Offline Voice Module](#phase-9--offline-voice-module)
- [Phase 10 — Telemetry & Logging](#phase-10--telemetry--logging)
- [Phase 11 — FastAPI Async Hub](#phase-11--fastapi-async-hub)
- [Phase 12 — Next.js Mission Dashboard](#phase-12--nextjs-mission-dashboard)
- [Phase 13 — End-to-End Integration](#phase-13--end-to-end-integration)
- [Phase 14 — Fault Injection & Abnormal Sequence Testing](#phase-14--fault-injection--abnormal-sequence-testing)
- [Phase 15 — Performance Benchmarking](#phase-15--performance-benchmarking)
- [Phase 16 — Hardware Deployment](#phase-16--hardware-deployment)

---

## Phase Overview

| Phase | Name | Status | Blocking |
|---|---|---|---|
| 0 | Project Setup | TODO | — |
| 1 | Camera & Video Ingestion | TODO | Phase 0 |
| 2 | Object Detection Pipeline | TODO | Phase 0 |
| 3 | Human & Hand/Pose Detection | TODO | Phase 0 |
| 4 | Custom Dataset Creation | TODO | Phases 2, 3 |
| 5 | Model Training & Validation | TODO | Phase 4 |
| 6 | HOI Engine | TODO | Phases 2, 3 |
| 7 | Event Abstraction Layer | TODO | Phase 6 |
| 8 | FSM / Protocol Validator | TODO | Phase 7 |
| 9 | Offline Voice Module | TODO | Phase 8 |
| 10 | Telemetry & Logging | TODO | Phase 8 |
| 11 | FastAPI Async Hub | TODO | Phases 1, 8, 10 |
| 12 | Next.js Mission Dashboard | TODO | Phase 11 |
| 13 | End-to-End Integration | TODO | All prior phases |
| 14 | Fault Injection Testing | TODO | Phase 13 |
| 15 | Performance Benchmarking | TODO | Phase 13 |
| 16 | Hardware Deployment | TODO | Phases 14, 15 |

> **Note:** Phases 2, 3, 6, and 7 can proceed in parallel using a pre-trained model (e.g., stock YOLOv8s on COCO) until the custom dataset (Phase 4) and trained model (Phase 5) are ready.

---

## Phase 0 — Project Setup

### Objective
Establish the project structure, tooling, development environment, and core conventions before any feature code is written.

### Tasks
- [ ] Initialize Git repository (`AstroFlow-AI`).
- [ ] Create directory structure per TRD Section 13.3.
- [ ] Create `pyproject.toml` / `requirements.txt` with all core Python dependencies.
- [ ] Set up Python virtual environment (Python 3.10+).
- [ ] Verify CUDA availability on development machine (`torch.cuda.is_available()`).
- [ ] Create `configs/protocol_rules.json` with schema scaffold (empty / example structure).
- [ ] Create `configs/protocol_rules.schema.json` (JSON Schema for validation).
- [ ] Set up `pytest` with initial empty test directories.
- [ ] Initialize Next.js project in `frontend/` (TypeScript, App Router).
- [ ] Set up linting (Python: ruff or flake8; TypeScript: ESLint).
- [ ] Create initial `README.md`, `docs/` folder.
- [ ] Create `.gitignore` for models, datasets, recordings, logs, env.
- [ ] Document environment setup in `docs/SETUP.md`.

### Inputs
- Repository created.
- Development machine with RTX 3050 (or equivalent for development).

### Outputs
- Functional project scaffold.
- All dependencies installable.
- CUDA verified.
- Empty `protocol_rules.json` validated against schema.

### Acceptance Criteria
- `pytest` runs with 0 failures (empty test suites pass).
- `next dev` starts without errors.
- `torch.cuda.is_available()` returns `True` on target machine.
- `protocol_rules.json` schema validation passes on the scaffold file.

### Risks
- CUDA driver version incompatibility on development machine.
- Next.js App Router conventions differ from Pages Router — ensure team is aligned.

---

## Phase 1 — Camera & Video Ingestion

### Objective
Implement Module 1: reliable camera frame acquisition, concurrent NVENC H.264 archival, and frame delivery to the inference pipeline.

### Tasks
- [ ] Implement `CameraCapture` class using `cv2.VideoCapture`.
- [ ] Support camera index configuration and auto-detect fallback.
- [ ] Implement target FPS enforcement and frame timestamping.
- [ ] Implement thread-safe frame queue between capture and inference.
- [ ] Implement archive branch: NVENC H.264 encoding via FFmpeg subprocess or OpenCV FFmpeg backend.
- [ ] MP4 file naming: `recordings/session_{session_id}_{timestamp}.mp4`.
- [ ] Implement frame drop logging when inference queue is full.
- [ ] Implement camera disconnection detection and CAMERA_DISCONNECTED state signal.
- [ ] Implement camera reconnection polling.
- [ ] Unit tests: frame timestamping, queue behavior, reconnection logic.

### Inputs
- USB or CSI camera connected.
- Phase 0 complete.

### Outputs
- `FramePacket` dataclass with frame, timestamp, frame_id.
- Continuous MP4 archive file per session.
- Frame drop events logged.

### Dependencies
- OpenCV, FFmpeg with NVENC support, PyTorch (for later CUDA verification).

### Acceptance Criteria
- Camera streams at target FPS without dropped frames under no-load conditions.
- MP4 archive is readable and timestamped correctly.
- Camera disconnection event is logged within 1 second of physical disconnect.
- Reconnection resumes archiving and inference frame delivery.

### Risks
- NVENC availability depends on GPU driver version; FFmpeg must be compiled with NVENC support.
- Frame rate may drop under load — acceptable if it stays above minimum inference rate.

---

## Phase 2 — Object Detection Pipeline

### Objective
Implement Module 2A: real-time object detection using a pre-trained or stock YOLOv8s model (custom model from Phase 5 replaces this later).

### Tasks
- [ ] Implement `ObjectDetector` class wrapping Ultralytics YOLO.
- [ ] Load model from configurable `model_path` in `detection_config`.
- [ ] Run inference on frames from Phase 1 frame queue.
- [ ] Parse YOLO output into `DetectionResult` dataclass.
- [ ] Apply confidence threshold filtering (separate main threshold and low-confidence threshold).
- [ ] Log low-confidence detections at WARNING level (do not silently discard).
- [ ] Implement inference FPS measurement.
- [ ] Unit tests: `DetectionResult` structure, confidence filtering behavior.
- [ ] Integration test: live frame → detection result within expected latency range.

### Inputs
- Frame queue from Phase 1.
- Pre-trained YOLOv8s model (stock COCO model for development; replaced in Phase 5).

### Outputs
- `DetectionResult` per frame → forwarded to Phase 3 (pose) and Phase 6 (HOI).

### Dependencies
- Phase 1 (frame queue).
- Ultralytics, PyTorch, CUDA.

### Acceptance Criteria
- Detection runs on GPU (CUDA); falls back to CPU with warning if GPU unavailable.
- `DetectionResult` contains correct bbox format and confidence scores.
- Low-confidence detections are logged, not silently dropped.
- Inference FPS counter is accurate within 5%.

### Risks
- Stock COCO model will not detect domain-specific objects (vials, syringes). Expected at this phase — this is a pipeline integration milestone, not a final accuracy milestone.
- VRAM pressure if run concurrently with Phase 3 (pose) — profile before combining.

---

## Phase 3 — Human & Hand/Pose Detection

### Objective
Implement Module 2B: hand/keypoint tracking using MediaPipe Hands, and optionally full-body pose using YOLO-Pose.

### Tasks
- [ ] Implement `HandTracker` class using MediaPipe Hands.
- [ ] Convert MediaPipe output to `HandTrack` dataclass (21 keypoints per hand).
- [ ] Extract wrist and fingertip pixel coordinates.
- [ ] Implement `PoseTracker` class using YOLO-Pose (optional; use if body keypoints required).
- [ ] Combine hand and pose results into `PoseResult` dataclass.
- [ ] Implement Module 2C: `CoordinateNormalizer` class.
  - Load anchor region from `protocol_rules.json`.
  - Normalize all pixel-space bboxes and keypoints to anchor-relative [0, 1] coordinates.
  - Clamp out-of-bounds detections and flag them.
- [ ] Unit tests: normalization math, keypoint extraction, multi-hand handling.

### Inputs
- Frame from Phase 1 (direct or copy).
- `DetectionResult` from Phase 2 (for person bbox reference).

### Outputs
- `PoseResult` with normalized keypoints → forwarded to Phase 6 (HOI).
- `NormalizedCoordinates` for all detections → forwarded to Phase 6.

### Dependencies
- Phase 1 (frames).
- Phase 2 (for combined pipeline).
- MediaPipe, NumPy.

### Acceptance Criteria
- MediaPipe Hands detects at least one hand in controlled test footage.
- 21 keypoints per hand are populated correctly.
- Normalized coordinates are in [0, 1] range for all in-workspace detections.
- Anchor region configuration can be changed without code modification.

### Risks
- MediaPipe is CPU-bound; VRAM impact is minimal but CPU load increases.
- Hand detection may fail under gloves — this is a dataset and fine-tuning concern (Phase 5).

---

## Phase 4 — Custom Dataset Creation

### Objective
Plan, collect, and annotate a custom dataset covering all five dataset layers (human detection, object detection, HOI, action labels, sequence data) required for training domain-specific models.

### Tasks

#### 4A — Dataset Planning
- [ ] Define all object classes and interaction labels for the initial experiment protocol.
- [ ] Define annotation schema aligned with Schema Doc.md (Layer A–E).
- [ ] Choose annotation tool (CVAT or Label Studio — local deployment).
- [ ] Create annotation guidelines document.

#### 4B — Data Collection
- [ ] Set up recording rig with payload camera at target angle.
- [ ] Collect footage with multiple operators.
- [ ] Ensure lighting variation, occlusion variation, object orientation variation.
- [ ] Collect correct execution sequences.
- [ ] Collect deliberate incorrect sequences (skipped steps, wrong objects, wrong order).
- [ ] Collect multiple repetitions per action and sequence type.

#### 4C — Annotation
- [ ] Annotate object bounding boxes per frame (Layer B).
- [ ] Annotate human/hand detections (Layer A).
- [ ] Annotate HOI interaction labels (Layer C).
- [ ] Annotate temporal action segments (Layer D).
- [ ] Annotate sequence-level correct/incorrect labels (Layer E).

#### 4D — Dataset Pipeline
- [ ] Implement train/val/test split.
- [ ] Implement data augmentation pipeline (flip, brightness, crop, rotation).
- [ ] Export to YOLO format for object detection training.
- [ ] Export to temporal annotation format for action segment training.
- [ ] Verify dataset statistics (class distribution, annotation coverage).

### Inputs
- Physical experiment rig with all protocol objects.
- Multiple operators.
- Phase 2 and 3 (as reference for what the model needs to detect).

### Outputs
- Annotated dataset in YOLO format for Phase 5.
- Dataset split: train / val / test.
- Annotation statistics report.

### Dependencies
- Physical payload rig availability.
- CVAT or Label Studio (local).

### Acceptance Criteria
- All defined object classes have sufficient annotations.
- Both correct and incorrect execution sequences are represented.
- Annotation guidelines are followed consistently across annotators.
- Dataset statistics pass minimum class balance checks.

### Risks
- Insufficient variation in early collection — mitigate with deliberate variation checklist.
- Annotation inconsistency across operators — mitigate with annotation guidelines and review pass.
- Dataset size may be small initially — augmentation pipeline required.

---

## Phase 5 — Model Training & Validation

### Objective
Fine-tune YOLOv8s (or YOLOv11s) on the custom dataset to detect domain-specific experiment objects and persons with gloves.

### Tasks
- [ ] Configure Ultralytics training pipeline on the custom dataset.
- [ ] Set up training on development GPU (RTX 3050 or higher).
- [ ] Train object detection model on Layer B + Layer A annotations.
- [ ] Evaluate: mAP@0.5, precision, recall per class.
- [ ] Perform iterative fine-tuning based on evaluation.
- [ ] Export trained model to `.pt` format.
- [ ] Run inference on held-out test set.
- [ ] Document evaluation results (do not fabricate metrics — record actual measurements).
- [ ] Replace the stock COCO model in Phase 2 with the custom-trained model.
- [ ] Re-run Phase 2 acceptance criteria with the fine-tuned model.

### Inputs
- Custom dataset from Phase 4.
- Ultralytics YOLOv8s base model.

### Outputs
- `models/yolov8s_bas_v1.pt` — fine-tuned model file.
- Training metrics report (mAP, P/R curves, confusion matrix).
- Evaluation results on test split.

### Dependencies
- Phase 4 complete (dataset available).
- GPU training environment (RTX 3050 minimum, higher GPU preferred for faster training).

### Acceptance Criteria
- Model achieves acceptable mAP on test split (threshold to be defined based on initial evaluation; target is to be measured).
- Per-class performance for all defined object classes is logged and reviewed.
- Model runs on RTX 3050 within VRAM budget.
- Model file is stored at configured path; system loads it without modification.

### Risks
- Insufficient dataset size — augmentation and additional collection required.
- Class imbalance (e.g., too few "gloves" examples) — monitor per-class metrics.
- VRAM constraint during concurrent training and other processes — manage resource allocation.

---

## Phase 6 — HOI Engine

### Objective
Implement Module 2D: Human-Object Interaction (HOI) matrix computation from normalized detections and pose results.

### Tasks
- [ ] Implement `HOIEngine` class.
- [ ] Compute per-hand per-object Euclidean distance in normalized space.
- [ ] Compute bounding box IoU between hand bbox and object bbox.
- [ ] Apply interaction class thresholds from `hoi_config` in `protocol_rules.json`.
- [ ] Apply temporal consistency filter (`min_duration_frames`).
- [ ] Compute composite HOI confidence score.
- [ ] Produce `HOIMatrix` per frame.
- [ ] Unit tests: distance computation, IoU computation, threshold application, temporal consistency.

### Inputs
- `DetectionResult` (normalized bboxes) from Phase 2+3.
- `PoseResult` (normalized hand keypoints) from Phase 3.
- HOI configuration from `protocol_rules.json`.

### Outputs
- `HOIMatrix` per frame → forwarded to Phase 7.

### Dependencies
- Phases 2, 3 (detection and pose).
- NumPy, SciPy.

### Acceptance Criteria
- HOI matrix is computed correctly for all hand-object pairs in test frames.
- Temporal consistency filter prevents single-frame interaction flashes.
- Confidence scores are computed using the defined composite formula.
- All HOI configuration parameters are read from `protocol_rules.json` — no hardcoded values.

### Risks
- HOI false positives in cluttered workspaces — mitigate with appropriate distance/IoU thresholds.
- Performance: HOI computation must not be the bottleneck in the pipeline.

---

## Phase 7 — Event Abstraction Layer

### Objective
Implement Module 2E: map HOI matrix entries to named protocol events using `event_mapping` in `protocol_rules.json`.

### Tasks
- [ ] Implement `EventAbstractor` class.
- [ ] Load `event_mapping` from `protocol_rules.json`.
- [ ] For each `HOIMatrix` input, evaluate against all event mapping rules.
- [ ] Emit `ProtocolEvent` when all conditions for an event are satisfied.
- [ ] Include source `interaction_id` in each `ProtocolEvent`.
- [ ] Handle compound events (multiple simultaneous HOI conditions required).
- [ ] Unit tests: single-HOI event mapping, compound event mapping, no-match behavior.
- [ ] Integration test: HOI matrix → ProtocolEvent pipeline.

### Inputs
- `HOIMatrix` from Phase 6.
- `event_mapping` from `protocol_rules.json`.

### Outputs
- `ProtocolEvent` stream → forwarded to Phase 8 (FSM).

### Dependencies
- Phase 6 (HOI engine).
- `protocol_rules.json` with `event_mapping` populated.

### Acceptance Criteria
- `ProtocolEvent` is emitted correctly for all events defined in `event_mapping`.
- No protocol events are emitted for undefined HOI patterns.
- No hardcoded event names exist in the `EventAbstractor` source code.
- Event confidence is correctly propagated from HOI confidence.

### Risks
- Overly strict event mapping conditions may miss valid events — tune thresholds during integration.
- Overly loose conditions may cause false events — validate with fault injection (Phase 14).

---

## Phase 8 — FSM / Protocol Validator

### Objective
Implement Module 3: Deterministic Experiment Validator using the Python `transitions` library driven entirely by `protocol_rules.json`.

### Tasks
- [ ] Implement `ProtocolFSM` class using `transitions.Machine`.
- [ ] Load states, transitions, and timing rules from `protocol_rules.json`.
- [ ] Build FSM programmatically (no hardcoded states or transitions).
- [ ] Implement `protocol_rules.json` validation on load (see Schema Doc.md Section 12.1).
- [ ] Implement anomaly detection for all classified anomaly types.
- [ ] Implement timing constraints (min/max step time).
- [ ] Implement PAUSED / SESSION_ABORTED system states.
- [ ] Produce `StateTransition` and `AnomalyRecord` on each event.
- [ ] Implement FSM diagram export (Graphviz) for debugging.
- [ ] Unit tests: all valid transitions, all anomaly types, timing constraints, pause/resume.
- [ ] Integration test: EventAbstractor → FSM pipeline.

### Inputs
- `ProtocolEvent` stream from Phase 7.
- `protocol_rules.json` (steps + transitions + anomaly_rules).

### Outputs
- `StateTransition` records → to Module 5 (logging).
- `AnomalyRecord` records → to Modules 4, 5, 6.
- FSM state → to all modules as shared state.

### Dependencies
- Phase 7 (event stream).
- `transitions` library.
- `protocol_rules.json` with full steps and transitions.

### Acceptance Criteria
- FSM loads successfully from `protocol_rules.json` with no hardcoded values.
- All valid transitions produce correct state advancement.
- All anomaly types are detected and classified correctly.
- Timing constraints are enforced accurately.
- PAUSED state preserves FSM position exactly.
- Validation failure on invalid `protocol_rules.json` halts startup.

### Risks
- `protocol_rules.json` misconfiguration may cause FSM deadlocks — validation and test suite are essential.
- `transitions` library state machine with many states may have performance implications — profile under load.

---

## Phase 9 — Offline Voice Module

### Objective
Implement Module 4: async voice prompt delivery using Piper TTS and Pyttsx3 fallback.

### Tasks
- [ ] Install and verify Piper TTS with local voice model (`.onnx` file).
- [ ] Implement `VoiceModule` class with async voice queue.
- [ ] Implement Piper TTS synthesis (text → `.wav` → audio playback).
- [ ] Implement Pyttsx3 fallback synthesis.
- [ ] Implement voice queue priority system (NORMAL / HIGH / CRITICAL).
- [ ] Load voice prompt text from `protocol_rules.json` `voice_prompts` section.
- [ ] Subscribe to FSM state transitions and anomaly events.
- [ ] Emit `VoiceEvent` log record on delivery.
- [ ] Unit tests: queue priority behavior, fallback activation, voice event logging.

### Inputs
- FSM state transitions and anomaly records from Phase 8.
- `voice_prompts` from `protocol_rules.json`.
- Local Piper voice model file.

### Outputs
- Audio output to local speaker.
- `VoiceEvent` log records.

### Dependencies
- Phase 8 (FSM events).
- Piper TTS, Pyttsx3, system audio interface.

### Acceptance Criteria
- Voice prompts are delivered within acceptable latency of triggering event.
- Pyttsx3 fallback activates automatically if Piper fails.
- Voice synthesis does not block the inference pipeline.
- CRITICAL priority prompts are never discarded by queue overflow.

### Risks
- Piper synthesis latency — async queue design mitigates blocking; measure actual latency.
- Audio hardware availability on target edge server.

---

## Phase 10 — Telemetry & Logging

### Objective
Implement Module 5: structured JSON event logging, flat text audit trail, and real-time system metrics collection.

### Tasks
- [ ] Implement `LogEngine` class with async write queue.
- [ ] Implement JSONL event log writer (`session_{id}_events.json`).
- [ ] Implement flat text audit log writer (`session_{id}_audit.txt`).
- [ ] Implement `TelemetryCollector` using `pynvml` (GPU) and `psutil` (CPU/RAM).
- [ ] Implement `TelemetrySnapshot` at configurable interval (default 1 Hz).
- [ ] Implement session summary record at session end.
- [ ] Ensure logs are append-only; never open in overwrite mode during a session.
- [ ] Implement log flush on session end.
- [ ] Unit tests: JSONL format correctness, audit log format, session summary, append-only enforcement.

### Inputs
- Events from all modules (via internal event bus or direct call).
- GPU/system metrics from `pynvml`/`psutil`.

### Outputs
- `logs/session_{id}_events.json` (JSONL).
- `logs/session_{id}_audit.txt` (plain text).
- `TelemetrySnapshot` objects → to Module 6 (WebSocket).

### Dependencies
- Phase 8 (FSM events), Phase 9 (voice events).
- `pynvml`, `psutil`.

### Acceptance Criteria
- All log entries are correctly structured per Schema Doc.md.
- Log files are never corrupted by concurrent writes (async queue enforces single writer).
- Telemetry snapshot is emitted at the configured interval with accurate metrics.
- Session summary is correctly computed at session end.

### Risks
- Disk I/O contention with video archive — monitor storage throughput.
- `pynvml` may require specific driver version — verify on target hardware.

---

## Phase 11 — FastAPI Async Hub

### Objective
Implement Module 6: async FastAPI backend exposing `/video_feed` (MJPEG) and `/ws/telemetry` (WebSocket) to the Mission Dashboard.

### Tasks
- [ ] Set up FastAPI application with Uvicorn.
- [ ] Implement `GET /video_feed` (MJPEG multipart stream with CV annotations applied).
- [ ] Implement annotation overlay: bounding boxes, labels, confidence, hand skeleton, HOI indicators, FSM HUD.
- [ ] Implement `WS /ws/telemetry` WebSocket endpoint.
- [ ] Implement all WebSocket message types per TRD Section 9.2.
- [ ] Implement `GET /health`, `GET /session/status`.
- [ ] Implement `POST /session/start`, `/session/pause`, `/session/resume`, `/session/abort`.
- [ ] Implement `GET /protocols` (list available protocols).
- [ ] Implement `GET /logs/{session_id}`.
- [ ] CORS configuration for local subnet only.
- [ ] Structured error responses.
- [ ] Integration test: MJPEG stream receives annotated frames; WebSocket client receives all message types.

### Inputs
- Annotated frames from inference pipeline.
- FSM state, telemetry snapshots, anomaly records from Modules 3, 5.

### Outputs
- MJPEG stream served at `http://{ip}:8000/video_feed`.
- WebSocket stream at `ws://{ip}:8000/ws/telemetry`.
- REST endpoints for session management.

### Dependencies
- Phase 1 (frames), Phase 2/3 (detection/pose for annotation), Phase 8 (FSM), Phase 10 (telemetry).
- FastAPI, Uvicorn, websockets.

### Acceptance Criteria
- MJPEG stream displays annotated frames with no visible stutter at target FPS.
- WebSocket pushes telemetry messages at ~1 Hz.
- WebSocket pushes protocol events immediately on FSM transition (sub-200ms).
- All REST endpoints return structured JSON.
- API is only accessible on local subnet (CORS enforced).

### Risks
- Annotation rendering in Python (cv2.rectangle etc.) may add per-frame overhead — profile.
- WebSocket connection management for multiple simultaneous clients.

---

## Phase 12 — Next.js Mission Dashboard

### Objective
Implement the frontend Mission Dashboard per the Design Doc specification.

### Tasks

#### 12A — Foundation
- [ ] Set up Next.js App Router structure.
- [ ] Implement CSS design token system (per Design Doc Section 5.2).
- [ ] Implement global layout: top status bar, left nav rail, main area, right panel, bottom console.
- [ ] Bundle offline fonts (Inter + JetBrains Mono).
- [ ] Implement MJPEG video viewport component.
- [ ] Implement WebSocket client with reconnect logic.

#### 12B — Core Components
- [ ] `<StatusBadge>` — all severity variants.
- [ ] `<TelemetryCard>` — metric display.
- [ ] `<BoundingBoxOverlay>` — SVG overlay on video.
- [ ] `<HandSkeletonOverlay>` — MediaPipe skeleton.
- [ ] `<HOIIndicator>` — interaction line overlay.
- [ ] `<ProtocolChecklist>` — step list with status.
- [ ] `<AnomalyAlert>` — card with full anomaly details.
- [ ] `<EventTerminal>` — auto-scrolling monospace log.
- [ ] `<RecordingIndicator>` — REC + elapsed.

#### 12C — Screens
- [ ] **Live Video / HAR View** (primary operational screen).
- [ ] **Mission Dashboard** (home/overview).
- [ ] **Telemetry** screen.
- [ ] **Alerts / Anomalies** screen.
- [ ] **Protocol / SOP** screen.
- [ ] **Logs / Event History** screen.
- [ ] **Module Architecture** screen.
- [ ] **System Diagnostics** screen.

#### 12D — State Management
- [ ] Implement WebSocket message routing to UI state.
- [ ] Implement all UX states (INITIALIZING, READY, RUNNING, WARNING, ANOMALY, PAUSED, DISCONNECTED, COMPLETE, ERROR).

### Inputs
- Backend API (Phase 11) running.
- Design Doc.md specifications.

### Outputs
- Fully functional Next.js Mission Dashboard.
- Runnable with `npm run dev` pointed at local backend.

### Dependencies
- Phase 11 (backend API).
- Design Doc.md.

### Acceptance Criteria
- All 8 screens render without errors.
- Live video viewport displays MJPEG stream with visible CV annotations.
- WebSocket telemetry updates protocol checklist and telemetry HUD in real time.
- Anomaly alerts appear immediately on ERROR/CRITICAL events.
- All UX states visually correct.
- Dashboard loads from local assets only (no external HTTP requests).

### Risks
- MJPEG stream in browser may behave differently across browsers — test with Chrome and Firefox.
- Canvas/SVG overlay performance on high-FPS video streams.

---

## Phase 13 — End-to-End Integration

### Objective
Connect all modules into a single running system and verify the complete pipeline from camera to dashboard.

### Tasks
- [ ] Integrate all 6 backend modules into unified startup script.
- [ ] Implement shared state management between modules (session ID, FSM state).
- [ ] Verify camera → detection → pose → HOI → event → FSM → voice + log + WebSocket pipeline.
- [ ] Run a full mock experiment session with a manually executed protocol.
- [ ] Verify all log files are correctly written for the session.
- [ ] Verify video archive is correctly written.
- [ ] Verify Mission Dashboard shows correct state at each step.
- [ ] Verify voice prompts are delivered at correct events.
- [ ] Document any integration issues found.

### Inputs
- All prior phases complete.

### Outputs
- Complete end-to-end system running on development hardware.
- Session log files from test run.
- Video archive from test run.
- Integration issues log.

### Acceptance Criteria
- Full protocol session executes from SYSTEM_IDLE to SESSION_COMPLETE.
- All modules are active and communicating correctly.
- Mission Dashboard shows correct FSM state throughout.
- All voice prompts are delivered.
- All log entries are present and correctly structured.

### Risks
- Inter-module timing issues — frame processing latency may cause pipeline stalls.
- Thread safety issues with shared state — enforce queue-based communication.

---

## Phase 14 — Fault Injection & Abnormal Sequence Testing

### Objective
Verify the FSM correctly detects and classifies all anomaly types by deliberately executing incorrect protocol sequences.

### Tasks
- [ ] Design fault injection test suite in `tests/test_fsm_fault_injection.py`.
- [ ] Test case: INVALID_ACTION — submit event not valid for current state.
- [ ] Test case: SKIPPED_STEP — submit step N+2 event without step N+1.
- [ ] Test case: OUT_OF_ORDER — submit a future-step event.
- [ ] Test case: PREMATURE_ACTION — submit event within min_time constraint.
- [ ] Test case: REPEATED_ACTION — submit same completed step event again.
- [ ] Test case: STEP_TIMEOUT — let step timer expire without event.
- [ ] Test case: UNKNOWN_INTERACTION — submit an event not in event_mapping.
- [ ] Verify correct anomaly classification for each case.
- [ ] Verify correct severity assignment for each case.
- [ ] Verify voice warnings are delivered for each case.
- [ ] Verify dashboard anomaly panel activates for each case.
- [ ] Document false positive rate on correctly executed sequences.

### Inputs
- Phase 13 complete (integrated system).
- Fault injection test cases.

### Outputs
- Fault injection test results report.
- Anomaly detection accuracy metrics.
- False positive rate on correct sequences.

### Acceptance Criteria
- All 7 anomaly types are correctly detected in automated tests.
- False positive rate (anomalies during correct execution) is zero in automated tests.

### Risks
- Ambiguous HOI events may cause false positives — return to Phase 6/7 for threshold tuning.

---

## Phase 15 — Performance Benchmarking

### Objective
Measure all system performance metrics on the target RTX 3050 hardware and document actual measured values.

### Tasks
- [ ] Measure object detection inference time (ms per frame) on RTX 3050.
- [ ] Measure pose tracking inference time (ms per frame).
- [ ] Measure HOI matrix computation time.
- [ ] Measure end-to-end frame latency (capture → FSM event).
- [ ] Measure pipeline FPS under simultaneous detection + pose + HOI.
- [ ] Measure VRAM peak usage.
- [ ] Measure GPU utilization % during active inference.
- [ ] Measure audio archival throughput (NVENC frame rate at 1080p).
- [ ] Measure WebSocket push latency (FSM event to dashboard update).
- [ ] Document all measured values (do not estimate; use actual measurements).
- [ ] Identify bottlenecks.
- [ ] Optimize if required (model quantization, TensorRT, frame skip, batch tuning).

### Inputs
- Phase 13 complete (integrated system on target hardware).

### Outputs
- Performance benchmark report with actual measured values.
- Optimization recommendations if bottlenecks identified.

### Acceptance Criteria
- All metrics measured and documented with actual values.
- End-to-end latency is acceptable for real-time operation (threshold defined after initial measurement).
- VRAM usage does not exceed available VRAM (4 GB or 8 GB depending on hardware variant).

### Risks
- 4 GB VRAM variant may not support concurrent YOLOv8s + MediaPipe at full FPS — model optimization required.

---

## Phase 16 — Hardware Deployment

### Objective
Deploy the complete system on the target experiment-environment edge hardware and validate operation.

### Tasks
- [ ] Prepare OS image or Docker container for edge server.
- [ ] Install all dependencies on target machine.
- [ ] Transfer model files, protocol configuration, and application code.
- [ ] Verify CUDA/GPU availability on target hardware.
- [ ] Connect physical payload camera and verify capture.
- [ ] Connect and test local speaker.
- [ ] Set up isolated local network (edge server ↔ Mission Dashboard display).
- [ ] Run Mission Dashboard on separate display machine.
- [ ] Execute full protocol session with physical experiment rig.
- [ ] Verify all log files and video archive.
- [ ] Verify voice prompts audible from operator position.
- [ ] Verify Mission Dashboard accessible on separate machine via local network.
- [ ] Run fault injection tests on deployed hardware.
- [ ] Document any hardware-specific issues.

### Inputs
- All prior phases complete.
- Target edge hardware available.
- Physical experiment rig assembled.

### Outputs
- Deployed AstroFlow-AI system on target hardware.
- Deployment validation report.

### Acceptance Criteria
- Full end-to-end protocol session completes successfully on physical rig.
- No hardware-specific regressions from development environment.
- Mission Dashboard accessible from separate network machine.
- All logs and video archive written correctly.
- Voice prompts audible from operator position.

### Risks
- Hardware-specific driver or dependency issues.
- Physical rig camera angle may require anchor calibration adjustment.
- Network configuration on isolated subnet may require configuration.

---

*End of Implementation Doc — AstroFlow-AI v0.1.0-draft*

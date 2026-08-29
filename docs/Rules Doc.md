# AstroFlow-AI — Engineering & Coding Rules

> **Document Version:** 0.1.0-draft  
> **Status:** Active — applies to all development  
> **Last Updated:** 2026-08-29  
> **Related Documents:** [TRD.md](./TRD.md) · [Schema Doc.md](./Schema%20Doc.md) · [Security.md](./Security.md)

---

## Table of Contents

1. [Architecture Rules](#1-architecture-rules)
2. [Python Rules](#2-python-rules)
3. [TypeScript / Next.js Rules](#3-typescript--nextjs-rules)
4. [Computer Vision Rules](#4-computer-vision-rules)
5. [ML / Model Rules](#5-ml--model-rules)
6. [Dataset Rules](#6-dataset-rules)
7. [API Rules](#7-api-rules)
8. [Logging Rules](#8-logging-rules)
9. [FSM Rules](#9-fsm-rules)
10. [UI Rules](#10-ui-rules)
11. [Git Rules](#11-git-rules)
12. [Naming Conventions](#12-naming-conventions)
13. [Error Handling Rules](#13-error-handling-rules)
14. [Testing Rules](#14-testing-rules)
15. [Performance Rules](#15-performance-rules)
16. [Offline-First Rules](#16-offline-first-rules)

---

## 1. Architecture Rules

### ARCH-01 — Strict Pipeline Separation
The pipeline is: **PERCEPTION → INTERACTION UNDERSTANDING → EVENT ABSTRACTION → DETERMINISTIC VALIDATION → OPERATOR FEEDBACK**.

These stages must never be collapsed. The CV/HAR Engine (Module 2) must never contain protocol logic. The FSM (Module 3) must never contain CV/perception logic.

### ARCH-02 — Protocol Logic in Configuration Only
No experiment-specific logic (step ordering, expected events, timing constraints, allowed objects, voice messages) may appear in any Python source file. All protocol logic lives in `protocol_rules.json`. This is inviolable.

### ARCH-03 — Models Are Swappable
The object detection model, pose model, and TTS model must be replaceable by changing configuration paths and the model file. No module depends on a specific model being YOLOv8s, or any specific checkpoint. The interface contract must be stable across model changes.

### ARCH-04 — Inference Must Not Block
No blocking I/O operation (disk write, audio synthesis, API response) may occur in the frame processing hot path. Use async queues, background threads, and async FastAPI routes.

### ARCH-05 — No Silent Failures
Every module must handle its failure modes explicitly. No exception may be silently swallowed. Every error must be logged with the full context required for post-session diagnosis.

### ARCH-06 — Forward-Only Data Flow
Data flows: Camera → Module 2 → Module 3 → Modules 4/5/6. No data flows backward (e.g., FSM state must not influence detection or HOI computation).

### ARCH-07 — Offline-First by Default
Every design decision defaults to offline operation. Network connectivity is never assumed. Dependencies on external services, APIs, or CDNs are not permitted in the core inference path.

### ARCH-08 — Single Session, Single Protocol
The current architecture supports one active experiment session and one active protocol at a time. Multi-session or multi-protocol concurrent operation is a future expansion, not a current design constraint to anticipate.

---

## 2. Python Rules

### PY-01 — Python Version
Use Python 3.10+. Take advantage of union type syntax (`X | Y`), structural pattern matching where appropriate, and `from __future__ import annotations` where needed for forward references.

### PY-02 — Type Annotations
All function signatures must have full type annotations. Use Pydantic v2 for configuration and data model validation. Use Python `dataclasses` for internal pipeline data structures.

```python
# Correct
def compute_iou(box_a: list[float], box_b: list[float]) -> float:
    ...

# Incorrect
def compute_iou(box_a, box_b):
    ...
```

### PY-03 — Module Organization
Each of the six backend modules must reside in its own subdirectory under `backend/`. Module-internal implementation details must not be imported by other modules directly. Cross-module communication uses shared data structures (dataclasses) passed via queues.

### PY-04 — No Mutable Global State
No mutable global variables. Session state, FSM state, and shared metrics must be held in controlled state objects or queue-based communication channels, not bare globals.

### PY-05 — Configuration via Config Files
No magic numbers or hardcoded thresholds in source code. All configurable values (confidence thresholds, timing, object classes, model paths) must be read from `protocol_rules.json` or a system configuration file.

```python
# Correct
confidence_threshold = config["detection_config"]["confidence_threshold"]

# Incorrect
if detection.confidence > 0.6:  # hardcoded!
```

### PY-06 — Logging Over Print
Use `logging` module throughout. Never use `print()` in production code. Log levels: DEBUG (frame-level verbose), INFO (state transitions, events), WARNING (low confidence, non-critical anomaly), ERROR (anomaly, module failure), CRITICAL (unrecoverable).

### PY-07 — Pydantic Validation at Boundaries
All external data entering the system (JSON configuration files, API request bodies, WebSocket messages) must be validated by a Pydantic model before use in business logic.

### PY-08 — Avoid Threading Antipatterns
Do not use bare `threading.Lock()` in hot paths. Prefer `queue.Queue` for inter-thread communication. Avoid shared mutable state between threads.

### PY-09 — Resource Cleanup
Use context managers (`with` blocks) for all file handles, GPU resources, and camera captures. Implement `__del__` or explicit `close()` methods for classes holding external resources.

### PY-10 — Docstrings
All public classes and methods must have docstrings. Use Google-style docstring format. Document inputs, outputs, and raised exceptions.

---

## 3. TypeScript / Next.js Rules

### TS-01 — TypeScript Strict Mode
Enable `strict: true` in `tsconfig.json`. No `any` types permitted in production code. Use `unknown` with type narrowing where type is genuinely unknown.

### TS-02 — No External Asset Loading
All fonts, icons, and static assets must be bundled with the Next.js build. No imports from external CDNs or remote URLs. The dashboard must load from local assets only.

### TS-03 — API Contract Types
All API response shapes (MJPEG stream excluded) must be represented as TypeScript interfaces that mirror the Python schema dataclasses. Maintain schema parity between backend and frontend.

```typescript
// Correct: typed interface matching backend schema
interface TelemetryMessage {
  msg_type: "TELEMETRY";
  inference_fps: number;
  vram_used_mb: number;
  fsm_current_state: string;
  // ...
}

// Incorrect: any
const msg: any = await ws.receive();
```

### TS-04 — WebSocket Message Routing
All WebSocket message types must be handled by a typed discriminated union. No unhandled message types in the client.

### TS-05 — Component Purity
React components must be pure functions where possible. Side effects (WebSocket subscriptions, interval timers) must be managed in `useEffect` with proper cleanup.

### TS-06 — State Management Discipline
Dashboard UI state must be derived from WebSocket messages. No state duplication between local component state and WebSocket-driven global state.

### TS-07 — No Mock Data in Production Build
No hardcoded placeholder data, fake FPS values, or fake telemetry in the production build. The UI must display "Connecting..." or equivalent when data is not yet available.

### TS-08 — ESLint and Formatting
Enforce ESLint with Next.js recommended rules. Use Prettier for consistent formatting. No warnings or errors in the production build.

---

## 4. Computer Vision Rules

### CV-01 — No Protocol Logic in Vision Code
Module 2 (CV/HAR Engine) must not know about protocol steps, expected events, or FSM states. It outputs raw detection results and HOI matrices. Protocol relevance is determined by the Event Abstraction Layer and FSM only.

### CV-02 — Never Silently Discard Low-Confidence Detections
Low-confidence detections (between `low_confidence_threshold` and `confidence_threshold`) must be logged at WARNING level. They must not be silently filtered without a log record.

### CV-03 — Coordinate Normalization Before HOI
All bounding box and keypoint coordinates must be normalized to anchor-relative space before HOI computation. Never compute HOI in pixel space.

### CV-04 — Temporal Consistency Required
A single-frame detection must never directly trigger a protocol event. The `min_duration_frames` requirement in `hoi_config` must be enforced before any interaction class is emitted.

### CV-05 — Orientation-Agnostic Design
Spatial computations must not assume a fixed gravity vector or fixed operator orientation. The coordinate normalization system must handle non-standard postures (microgravity) without modification.

### CV-06 — Detection Class Configuration
Detection class labels and IDs must be loaded from `protocol_rules.json`. They must not be hardcoded in the detector class.

### CV-07 — Frame Drop Logging
Every dropped frame (when the inference queue is full) must be logged at WARNING level with the frame timestamp and drop reason.

### CV-08 — VRAM-Safe Model Loading
Model files must be loaded once at startup. Never reload a model mid-session. Verify VRAM availability before loading; log an error if insufficient VRAM is detected.

---

## 5. ML / Model Rules

### ML-01 — No Claimed Performance Without Measurement
Never claim accuracy, FPS, latency, or VRAM figures in any code comment, documentation, or UI element without actual measured values from benchmarking on target hardware.

### ML-02 — Model Files Are External
Model weights (`.pt` files, `.onnx` files) are never committed to the Git repository. They are stored in `models/` which is in `.gitignore`. Model provenance (source, version, training dataset) must be documented in `docs/`.

### ML-03 — No Protocol Logic in Model Outputs
Model outputs (bounding boxes, class labels, keypoints) are perceptual observations. They are never treated directly as protocol decisions. The Event Abstraction Layer and FSM are the only components that interpret protocol meaning.

### ML-04 — Configurable Model Path
The model file path is always read from configuration. Swapping to a new model requires changing the configuration path and the model file — not modifying source code.

### ML-05 — Evaluation Reproducibility
All training evaluation metrics must be computed on a fixed, held-out test split. The test split must never be used for training or hyperparameter tuning.

### ML-06 — No Fabricated Training Data
Do not claim the model was trained on any dataset that has not been collected and annotated. Dataset status is always clearly indicated in documentation.

---

## 6. Dataset Rules

### DS-01 — Annotation Consistency
All annotators must follow the annotation guidelines document (`docs/DATASET_GUIDE.md`) exactly. No improvised annotation conventions without updating the guidelines and re-reviewing.

### DS-02 — Label Names Match `protocol_rules.json`
All action labels and interaction labels in the dataset must match exactly the names defined in `protocol_rules.json` `event_mapping` and `hoi_config`. Label name discrepancy between dataset and config is a critical defect.

### DS-03 — Correct and Incorrect Sequences Required
The dataset must include deliberate incorrect execution sequences (skipped steps, wrong objects, wrong order). A dataset containing only correct execution is insufficient for FSM validation and anomaly testing.

### DS-04 — No Sensitive Footage
No footage containing identifiable personal data beyond what is necessary for experiment observation should be included in the dataset.

### DS-05 — Train/Val/Test Separation
Test split data must never be seen during training or hyperparameter search. Record the random seed used for splitting.

---

## 7. API Rules

### API-01 — Async-Only Route Handlers
Every FastAPI route handler must be an `async def` function. No synchronous I/O operations (file reads, subprocess calls, model inference) may block inside a route handler.

### API-02 — Local Subnet Only
The FastAPI server must bind to the configured local interface. Never bind to `0.0.0.0` without explicit configuration and documentation. CORS must restrict origins to the local subnet.

### API-03 — Structured Error Responses
All API errors must return a structured JSON response with `error`, `error_code`, `detail`, and `timestamp`. Never return raw Python exception messages or stack traces to clients.

### API-04 — No Raw Model Output in API Responses
API responses must contain structured schema objects (using defined interfaces). Raw model tensor outputs or numpy arrays must never be returned directly.

### API-05 — Telemetry Is Push-Only
The `/ws/telemetry` WebSocket endpoint pushes messages to clients. Clients do not send requests on the telemetry socket. Any client-to-server communication (session control) uses the REST endpoints.

### API-06 — Session Control Requires Active Session
Session control endpoints (`/session/pause`, `/session/resume`, `/session/abort`) must validate that an active session exists and return a structured error if not.

---

## 8. Logging Rules

### LOG-01 — Append-Only During Session
Log files for an active session must be opened in append mode. Never open in write/overwrite mode during a session. The log file must never be truncated or replaced while the session is active.

### LOG-02 — ISO-8601 Timestamps on Every Entry
Every log entry must include a timestamp in ISO-8601 format with millisecond precision. No log entry without a timestamp.

### LOG-03 — Source Module on Every Entry
Every log entry must identify its source module (`MODULE_1`, `MODULE_2`, `MODULE_3`, `MODULE_4`, `MODULE_5`, `MODULE_6`, or `SYSTEM`).

### LOG-04 — FSM State on Every Entry
Every log entry must record the current FSM state at the time of logging. This enables post-session timeline reconstruction.

### LOG-05 — Severity Is Never Downgraded
An ANOMALY event is always logged at ERROR or higher. An exception is always logged at ERROR or CRITICAL. Severity levels must not be downgraded to avoid "noisy" logs.

### LOG-06 — Session Summary Must Be Written
A session summary record (see Schema Doc.md Section 9.3) must be written as the final log entry of every session, including sessions that end in abort or error.

### LOG-07 — Log Flush Before Shutdown
All pending log queue items must be flushed to disk before the logging engine shuts down. Never exit with unflushed log entries.

### LOG-08 — No Telemetry Fabrication
Never log placeholder, estimated, or fabricated telemetry values. Log "unavailable" or skip the field if a metric cannot be measured.

---

## 9. FSM Rules

### FSM-01 — Configuration-Driven Only
The FSM must be constructed entirely from `protocol_rules.json` at startup. No FSM state name, event name, or transition may be hardcoded in the FSM module source code.

### FSM-02 — Validation Before Initialization
`protocol_rules.json` must pass schema validation before the FSM is initialized. If validation fails, the system must halt. An invalid FSM is worse than no FSM.

### FSM-03 — Every Transition Is Logged
Every FSM state transition, valid or anomalous, must produce a `StateTransition` log record. No silent transitions.

### FSM-04 — Anomaly Does Not Silently Advance State
An anomaly event must not advance the FSM to the next step unless explicitly configured in `protocol_rules.json` (`auto_advance: true` with clear documentation). Default behavior on anomaly is: stay in current state + emit anomaly record.

### FSM-05 — Pause Preserves State Exactly
The PAUSED state must preserve the current protocol step state exactly. On resume, the FSM returns to the exact state it was in before pause, with no state loss.

### FSM-06 — No Protocol Logic Outside FSM Module
Protocol state is the sole responsibility of Module 3. No other module may modify FSM state directly. FSM state changes are only triggered by named protocol events from Module 2E, session control commands from the API, and timer callbacks for timeout detection.

### FSM-07 — Timing Is Wall-Clock Based
Step timing constraints must use wall-clock elapsed time from step entry, not frame count. Frame count is not a reliable proxy for elapsed time.

---

## 10. UI Rules

### UI-01 — Operational First
Every UI element must serve an operational purpose. Decorative elements that do not communicate system state or actionable information must be removed.

### UI-02 — No Mock/Placeholder Data in Production
The production dashboard must never display hardcoded numbers, placeholder text like "XX ms", or mock telemetry values. Display "—", "Initializing...", or similar inert states until real data arrives.

### UI-03 — Color Conveys Severity
The color system defined in Design Doc.md must be applied consistently. Cyan-teal = active. Green = nominal. Amber = warning. Red = error/critical. These meanings must not be used for any other purpose.

### UI-04 — Anomaly Must Be Unmissable
Any ERROR or CRITICAL anomaly must activate a visual indicator that is visible without scrolling from the primary operational screen. It must not be hidden in a tab or require navigation.

### UI-05 — Event Terminal Must Auto-Scroll
The bottom event terminal must auto-scroll to the latest entry. Scrolling must pause when the user manually scrolls up, and resume on "Jump to latest" click or when the user scrolls back to the bottom.

### UI-06 — No External Network Requests
The frontend must make zero requests to external servers. All API calls go to the local FastAPI backend. No Google Analytics, error tracking, or telemetry SDKs.

### UI-07 — State Indicator Always Visible
The system status indicator (RUNNING / WARNING / ANOMALY / PAUSED / ERROR) in the top status bar must always be visible. It must never be scrolled away or covered by other UI elements.

---

## 11. Git Rules

### GIT-01 — Never Commit Model Files
Model weights, checkpoints, and TTS voice models must be in `.gitignore`. They are too large for a Git repository and must be managed via documented download/transfer procedures.

### GIT-02 — Never Commit Sensitive Data
Log files, video recordings, session data, and any files that could contain experiment footage or operational data must be in `.gitignore`.

### GIT-03 — Conventional Commits
Use conventional commit format:
```
feat(module2): implement HOI matrix computation
fix(fsm): correct premature action timing check
docs(schema): update ProtocolEvent schema
test(fsm): add fault injection tests for SKIPPED_STEP
```

### GIT-04 — Branch Naming
```
feature/phase-06-hoi-engine
fix/cv-confidence-threshold-logging
docs/update-implementation-roadmap
```

### GIT-05 — Do Not Commit Broken Code to Main
`main` branch must always represent a functional state of the system. Use feature branches. Merge only when tests pass.

---

## 12. Naming Conventions

### 12.1 Python

| Entity | Convention | Example |
|---|---|---|
| Module | `snake_case` | `hoi_engine.py` |
| Class | `PascalCase` | `HOIEngine`, `ProtocolFSM` |
| Function/method | `snake_case` | `compute_iou`, `emit_event` |
| Variable | `snake_case` | `detection_result`, `frame_id` |
| Constant | `UPPER_SNAKE_CASE` | `MAX_QUEUE_DEPTH`, `DEFAULT_FPS` |
| Dataclass | `PascalCase` | `DetectionResult`, `HOIEntry` |
| Test file | `test_{module}.py` | `test_hoi_engine.py` |

### 12.2 TypeScript

| Entity | Convention | Example |
|---|---|---|
| Component | `PascalCase` | `<AnomalyAlert>`, `<ProtocolChecklist>` |
| Interface | `PascalCase` | `TelemetryMessage`, `DetectionResult` |
| Function | `camelCase` | `computeIou`, `handleWsMessage` |
| Variable | `camelCase` | `sessionId`, `fsmState` |
| CSS class | `kebab-case` | `.status-badge`, `.event-terminal` |
| CSS custom property | `--kebab-case` | `--color-accent-primary` |

### 12.3 Protocol / Schema

| Entity | Convention | Example |
|---|---|---|
| Protocol event names | `UPPER_SNAKE_CASE` | `PICK_UP_VIAL`, `INSERT_SYRINGE_TO_VIAL` |
| FSM state names | `UPPER_SNAKE_CASE` | `STEP_01_READY`, `STEP_01_COMPLETE` |
| Anomaly types | `UPPER_SNAKE_CASE` | `SKIPPED_STEP`, `OUT_OF_ORDER` |
| `protocol_rules.json` keys | `snake_case` | `step_id`, `min_time_seconds` |
| Session IDs | `ses-{YYYYMMDD}-{HHmmss}-{rand}` | `ses-20260829-120000-a7f3` |
| Log IDs | `{type}-uuid-{seq}` | `evt-uuid-0001`, `ano-uuid-0001` |

---

## 13. Error Handling Rules

### ERR-01 — Catch at Module Boundary, Not Inline
Each module must have a top-level exception handler for its main processing loop. Internal functions should raise, not catch, except for recoverable conditions that the function itself can handle completely.

### ERR-02 — Log Before Raising
When re-raising an exception after logging, use `raise` (not `raise e`) to preserve the original traceback.

### ERR-03 — Fail Fast on Configuration Errors
Configuration validation errors (invalid `protocol_rules.json`, missing model file, CUDA unavailable when required) must cause immediate, loud startup failure with a clear error message. Do not attempt to continue with a degraded configuration.

### ERR-04 — Distinguish Recoverable from Unrecoverable
Recoverable errors (camera disconnect, temporary queue full) cause a state change and a WARNING/ERROR log. Unrecoverable errors (missing model file, invalid FSM) cause a CRITICAL log and system halt.

### ERR-05 — Never Swallow Exceptions
```python
# Correct
try:
    result = detector.infer(frame)
except InferenceError as e:
    logger.error("Inference failed", exc_info=True)
    raise  # or transition to error state

# Incorrect
try:
    result = detector.infer(frame)
except Exception:
    pass  # Never do this
```

---

## 14. Testing Rules

### TEST-01 — Test Against Interfaces, Not Implementation
Unit tests must test the public interface of a class or function. Do not test private methods directly. If private logic is complex enough to test, refactor it into a testable unit.

### TEST-02 — No Network or Hardware in Unit Tests
Unit tests must not require a camera, GPU, or network connection. Use mocks and fixtures for hardware dependencies.

### TEST-03 — Fault Injection Is Required
The FSM test suite must include deliberate fault injection tests for all 7 anomaly types. These are P0 tests.

### TEST-04 — Test Isolation
Each test must be fully isolated. Shared state between tests is forbidden. Use `setUp`/`tearDown` or pytest fixtures for state that must be initialized per test.

### TEST-05 — Coverage Is Not a Goal in Itself
Test the behaviors that matter (anomaly detection, state transitions, schema validation). 100% coverage of boilerplate code is not the objective.

### TEST-06 — Document Known Flaky Tests
If a test is hardware-dependent or non-deterministic, document it clearly. Do not merge flaky tests to `main`.

---

## 15. Performance Rules

### PERF-01 — Measure Before Optimizing
Do not pre-optimize. Implement correctly first, then measure on target hardware. Optimization is only applied where benchmarking identifies an actual bottleneck.

### PERF-02 — Never Fabricate Performance Claims
Performance values in documentation, comments, or UI must be actual measured values from benchmarking on target hardware. Mark all unverified values as "to be measured".

### PERF-03 — Inference Thread Priority
The inference processing thread must have scheduling priority over the log writer, archive encoder, and voice synthesis threads.

### PERF-04 — Bounded Queues
All inter-thread queues must be bounded. Specify maximum queue depth. Overflow behavior (drop oldest, drop newest, block) must be explicitly defined and documented.

### PERF-05 — Profile Before Model Swap
Before changing the detection model, run a full pipeline benchmark with the new model. Do not assume a larger model improves the system if it causes pipeline stalls due to VRAM or latency.

---

## 16. Offline-First Rules

### OFFLINE-01 — Zero External Network Calls in Core Path
No module in the inference pipeline (Modules 1–5) may make any HTTP, WebSocket, or socket connection to an address outside the configured local subnet.

### OFFLINE-02 — All Models Local
All inference models (YOLO, MediaPipe, Piper TTS voice model) must be stored locally in the `models/` directory. Model downloads must happen during setup, not at runtime.

### OFFLINE-03 — All Dependencies Installable Offline
After initial dependency installation (via pip with all packages pre-downloaded), the system must be able to start, run, and operate indefinitely without network access.

### OFFLINE-04 — Frontend Loads Without Internet
The Next.js frontend must not require any internet connection to load or operate. All fonts, icons, and JavaScript bundles must be available in the local build output.

### OFFLINE-05 — Document All External Setup Steps
Any step that requires internet access (pip install, model download, font download) must be clearly documented as a pre-deployment step. The production deployment guide must identify where network access is required.

---

*End of Rules Doc — AstroFlow-AI v0.1.0-draft*

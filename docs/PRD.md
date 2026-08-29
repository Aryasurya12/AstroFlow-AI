# AstroFlow-AI — Product Requirements Document (PRD)

> **Document Version:** 0.1.0-draft  
> **Status:** Planning / Pre-Development  
> **Last Updated:** 2026-08-29  
> **Related Documents:** [TRD.md](./TRD.md) · [workflow.md](./workflow.md) · [Implementation Doc.md](./Implementation%20Doc.md)

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Users & Stakeholders](#2-users--stakeholders)
3. [Goals](#3-goals)
4. [Non-Goals](#4-non-goals)
5. [Key Features](#5-key-features)
6. [Functional Requirements](#6-functional-requirements)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Dataset Requirements](#8-dataset-requirements)
9. [Success Metrics](#9-success-metrics)
10. [Risks and Assumptions](#10-risks-and-assumptions)
11. [Future Expansion](#11-future-expansion)

---

## 1. Product Overview

### 1.1 Project Name

**AstroFlow-AI**

*On-board AI Copilot for Bharatiya Antariksh Station (BAS) Experiment Protocols*

### 1.2 One-Line Description

AstroFlow-AI is an offline Edge-AI system that monitors controlled experiment execution aboard space-analog or orbital environments — recognizing astronaut/operator activity, validating experiment sequences against predefined protocols, providing real-time voice guidance, and generating complete local mission logs — all without network connectivity.

### 1.3 Problem Statement

Controlled scientific experiments conducted in orbital or space-analog environments face a unique convergence of challenges:

1. **Protocol Rigor:** Experiment procedures (SOPs) must be followed with high temporal and sequential precision. A single skipped, repeated, or out-of-order action can compromise specimen integrity, invalidate experimental data, or create safety hazards.

2. **Operator Cognitive Load:** Astronauts/operators performing experiments simultaneously consult paper checklists or tablet-based SOPs while managing delicate equipment in constrained workspaces. This split attention is a known contributor to procedural errors.

3. **Connectivity Constraints:** Orbital environments and space-analog testbeds cannot rely on real-time downlink to mission control for experiment validation. The monitoring system must be fully self-contained.

4. **Audit Requirements:** Mission science teams require timestamped, tamper-evident records of experiment execution for scientific reproducibility and post-mission analysis.

5. **Existing Tooling Gap:** Currently, experiment protocol compliance is tracked manually by the operator or by a remote supervisor monitoring a standard video feed without computational assistance. No automated, real-time system detects protocol deviations as they occur.

### 1.4 Why Generic HAR and CCTV Systems Are Insufficient

Generic Human Activity Recognition (HAR) and video surveillance systems are designed around a fundamentally different operational model:

| Dimension | Generic HAR / CCTV | AstroFlow-AI |
|---|---|---|
| Activity vocabulary | Generic (walking, sitting, running) | Protocol-specific (picking up a vial, positioning syringe, activating observation port) |
| Validation logic | None — observation only | Full deterministic FSM validates against defined protocol state |
| Object awareness | Generic (person, car) | Domain-specific experiment objects (vial, syringe, plunger, observation chamber) |
| Interaction understanding | None or coarse | HOI matrix — spatial proximity, bounding-box overlap, confidence-filtered interaction |
| Sequence awareness | None | Step ordering, timing constraints, skipped-step detection, out-of-order detection |
| Audio output | None | Offline TTS voice guidance and anomaly warnings |
| Connectivity | Cloud-dependent inference | 100% offline, local inference on RTX 3050 edge hardware |
| Protocol configuration | Not applicable | Fully configurable via `protocol_rules.json` |
| Audit trail | Raw video only | Structured JSON event log + flat audit trail + protocol state history |

Generic systems answer only: *"What is this person doing?"*

AstroFlow-AI answers: *"What experiment action is occurring, and is it correct according to the current protocol state?"*

### 1.5 Proposed Solution

AstroFlow-AI is a modular, offline Edge-AI experiment-monitoring platform organized into six backend modules running on an NVIDIA RTX 3050 Edge Inference Server:

1. **Video Ingestion & Pipeline** — Hardware-accelerated camera ingestion, NVENC archival, local RTSP/WebRTC bridge.
2. **Computer Vision & HAR Engine** — Object detection (YOLOv8s/YOLOv11s), hand/pose tracking (MediaPipe/YOLO-Pose), coordinate normalization, HOI matrix.
3. **Deterministic Experiment Validator** — FSM-based protocol engine driven by `protocol_rules.json`; never invents protocol logic.
4. **Offline Voice Module** — Piper TTS (Pyttsx3 fallback) for local voice prompts triggered by protocol events.
5. **Telemetry & Log Engine** — Local JSON event logs, flat audit trail, mission storage, system metrics.
6. **FastAPI Async Hub** — MJPEG/WebRTC video delivery, WebSocket telemetry stream, REST API.

The AI pipeline determines *"What is happening?"*
The Deterministic Experiment Validator determines *"Is this correct at this point in the experiment?"*

This separation is a foundational architectural principle of AstroFlow-AI.

---

## 2. Users & Stakeholders

### 2.1 Primary User: Experiment Operator

**Role:** The astronaut or laboratory technician physically performing the experiment at the payload rig.

**Context:**
- Operating in a confined workspace, possibly in microgravity or a space-analog environment.
- May be wearing gloves and handling delicate/hazardous experiment equipment.
- Cannot safely consult paper checklists mid-procedure.
- Benefits from hands-free, voice-guided protocol feedback.

**Key Needs:**
- Voice prompts for current protocol step guidance.
- Immediate warning if a step is being skipped or performed out of order.
- Confirmation when a step is successfully detected as complete.
- Minimal visual distraction from the experiment rig itself.

### 2.2 Secondary User: Experiment Supervisor / Mission Science Lead

**Role:** A scientist or mission controller monitoring the experiment, co-located or within communication range.

**Key Needs:**
- Live video feed with CV annotations.
- Current FSM state and protocol progress visualization.
- Anomaly alerts with severity, affected step, and recommended action.
- Exportable audit trail.

### 2.3 Developer / ML Engineer

**Role:** Technical team member responsible for training custom models, configuring protocol rules, and maintaining the inference pipeline.

**Key Needs:**
- Clear module boundaries that allow model replacement without rewriting the protocol engine.
- Well-documented dataset labeling schema.
- Configurable confidence thresholds, detection classes, and HOI parameters.
- Performance benchmarking outputs.

### 2.4 System Administrator

**Role:** Responsible for maintaining the edge hardware, updating software, managing local storage, and ensuring system integrity.

**Key Needs:**
- System health diagnostics (VRAM, CPU/GPU utilization, storage capacity).
- Model integrity verification tools.
- Secure configuration update procedures.
- Log retention and archival management.

---

## 3. Goals

### 3.1 Primary Goals

| ID | Goal | Priority |
|---|---|---|
| G-01 | Real-time experiment activity monitoring via fixed payload camera | P0 |
| G-02 | Accurate detection of experiment-relevant objects in the workspace | P0 |
| G-03 | Hand/keypoint tracking for fine-grained interaction detection | P0 |
| G-04 | Human-Object Interaction (HOI) understanding from visual observations | P0 |
| G-05 | Deterministic protocol compliance validation using a configurable FSM | P0 |
| G-06 | Early detection of skipped, out-of-order, premature, or repeated actions | P0 |
| G-07 | 100% offline/local operation — no network dependency for core inference | P0 |
| G-08 | Local voice guidance and anomaly warnings via Offline Voice Module | P1 |
| G-09 | Complete local audit trail — structured JSON + flat text logs | P1 |
| G-10 | Mission Dashboard — live video, telemetry, SOP state, anomaly view | P1 |
| G-11 | Low-latency inference pipeline suitable for real-time operations | P1 |
| G-12 | Configurable protocol rules — new experiments without software rewrite | P1 |

### 3.2 Design Goals

- Maintain clear separation between AI perception and deterministic protocol validation.
- All protocol-specific logic must reside in `protocol_rules.json`, not in the inference pipeline.
- Models must be replaceable without modifying the protocol engine.
- Logging must be machine-readable, timestamped, and immutable during an active experiment session.
- The UI must communicate operational state, not merely display data.

---

## 4. Non-Goals

| ID | Non-Goal | Rationale |
|---|---|---|
| NG-01 | Cloud-based inference or real-time uplink | Offline-first; cloud dependency violates the operational constraint |
| NG-02 | Experiment protocol authoring / design | AstroFlow-AI validates protocols; it does not design them |
| NG-03 | Generic surveillance or security monitoring | Not designed for broad-area people tracking or access control |
| NG-04 | Multi-experiment simultaneous protocol validation | Single active protocol session per experiment session in current architecture |
| NG-05 | Autonomous experiment execution or robotic control | System is observational and advisory; it does not actuate hardware |
| NG-06 | Emotional state or physiological monitoring | System tracks protocol-relevant actions only |
| NG-07 | Medical diagnosis or operator health assessment | Outside scope and regulatory boundary |
| NG-08 | Real-time transmission of raw video off-platform | Video is archived locally; streaming limited to isolated local subnet |
| NG-09 | Experiment data analysis or science result processing | System monitors procedure execution, not scientific content of observations |
| NG-10 | Multi-camera spatial reconstruction (3D) | Single fixed camera per experiment session in current design |
| NG-11 | Fully autonomous anomaly correction | System warns and logs; human operator makes all decisions |

---

## 5. Key Features

### 5.1 Must Have (P0)

- Fixed camera video ingestion at target 1080p @ 60 FPS.
- Hardware-accelerated local video archival (NVENC H.264 / MP4).
- Real-time object detection for experiment-relevant objects (vial, syringe, plunger, observation port, gloves).
- Real-time person/operator detection.
- Hand/keypoint tracking and normalization.
- Human-Object Interaction (HOI) matrix: proximity, overlap, confidence.
- Coordinate normalization relative to a payload rack anchor.
- Deterministic FSM protocol validator driven by `protocol_rules.json`.
- Step sequence validation (ordered, out-of-order, skipped, repeated).
- Timing constraint validation.
- Anomaly event generation with classification.
- Structured JSON event log.
- Flat text audit trail.
- FastAPI `/video_feed` endpoint (MJPEG).
- FastAPI `/ws/telemetry` WebSocket endpoint.
- Next.js Mission Dashboard — live video viewport, protocol checklist, anomaly panel.

### 5.2 Should Have (P1)

- Offline Voice Module (Piper TTS) — step prompts, anomaly warnings, step completion confirmation.
- Pyttsx3 fallback TTS.
- Real-time telemetry HUD — inference FPS, frame latency, VRAM usage, active model state.
- Auto-scrolling monospace event terminal in the Mission Dashboard.
- WebRTC local video bridge (alternative to MJPEG).
- Confidence-level visualization on bounding boxes.
- Hand keypoint skeleton overlay in the live video view.
- Interaction indicator overlay (showing active HOI events).
- Protocol step SOP checklist with completed / in-progress / pending states.

### 5.3 Nice to Have (P2)

- Multiple protocol profiles switchable without system restart.
- Operator profile / session identification (role-based, not biometric).
- Exportable session report (PDF or structured JSON summary).
- RTSP local bridge for integration with existing ground-segment display hardware.
- Recording indicator with elapsed duration in the video HUD.

### 5.4 Future Consideration (P3)

- Multi-camera support for occlusion robustness.
- Digital twin integration for 3D spatial visualization.
- Fine-tuned model re-training pipeline on locally collected footage.
- Remote monitoring channel when network access is explicitly permitted.
- Additional experiment protocol types.
- On-device model quantization and optimization.

---

## 6. Functional Requirements

### 6.1 Video Ingestion

| ID | Requirement |
|---|---|
| FR-VI-01 | The system SHALL capture video from a USB or CSI camera using OpenCV VideoCapture. |
| FR-VI-02 | The system SHALL target 1080p resolution at 60 FPS. |
| FR-VI-03 | The system SHALL archive video locally using NVENC H.264 encoding to MP4 format. |
| FR-VI-04 | The system SHALL expose a local MJPEG stream via `/video_feed` for the Mission Dashboard. |
| FR-VI-05 | The system SHALL support an optional RTSP/WebRTC bridge over an isolated local subnet. |
| FR-VI-06 | Video archival and inference pipelines SHALL operate concurrently without frame drops affecting inference. |
| FR-VI-07 | The system SHALL timestamp all archived video files with experiment session ID and start time. |

### 6.2 Object Detection

| ID | Requirement |
|---|---|
| FR-OD-01 | The system SHALL detect experiment-relevant objects: vial, syringe, plunger, observation port/chamber, gloves, and additional objects defined in `protocol_rules.json`. |
| FR-OD-02 | Object detection SHALL use a YOLOv8s or YOLOv11s model (or a user-specified replacement meeting the interface contract). |
| FR-OD-03 | Detection outputs SHALL include class label, bounding box coordinates, and confidence score. |
| FR-OD-04 | Detection results below a configurable confidence threshold SHALL be flagged but not silently discarded; they SHALL be logged at the appropriate severity level. |
| FR-OD-05 | Object detection classes SHALL be configurable without modifying inference engine source code. |

### 6.3 Human & Pose Detection

| ID | Requirement |
|---|---|
| FR-HP-01 | The system SHALL detect the presence and position of the experiment operator in the frame. |
| FR-HP-02 | The system SHALL track hand position and keypoints using MediaPipe Hands or YOLO-Pose. |
| FR-HP-03 | Hand/keypoint coordinates SHALL be normalized relative to a configurable payload rack bounding anchor. |
| FR-HP-04 | The pose/hand tracking module SHALL be orientation-agnostic to support microgravity postures. |

### 6.4 Human-Object Interaction Engine

| ID | Requirement |
|---|---|
| FR-HOI-01 | The system SHALL compute an HOI matrix per frame encoding relationships between tracked hands/keypoints and detected objects. |
| FR-HOI-02 | HOI computation SHALL include spatial proximity, bounding-box overlap/intersection, and confidence score. |
| FR-HOI-03 | HOI events SHALL be classified into defined interaction types (e.g., near, touching, holding, transferring). |
| FR-HOI-04 | HOI classification thresholds SHALL be configurable. |
| FR-HOI-05 | HOI results SHALL feed into the Event Abstraction Layer before reaching the FSM. |

### 6.5 Event Abstraction

| ID | Requirement |
|---|---|
| FR-EA-01 | Raw HOI matrix data SHALL be abstracted into named protocol events before being submitted to the FSM. |
| FR-EA-02 | The event abstraction mapping SHALL be configurable via `protocol_rules.json`. |
| FR-EA-03 | Events SHALL carry a timestamp, confidence, source interaction ID, and involved object labels. |
| FR-EA-04 | The event abstraction layer SHALL not modify or interpret the protocol rules themselves. |

### 6.6 Deterministic Experiment Validator (FSM)

| ID | Requirement |
|---|---|
| FR-FSM-01 | The system SHALL maintain a Finite State Machine (FSM) driven entirely by `protocol_rules.json`. |
| FR-FSM-02 | The FSM SHALL validate each incoming event against the expected protocol state. |
| FR-FSM-03 | The FSM SHALL detect and classify: valid transitions, invalid actions, skipped steps, out-of-order actions, premature actions, repeated actions, and timing timeouts. |
| FR-FSM-04 | State transitions SHALL be logged with timestamp, source event, previous state, and new state. |
| FR-FSM-05 | The FSM SHALL be implemented using the Python `transitions` library (or equivalent). |
| FR-FSM-06 | The FSM SHALL NOT contain any hardcoded experiment-specific logic; all protocol logic SHALL reside in `protocol_rules.json`. |
| FR-FSM-07 | The FSM SHALL support a PAUSED state allowing operator-initiated hold without losing protocol state. |

### 6.7 Offline Voice Module

| ID | Requirement |
|---|---|
| FR-VM-01 | The system SHALL provide voice prompts and warnings via a local speaker without network connectivity. |
| FR-VM-02 | Voice synthesis SHALL use Piper TTS as the primary engine. |
| FR-VM-03 | Pyttsx3 SHALL serve as a fallback TTS engine if Piper is unavailable. |
| FR-VM-04 | Voice messages SHALL be defined in `protocol_rules.json` linked to specific FSM state transitions and anomaly events. |
| FR-VM-05 | Voice prompts SHALL be queued and delivered without blocking the inference pipeline. |
| FR-VM-06 | The system SHALL support configurable voice volume, speech rate, and language/voice model selection. |

### 6.8 Telemetry & Log Engine

| ID | Requirement |
|---|---|
| FR-TL-01 | The system SHALL log all protocol events to a structured JSON event log. |
| FR-TL-02 | The system SHALL maintain a flat text audit trail with human-readable timestamps and severity levels. |
| FR-TL-03 | Log entries SHALL include: timestamp (ISO-8601), session ID, event type, source module, current FSM state, involved objects, and confidence score where applicable. |
| FR-TL-04 | Log files SHALL be written to local storage with session-scoped file names. |
| FR-TL-05 | The system SHALL expose real-time telemetry via the WebSocket endpoint. |
| FR-TL-06 | Logs SHALL NOT be deleted or modified during an active experiment session. |

### 6.9 FastAPI Async Hub

| ID | Requirement |
|---|---|
| FR-API-01 | The backend SHALL expose a `GET /video_feed` endpoint delivering an MJPEG stream with CV annotations. |
| FR-API-02 | The backend SHALL expose a `WS /ws/telemetry` WebSocket endpoint delivering real-time telemetry and event updates. |
| FR-API-03 | All FastAPI routes SHALL be implemented as async to prevent blocking the inference pipeline. |
| FR-API-04 | The API SHALL be accessible only on the isolated local network. |

### 6.10 Mission Dashboard (Frontend)

| ID | Requirement |
|---|---|
| FR-UI-01 | The Mission Dashboard SHALL display a live annotated video viewport. |
| FR-UI-02 | The dashboard SHALL show the current FSM protocol state and step-by-step SOP checklist with status indicators. |
| FR-UI-03 | The dashboard SHALL display real-time anomaly warnings with severity classification. |
| FR-UI-04 | The dashboard SHALL include a telemetry HUD showing inference FPS, frame latency, VRAM usage, and model state. |
| FR-UI-05 | The dashboard SHALL include an auto-scrolling monospace event log terminal. |
| FR-UI-06 | The dashboard SHALL be implemented using Next.js and TypeScript. |
| FR-UI-07 | The dashboard SHALL connect to the backend via MJPEG stream and WebSocket. |

---

## 7. Non-Functional Requirements

### 7.1 Latency

| ID | Requirement |
|---|---|
| NFR-LAT-01 | End-to-end pipeline latency (frame capture to FSM event) should be minimized; target latency to be measured on target hardware. |
| NFR-LAT-02 | Voice prompt delivery SHALL occur within a configurable grace period after the triggering FSM event. |
| NFR-LAT-03 | Mission Dashboard telemetry update interval should be configurable; target is sub-second. |

### 7.2 Reliability

| ID | Requirement |
|---|---|
| NFR-REL-01 | The system SHALL handle camera disconnection gracefully, logging the event and entering a DISCONNECTED state. |
| NFR-REL-02 | The FSM SHALL preserve protocol state across temporary inference pipeline interruptions. |
| NFR-REL-03 | The system SHALL not crash silently; all unhandled exceptions SHALL be logged with full context. |

### 7.3 Offline Operation

| ID | Requirement |
|---|---|
| NFR-OFF-01 | The system SHALL operate with zero network connectivity. |
| NFR-OFF-02 | All inference models SHALL be stored and executed locally. |
| NFR-OFF-03 | All TTS voice models SHALL be stored locally; no remote API calls SHALL be made for voice synthesis. |
| NFR-OFF-04 | The Mission Dashboard SHALL load from local assets; no CDN or external resources SHALL be required. |

### 7.4 Privacy

| ID | Requirement |
|---|---|
| NFR-PRI-01 | Video data SHALL remain on local storage; no video SHALL be transmitted to external systems. |
| NFR-PRI-02 | The system SHALL NOT perform facial recognition or biometric identification. |
| NFR-PRI-03 | Operator identification in logs SHALL be session-scoped (operator ID or role), not biometric. |

### 7.5 Explainability

| ID | Requirement |
|---|---|
| NFR-EXP-01 | Every FSM state transition SHALL be attributable to a specific detected event with a logged confidence score. |
| NFR-EXP-02 | Every anomaly alert SHALL include the triggering event, the expected state, and the actual state. |
| NFR-EXP-03 | Protocol rules SHALL be human-readable in `protocol_rules.json` and auditable by mission scientists. |

### 7.6 Scalability

| ID | Requirement |
|---|---|
| NFR-SCA-01 | New experiment protocols SHALL be addable by creating or updating `protocol_rules.json` without modifying source code. |
| NFR-SCA-02 | New object detection classes SHALL be addable by retraining/swapping the YOLO model and updating detection class configuration. |
| NFR-SCA-03 | The system architecture SHALL support future addition of additional camera modules. |

### 7.7 Maintainability

| ID | Requirement |
|---|---|
| NFR-MNT-01 | Each of the six backend modules SHALL have clearly defined input/output interfaces allowing independent testing and replacement. |
| NFR-MNT-02 | Protocol logic SHALL be strictly separated from inference pipeline code. |
| NFR-MNT-03 | All configurable parameters SHALL be externalized to configuration files, not hardcoded. |

### 7.8 Observability

| ID | Requirement |
|---|---|
| NFR-OBS-01 | The system SHALL expose real-time inference metrics (FPS, latency, VRAM) via the telemetry WebSocket. |
| NFR-OBS-02 | System health (camera state, model state, FSM state, storage availability) SHALL be surfaced on the Mission Dashboard. |
| NFR-OBS-03 | All module startup, shutdown, and error events SHALL be logged. |

---

## 8. Dataset Requirements

### 8.1 Why a Custom Dataset Is Required

Pre-existing public HAR datasets contain generic human activity labels irrelevant to controlled experiment procedures in a payload rack environment. A custom dataset is required to:

- Train object detection models on domain-specific experiment equipment (vials, syringes, plungers, observation chambers, gloves).
- Capture interaction labels at the granularity required by the HOI engine.
- Provide training examples of correct and incorrect protocol sequences.
- Represent the specific camera angle, lighting conditions, and workspace of the target payload rig.

### 8.2 Dataset Layers

#### Layer A — Human Detection
- Operator/person bounding boxes.
- Full-body pose keypoints.
- Hand segmentation/bounding boxes.
- Finger/wrist keypoints for interaction detection.

#### Layer B — Object Detection
- Per-instance bounding boxes for each experiment object class.
- Object classes: vial, syringe, plunger, observation port/chamber, gloves, and additional protocol-specific objects.
- Annotations capture multiple object orientations.

#### Layer C — Human-Object Interaction Labels
- Spatial relationship labels: near, touching, holding, transferring, inserting, placing, withdrawing.
- Object pair involved.
- Confidence-relevant distance/overlap metrics.

#### Layer D — Action / Activity Labels
- Protocol-specific action labels (configurable per experiment).
- Temporal segment annotations for action boundaries.
- Labels must map to FSM event names defined in `protocol_rules.json`.

#### Layer E — Sequence Data
- Full experiment session recordings annotated at the action level.
- Correct and incorrect execution sequences.
- Including: skipped steps, out-of-order steps, premature steps, step repetition.

### 8.3 Dataset Variation Requirements

| Dimension | Variation Required |
|---|---|
| Camera angle | Fixed payload camera perspective; slight repositioning per session |
| Lighting | Laboratory lighting, panel lighting, shadow conditions |
| Occlusion | Hand-object overlap, object partially occluded by operator body |
| Operators | Multiple operators; different hand sizes, glove types, sleeve lengths |
| Object orientation | Multiple rotations and grip styles per object |
| Workspace orientation | Normal and simulated microgravity posture |
| Execution type | Correct execution; deliberate incorrect sequence; deliberate skips |
| Temporal variation | Fast, normal, and slow execution speeds |
| Repetitions | Multiple repetitions per action and sequence |

### 8.4 Dataset Status

> **Current Status:** Dataset does not yet exist. Collection, annotation, and labeling pipeline are planned in Phase 4 of the implementation roadmap. See [Implementation Doc.md](./Implementation%20Doc.md).

---

## 9. Success Metrics

> **Important:** No measured values exist at this stage. All metrics are targets to be validated after hardware deployment and benchmarking.

### 9.1 ML / Perception Metrics

| Metric | Description | Target |
|---|---|---|
| Object detection mAP@0.5 | Mean Average Precision on test split | To be measured |
| Hand detection precision/recall | On held-out workspace footage | To be measured |
| HOI classification accuracy | On annotated interaction test set | To be measured |
| False positive rate | Spurious object/interaction detections | To be minimized |
| False negative rate | Missed protocol-relevant detections | Critical to minimize |

### 9.2 System Metrics

| Metric | Description | Target |
|---|---|---|
| End-to-end pipeline latency | Frame capture to FSM event | To be measured on RTX 3050 |
| Inference FPS | Frames processed per second | To be measured |
| VRAM peak utilization | During concurrent detection + pose | To be measured |
| System uptime | Continuous operation per session | >= session duration |

### 9.3 Protocol Metrics

| Metric | Description | Target |
|---|---|---|
| Step detection accuracy | Correct FSM transitions on valid execution | To be measured via fault injection testing |
| Anomaly detection rate | Detected anomaly events on incorrect sequences | To be measured |
| False anomaly rate | Spurious anomaly events on correct sequences | To be minimized |
| Timeout detection accuracy | Correct timeout events when step exceeds limit | To be measured |

### 9.4 UI / Operator Metrics

| Metric | Description | Target |
|---|---|---|
| Dashboard latency | FSM event to UI update | Sub-second target |
| Voice prompt delivery delay | FSM event trigger to audio output | To be measured |
| Operator comprehension | Ability to identify protocol state from dashboard | Qualitative; usability testing required |

---

## 10. Risks and Assumptions

### 10.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Object detection fails to generalize to target rig lighting/occlusion | High (pre-training) | High | Dataset collection with deliberate lighting/occlusion variation; confidence filtering |
| HOI false positives driving incorrect FSM transitions | Medium | High | Temporal smoothing, confidence thresholds, event debouncing before FSM |
| Inference FPS drops below real-time threshold on RTX 3050 | Medium | Medium | Model optimization, batch-size tuning, model swap to lighter variant |
| Piper TTS latency exceeds voice prompt grace period | Low | Medium | Async voice queue; Pyttsx3 fallback |
| `protocol_rules.json` misconfiguration leads to FSM deadlock | Medium | High | JSON schema validation on load; FSM initialization test suite |
| Custom dataset insufficient for model generalization | High (early stages) | High | Iterative collection, augmentation pipeline, synthetic data consideration |

### 10.2 Operational Assumptions

- The experiment rig includes a fixed camera mount at a known payload-rack perspective.
- The payload rack workspace has defined physical boundaries usable as a bounding anchor.
- The operating environment has consistent minimum lighting for camera-based detection.
- An isolated local network (Ethernet or Wi-Fi) is available for MJPEG/WebSocket communication.
- The local speaker is operational and positioned for operator audibility.
- Experiment protocols are defined and validated by domain scientists before encoding in `protocol_rules.json`.

### 10.3 Architectural Assumptions

- The system operates one protocol session at a time.
- A single fixed camera provides the primary observation stream.
- The operator is the only person present at the experiment rig during an active session.
- Experiment equipment used within a session matches the object classes trained in the deployed model.

---

## 11. Future Expansion

### 11.1 Additional Experiment Protocols
The `protocol_rules.json` structure supports multiple named protocol definitions. New protocols can be added without modifying the inference pipeline or FSM engine.

### 11.2 Additional Sensors
Future integration could include IMU data for microgravity pose estimation, spectrometer or environmental sensors, and force/torque sensing on experiment hardware.

### 11.3 Multi-Camera Support
A future multi-camera mode could provide occlusion-robust coverage and enable 3D spatial reasoning.

### 11.4 Improved Models
The modular architecture allows the YOLO detection model to be replaced with a finer-tuned variant without modifying downstream components.

### 11.5 Edge Accelerators
Future hardware configurations could include NVIDIA Jetson modules or custom NPU accelerators for power and VRAM efficiency improvements.

### 11.6 Digital Twin Integration
A 3D workspace digital twin could be fed real-time object poses for spatial simulation, planning, and post-experiment replay.

### 11.7 Remote Monitoring (Conditional)
When network access is explicitly permitted by mission operations, a secure read-only remote monitoring channel could stream the Mission Dashboard to a ground-control facility. **This would only be enabled as an explicit, audited configuration option and would never form part of the core inference path.**

---

*End of PRD — AstroFlow-AI v0.1.0-draft*

# AstroFlow-AI — Security Architecture

> **Document Version:** 0.1.0-draft  
> **Status:** Planning / Pre-Development  
> **Last Updated:** 2026-08-29  
> **Related Documents:** [TRD.md](./TRD.md) · [Rules Doc.md](./Rules%20Doc.md) · [PRD.md](./PRD.md)

---

## Table of Contents

1. [Security Context](#1-security-context)
2. [Threat Model](#2-threat-model)
3. [Security Principles](#3-security-principles)
4. [Video Security](#4-video-security)
5. [Model Security](#5-model-security)
6. [Protocol Configuration Security](#6-protocol-configuration-security)
7. [API Security](#7-api-security)
8. [Logging Security](#8-logging-security)
9. [Physical Security](#9-physical-security)
10. [Dependency Security](#10-dependency-security)
11. [Incident Response](#11-incident-response)

---

## 1. Security Context

AstroFlow-AI is a **locally deployed, offline-first Edge-AI system**. Its security threat landscape is fundamentally different from a cloud-connected application:

- There is no external internet-facing surface for the core inference pipeline.
- The primary attack vectors are physical access to hardware, local network access, and supply-chain risks in software dependencies.
- The system does not handle authentication for a large user base; access control is local and operator-scoped.
- The most critical assets are: the experiment video archive, the audit log trail, the protocol configuration, and the inference models.

The security architecture is designed to protect these assets from the threat model described below, without introducing cloud authentication systems or complex external dependencies that would compromise offline-first operation.

---

## 2. Threat Model

### 2.1 Threat Actor Categories

| Actor | Capability | Motivation |
|---|---|---|
| **Unauthorized Local User** | Physical access to edge server console; local network access | Exfiltrate experiment data; tamper with logs; disrupt system |
| **Malicious USB/Peripheral** | Connect device to edge server USB port | Load malware, exfiltrate data, inject false camera feed |
| **Compromised Software Component** | Compromise dependency package (supply chain) | Execute arbitrary code on edge server; tamper with model behavior |
| **Insider Threat** | Authorized physical and local network access | Manipulate protocol configuration, falsify logs, suppress anomaly events |
| **API Abuser (Local Network)** | Access to local subnet | Abuse REST/WebSocket endpoints; replay attacks; resource exhaustion |
| **Physical Adversary** | Direct physical access to hardware | Steal storage media; tamper with hardware; replace camera |

### 2.2 Threat Surface Map

| Component | Threat |
|---|---|
| **Edge Inference Server** | Unauthorized local login; USB device insertion; physical hardware tampering |
| **Camera / USB peripheral** | Camera replacement with a replay device; malicious USB injection |
| **Video Archive (MP4 files)** | Unauthorized read access; tampering with footage |
| **Model Files** | Replacement with adversarial or backdoored models |
| **`protocol_rules.json`** | Modification during active session; unauthorized protocol override |
| **Log files** | Deletion; tampering; selective removal of anomaly events |
| **FastAPI `/video_feed`** | Unauthorized stream access (LAN); MJPEG stream interception |
| **FastAPI `/ws/telemetry`** | Unauthorized WebSocket connection; message injection |
| **REST endpoints** | Unauthorized session control; session abort; false pause |
| **Python dependencies** | Supply-chain attack on PyPI packages |
| **OS and firmware** | Privilege escalation; kernel exploit |

---

## 3. Security Principles

### SP-01 — Offline-First Security
The system must be secure without internet connectivity. No security mechanism (authentication, certificate validation, threat intelligence) may require an external network connection to function.

### SP-02 — Least Privilege
Each process and user account must have only the permissions required for its specific function:
- The inference process does not need write access outside its session directories.
- The FastAPI process does not need write access to model files.
- No process should run as root unless absolutely required by hardware access constraints.

### SP-03 — Local Network Isolation
The edge server must be connected only to an isolated local network segment (Ethernet or isolated SSID). The local network must not have routing to the internet or to broader mission-control infrastructure without explicit firewall configuration.

### SP-04 — Integrity Verification
Critical files (model weights, `protocol_rules.json`) must have their integrity verifiable via cryptographic checksums. Checksum mismatches must cause startup refusal and an audited alert.

### SP-05 — Auditability
All security-relevant events (startup, shutdown, configuration load, anomaly events, API access) must be logged in the audit trail. The audit trail itself must be protected from modification.

### SP-06 — Defense in Depth
No single security control is assumed to be perfect. Multiple overlapping controls (OS-level access control, application-level access control, network isolation, integrity verification, audit logging) provide defense in depth.

---

## 4. Video Security

### 4.1 Local Storage

- Video recordings are stored in `recordings/` on the edge server's local disk.
- No video is transmitted off the edge server except as the annotated MJPEG stream on the isolated local subnet.
- The `recordings/` directory must have filesystem permissions set to the minimum set of users/processes that require access.

### 4.2 Access Controls

- **OS-level:** The `recordings/` directory should be owned by the inference process user account with `700` permissions (Linux) or equivalent restrictive ACL (Windows).
- **No public access:** The MJPEG stream served by the FastAPI Async Hub is not publicly accessible; it is restricted to the isolated local subnet via network configuration.

### 4.3 Retention

- Video retention policy must be documented and enforced. Sessions beyond the defined retention window should be archived or securely deleted per mission operations policy.
- No automatic deletion of recordings during an active session.

### 4.4 Encryption

- At-rest encryption for the `recordings/` directory may be implemented at the OS/filesystem level (e.g., LUKS on Linux, BitLocker on Windows) if the mission security classification requires it.
- Application-level encryption of MP4 files is not implemented in the current architecture due to performance constraints; filesystem-level encryption is preferred.

### 4.5 Preventing Unauthorized Stream Access

- The `/video_feed` MJPEG endpoint must be served on the internal network interface only.
- Network-level access control (firewall rules) must restrict access to the local subnet.
- Future enhancement: token-based access for the MJPEG stream within the local subnet.

---

## 5. Model Security

### 5.1 Model Integrity

AI model files (YOLO `.pt`, MediaPipe task files, Piper `.onnx`) are critical to correct system operation. An adversarially modified model could suppress detections, generate false detections, or evade anomaly detection.

**Controls:**

- At startup, the inference server computes the SHA-256 hash of each model file and compares it against a stored expected hash in `configs/model_checksums.json`.
- If a checksum mismatch is detected, the system must **refuse to start** and log a CRITICAL error.
- `configs/model_checksums.json` must itself be protected against unauthorized modification.

### 5.2 Model Checksum File

```json
{
  "schema_version": "1.0.0",
  "models": [
    {
      "model_id": "yolov8s_bas_v1",
      "file_path": "models/yolov8s_bas_v1.pt",
      "sha256": "placeholder — populated after model is finalized",
      "updated_at": "ISO-8601"
    },
    {
      "model_id": "piper_voice_en",
      "file_path": "models/piper_en_US.onnx",
      "sha256": "placeholder",
      "updated_at": "ISO-8601"
    }
  ]
}
```

### 5.3 Trusted Model Deployment

- Model files must only be deployed through a documented, audited procedure.
- Model updates must be reviewed by the ML engineer, tested in a controlled environment, and checksums updated before deployment.
- No ad-hoc model replacement during an active experiment session is permitted.

---

## 6. Protocol Configuration Security

`protocol_rules.json` defines all experiment protocol logic, including timing constraints, allowed actions, and anomaly rules. Unauthorized modification during an active session could suppress anomaly detection or allow invalid actions to appear valid.

### 6.1 Schema Validation at Load

`protocol_rules.json` is validated against a schema on every startup. A syntactically valid but semantically incorrect configuration (e.g., all anomaly rules disabled) is a security concern that schema validation alone cannot detect — protocol review is a human responsibility.

### 6.2 Checksum Verification

`protocol_rules.json` must have its SHA-256 hash recorded and verified at startup, similar to model files. The hash is stored in a separate file (`configs/protocol_checksums.json`) or embedded in the system audit log.

### 6.3 Controlled Updates

- `protocol_rules.json` must not be modified during an active experiment session. The system must detect runtime modifications to this file and log a CRITICAL warning if the file changes while a session is active.
- Protocol version must be logged at session start. If the protocol version changes mid-session, it must be detected and flagged.
- Updates to `protocol_rules.json` follow the same audited deployment procedure as model updates.

### 6.4 Version Tracking

```json
{
  "protocol_id": "bas-protocol-001",
  "protocol_version": "1.2.0",
  "last_modified": "2026-08-29",
  "checksum": "sha256-hex"
}
```

The version and checksum are logged at session start for traceability.

---

## 7. API Security

### 7.1 `GET /video_feed`

**Threat:** Unauthorized access to live annotated video stream on local network.

**Controls:**
- Served on internal network interface only (not `0.0.0.0` without explicit configuration).
- Network firewall restricts access to local subnet only.
- Future: bearer token or session-scoped token for MJPEG stream access within the subnet.

### 7.2 `WS /ws/telemetry`

**Threat:** Unauthorized WebSocket connection; message injection from unauthorized client.

**Controls:**
- WebSocket endpoint accessible on local subnet only.
- The telemetry socket is push-only from server to client; clients cannot inject messages into the telemetry flow.
- Session control operations use the REST endpoints, not the WebSocket.
- Future: token-based authentication for WebSocket connection upgrade.

### 7.3 Session Control Endpoints

**Threat:** Unauthorized operator using `/session/abort` or `/session/pause` to disrupt an active experiment.

**Controls:**
- Session control endpoints are accessible on the local subnet only.
- Future enhancement: session-scoped token or PIN required for session control operations.
- All session control API calls are logged in the audit trail with the requesting client IP address.

### 7.4 Resource Exhaustion

**Threat:** Local network client floods API endpoints causing resource exhaustion on the edge server.

**Controls:**
- Rate limiting on FastAPI endpoints (configurable; default: 60 requests/minute per IP for REST, 1 concurrent connection per IP for WebSocket).
- Request size limits enforced by Uvicorn/FastAPI.
- Bounded MJPEG client connections (configurable max concurrent clients).

### 7.5 CORS Configuration

```python
# FastAPI CORS: restrict to local subnet only
origins = [
    f"http://{local_subnet_ip}",
    "http://localhost",
    "http://127.0.0.1"
]
```

No wildcard origins are permitted.

---

## 8. Logging Security

The audit log is the primary tamper-evidence artifact for post-experiment review. Its integrity is critical.

### 8.1 Append-Only Enforcement

- Log files must never be opened in write/overwrite mode during a session.
- The log writer must use append-only file operations.
- At the OS level, the log directory should be monitored for unexpected modification events (optional, via `inotify` on Linux).

### 8.2 Preventing Deletion

- Log files must not be deleted or moved during an active session.
- The system should maintain a lock file or file handle to the active log that prevents OS-level deletion on supported platforms.
- Post-session, log deletion requires an authorized, documented procedure.

### 8.3 Timestamp Integrity

- All timestamps use the edge server's local system clock in ISO-8601 UTC format.
- Clock synchronization: while the system operates offline, the system clock must be set correctly before session start. Clock drift during a session is acceptable; clock manipulation is a threat.
- The session start timestamp and all event timestamps must be monotonically non-decreasing within a session. Any clock regression event must be logged at CRITICAL.

### 8.4 Audit Log Completeness

- Every FSM state transition (valid or anomalous) must produce a log entry.
- No anomaly event may be logged at a lower severity than its defined severity level.
- Session summary must be written even if the session ends in an error or abort.

### 8.5 Post-Session Log Archive

- After session close, log files should be checksummed and the checksum recorded.
- If mission operations require, logs can be signed using a local private key for non-repudiation.

---

## 9. Physical Security

### 9.1 Edge Server Physical Access

- The edge inference server must be physically secured in a location accessible only to authorized personnel.
- Unauthorized physical access is the highest-risk threat vector; all other controls can be bypassed by an adversary with physical access to the hardware.
- BIOS/UEFI must be password-protected.
- Boot from USB/external media must be disabled in firmware (unless required for maintenance).

### 9.2 USB Device Policy

- USB ports not required for the camera, speaker, or input devices should be physically disabled or blocked.
- OS-level USB device authorization policies should restrict new device connection during an active experiment session.
- Camera substitution (replacing the payload camera with a replay device) is a physical threat; camera connection should be audited at session start (camera serial number or device ID logging where supported).

### 9.3 Storage Media

- If the edge server uses removable storage (SSD, SD card), physical removal of storage media during a session is a risk. The enclosure should be physically secured.
- If mission security classification requires it, full-disk encryption (LUKS/BitLocker) prevents data recovery from removed storage.

---

## 10. Dependency Security

### 10.1 Pinned Dependencies

- All Python dependencies must be pinned to specific versions in `requirements.txt` or `pyproject.toml`. No unpinned or wildcard versions in production.
- Frontend dependencies must be pinned in `package-lock.json` (or `yarn.lock`).

```
# Correct
ultralytics==8.0.196
fastapi==0.110.0

# Incorrect
ultralytics>=8.0.0  # in production lock file
```

### 10.2 Supply Chain Risk

- PyPI packages are a supply-chain risk. Prefer packages with strong provenance (maintained by large organizations, widely audited).
- Regularly check for known vulnerabilities in dependencies using `pip audit` or equivalent.
- In isolated deployment environments, dependencies should be pre-downloaded and served from a local package mirror, not fetched from the public internet at deployment time.

### 10.3 Dependency Review

- Any new dependency added to the project must be reviewed for:
  - License compatibility with the project.
  - Known CVEs.
  - Active maintenance status.
  - Whether it makes any network calls (if it does, it must be audited to confirm they can be disabled).

### 10.4 Offline Installation Package

- Before deployment to an air-gapped or isolated environment, create a complete offline installation package:
  - All Python packages as `.whl` files.
  - All Node.js packages in `node_modules/` (or `npm pack`).
  - All model files.
  - All font files.
- This package must be verified to install and run without internet access.

---

## 11. Incident Response

### 11.1 Detected Integrity Violation

**Trigger:** Model checksum mismatch or `protocol_rules.json` checksum mismatch detected at startup.

**Response:**
1. System refuses to start. Log CRITICAL: `INTEGRITY_VIOLATION — {file_path}`.
2. Do not proceed with any experiment session.
3. Notify system administrator.
4. Investigate source of modification before re-deployment.
5. Restore file from trusted backup or re-deploy from trusted source.
6. Recompute and update checksums after verified restoration.
7. Document the incident in an out-of-band incident log.

### 11.2 Log Tampering Detected

**Trigger:** Log file is found to have been modified outside of normal session write operations (e.g., entries deleted, timestamps altered).

**Response:**
1. Log the detection event (if possible) in a new session log.
2. Mark the affected session log as `INTEGRITY_SUSPECT` in the session summary.
3. Preserve the tampered file as evidence; do not overwrite.
4. Investigate who had access to the log directory.
5. Report to mission operations security point of contact.

### 11.3 Unauthorized API Access

**Trigger:** API access log shows requests from IP addresses not belonging to the expected local subnet, or unusually high request volumes.

**Response:**
1. Log all anomalous access attempts (FastAPI middleware must log source IP for every request).
2. If active session is in progress: evaluate whether the attack affects the experiment; abort if necessary.
3. Review network isolation configuration; verify firewall rules.
4. If origin is inside the local subnet: investigate which machine originated the requests.

### 11.4 Physical Security Event

**Trigger:** Unauthorized person observed accessing the edge server, or unexpected USB device detected.

**Response:**
1. Immediately abort the active experiment session if in progress.
2. Do not resume until physical access investigation is complete.
3. Run integrity checks on all critical files (model files, `protocol_rules.json`, log files).
4. If USB device was connected: assume potential compromise; re-image the system before next use.
5. Document the incident in the mission security log.

### 11.5 System Crash During Session

**Trigger:** Unhandled exception or system crash during active experiment session.

**Response:**
1. The session cannot be resumed (FSM state is lost after unhandled crash).
2. Log files and video archive from the partial session must be preserved as-is for investigation.
3. Run log integrity check on the partial session.
4. Restart the system and verify integrity before starting a new session.

---

*End of Security.md — AstroFlow-AI v0.1.0-draft*

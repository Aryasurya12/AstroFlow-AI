# AstroFlow-AI — UI/UX Design Specification

> **Document Version:** 0.1.0-draft  
> **Status:** Planning / Pre-Development  
> **Last Updated:** 2026-08-29  
> **Related Documents:** [TRD.md](./TRD.md) · [PRD.md](./PRD.md) · [workflow.md](./workflow.md)

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Visual Language](#2-visual-language)
3. [Global Layout System](#3-global-layout-system)
4. [Screen Specifications](#4-screen-specifications)
5. [Component System](#5-component-system)
6. [UX States](#6-ux-states)
7. [Responsive Behavior](#7-responsive-behavior)
8. [Accessibility](#8-accessibility)

---

## 1. Design Philosophy

AstroFlow-AI's Mission Dashboard is an **operational system interface**, not a consumer application or SaaS analytics product.

The design intent is:

> *"A mission operations console that happens to run inference — not an AI product that has a dashboard."*

Every design decision must be evaluated against three criteria:

1. **Does this communicate operational state clearly?**
2. **Does this reduce cognitive load under time-pressure?**
3. **Is this information that the operator or supervisor needs right now?**

### 1.1 Design Influences

The visual aesthetic is inspired by:
- NASA mission operations centers (MOC) and flight operations displays.
- ISRO/ground-segment control room interfaces.
- Modern Edge-AI observability dashboards (Grafana dark mode, Prometheus).
- Aerospace-grade HUD and avionics display systems.

The interface deliberately feels **technical, dense, and purposeful** — not clean and minimal in the consumer software sense. Every pixel of screen space on the primary display carries operational meaning.

### 1.2 Design Anti-Patterns to Avoid

| Anti-Pattern | Why It Is Wrong for This System |
|---|---|
| Pastel / soft color palette | Fails to communicate severity hierarchy clearly |
| Large empty white space | Wastes display real estate on a mission-control console |
| Rounded card-heavy layout (generic SaaS) | Reduces information density without operational benefit |
| Animated backgrounds / decorative motion | Distracts from live video and status changes |
| Bottom navigation bar (mobile-first) | Wrong layout for desktop primary display |
| Modal dialogs for routine operations | Blocks primary content; unacceptable for operational UI |
| Gradients used as decoration | Gradients are reserved for status/health indicators |

---

## 2. Visual Language

### 2.1 Background System

The interface uses a layered background hierarchy:

| Layer | Role | Description |
|---|---|---|
| Base | Page background | Near-black; not pure `#000`. Slightly cool-toned dark (e.g., `hsl(220, 15%, 7%)`) |
| Surface | Cards, panels | Slightly lighter than base; creates panel depth without heavy shadows |
| Elevated | Focused elements, dropdowns | Distinct from surface; used sparingly |
| Overlay | Modal, critical alert banners | Semi-transparent overlay with blur backdrop |

**Principle:** Depth is created through subtle tone differences and thin borders, not heavy shadows or dramatic elevation changes.

### 2.2 Accent Color System

The accent system communicates both **status** and **interactivity**.

| Accent Role | Color Range | Usage |
|---|---|---|
| Primary active / interactive | Cyan-teal family (e.g., `hsl(185, 80%, 45%)`) | Active steps, selected items, interactive controls, links |
| Nominal / OK | Muted green family | "System running", step completed, nominal telemetry |
| Warning | Amber-orange family | Non-critical anomaly, low confidence, approaching timeout |
| Error | Red-orange family | Invalid action, skipped step, camera failure |
| Critical | High-saturation red | Critical anomaly, session abort, unrecoverable failure |
| Inactive / Pending | Muted grey-blue | Pending steps, inactive modules, disabled controls |
| Data / Telemetry | Soft teal or white | Numerical telemetry values, chart lines |

**Principle:** Color is used to communicate operational meaning, not decoration. Glowing effects (CSS `box-shadow` or `filter: drop-shadow`) are used only on active/critical states, not as general aesthetic treatment.

### 2.3 Typography

| Element | Font Family | Weight | Case |
|---|---|---|---|
| Primary UI / labels | `Inter` or `IBM Plex Sans` (loaded offline) | 400, 500 | Sentence case |
| Headings / section titles | Same family | 600, 700 | Uppercase tracking |
| Status labels / badges | Same family | 500 | UPPERCASE |
| Monospace data (telemetry values, FPS, latency) | `JetBrains Mono` or `IBM Plex Mono` | 400 | N/A |
| Event log / audit terminal | `JetBrains Mono` or `Fira Code` | 400 | N/A |
| Technical identifiers (session IDs, event types) | Monospace | 400 | Lowercase or UPPER as appropriate |

**Principle:** Mixed-font-family systems (proportional UI + monospace data) are the correct pattern for dashboards. All fonts must be bundled with the frontend build; no external font loading.

### 2.4 Spacing System

Based on a 4px base unit:

| Token | Value | Usage |
|---|---|---|
| `--space-1` | 4px | Micro-gap between related items |
| `--space-2` | 8px | Intra-component padding |
| `--space-3` | 12px | Standard component padding |
| `--space-4` | 16px | Section separation |
| `--space-6` | 24px | Panel separation |
| `--space-8` | 32px | Major section gap |

Spacing is tight by default — this is a dense operational display, not a reading interface.

### 2.5 Borders and Dividers

- **Panel borders:** 1px, muted accent color at low opacity. Not decorative — borders delineate functional regions.
- **Active borders:** 1px, primary accent at full opacity. Used to highlight the currently active panel or selected element.
- **Dividers:** 1px horizontal lines within panels, very low opacity.
- **Rounded corners:** 2px–4px maximum. No large border-radius values; the interface has sharp, precise geometry.

### 2.6 Status Indicators

| Indicator Type | Appearance |
|---|---|
| Dot indicator | 8px filled circle with color-coded status |
| Badge | Small pill, uppercase text, color fill |
| Bar | Thin horizontal fill bar (e.g., VRAM utilization) |
| Border highlight | 1px colored border on active panel |
| Glow | Subtle `box-shadow` in accent color on active/critical elements only |
| Flashing | CSS animation on CRITICAL state only — never decorative |

### 2.7 Iconography

- Icons are functional, not decorative.
- Use a single icon set throughout (e.g., Lucide, Phosphor, or custom SVGs).
- Icons appear with a label in most contexts; icon-only in compact/mobile views.
- Icon size: 16px standard; 20px for primary action icons.

### 2.8 Micro-Animations

| Element | Animation |
|---|---|
| Status indicator pulse | Subtle pulse on ACTIVE/WARNING (CSS animation) |
| State transition | Fade (150ms) on protocol step state change |
| Log entry arrival | Slide-in from bottom or fade-in on new event |
| Anomaly flash | Border flash (2-3 cycles) on ERROR/CRITICAL anomaly |
| Telemetry value update | No animation — values update in place cleanly |
| Video feed | No animation; live stream displayed as-is |

**Principle:** Animations communicate state changes, not aesthetics. No perpetual animations except status pulse on active/warning states.

---

## 3. Global Layout System

The Mission Dashboard uses a **fixed, three-column layout** on the primary display.

```
┌────────────────────────────────────────────────────────────────────┐
│  TOP STATUS BAR                                                    │
│  [Project Logo]  [Session ID]  [System Status]  [UTC Clock]       │
│  [Active Protocol]  [Edge Node Status]  [Network]  [Recording]    │
├──────────┬─────────────────────────────────────┬───────────────────┤
│          │                                     │                   │
│  LEFT    │    MAIN CONTENT AREA                │  RIGHT PANEL      │
│  NAV     │    (Primary visualization / live    │  Protocol State   │
│  RAIL    │    video, telemetry charts,         │  SOP Checklist    │
│          │    module map, logs, etc.)           │  Anomaly Alerts   │
│  48px    │                                     │  Telemetry HUD    │
│  wide    │                                     │  ~320px wide      │
│          │                                     │                   │
├──────────┴─────────────────────────────────────┴───────────────────┤
│  BOTTOM EVENT CONSOLE                                              │
│  Auto-scrolling monospace audit log terminal          [160px tall] │
└────────────────────────────────────────────────────────────────────┘
```

### 3.1 Top Status Bar

Always visible. Contains:
- **Project identity:** AstroFlow-AI logo/wordmark + mission name.
- **Session ID:** Truncated UUID of active session (or "NO SESSION").
- **System status badge:** IDLE / RUNNING / WARNING / ANOMALY / PAUSED / ERROR.
- **UTC clock:** Live timestamp display (monospace).
- **Active protocol name:** Currently loaded protocol from `protocol_rules.json`.
- **Edge node status:** CPU%, GPU%, VRAM bar, Camera indicator.
- **Recording indicator:** REC badge + elapsed time (if archiving active).

### 3.2 Left Navigation Rail

48px wide icon rail. Navigation items:

| Icon | Destination | Label (tooltip) |
|---|---|---|
| Grid | Mission Dashboard (home) | Dashboard |
| Camera | Live Video / HAR View | Live View |
| Activity | Telemetry | Telemetry |
| Map | Module Architecture | System Map |
| Terminal | Logs / Event History | Logs |
| Alert | Alerts / Anomalies | Alerts |
| Checklist | Protocol / SOP View | Protocol |
| Settings | System Diagnostics | Diagnostics |

Active screen indicated by accent-colored left border on the nav item.

### 3.3 Main Content Area

Fills remaining width between left rail and right panel. Changes per screen. The **Live Video / HAR View** is the primary operational screen.

### 3.4 Right Operations Panel (~320px)

Always visible, always showing:
- Current FSM state
- Protocol progress ring or progress bar
- SOP checklist (last 3 visible, scroll for more)
- Latest anomaly alert (if active)
- Telemetry mini-summary

Full detail for each section is available on dedicated screens.

### 3.5 Bottom Event Console (~160px)

Always visible. Contains:
- Auto-scrolling monospace terminal.
- Each line: `[timestamp] [severity] [module] event description`.
- Severity color coding per line.
- Pause scrolling on hover.
- Manual scroll available.
- "Jump to latest" button when scrolled up.

---

## 4. Screen Specifications

### 4.1 Live Video / HAR View (Primary Operational Screen)

This is the most operationally critical screen. It must show maximum useful information without obscuring the live video.

**Layout:**
```
┌───────────────────────────────────────────────────┐
│ [RECORDING ●] [00:12:34]        [FPS: ##] [ms: ##]│
│                                                   │
│   ┌─────────────────────────────────────────────┐ │
│   │                                             │ │
│   │          LIVE VIDEO VIEWPORT                │ │
│   │          (1920×1080 → scaled to fit)        │ │
│   │                                             │ │
│   │  [Person BB]  [Vial BB 0.91]                │ │
│   │  [Syringe BB 0.84]                          │ │
│   │  [Hand skeleton overlay]                    │ │
│   │  [HOI indicator: hand ←→ vial]              │ │
│   │                                             │ │
│   │  ┌──────────────────────────────────┐       │ │
│   │  │ FSM: STEP_02_READY              │       │ │
│   │  │ Expecting: INSERT_SYRINGE       │       │ │
│   │  └──────────────────────────────────┘       │ │
│   └─────────────────────────────────────────────┘ │
│                                                   │
│  [Active HOI: hand HOLDING vial (0.88)]           │
│  [ANOMALY: OUT_OF_ORDER — ORANGE banner]          │
└───────────────────────────────────────────────────┘
```

**Overlay Elements:**

| Element | Position | Style |
|---|---|---|
| Object bounding boxes | Overlaid on video | Thin colored rectangle; class label above; confidence score below |
| Person bounding box | Overlaid on video | Distinct color (e.g., cyan); label "OPERATOR" |
| Hand skeleton | Overlaid on video | 21-point dot-and-line skeleton, subtle glow |
| HOI interaction line | Between hand and object | Dashed line with arrowhead; interaction label; confidence |
| FSM state HUD | Bottom-left of video | Semi-transparent dark panel; current state + expected event |
| Recording indicator | Top-left corner | Pulsing red dot + "REC" + elapsed time |
| FPS counter | Top-right | Monospace, small |
| Frame latency | Top-right | Monospace, small |
| Anomaly banner | Bottom of video or top overlay | Color-coded stripe; anomaly type + description |

**Bounding Box Color Coding:**

| Object Type | Box Color |
|---|---|
| Operator/person | Cyan |
| Experiment objects (active HOI) | Bright green |
| Experiment objects (no HOI) | Muted teal |
| Unknown/flagged detection | Orange |
| Low-confidence detection | Dashed orange |

### 4.2 Mission Dashboard (Home Screen)

Overview of system state. Shown on startup and between sessions.

**Layout (6-panel grid):**

```
┌─────────────────┬──────────────────┬─────────────────┐
│ SYSTEM STATUS   │ ACTIVE SESSION   │ EDGE NODE HEALTH│
│ RUNNING         │ Protocol: [name] │ GPU: ██████ xx% │
│ 00:14:23 uptime │ Step 2 of 7      │ VRAM: ████ xxMB │
│                 │ Progress: ████░  │ CPU: ███ xx%    │
│                 │                  │ Temp: to meas.  │
├─────────────────┴──────────────────┼─────────────────┤
│ PROTOCOL COMPLIANCE (session)      │ CAPABILITIES    │
│ Steps complete: 1/7                │ ● Object Det.   │
│ Anomalies: 1                       │ ● Pose Track.   │
│ Last anomaly: OUT_OF_ORDER         │ ● HOI Engine    │
│ 00:02:15 ago                       │ ● FSM Active    │
│                                    │ ● Voice Module  │
│                                    │ ● Recording     │
├────────────────────────────────────┴─────────────────┤
│ RECENT EVENTS (last 5)                               │
│ [timestamp] [INFO] STEP_01 → STEP_02 (PICK_UP_VIAL) │
│ [timestamp] [WARN] ANOMALY: OUT_OF_ORDER             │
│ ...                                                  │
└──────────────────────────────────────────────────────┘
```

### 4.3 Telemetry Screen

Real-time system performance. Focused on edge hardware health.

**Layout:**

```
┌────────────────────────────────────────────────────────┐
│ INFERENCE PERFORMANCE                                  │
│  Inference FPS:    [LARGE VALUE — monospace]           │
│  Frame Latency:    [LARGE VALUE — monospace] ms        │
│  Detection time:   [value] ms                          │
│  Pose time:        [value] ms                          │
│  HOI time:         [value] ms                          │
├────────────────────────────────────────────────────────┤
│ GPU                          │ SYSTEM                  │
│  VRAM: [bar] xx / xxxx MB   │  CPU: [bar] xx%          │
│  GPU util: [bar] xx%         │  RAM: [bar] xx / xxxx MB│
│  Temp: [value] °C            │  Storage: [bar] xx GB   │
├────────────────────────────────────────────────────────┤
│ STREAM STATE                 │ MODEL STATE             │
│  Camera: ● CONNECTED         │  Detection: YOLO v8s    │
│  Archive: ● RECORDING        │  Pose: MediaPipe        │
│  MJPEG: ● SERVING            │  Loaded: ●              │
│  WebSocket: ● 1 client       │  CUDA: ●                │
└────────────────────────────────────────────────────────┘
```

> Telemetry values labeled "to be measured" in development; no placeholder numbers displayed.

### 4.4 Alerts / Anomalies Screen

Historical list of anomaly events from the current session.

**Each alert card contains:**

| Field | Description |
|---|---|
| Timestamp | ISO-8601; relative time (e.g., "2m ago") |
| Severity | Badge: WARNING / ERROR / CRITICAL |
| Anomaly type | e.g., SKIPPED_STEP, OUT_OF_ORDER |
| Affected step | Step ID from protocol |
| Trigger event | The event that caused the anomaly |
| Expected event | What was expected at that state |
| Recommended action | Human-readable guidance string |

Alerts are sortable by time and severity. Active anomalies are pinned to top.

### 4.5 Protocol / SOP Execution View

Full-page protocol checklist.

```
PROTOCOL: [Protocol Name]  v[version]  SESSION: [session_id]

┌─────────────────────────────────────────────────────────────┐
│ ✓ STEP 01 — Pick up vial              [COMPLETE] [00:00:34] │
│ ► STEP 02 — Insert syringe            [IN PROGRESS]         │
│   STEP 03 — Observe chamber           [PENDING]             │
│   STEP 04 — Withdraw syringe          [PENDING]             │
│   STEP 05 — Seal vial                 [PENDING]             │
│   STEP 06 — Return to rack            [PENDING]             │
│   STEP 07 — Protocol complete         [PENDING]             │
└─────────────────────────────────────────────────────────────┘

Progress: ██░░░░░░░░  1/7  (14%)

Anomalies this session: 1
└── [00:03:12] WARNING — OUT_OF_ORDER — Step 02
```

Step status icons:
- ✓ Complete (green)
- ► In Progress (cyan; animated pulse)
- ○ Pending (muted grey)
- ✗ Failed / Anomaly (red)
- ⏸ Skipped (orange)

### 4.6 Logs / Event History Screen

Full-screen monospace event terminal with filtering.

```
FILTER: [All] [INFO] [WARNING] [ERROR] [CRITICAL]
SEARCH: [____________________________]

[2026-08-29T12:05:34.123Z] [INFO   ] [FSM   ] STEP_01_READY → STEP_01_COMPLETE (PICK_UP_VIAL, conf:0.88)
[2026-08-29T12:05:52.007Z] [WARNING] [FSM   ] ANOMALY:OUT_OF_ORDER — step:STEP_02, recv:ACTIVATE_PORT
[2026-08-29T12:06:01.443Z] [INFO   ] [VOICE ] Prompt: "Warning: action is out of sequence."
[2026-08-29T12:06:05.881Z] [INFO   ] [HOI   ] Interaction: hand HOLDING vial, conf:0.91, frames:18
...
```

Features:
- Filtered by severity level.
- Searchable.
- Color-coded per severity level.
- Auto-scroll (pause on hover).
- Export button → downloads `session_{id}_audit.txt`.

### 4.7 System Architecture / Module Map Screen

Visual representation of the six backend modules with live health status.

```
[Camera] → [Module 1: Ingestion] → [Module 2: CV/HAR] → [Module 3: FSM]
                                                              ↓
                                           [Module 4: Voice] [Module 5: Logs] [Module 6: API]
```

Each module node shows:
- Module name
- Status indicator (RUNNING / IDLE / ERROR)
- Key metric (FPS for Module 2, FSM state for Module 3, etc.)

### 4.8 System Diagnostics Screen

Hardware health, storage, and software version information.

| Section | Contents |
|---|---|
| Hardware | GPU name, VRAM total, CPU model, RAM total |
| Software | Python version, YOLO version, MediaPipe version, FastAPI version, Next.js version |
| Storage | Recording path, available space, current archive size |
| Configuration | Active `protocol_rules.json` file hash / version |
| Session | Current session ID, start time, elapsed |

---

## 5. Component System

### 5.1 Core Reusable Components

| Component | Description |
|---|---|
| `<StatusBadge>` | Colored pill with text; variants: IDLE/RUNNING/WARNING/ERROR/CRITICAL/PAUSED |
| `<TelemetryCard>` | Panel with header, large metric value, unit, optional sparkline |
| `<BoundingBoxOverlay>` | SVG/Canvas overlay for video; renders boxes, labels, confidence |
| `<HandSkeletonOverlay>` | SVG overlay for MediaPipe keypoints and skeleton lines |
| `<HOIIndicator>` | SVG line between hand and object bbox centers with label |
| `<ProtocolChecklist>` | Step-by-step list with status icons and timing |
| `<AnomalyAlert>` | Card with severity, type, affected step, recommended action |
| `<EventTerminal>` | Auto-scrolling monospace log viewer |
| `<SystemStatusBar>` | Top bar component (always visible) |
| `<NavRail>` | Left icon navigation |
| `<VideoViewport>` | MJPEG `<img>` or WebRTC video element with overlays |
| `<FsmStateHUD>` | Current FSM state overlay panel on video |
| `<ProgressRing>` | Circular progress indicator for protocol completion % |
| `<MetricBar>` | Horizontal fill bar for VRAM, CPU, etc. |
| `<ModuleStatusNode>` | Module map node with status + metric |
| `<RecordingIndicator>` | Pulsing REC badge + elapsed time |

### 5.2 Design Token System (CSS Custom Properties)

```css
:root {
  /* Backgrounds */
  --color-bg-base: hsl(220, 15%, 7%);
  --color-bg-surface: hsl(220, 12%, 11%);
  --color-bg-elevated: hsl(220, 10%, 16%);

  /* Accents */
  --color-accent-primary: hsl(185, 80%, 45%);   /* Cyan-teal */
  --color-accent-nominal: hsl(145, 60%, 40%);   /* Green */
  --color-accent-warning: hsl(38, 90%, 50%);    /* Amber */
  --color-accent-error: hsl(10, 80%, 52%);      /* Red-orange */
  --color-accent-critical: hsl(0, 90%, 50%);    /* Red */
  --color-accent-inactive: hsl(220, 15%, 30%);  /* Muted */

  /* Typography */
  --font-ui: 'Inter', 'IBM Plex Sans', sans-serif;
  --font-mono: 'JetBrains Mono', 'IBM Plex Mono', monospace;

  /* Borders */
  --border-width: 1px;
  --border-radius-sm: 2px;
  --border-radius-md: 4px;
  --border-color: hsl(220, 15%, 20%);
  --border-active: var(--color-accent-primary);

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
}
```

---

## 6. UX States

| State | Top Bar Status | Main Area | Right Panel | Bottom Console |
|---|---|---|---|---|
| INITIALIZING | "INITIALIZING" (grey pulse) | System startup progress | Module checklist | Startup log entries |
| READY | "READY" (green) | Protocol selection / system overview | Protocol loaded, no active steps | Ready message |
| RUNNING | "RUNNING" (cyan pulse) | Live video / active view | Active SOP checklist | Live event stream |
| WARNING | "WARNING" (amber) | Live video + anomaly banner | Anomaly highlighted | Warning entries highlighted |
| ANOMALY | "ANOMALY" (red pulse) | Live video + critical banner | Anomaly card pinned top | Error entries |
| PAUSED | "PAUSED" (amber static) | Video continues; PAUSED overlay on FSM HUD | Pause indicator | Pause log entry |
| DISCONNECTED | "DISCONNECTED" (red) | Camera lost banner; no video | Disconnected state | Disconnection event |
| COMPLETE | "COMPLETE" (green) | Session summary | Step list all complete | Completion event |
| ERROR | "SYSTEM ERROR" (red flash) | Error screen | Error details | Exception log |

---

## 7. Responsive Behavior

The primary target is a **1920×1080 desktop display** or larger mission-control monitor.

| Breakpoint | Behavior |
|---|---|
| ≥ 1920px | Full three-column layout; full event console; all telemetry visible |
| 1280px–1919px | Reduced right panel width; compact telemetry cards |
| 1024px–1279px | Right panel collapses to icon-tab; expand on click |
| < 1024px | Single-column; nav rail becomes bottom tab bar; video takes full width; right panel accessible via drawer |

> **Note:** Sub-1024px is not a primary operational target. The system is designed for a dedicated mission-control display. Mobile/tablet behavior is provided as a non-primary reference view only.

---

## 8. Accessibility

| Requirement | Implementation |
|---|---|
| Color alone not used to convey state | Status badges always include text labels in addition to color |
| Screen reader support | ARIA labels on all interactive elements; live region for event terminal |
| Keyboard navigation | Full keyboard navigation for all controls; skip-to-content link |
| Focus indicators | High-contrast focus ring on all focusable elements |
| Minimum text contrast | WCAG AA minimum for all body text against panel backgrounds |
| Reduced motion | `prefers-reduced-motion` media query; disables non-essential animations |
| Font size | Base 14px; minimum 12px for compact telemetry; no text below 10px |
| Interactive targets | Minimum 32×32px click target on all interactive elements |

---

*End of Design Doc — AstroFlow-AI v0.1.0-draft*

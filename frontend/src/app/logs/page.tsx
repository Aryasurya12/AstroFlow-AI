"use client";

import React, { useState } from "react";
import { 
  Terminal, 
  Search, 
  Download, 
  Radio 
} from "lucide-react";

interface LogLine {
  timestamp: string;
  level: "INFO" | "WARNING" | "CRITICAL" | "NOMINAL";
  module: "FSM" | "VOICE" | "HOI" | "CAM" | "STORE" | "SAFETY";
  message: string;
}

const FULL_LOGS: LogLine[] = [
  {
    timestamp: "2026-08-29T11:42:01.000Z",
    level: "CRITICAL",
    module: "SAFETY",
    message: "SAFETY_INTERLOCK_DEVIATION: Chamber pressure delta > 0.05 bar during pre-check purge. Auto-valve reset executed.",
  },
  {
    timestamp: "2026-08-29T12:14:10.512Z",
    level: "WARNING",
    module: "HOI",
    message: "ANOMALY: OBJECT_OCCLUSION · Target lost on REAGENT_VIAL for > 15 frames (operator sleeve shadow).",
  },
  {
    timestamp: "2026-08-29T12:15:20.104Z",
    level: "NOMINAL",
    module: "CAM",
    message: "Camera /dev/video0 initialized: 1920x1080 @ 30fps. Buffer pool allocated 64MB.",
  },
  {
    timestamp: "2026-08-29T12:15:21.050Z",
    level: "INFO",
    module: "HOI",
    message: "YOLOv8s object detection initialized with TensorRT FP16 engine. Classes: 14.",
  },
  {
    timestamp: "2026-08-29T12:15:22.418Z",
    level: "INFO",
    module: "HOI",
    message: "MediaPipe Hands tracking model loaded. 21 skeletal landmarks enabled.",
  },
  {
    timestamp: "2026-08-29T12:15:25.890Z",
    level: "INFO",
    module: "FSM",
    message: "Protocol rules loaded: EXP-04_CRYSTAL_GROWTH_V2. 7 distinct operational states parsed.",
  },
  {
    timestamp: "2026-08-29T12:15:26.110Z",
    level: "NOMINAL",
    module: "FSM",
    message: "Session SES-8821-A initiated by CMD-01. Initial transition -> STEP_01_READY.",
  },
  {
    timestamp: "2026-08-29T12:15:34.123Z",
    level: "INFO",
    module: "FSM",
    message: "STEP_01_READY -> STEP_01_COMPLETE (Event: PICK_UP_VIAL, confidence: 0.94).",
  },
  {
    timestamp: "2026-08-29T12:15:34.205Z",
    level: "INFO",
    module: "HOI",
    message: "Interaction detected: hand HOLDING vial (class: REAGENT_VIAL, conf: 0.91, frames: 18).",
  },
  {
    timestamp: "2026-08-29T12:15:52.007Z",
    level: "WARNING",
    module: "FSM",
    message: "ANOMALY: OUT_OF_ORDER · state: STEP_02, received: ACTIVATE_PORT, expected: INSERT_SYRINGE.",
  },
  {
    timestamp: "2026-08-29T12:16:01.443Z",
    level: "INFO",
    module: "VOICE",
    message: "Dispatched audio synthesis: 'Warning: action is out of sequence. Return to Step 02.'",
  },
  {
    timestamp: "2026-08-29T12:16:05.881Z",
    level: "INFO",
    module: "HOI",
    message: "Interaction: hand HOLDING syringe (class: SYRINGE_10ML, conf: 0.88, frames: 24).",
  },
  {
    timestamp: "2026-08-29T12:16:12.440Z",
    level: "NOMINAL",
    module: "STORE",
    message: "Encrypted telemetry chunk written to flash partition: /data/sessions/ses8821a_chk02.log",
  },
];

type FilterMode = "ALL" | "NORMAL" | "ALERTS";

export default function LogsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterMode>("ALL");

  // Dynamically compute counts from the current log items array
  const allCount = FULL_LOGS.length;
  const normalCount = FULL_LOGS.filter(
    (l) => l.level === "NOMINAL" || l.level === "INFO"
  ).length;
  const alertsCount = FULL_LOGS.filter(
    (l) => l.level === "WARNING" || l.level === "CRITICAL"
  ).length;

  const filteredLogs = FULL_LOGS.filter((line) => {
    // 1. Filter mode check
    if (activeFilter === "NORMAL") {
      if (line.level !== "NOMINAL" && line.level !== "INFO") {
        return false;
      }
    } else if (activeFilter === "ALERTS") {
      if (line.level !== "WARNING" && line.level !== "CRITICAL") {
        return false;
      }
    }

    // 2. Search query filter
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      return (
        line.message.toLowerCase().includes(q) ||
        line.module.toLowerCase().includes(q) ||
        line.timestamp.toLowerCase().includes(q) ||
        line.level.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExport = () => {
    const text = FULL_LOGS.map(
      (l) => `[${l.timestamp}] [${l.level.padEnd(8)}] [${l.module}] ${l.message}`
    ).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "session_ses8821a_audit.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3 font-sans h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border flex-none">
        <div>
          <h1 className="text-sm font-mono font-bold tracking-wider uppercase text-foreground flex items-center gap-2">
            <Terminal className="w-4 h-4 text-accent" />
            MISSION AUDIT LOG & ALERTS
          </h1>
          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
            Unified audit trail, real-time safety cognition alerts, and FSM transition trace
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 font-mono text-xs">
          <span className="px-2 py-0.5 rounded-[2px] bg-status-nominal/15 border border-status-nominal/40 text-status-nominal">
            ACTIVE STREAM · 100ms
          </span>
        </div>
      </div>

      {/* Filter & Search Toolbar (Single unified row: Search | 3-Pill Filter Cluster | Export) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 p-2 panel-surface rounded-[2px] font-mono text-xs flex-none border border-border">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit logs, alerts, modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-background border border-border rounded-[2px] text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
          />
        </div>

        {/* Center / Inline Cluster: 3 Pill Filter Group */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* ALL Pill */}
          <button
            onClick={() => setActiveFilter("ALL")}
            className={`px-3 py-1.5 rounded-[2px] text-xs font-mono border transition-all flex items-center gap-1.5 ${
              activeFilter === "ALL"
                ? "border-primary text-primary bg-accent/15 shadow-glow-cyan font-semibold"
                : "bg-surface-elevated border-border text-muted-foreground hover:text-foreground hover:bg-surface-elevated/80"
            }`}
          >
            <span>ALL</span>
            <span
              className={`px-1.5 py-0.2 rounded-[2px] text-[10px] tabular-nums font-mono ${
                activeFilter === "ALL"
                  ? "bg-primary/20 text-primary font-semibold"
                  : "bg-background/60 text-muted-foreground"
              }`}
            >
              {allCount}
            </span>
          </button>

          {/* NORMAL Pill */}
          <button
            onClick={() => setActiveFilter("NORMAL")}
            className={`px-3 py-1.5 rounded-[2px] text-xs font-mono border transition-all flex items-center gap-1.5 ${
              activeFilter === "NORMAL"
                ? "border-primary text-primary bg-accent/15 shadow-glow-cyan font-semibold"
                : "bg-surface-elevated border-border text-muted-foreground hover:text-foreground hover:bg-surface-elevated/80"
            }`}
          >
            <span>NORMAL</span>
            <span
              className={`px-1.5 py-0.2 rounded-[2px] text-[10px] tabular-nums font-mono ${
                activeFilter === "NORMAL"
                  ? "bg-primary/20 text-primary font-semibold"
                  : "bg-background/60 text-muted-foreground"
              }`}
            >
              {normalCount}
            </span>
          </button>

          {/* ALERTS Pill */}
          <button
            onClick={() => setActiveFilter("ALERTS")}
            className={`px-3 py-1.5 rounded-[2px] text-xs font-mono border transition-all flex items-center gap-1.5 ${
              activeFilter === "ALERTS"
                ? "border-amber-500 text-amber-400 bg-amber-500/15 shadow-glow-amber font-semibold"
                : "bg-surface-elevated border-border text-muted-foreground hover:text-foreground hover:bg-surface-elevated/80"
            }`}
          >
            <span>ALERTS</span>
            <span
              className={`px-1.5 py-0.2 rounded-[2px] text-[10px] tabular-nums font-mono font-semibold ${
                alertsCount > 0 || activeFilter === "ALERTS"
                  ? "text-amber-400 bg-amber-400/10 border border-amber-400/30"
                  : "bg-background/60 text-muted-foreground"
              }`}
            >
              {alertsCount}
            </span>
          </button>
        </div>

        {/* Extreme Right: Export Audit File Button */}
        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-accent text-background font-mono font-bold text-xs rounded-[2px] hover:bg-accent-hover transition-colors shadow-glow-cyan shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>EXPORT AUDIT FILE</span>
        </button>
      </div>

      {/* Terminal Monospace Content Viewport */}
      <div className="flex-1 panel-surface rounded-[2px] overflow-hidden flex flex-col bg-background/95 font-mono text-xs border border-border">
        <div className="panel-header px-3 py-1.5 flex items-center justify-between flex-none">
          <div className="flex items-center gap-2">
            <Radio className="w-3 h-3 text-status-nominal animate-pulse" />
            <span>LOG STREAM: SESSION_SES8821A_AUDIT.LOG</span>
          </div>
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {filteredLogs.length} OF {FULL_LOGS.length} ENTRIES
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredLogs.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 font-mono text-xs">
              No matching log records found for active filters.
            </div>
          ) : (
            filteredLogs.map((log, idx) => {
              const isWarning = log.level === "WARNING";
              const isCritical = log.level === "CRITICAL";

              // High-contrast severity row styling
              let rowClass = "hover:bg-surface-elevated/40 border-b border-border/40";
              if (isWarning) {
                rowClass = "bg-amber-500/10 border-l-2 border-amber-500 hover:bg-amber-500/15 border-b border-border/40";
              } else if (isCritical) {
                rowClass = "bg-red-500/15 border-l-2 border-red-500 hover:bg-red-500/20 border-b border-border/40";
              }

              return (
                <div
                  key={idx}
                  className={`flex items-start gap-2 p-1.5 rounded-[2px] transition-colors ${rowClass}`}
                >
                  {/* Timestamp */}
                  <span className="text-[hsl(220,15%,45%)] font-mono tabular-nums text-[10px] shrink-0 select-none pt-0.5">
                    [{log.timestamp}]
                  </span>

                  {/* Severity Badge */}
                  {isWarning && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold font-mono rounded-[2px] bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
                      [WARN]
                    </span>
                  )}
                  {isCritical && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold font-mono rounded-[2px] bg-red-500/25 text-red-400 border border-red-500/50 shrink-0 font-bold">
                      [CRITICAL]
                    </span>
                  )}
                  {log.level === "NOMINAL" && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold font-mono rounded-[2px] bg-status-nominal/15 text-status-nominal border border-status-nominal/30 shrink-0">
                      [NOMINAL]
                    </span>
                  )}
                  {log.level === "INFO" && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold font-mono rounded-[2px] bg-accent/10 text-accent border border-accent/30 shrink-0">
                      [INFO]
                    </span>
                  )}

                  {/* Module Tag */}
                  <span className="text-accent font-semibold shrink-0 font-mono text-[10px] pt-0.5">
                    [{log.module}]
                  </span>

                  {/* Message */}
                  <span className="text-foreground/95 leading-relaxed font-mono font-medium pt-0.5 flex-1">
                    {log.message}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Terminal, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  ArrowDown, 
  Pause, 
  Play, 
  Radio 
} from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: string;
  severity: "INFO" | "WARN" | "CRIT" | "NOMINAL" | "DEBUG";
  module: string;
  message: string;
}

const INITIAL_LOGS: LogEntry[] = [
  {
    id: "log-1",
    timestamp: "12:15:20.104",
    severity: "NOMINAL",
    module: "CAMERA",
    message: "MJPEG Video Stream initialized (1920x1080@30fps, color_space: RGB24, dev: /dev/video0)",
  },
  {
    id: "log-2",
    timestamp: "12:15:21.050",
    severity: "INFO",
    module: "MOD-CV",
    message: "YOLOv8s object detection engine warm-up complete. CUDA TensorRT execution provider active.",
  },
  {
    id: "log-3",
    timestamp: "12:15:22.418",
    severity: "INFO",
    module: "MOD-CV",
    message: "MediaPipe hand landmark tracker initialized (21 keypoints, confidence_threshold: 0.70).",
  },
  {
    id: "log-4",
    timestamp: "12:15:25.890",
    severity: "INFO",
    module: "FSM",
    message: "Loaded protocol definition: EXP-04_CRYSTAL_GROWTH_V2. Total sequence states: 7.",
  },
  {
    id: "log-5",
    timestamp: "12:15:26.110",
    severity: "NOMINAL",
    module: "FSM",
    message: "Session SES-8821-A started. Initial state transition: FSM_IDLE -> STEP_01_READY.",
  },
  {
    id: "log-6",
    timestamp: "12:15:34.205",
    severity: "INFO",
    module: "HOI",
    message: "Interaction detected: hand HOLDING vial (class: REAGENT_VIAL, conf: 0.94, duration: 1.8s).",
  },
  {
    id: "log-7",
    timestamp: "12:15:34.500",
    severity: "NOMINAL",
    module: "FSM",
    message: "STEP_01 validated: PICK_UP_VIAL verified. State -> STEP_02_READY.",
  },
  {
    id: "log-8",
    timestamp: "12:15:52.012",
    severity: "WARN",
    module: "FSM",
    message: "ANOMALY: OUT_OF_ORDER — received ACTIVATE_PORT before required action INSERT_SYRINGE.",
  },
  {
    id: "log-9",
    timestamp: "12:15:52.340",
    severity: "INFO",
    module: "VOICE",
    message: "Synthesized audio alert dispatched: 'Caution: execute syringe insertion before valve activation.'",
  },
  {
    id: "log-10",
    timestamp: "12:16:02.810",
    severity: "NOMINAL",
    module: "ARCHIVE",
    message: "Synced telemetry checkpoint to local flash buffer: session_ses8821a_checkpoint_02.bin",
  },
];

export function BottomEventConsole() {
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAutoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, isAutoScroll]);

  const filteredLogs = logs.filter((log) => {
    if (selectedFilter === "ALL") return true;
    if (selectedFilter === "WARN") return log.severity === "WARN" || log.severity === "CRIT";
    if (selectedFilter === "FSM") return log.module === "FSM";
    if (selectedFilter === "CV") return log.module === "MOD-CV" || log.module === "HOI";
    return log.severity === selectedFilter;
  });

  const getSeverityStyle = (severity: LogEntry["severity"]) => {
    switch (severity) {
      case "NOMINAL":
        return "text-status-nominal bg-status-nominal/10 border-status-nominal/30";
      case "WARN":
        return "text-status-warning bg-status-warning/15 border-status-warning/40";
      case "CRIT":
        return "text-status-critical bg-status-critical/20 border-status-critical/50 font-bold";
      case "DEBUG":
        return "text-muted-foreground bg-surface-elevated border-border";
      case "INFO":
      default:
        return "text-accent bg-accent/10 border-accent/30";
    }
  };

  return (
    <div
      className={`flex-none bg-surface/95 border-t border-border flex flex-col transition-all duration-200 select-none z-20 ${
        isCollapsed ? "h-7" : "h-40"
      }`}
    >
      {/* Console Title Bar / Control Header */}
      <div className="h-7 flex-none bg-surface-elevated/70 px-3 flex items-center justify-between border-b border-border text-[11px] font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-foreground font-semibold">
            <Terminal className="w-3.5 h-3.5 text-accent" />
            <span className="tracking-wider">EVENT STREAM AUDIT CONSOLE</span>
          </div>

          <span className="text-border">|</span>

          {/* Filter Pills */}
          <div className="flex items-center gap-1">
            {["ALL", "INFO", "WARN", "FSM", "CV"].map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-1.5 py-0.2 text-[9px] rounded-xs font-semibold tracking-wider transition-colors ${
                  selectedFilter === filter
                    ? "bg-accent text-background font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Console Controls */}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <Radio className="w-2.5 h-2.5 text-status-nominal animate-pulse" />
            <span className="hidden sm:inline">LOCAL WS:8000</span>
          </div>

          <button
            onClick={() => setIsAutoScroll(!isAutoScroll)}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
            title={isAutoScroll ? "Pause Auto-scroll" : "Enable Auto-scroll"}
          >
            {isAutoScroll ? (
              <>
                <Pause className="w-3 h-3 text-accent" />
                <span className="text-accent text-[9px]">AUTO-SCROLL ON</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-status-warning" />
                <span className="text-status-warning text-[9px]">SCROLL PAUSED</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              if (logContainerRef.current) {
                logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
              }
            }}
            className="hover:text-foreground"
            title="Scroll to bottom"
          >
            <ArrowDown className="w-3 h-3" />
          </button>

          <button
            onClick={() => setLogs([])}
            className="hover:text-status-critical"
            title="Clear buffer"
          >
            <Trash2 className="w-3 h-3" />
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hover:text-foreground ml-1"
            title={isCollapsed ? "Expand Console" : "Collapse Console"}
          >
            {isCollapsed ? (
              <ChevronUp className="w-3.5 h-3.5 text-accent" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Terminal Monospace Stream View */}
      {!isCollapsed && (
        <div
          ref={logContainerRef}
          onMouseEnter={() => setIsAutoScroll(false)}
          onMouseLeave={() => setIsAutoScroll(true)}
          className="flex-1 overflow-y-auto p-2 bg-background/90 font-mono text-[10px] space-y-0.5 leading-relaxed selection:bg-accent/30 selection:text-white"
        >
          {filteredLogs.length === 0 ? (
            <div className="text-muted-foreground text-center py-4 italic">
              Buffer empty or no logs matching selected filter.
            </div>
          ) : (
            filteredLogs.map((entry) => (
              <div
                key={entry.id}
                className="flex items-baseline gap-2 hover:bg-surface-elevated/40 px-1.5 py-0.5 rounded-[2px] transition-colors group"
              >
                {/* Dimmed timestamp to elevate severity tag and message hierarchy */}
                <span className="text-[hsl(220,15%,45%)] font-mono tabular-nums text-[10px] shrink-0 select-none">
                  [{entry.timestamp}]
                </span>

                <span
                  className={`px-1.5 py-0 text-[8px] font-bold border rounded-[2px] shrink-0 tracking-wider font-mono ${getSeverityStyle(
                    entry.severity
                  )}`}
                >
                  {entry.severity.padEnd(5, " ")}
                </span>

                <span className="text-accent font-semibold shrink-0 font-mono text-[10px]">
                  [{entry.module}]
                </span>

                <span className="text-foreground/95 break-all font-mono font-medium">{entry.message}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

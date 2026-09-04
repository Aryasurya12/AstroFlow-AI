"use client";

import React from "react";
import { 
  Workflow, 
  CheckCircle2, 
  PlayCircle, 
  Circle, 
  AlertTriangle, 
  Gauge 
} from "lucide-react";

export function RightOperationsPanel() {
  return (
    <aside className="w-80 flex-none bg-surface border-l border-border overflow-y-auto flex flex-col p-2.5 gap-2.5 select-none z-20 text-xs corner-bracket-container">
      {/* 4 Corner Brackets for Aerospace Instrument Cockpit Aesthetic */}
      <span className="corner-bracket corner-bracket-tl" />
      <span className="corner-bracket corner-bracket-tr" />
      <span className="corner-bracket corner-bracket-bl" />
      <span className="corner-bracket corner-bracket-br" />

      {/* Panel Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-border">
        <span className="font-mono text-[10px] uppercase font-semibold text-muted-foreground tracking-widest flex items-center gap-1.5">
          <Workflow className="w-3.5 h-3.5 text-accent" />
          OPERATIONS COCKPIT
        </span>
        <span className="font-mono text-[9px] text-accent bg-accent/10 px-1.5 py-0.5 rounded-[2px] border border-accent/30 tracking-wider font-semibold">
          ACTIVE
        </span>
      </div>

      {/* 1. Current FSM State Card */}
      <div className="panel-surface rounded-[2px] p-2.5 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">FSM State</span>
          <span className="text-[10px] font-mono text-accent font-semibold tabular-nums">CONF: 94.2%</span>
        </div>
        <div className="bg-background/80 border border-accent/50 p-2 rounded-[2px] flex items-center justify-between shadow-glow-cyan">
          <div className="flex flex-col">
            <span className="text-[9px] font-mono text-muted-foreground tracking-wider">ACTIVE NODE</span>
            <span className="font-mono font-bold text-sm text-accent tracking-wide">
              STEP_02_READY
            </span>
          </div>
          <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
        </div>
        <div className="text-[10px] font-mono text-muted-foreground flex justify-between pt-0.5">
          <span className="text-muted-foreground">EXPECTING:</span>
          <span className="text-foreground font-semibold">INSERT_SYRINGE</span>
        </div>
      </div>

      {/* 2. Protocol Progress Ring / Gauge */}
      <div className="panel-surface rounded-[2px] p-2.5 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Protocol Execution</span>
          <span className="text-[10px] font-mono text-status-nominal font-bold tabular-nums">2 / 7 STEPS</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Progress Circular Visual */}
          <div className="relative w-12 h-12 flex-none flex items-center justify-center">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-border"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-accent"
                strokeDasharray="28.5, 100"
                strokeWidth="3"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute font-mono text-[10px] font-bold text-foreground tabular-nums">
              28%
            </span>
          </div>
          <div className="flex flex-col gap-0.5 text-[10px] font-mono">
            <div className="flex justify-between gap-2 text-muted-foreground">
              <span>ELAPSED:</span>
              <span className="text-foreground font-mono tabular-nums">00:04:12</span>
            </div>
            <div className="flex justify-between gap-2 text-muted-foreground">
              <span>EST. REMAIN:</span>
              <span className="text-foreground font-mono tabular-nums">00:10:48</span>
            </div>
            <div className="flex justify-between gap-2 text-muted-foreground">
              <span>RULESET:</span>
              <span className="text-accent font-mono">EXP-04.v2</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SOP Mini Checklist */}
      <div className="panel-surface rounded-[2px] p-2.5 flex flex-col gap-1.5">
        <div className="flex items-center justify-between pb-1 border-b border-border">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">SOP Checklist</span>
          <span className="text-[9px] font-mono text-muted-foreground tabular-nums">STEP 2 OF 7</span>
        </div>
        <div className="flex flex-col gap-1 pt-1 font-mono text-[11px]">
          {/* Step 1: Completed with subtle muted green check */}
          <div className="flex items-center gap-2 p-1.5 rounded-[2px] bg-surface-elevated/30 border border-transparent text-muted-foreground">
            <CheckCircle2 className="w-3.5 h-3.5 text-status-nominal/80 flex-none" />
            <span className="truncate flex-1 text-foreground/70 line-through">01. Pick up reagent vial</span>
            <span className="text-[9px] text-status-nominal/80 font-semibold tabular-nums">DONE</span>
          </div>

          {/* Step 2: Active with 2px cyan left border */}
          <div className="flex items-center gap-2 p-1.5 rounded-[2px] bg-accent/10 border-l-2 border-accent border-y border-r border-accent/30 text-accent">
            <PlayCircle className="w-3.5 h-3.5 flex-none animate-pulse" />
            <span className="truncate flex-1 font-bold text-accent">02. Insert syringe to septum</span>
            <span className="text-[9px] font-bold tracking-wider">ACTIVE</span>
          </div>

          {/* Step 3: Pending dim */}
          <div className="flex items-center gap-2 p-1.5 rounded-[2px] bg-surface-elevated/15 border border-transparent text-muted-foreground/60">
            <Circle className="w-3.5 h-3.5 flex-none text-muted-foreground/40" />
            <span className="truncate flex-1">03. Observe microfluidic chamber</span>
            <span className="text-[9px] text-muted-foreground/50">PEND</span>
          </div>
        </div>
      </div>

      {/* 4. Latest Anomaly Alert Card */}
      <div className="panel-surface rounded-[2px] p-2.5 flex flex-col gap-1.5 border-l-2 border-l-status-warning">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-status-warning uppercase font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-status-warning" />
            LATEST ANOMALY
          </span>
          <span className="text-[9px] font-mono text-muted-foreground tabular-nums">00:02:15 ago</span>
        </div>
        <div className="bg-background/80 p-2 rounded-[2px] border border-status-warning/30 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold text-status-warning">
              OUT_OF_ORDER
            </span>
            <span className="text-[9px] font-mono px-1 py-0.2 bg-status-warning/15 text-status-warning rounded-[2px] font-semibold">
              WARN
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-tight">
            Trigger: <span className="text-foreground font-mono">ACTIVATE_PORT</span> before syringe insertion.
          </p>
        </div>
      </div>

      {/* 5. Telemetry Mini-Summary */}
      <div className="panel-surface rounded-[2px] p-2.5 flex flex-col gap-1.5 mt-auto">
        <div className="flex items-center justify-between pb-1 border-b border-border">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Gauge className="w-3 h-3 text-accent" />
            EDGE TELEMETRY
          </span>
          <span className="text-[9px] font-mono text-status-nominal font-semibold">LIVE</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px] pt-1">
          <div className="bg-background/60 p-1.5 rounded-[2px] border border-border flex flex-col">
            <span className="text-muted-foreground text-[9px]">INFERENCE FPS</span>
            <span className="text-foreground font-bold text-xs text-accent tabular-nums">24.8 fps</span>
          </div>
          <div className="bg-background/60 p-1.5 rounded-[2px] border border-border flex flex-col">
            <span className="text-muted-foreground text-[9px]">FRAME LATENCY</span>
            <span className="text-foreground font-bold text-xs tabular-nums">40.2 ms</span>
          </div>
          <div className="bg-background/60 p-1.5 rounded-[2px] border border-border flex flex-col">
            <span className="text-muted-foreground text-[9px]">GPU VRAM</span>
            <span className="text-foreground font-bold text-xs tabular-nums">4.2 / 8.0 GB</span>
          </div>
          <div className="bg-background/60 p-1.5 rounded-[2px] border border-border flex flex-col">
            <span className="text-muted-foreground text-[9px]">CORE TEMP</span>
            <span className="text-status-nominal font-bold text-xs tabular-nums">58°C</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

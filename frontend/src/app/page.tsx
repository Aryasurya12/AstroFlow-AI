import React from "react";
import Link from "next/link";
import { 
  Activity, 
  Layers, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight, 
  Eye, 
  HardDrive 
} from "lucide-react";

export default function MissionDashboardPage() {
  return (
    <div className="space-y-3 font-sans">
      {/* Page Header / Breadcrumb */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div>
          <h1 className="text-sm font-mono font-bold tracking-wider uppercase text-foreground flex items-center gap-2">
            <span className="w-2 h-2 bg-accent rounded-[2px]" />
            MISSION DASHBOARD · OPERATIONAL OVERVIEW
          </h1>
          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
            Real-time Edge-AI subsystem status, active session summary, and node health
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/live"
            className="flex items-center gap-1.5 px-3 py-1 bg-accent text-background font-mono font-bold text-xs rounded-[2px] hover:bg-accent-hover transition-colors shadow-glow-cyan"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>ENTER LIVE VIEW</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* 6-Panel Operational Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {/* Panel 1: System Status */}
        <div className="panel-surface rounded-[2px] flex flex-col">
          <div className="panel-header px-3 py-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-accent" />
              PANEL 01 · SYSTEM STATUS
            </span>
            <span className="text-status-nominal font-bold">ONLINE</span>
          </div>
          <div className="p-3 space-y-2.5 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Operational Mode</span>
              <span className="font-mono text-xs font-bold text-foreground bg-surface-elevated px-2 py-0.5 rounded-[2px] border border-border">
                AIR-GAPPED · FLIGHT
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Session Uptime</span>
              <span className="font-mono text-xs font-semibold text-accent tabular-nums">00:14:28.450</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Inference Pipeline</span>
              <span className="font-mono text-xs text-status-nominal font-medium tabular-nums">NOMINAL (24.8 FPS)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Local Host Node</span>
              <span className="font-mono text-xs text-muted-foreground">BAS-01-EDGE-01</span>
            </div>
            <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] font-mono">
              <span className="text-muted-foreground">ACTIVE OPERATOR:</span>
              <span className="text-foreground font-bold">Specialist Sharma (CMD-01)</span>
            </div>
          </div>
        </div>

        {/* Panel 2: Active Session */}
        <div className="panel-surface rounded-[2px] flex flex-col">
          <div className="panel-header px-3 py-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-accent" />
              PANEL 02 · ACTIVE SESSION
            </span>
            <span className="text-accent font-bold tabular-nums">SES-8821-A</span>
          </div>
          <div className="p-3 space-y-2.5 flex-1">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Protocol ID</span>
                <span className="font-mono font-semibold text-accent">EXP-04: CRYSTAL_GROWTH</span>
              </div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Step Progress</span>
                <span className="font-mono font-bold text-foreground tabular-nums">Step 2 of 7 (28%)</span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-1.5 bg-surface-elevated rounded-[2px] overflow-hidden border border-border mt-1.5">
                <div className="h-full bg-accent w-[28%] transition-all duration-300" />
              </div>
            </div>
            <div className="pt-2 border-t border-border space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Task:</span>
                <span className="font-mono text-foreground font-medium">Insert syringe into septum</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Safety Interlock:</span>
                <span className="font-mono text-status-nominal font-semibold">ENGAGED</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 3: Edge Node Health */}
        <div className="panel-surface rounded-[2px] flex flex-col">
          <div className="panel-header px-3 py-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-accent" />
              PANEL 03 · EDGE NODE HARDWARE
            </span>
            <span className="text-status-nominal font-bold tabular-nums">TDP: 35W</span>
          </div>
          <div className="p-3 space-y-2 flex-1 font-mono text-xs">
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-muted-foreground">GPU Utilization (Tensor Cores)</span>
                <span className="text-foreground font-semibold tabular-nums">64%</span>
              </div>
              <div className="w-full h-1.5 bg-surface-elevated rounded-[2px] overflow-hidden border border-border">
                <div className="h-full bg-accent w-[64%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-muted-foreground">VRAM Buffer (Unified)</span>
                <span className="text-foreground font-semibold tabular-nums">4.2 / 8.0 GB (52%)</span>
              </div>
              <div className="w-full h-1.5 bg-surface-elevated rounded-[2px] overflow-hidden border border-border">
                <div className="h-full bg-accent/80 w-[52%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-muted-foreground">CPU Core Load</span>
                <span className="text-foreground font-semibold tabular-nums">28% (8 Cores)</span>
              </div>
              <div className="w-full h-1.5 bg-surface-elevated rounded-[2px] overflow-hidden border border-border">
                <div className="h-full bg-status-nominal w-[28%]" />
              </div>
            </div>
            <div className="pt-1.5 border-t border-border flex justify-between text-[11px]">
              <span className="text-muted-foreground">SoC Die Temp:</span>
              <span className="text-status-nominal font-bold tabular-nums">58.4°C (Nominal &lt; 85°C)</span>
            </div>
          </div>
        </div>

        {/* Panel 4: Protocol Compliance */}
        <div className="panel-surface rounded-[2px] flex flex-col">
          <div className="panel-header px-3 py-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-accent" />
              PANEL 04 · PROTOCOL COMPLIANCE
            </span>
            <span className="text-status-warning font-bold">1 ANOMALY</span>
          </div>
          <div className="p-3 space-y-2.5 flex-1">
            <div className="grid grid-cols-2 gap-2 text-center font-mono">
              <div className="bg-background/60 p-2 border border-border rounded-[2px]">
                <div className="text-[10px] text-muted-foreground">COMPLETED STEPS</div>
                <div className="text-lg font-bold text-status-nominal tabular-nums">1 / 7</div>
              </div>
              <div className="bg-background/60 p-2 border border-border rounded-[2px]">
                <div className="text-[10px] text-muted-foreground">ACTIVE DEVIATIONS</div>
                <div className="text-lg font-bold text-status-warning tabular-nums">01</div>
              </div>
            </div>
            <div className="p-2 bg-status-warning/10 border border-status-warning/30 rounded-[2px] text-xs font-mono">
              <div className="flex items-center gap-1.5 text-status-warning font-semibold text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>OUT_OF_ORDER DETECTED</span>
              </div>
              <div className="text-muted-foreground text-[10px] mt-0.5 tabular-nums">
                Timestamp: 12:15:52 UTC (Step 02) · Operator attempted valve release prior to needle seated.
              </div>
            </div>
          </div>
        </div>

        {/* Panel 5: AI Subsystem Capabilities */}
        <div className="panel-surface rounded-[2px] flex flex-col">
          <div className="panel-header px-3 py-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3 h-3 text-accent" />
              PANEL 05 · SYSTEM CAPABILITIES
            </span>
            <span className="text-accent font-bold tabular-nums">6 / 6 ONLINE</span>
          </div>
          <div className="p-3 grid grid-cols-2 gap-2 flex-1 font-mono text-[11px]">
            <div className="flex items-center gap-2 p-1.5 bg-background/50 border border-border rounded-[2px]">
              <span className="w-2 h-2 rounded-full bg-status-nominal status-indicator-pulse" />
              <span className="text-foreground">Object Det (YOLO)</span>
            </div>
            <div className="flex items-center gap-2 p-1.5 bg-background/50 border border-border rounded-[2px]">
              <span className="w-2 h-2 rounded-full bg-status-nominal status-indicator-pulse" />
              <span className="text-foreground">Pose (MediaPipe)</span>
            </div>
            <div className="flex items-center gap-2 p-1.5 bg-background/50 border border-border rounded-[2px]">
              <span className="w-2 h-2 rounded-full bg-status-nominal status-indicator-pulse" />
              <span className="text-foreground">HOI Interaction</span>
            </div>
            <div className="flex items-center gap-2 p-1.5 bg-background/50 border border-border rounded-[2px]">
              <span className="w-2 h-2 rounded-full bg-status-nominal status-indicator-pulse" />
              <span className="text-foreground">FSM State Engine</span>
            </div>
            <div className="flex items-center gap-2 p-1.5 bg-background/50 border border-border rounded-[2px]">
              <span className="w-2 h-2 rounded-full bg-status-nominal status-indicator-pulse" />
              <span className="text-foreground">Voice · Audio TTS</span>
            </div>
            <div className="flex items-center gap-2 p-1.5 bg-background/50 border border-border rounded-[2px]">
              <span className="w-2 h-2 rounded-full bg-status-nominal status-indicator-pulse" />
              <span className="text-foreground">Flash Archive Log</span>
            </div>
          </div>
        </div>

        {/* Panel 6: Recent Events Log Preview */}
        <div className="panel-surface rounded-[2px] flex flex-col">
          <div className="panel-header px-3 py-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              PANEL 06 · RECENT CRITICAL EVENTS
            </span>
            <Link href="/logs" className="text-accent hover:underline font-mono text-[10px]">
              VIEW ALL &gt;
            </Link>
          </div>
          <div className="p-2 space-y-1 flex-1 font-mono text-[10px]">
            <div className="p-1 rounded-[2px] bg-surface-elevated/40 border border-border flex items-center justify-between">
              <span className="text-status-nominal font-semibold tabular-nums">[12:15:34] STEP_01 OK</span>
              <span className="text-muted-foreground truncate ml-2">PICK_UP_VIAL verified (0.94)</span>
            </div>
            <div className="p-1 rounded-[2px] bg-status-warning/15 border border-status-warning/40 flex items-center justify-between">
              <span className="text-status-warning font-semibold tabular-nums">[12:15:52] ANOMALY</span>
              <span className="text-muted-foreground truncate ml-2">OUT_OF_ORDER: ACTIVATE_PORT</span>
            </div>
            <div className="p-1 rounded-[2px] bg-surface-elevated/40 border border-border flex items-center justify-between">
              <span className="text-accent font-semibold tabular-nums">[12:16:01] TTS PROMPT</span>
              <span className="text-muted-foreground truncate ml-2">Warning dispatch broadcast</span>
            </div>
            <div className="p-1 rounded-[2px] bg-surface-elevated/40 border border-border flex items-center justify-between">
              <span className="text-foreground/80 font-semibold tabular-nums">[12:16:05] HOI DETECT</span>
              <span className="text-muted-foreground truncate ml-2">hand HOLDING vial (0.91)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

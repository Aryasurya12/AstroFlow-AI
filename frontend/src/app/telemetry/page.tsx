import React from "react";
import { Zap } from "lucide-react";

export default function TelemetryPage() {
  return (
    <div className="space-y-3 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div>
          <h1 className="text-sm font-mono font-bold tracking-wider uppercase text-foreground flex items-center gap-2">
            <span className="w-2 h-2 bg-accent rounded-[2px]" />
            EDGE-AI TELEMETRY & SYSTEM HEALTH MONITOR
          </h1>
          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
            Real-time Edge-AI inference pipeline metrics and latency budget telemetry
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2 py-0.5 rounded-[2px] bg-status-nominal/15 border border-status-nominal/40 text-status-nominal">
            TELEMETRY POLLING: 100ms
          </span>
        </div>
      </div>

      {/* Section 01: Real-Time Inference Performance */}
      <div className="panel-surface rounded-[2px] p-3.5 border border-border">
        <div className="panel-header px-1 pb-2 mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-accent" />
            SECTION 01 · REAL-TIME INFERENCE PERFORMANCE
          </span>
          <span className="text-status-nominal font-mono">TARGET &gt; 20 FPS (PASS)</span>
        </div>

        {/* 4 KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-background/80 p-3 rounded-[2px] border border-border">
            <span className="text-[10px] font-mono text-muted-foreground block">INFERENCE FPS</span>
            <div className="text-2xl font-mono font-bold text-accent mt-1 tabular-nums">24.8</div>
            <span className="text-[10px] font-mono text-status-nominal">Nominal (30 fps capture)</span>
          </div>

          <div className="bg-background/80 p-3 rounded-[2px] border border-border">
            <span className="text-[10px] font-mono text-muted-foreground block">TOTAL FRAME LATENCY</span>
            <div className="text-2xl font-mono font-bold text-foreground mt-1 tabular-nums">
              40.2 <span className="text-xs font-normal text-muted-foreground">ms</span>
            </div>
            <span className="text-[10px] font-mono text-accent">Budget: 50.0 ms max</span>
          </div>

          <div className="bg-background/80 p-3 rounded-[2px] border border-border">
            <span className="text-[10px] font-mono text-muted-foreground block">FRAME DROP RATE</span>
            <div className="text-2xl font-mono font-bold text-status-nominal mt-1 tabular-nums">0.00%</div>
            <span className="text-[10px] font-mono text-muted-foreground tabular-nums">0 dropped of 25,920</span>
          </div>

          <div className="bg-background/80 p-3 rounded-[2px] border border-border">
            <span className="text-[10px] font-mono text-muted-foreground block">TENSORRT PRECISION</span>
            <div className="text-xl font-mono font-bold text-foreground mt-1">FP16 CUDA</div>
            <span className="text-[10px] font-mono text-status-nominal">Hardware Accelerated</span>
          </div>
        </div>

        {/* Latency Breakdown Bar */}
        <div className="mt-4 pt-3.5 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-muted-foreground block">
              FRAME PIPELINE LATENCY BUDGET BREAKDOWN (Total: 40.2 ms)
            </span>
            <span className="text-[10px] font-mono text-status-nominal tabular-nums">
              80.4% OF 50ms BUDGET
            </span>
          </div>
          <div className="w-full h-3.5 rounded-[2px] overflow-hidden flex border border-border font-mono text-[9px] text-background font-bold text-center leading-[14px] tabular-nums">
            <div className="bg-accent w-[45%]" title="YOLO Detection: 18.4ms">DET 18.4ms</div>
            <div className="bg-status-nominal w-[30%]" title="MediaPipe Pose: 12.1ms">POSE 12.1ms</div>
            <div className="bg-status-warning w-[18%]" title="HOI Engine: 7.5ms">HOI 7.5ms</div>
            <div className="bg-status-muted w-[7%]" title="FSM Eval: 2.2ms">FSM 2.2ms</div>
          </div>
          <div className="flex flex-wrap gap-4 text-[10px] font-mono mt-2.5 text-muted-foreground tabular-nums">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-accent rounded-[2px]" /> YOLO Detection: 18.4 ms
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-status-nominal rounded-[2px]" /> Pose Estimation: 12.1 ms
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-status-warning rounded-[2px]" /> HOI Interaction: 7.5 ms
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-status-muted rounded-[2px]" /> FSM Rule Engine: 2.2 ms
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { 
  Radio, 
  CircleDot, 
  Layers 
} from "lucide-react";

export function TopStatusBar() {
  const [utcTime, setUtcTime] = useState<string>("----/--/-- --:--:-- UTC");
  const [recElapsed, setRecElapsed] = useState<string>("00:14:28");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const iso = now.toISOString().replace("T", " ").replace(/\..+/, "") + " UTC";
      setUtcTime(iso);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-12 flex-none bg-surface border-b border-border px-3.5 flex items-center justify-between select-none z-30 text-xs">
      {/* Left: Brand Identity & Station Context */}
      <div className="flex items-center gap-3">
        {/* Logo & Name */}
        <div className="flex items-center gap-2 pr-3 border-r border-border">
          <div className="w-5 h-5 bg-accent/15 border border-accent/70 flex items-center justify-center rounded-[2px] text-accent">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-wider text-sm text-foreground flex items-center gap-1 leading-none">
              ASTROFLOW<span className="text-accent">·AI</span>
            </span>
            <span className="text-[9px] text-muted-foreground font-mono leading-none tracking-wider mt-0.5">
              EDGE COPILOT
            </span>
          </div>
        </div>

        {/* Node: BAS-01 */}
        <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-surface-elevated/80 border border-border text-[11px] font-mono">
          <Layers className="w-3 h-3 text-accent" />
          <span className="text-muted-foreground">NODE:</span>
          <span className="text-foreground font-semibold">BAS-01</span>
        </div>

        <span className="text-border hidden md:inline">|</span>

        {/* Session ID */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-surface-elevated/60 border border-border font-mono text-[11px]">
          <span className="text-muted-foreground">SESSION:</span>
          <span className="text-accent font-semibold tracking-wide tabular-nums">SES-8821-A</span>
        </div>

        <span className="text-border hidden lg:inline">|</span>

        {/* Active Protocol */}
        <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-surface-elevated/60 border border-border font-mono text-[11px]">
          <span className="text-muted-foreground">PROTOCOL:</span>
          <span className="text-foreground font-medium">EXP-04: CRYSTAL_GROWTH_V2</span>
        </div>
      </div>

      {/* Center: System Status Badge */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1 rounded-[2px] bg-status-nominal/15 border border-status-nominal/50 text-status-nominal font-mono font-bold tracking-wider text-[11px]">
          <span className="w-2 h-2 rounded-full bg-status-nominal status-indicator-pulse" />
          <span>RUNNING · NOMINAL</span>
        </div>
      </div>

      {/* Right: REC Indicator & UTC Live Clock */}
      <div className="flex items-center gap-3 font-mono">
        {/* REC Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-[2px] bg-status-critical/15 border border-status-critical/40 text-status-critical text-[11px]">
          <CircleDot className="w-3 h-3 text-status-critical animate-pulse" />
          <span className="font-bold tracking-wider">REC</span>
          <span className="text-muted-foreground text-[10px] tabular-nums">{recElapsed}</span>
        </div>

        <span className="text-border">|</span>

        {/* UTC Clock */}
        <div className="px-2.5 py-0.5 text-[11px] text-foreground bg-surface-elevated/70 border border-border rounded-[2px] tracking-wider tabular-nums font-mono">
          {utcTime}
        </div>
      </div>
    </header>
  );
}

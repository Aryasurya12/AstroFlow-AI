import React from "react";
import { 
  CircleDot, 
  AlertTriangle, 
  Crosshair, 
  Maximize2, 
  Camera, 
  Volume2 
} from "lucide-react";

export default function LiveViewPage() {
  return (
    <div className="space-y-3 font-sans h-full flex flex-col">
      {/* Screen Title & Controls Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-border flex-none">
        <div>
          <h1 className="text-sm font-mono font-bold tracking-wider uppercase text-foreground flex items-center gap-2">
            <span className="w-2 h-2 bg-status-nominal rounded-[2px] status-indicator-pulse" />
            LIVE VIDEO & HUMAN ACTION RECOGNITION (HAR) VIEWPORT
          </h1>
          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
            Real-time MJPEG camera stream with AI inference overlays (YOLOv8 · MediaPipe · HOI Engine)
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2 py-0.5 bg-surface-elevated border border-border text-muted-foreground rounded-[2px]">
            SOURCE: /dev/video0 (1080p)
          </span>
          <button className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-elevated hover:bg-surface border border-border rounded-[2px] text-foreground transition-colors">
            <Maximize2 className="w-3.5 h-3.5" />
            <span>EXPAND HUD</span>
          </button>
        </div>
      </div>

      {/* Main Video & Overlay Viewport Container with Corner Brackets */}
      <div className="flex-1 min-h-[380px] relative panel-surface rounded-[2px] overflow-hidden flex flex-col bg-black/95 border border-border corner-bracket-container">
        {/* Technical Corner Brackets */}
        <span className="corner-bracket corner-bracket-tl" />
        <span className="corner-bracket corner-bracket-tr" />
        <span className="corner-bracket corner-bracket-bl" />
        <span className="corner-bracket corner-bracket-br" />

        {/* Top Video HUD Strip */}
        <div className="absolute top-0 inset-x-0 h-9 bg-gradient-to-b from-background/95 via-background/60 to-transparent p-2.5 flex items-center justify-between z-20 font-mono text-[11px]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-status-critical/20 border border-status-critical/50 text-status-critical">
              <CircleDot className="w-3 h-3 text-status-critical animate-pulse" />
              <span className="font-bold tracking-wider">REC</span>
              <span className="text-muted-foreground tabular-nums">00:14:28</span>
            </div>
            <span className="text-muted-foreground">1920×1080 @ 30fps</span>
          </div>

          <div className="flex items-center gap-3 text-muted-foreground tabular-nums">
            <div>
              <span className="text-muted-foreground">FPS:</span>{" "}
              <span className="text-status-nominal font-bold">24.8</span>
            </div>
            <div>
              <span className="text-muted-foreground">LATENCY:</span>{" "}
              <span className="text-accent font-bold">40.2ms</span>
            </div>
            <div>
              <span className="text-muted-foreground">JITTER:</span>{" "}
              <span className="text-foreground">±1.4ms</span>
            </div>
          </div>
        </div>

        {/* Video Canvas & Optical Calibration Rig Grid */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden optical-grid">
          {/* Calibrated Optical Rig Axis Reticle Lines */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Horizontal center axis */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-accent/20" />
            {/* Vertical center axis */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-accent/20" />

            {/* Calibrated Optical Coordinate Marks */}
            <div className="absolute top-10 left-3 font-mono text-[9px] text-muted-foreground/70 select-none">
              + [X: 0000 Y: 0000] · OPTICAL AXIS CALIBRATED
            </div>
            <div className="absolute top-10 right-3 font-mono text-[9px] text-muted-foreground/70 select-none">
              FOV: 84.2° · GMSL2 CSI-2
            </div>
            <div className="absolute bottom-12 right-3 font-mono text-[9px] text-muted-foreground/70 select-none tabular-nums">
              [X: 1920 Y: 1080] · EXPOSURE: 1/120s
            </div>
          </div>

          {/* Center Target Reticle */}
          <div className="relative pointer-events-none">
            <Crosshair className="w-10 h-10 text-accent/30" />
            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] font-mono text-accent/50 tracking-widest">
              [0,0]
            </span>
          </div>

          {/* SIMULATED OVERLAYS */}
          {/* 1. Operator Bounding Box (Cyan) */}
          <div className="absolute left-[12%] top-[15%] w-[42%] h-[72%] border border-accent/70 rounded-[2px] pointer-events-none">
            <span className="absolute -top-5 left-0 px-1.5 py-0.2 bg-accent text-background font-mono text-[9px] font-bold uppercase rounded-t-[2px]">
              OPERATOR · SHARMA [0.96]
            </span>
          </div>

          {/* 2. Reagent Vial Bounding Box (Green - Active HOI) */}
          <div className="absolute right-[28%] top-[42%] w-[16%] h-[24%] border-2 border-status-nominal rounded-[2px] pointer-events-none shadow-glow-green">
            <span className="absolute -top-5 left-0 px-1.5 py-0.2 bg-status-nominal text-background font-mono text-[9px] font-bold uppercase rounded-t-[2px]">
              VIAL · REAGENT_A [0.91]
            </span>
            <span className="absolute -bottom-4 right-0 font-mono text-[8px] text-status-nominal font-bold bg-background/90 px-1">
              HOI: HOLDING (0.88)
            </span>
          </div>

          {/* 3. Syringe Bounding Box (Teal - Inactive/Target) */}
          <div className="absolute right-[12%] top-[48%] w-[12%] h-[18%] border border-accent/60 rounded-[2px] pointer-events-none">
            <span className="absolute -top-5 left-0 px-1.5 py-0.2 bg-accent/30 text-accent font-mono text-[9px] font-bold uppercase rounded-t-[2px] border border-accent/40">
              SYRINGE_10ML [0.84]
            </span>
          </div>

          {/* 4. Hand Skeleton Keypoints Simulation (21-pts) */}
          <div className="absolute right-[33%] top-[47%] w-24 h-24 pointer-events-none">
            <svg className="w-full h-full text-status-nominal/80" viewBox="0 0 100 100">
              <line x1="50" y1="85" x2="30" y2="55" stroke="currentColor" strokeWidth="1.5" />
              <line x1="50" y1="85" x2="48" y2="45" stroke="currentColor" strokeWidth="1.5" />
              <line x1="50" y1="85" x2="68" y2="50" stroke="currentColor" strokeWidth="1.5" />
              <line x1="48" y1="45" x2="52" y2="25" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="50" cy="85" r="3" fill="#17c7ce" />
              <circle cx="30" cy="55" r="2.5" fill="#29a35a" />
              <circle cx="48" cy="45" r="2.5" fill="#29a35a" />
              <circle cx="68" cy="50" r="2.5" fill="#29a35a" />
              <circle cx="52" cy="25" r="2.5" fill="#29a35a" />
            </svg>
          </div>

          {/* Interactive HOI Vector Wireframe */}
          <div className="absolute right-[31%] top-[40%] font-mono text-[9px] text-accent bg-background/95 px-2 py-0.5 border border-accent/40 rounded-[2px] shadow-md">
            HAND ──► HOLDING ──► VIAL
          </div>

          {/* Overlay Message: Stream Source Placeholder Notice */}
          <div className="text-center select-none opacity-40 hover:opacity-80 transition-opacity">
            <Camera className="w-10 h-10 mx-auto text-muted-foreground mb-1" />
            <span className="font-mono text-xs text-muted-foreground block">
              CAMERA FEED HARDWARE VIEWPORT
            </span>
            <span className="font-mono text-[10px] text-muted-foreground/80">
              Live MJPEG socket: http://localhost:8000/api/video/feed
            </span>
          </div>

          {/* Overlay FSM State HUD (Bottom-Left of Video) */}
          <div className="absolute bottom-3 left-3 bg-surface/90 border border-accent/60 p-2.5 rounded-[2px] font-mono text-xs shadow-glow-cyan z-20 backdrop-blur-xs">
            <div className="text-[10px] text-muted-foreground uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              FSM STATE HUD
            </div>
            <div className="font-bold text-accent text-sm mt-0.5">
              STEP_02_READY
            </div>
            <div className="text-[10px] text-foreground/90 mt-0.5">
              EXPECTING: <span className="text-status-warning font-semibold">INSERT_SYRINGE</span>
            </div>
          </div>
        </div>

        {/* Bottom Anomaly Banner Overlay */}
        <div className="h-8 bg-status-warning/20 border-t border-status-warning/50 px-3 flex items-center justify-between text-xs font-mono z-20">
          <div className="flex items-center gap-2 text-status-warning font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>ANOMALY DETECTED: OUT_OF_ORDER (Action ACTIVATE_PORT before INSERT_SYRINGE)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">AUTO-VOICE RECOVERY DISPATCHED</span>
            <Volume2 className="w-3.5 h-3.5 text-accent animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

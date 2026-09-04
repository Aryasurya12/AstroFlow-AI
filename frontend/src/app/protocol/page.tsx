import React from "react";
import { 
  ClipboardList, 
  CheckCircle2, 
  PlayCircle, 
  Circle, 
  Layers 
} from "lucide-react";

interface StepItem {
  id: string;
  stepNumber: string;
  title: string;
  expectedAction: string;
  targetObject: string;
  durationEst: string;
  status: "COMPLETE" | "IN_PROGRESS" | "PENDING" | "ANOMALY";
  notes: string;
}

const STEPS: StepItem[] = [
  {
    id: "step-1",
    stepNumber: "01",
    title: "Pick up reagent vial",
    expectedAction: "PICK_UP_VIAL",
    targetObject: "REAGENT_VIAL_A",
    durationEst: "00:30",
    status: "COMPLETE",
    notes: "Verified at 12:15:34 UTC. Hand-object interaction confirmed (conf: 0.94).",
  },
  {
    id: "step-2",
    stepNumber: "02",
    title: "Insert syringe into septum",
    expectedAction: "INSERT_SYRINGE",
    targetObject: "SYRINGE_10ML + VIAL",
    durationEst: "01:15",
    status: "IN_PROGRESS",
    notes: "Active step. Operator holding syringe near septum port. Warning: premature valve turn flagged.",
  },
  {
    id: "step-3",
    stepNumber: "03",
    title: "Observe microfluidic chamber",
    expectedAction: "OBSERVE_CHAMBER",
    targetObject: "CHAMBER_WINDOW",
    durationEst: "03:00",
    status: "PENDING",
    notes: "Awaiting fluid transfer confirmation from step 02.",
  },
  {
    id: "step-4",
    stepNumber: "04",
    title: "Withdraw syringe carefully",
    expectedAction: "WITHDRAW_SYRINGE",
    targetObject: "SYRINGE_10ML",
    durationEst: "00:45",
    status: "PENDING",
    notes: "Must maintain vertical alignment to prevent needle deflection.",
  },
  {
    id: "step-5",
    stepNumber: "05",
    title: "Seal vial with protective cap",
    expectedAction: "SEAL_VIAL",
    targetObject: "CAP_TEFLON",
    durationEst: "00:40",
    status: "PENDING",
    notes: "Verify airtight mechanical click feedback.",
  },
  {
    id: "step-6",
    stepNumber: "06",
    title: "Return sealed vial to cold rack",
    expectedAction: "RETURN_TO_RACK",
    targetObject: "COLD_RACK_SLOT_04",
    durationEst: "00:30",
    status: "PENDING",
    notes: "Cold storage partition maintained at 4.0°C.",
  },
  {
    id: "step-7",
    stepNumber: "07",
    title: "Protocol complete & latch door",
    expectedAction: "LATCH_DOOR",
    targetObject: "GLOVEBOX_LATCH",
    durationEst: "00:20",
    status: "PENDING",
    notes: "Trigger final audit write to telemetry archive.",
  },
];

export default function ProtocolPage() {
  return (
    <div className="space-y-3 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div>
          <h1 className="text-sm font-mono font-bold tracking-wider uppercase text-foreground flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-accent" />
            PROTOCOL & STANDARD OPERATING PROCEDURE (SOP) EXECUTION VIEW
          </h1>
          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
            Sequential Finite State Machine (FSM) validation matrix & real-time compliance tracker
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2 py-0.5 bg-surface-elevated border border-border text-foreground rounded-[2px]">
            VERSION: 2.1.0-FLIGHT
          </span>
          <span className="px-2 py-0.5 bg-accent/20 border border-accent/50 text-accent rounded-[2px] font-bold">
            FSM ENGINE ACTIVE
          </span>
        </div>
      </div>

      {/* Protocol Summary Card */}
      <div className="panel-surface rounded-[2px] p-3 font-mono">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-muted-foreground block">ACTIVE PROTOCOL</span>
            <span className="font-bold text-foreground text-sm">EXP-04: CRYSTAL_GROWTH_V2</span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block">SESSION ID</span>
            <span className="text-accent font-semibold tabular-nums">SES-8821-A (BHARATIYA ANTARIKSH)</span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block">OVERALL PROGRESS</span>
            <span className="text-status-nominal font-bold tabular-nums">1 / 7 STEPS COMPLETE (28%)</span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block">SAFETY COMPLIANCE</span>
            <span className="text-status-warning font-bold">1 RECOVERABLE ANOMALY</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="w-full h-1.5 bg-surface-elevated rounded-[2px] overflow-hidden border border-border">
            <div className="h-full bg-accent w-[28%]" />
          </div>
        </div>
      </div>

      {/* Step Sequence Table / Card List */}
      <div className="panel-surface rounded-[2px] overflow-hidden">
        <div className="panel-header px-3 py-2 flex items-center justify-between">
          <span>SOP STEP EXECUTION SEQUENCE · FSM TRANSITION MATRIX</span>
          <span className="text-[10px] text-muted-foreground tabular-nums">EST TOTAL: 07:00</span>
        </div>

        <div className="divide-y divide-border font-mono text-xs">
          {STEPS.map((step) => {
            const isComplete = step.status === "COMPLETE";
            const isInProgress = step.status === "IN_PROGRESS";
            const isPending = step.status === "PENDING";

            return (
              <div
                key={step.id}
                className={`p-3 transition-colors ${
                  isInProgress
                    ? "bg-accent/10 border-l-2 border-l-accent"
                    : isComplete
                    ? "bg-surface/50 border-l-2 border-l-status-nominal/80"
                    : "hover:bg-surface-elevated/40 border-l-2 border-l-transparent"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {/* Status Icon */}
                    {isComplete && (
                      <CheckCircle2 className="w-4 h-4 text-status-nominal/80 shrink-0" />
                    )}
                    {isInProgress && (
                      <PlayCircle className="w-4 h-4 text-accent shrink-0 animate-pulse" />
                    )}
                    {isPending && (
                      <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-muted-foreground tabular-nums">STEP {step.stepNumber}</span>
                        <span className="text-foreground font-semibold text-sm">
                          {step.title}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        TRIGGER: <span className="text-accent">{step.expectedAction}</span> · TARGET:{" "}
                        <span className="text-foreground">{step.targetObject}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      EST: {step.durationEst}
                    </span>

                    {isComplete && (
                      <span className="px-2 py-0.5 rounded-[2px] bg-status-nominal/15 border border-status-nominal/40 text-status-nominal/90 font-bold text-[10px]">
                        COMPLETED
                      </span>
                    )}
                    {isInProgress && (
                      <span className="px-2 py-0.5 rounded-[2px] bg-accent/20 border border-accent/60 text-accent font-bold text-[10px] animate-pulse">
                        IN PROGRESS
                      </span>
                    )}
                    {isPending && (
                      <span className="px-2 py-0.5 rounded-[2px] bg-surface-elevated border border-border text-muted-foreground/60 text-[10px]">
                        PENDING
                      </span>
                    )}
                  </div>
                </div>

                {/* Sub-note / Audit context */}
                <div className="mt-2 text-[11px] text-muted-foreground pl-7">
                  {step.notes}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

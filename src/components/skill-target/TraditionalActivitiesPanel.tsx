import { useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Check,
  MoreHorizontal,
  FileText,
  BookOpen,
  MessageSquare,
  ClipboardCheck,
  Lock,
} from "lucide-react";
import type { StepItem, StepType } from "@/types/learning";
import { cn } from "@/lib/utils";

interface TraditionalActivitiesPanelProps {
  steps: StepItem[];
  skillTargetTitle: string;
  onActivityClick: (step: StepItem) => void;
  activeStepId?: string;
}

const typeLabels: Record<StepType, string> = {
  assessment: "SCORM",
  role_play: "Role Play",
  module: "PDF",
};

const typeIcons: Record<StepType, React.ElementType> = {
  assessment: ClipboardCheck,
  role_play: MessageSquare,
  module: FileText,
};

export function TraditionalActivitiesPanel({
  steps,
  skillTargetTitle,
  onActivityClick,
  activeStepId,
}: TraditionalActivitiesPanelProps) {
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const sorted = [...steps].sort((a, b) => a.order - b.order);
  const completedCount = sorted.filter((s) => s.status === "completed").length;
  const rolePlayCompleted = sorted.filter(
    (s) => s.type === "role_play" && s.status === "completed"
  ).length;

  // Find the "up next" step
  const upNextStep = sorted.find(
    (s) => s.status === "available" || s.status === "in_progress"
  );

  // Filter steps
  const filtered = sorted.filter((s) => {
    if (statusFilter !== "All") {
      if (statusFilter === "Completed" && s.status !== "completed") return false;
      if (statusFilter === "In Progress" && s.status !== "in_progress") return false;
      if (statusFilter === "Locked" && s.status !== "locked") return false;
    }
    if (typeFilter !== "All") {
      if (typeFilter === "Module" && s.type !== "module") return false;
      if (typeFilter === "Assessment" && s.type !== "assessment") return false;
      if (typeFilter === "Role Play" && s.type !== "role_play") return false;
    }
    return true;
  });

  // Initials from title
  const initials = skillTargetTitle
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Learning space summary */}
      <div className="border-b border-border">
        <button
          onClick={() => setSummaryOpen(!summaryOpen)}
          className="flex items-center justify-between w-full px-5 py-4 text-sm font-semibold text-foreground hover:bg-muted/30 transition-colors"
        >
          <span>Learning space summary</span>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-muted-foreground" />
            {summaryOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </button>

        {summaryOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="px-5 pb-5"
          >
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Content completed</p>
                <p className="text-2xl font-bold text-foreground">{completedCount}</p>
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Role play completed</p>
                <p className="text-2xl font-bold text-foreground">{rolePlayCompleted}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                {initials}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Activities header */}
      <div className="px-5 pt-4 pb-3">
        <h3 className="text-base font-semibold text-foreground mb-3">
          Activities ({sorted.length})
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-muted/50 border border-border rounded-md px-2 py-1.5 text-foreground outline-none"
            >
              <option>All</option>
              <option>Completed</option>
              <option>In Progress</option>
              <option>Locked</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Type</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs bg-muted/50 border border-border rounded-md px-2 py-1.5 text-foreground outline-none"
            >
              <option>All</option>
              <option>Module</option>
              <option>Assessment</option>
              <option>Role Play</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activities list */}
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <div className="flex flex-col">
          {filtered.map((step, i) => {
            const Icon = typeIcons[step.type];
            const isCompleted = step.status === "completed";
            const isUpNext = step.id === upNextStep?.id;
            const isActive = step.id === activeStepId;
            const isLocked = step.status === "locked";
            const isClickable = !isLocked;

            return (
              <div key={step.id} className="flex gap-3 relative">
                {/* Vertical timeline line */}
                <div className="flex flex-col items-center">
                  {/* Icon circle */}
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors z-10",
                      isCompleted
                        ? "bg-primary border-primary text-primary-foreground"
                        : isUpNext
                        ? "bg-primary/15 border-primary text-primary"
                        : isLocked
                        ? "bg-muted border-border text-muted-foreground"
                        : "bg-card border-border text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : isLocked ? (
                      <Lock className="h-3.5 w-3.5" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  {/* Connecting line */}
                  {i < filtered.length - 1 && (
                    <div
                      className={cn(
                        "w-0.5 flex-1 min-h-[16px]",
                        isCompleted ? "bg-primary/40" : "bg-border"
                      )}
                    />
                  )}
                </div>

                {/* Content */}
                <div
                  className={cn(
                    "flex-1 pb-4 min-w-0",
                    isClickable && "cursor-pointer"
                  )}
                  onClick={() => isClickable && onActivityClick(step)}
                >
                  {isUpNext && (
                    <span className="inline-block text-[10px] font-medium border border-border rounded-full px-2 py-0.5 text-muted-foreground mb-1.5">
                      Up next
                    </span>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <h4
                      className={cn(
                        "text-sm font-medium leading-snug",
                        isActive ? "text-primary" : "text-foreground",
                        isLocked && "text-muted-foreground"
                      )}
                    >
                      {step.title}
                    </h4>
                    {isClickable && (
                      <button
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {typeLabels[step.type]}
                    {step.duration && ` | ${step.duration}`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

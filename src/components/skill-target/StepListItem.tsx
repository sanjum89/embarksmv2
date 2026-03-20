import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ClipboardCheck,
  BookOpen,
  MessageSquare,
  Lock,
  Check,
  SkipForward,
  Clock,
} from "lucide-react";
import type { StepItem, StepType } from "@/types/learning";
import { cn } from "@/lib/utils";

const stepTypeIcons: Record<string, React.ElementType> = {
  assessment: ClipboardCheck,
  role_play: MessageSquare,
  module: BookOpen,
};

const stepTypeRoutes: Record<StepType, string> = {
  assessment: "assessment",
  role_play: "role-play",
  module: "module",
};

interface StepListItemProps {
  step: StepItem;
  index: number;
  skillTargetId: string;
  isLast: boolean;
  showAccentLine?: boolean;
}

export function StepListItem({ step, index, skillTargetId, isLast, showAccentLine }: StepListItemProps) {
  const TypeIcon = stepTypeIcons[step.type];
  const isClickable = step.status === "available" || step.status === "in_progress" || step.status === "completed" || step.status === "skipped";
  const routeSegment = stepTypeRoutes[step.type];
  const href = `/skill-target/${skillTargetId}/${routeSegment}/${step.referenceId}`;

  const statusIndicator = () => {
    switch (step.status) {
      case "completed":
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/15 text-success ring-2 ring-success/30">
            <Check className="h-4 w-4" />
          </div>
        );
      case "in_progress":
        return (
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-info/15 text-info ring-2 ring-info/30">
            <TypeIcon className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-info animate-pulse" />
          </div>
        );
      case "available":
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-accent ring-2 ring-accent/30">
            <TypeIcon className="h-4 w-4" />
          </div>
        );
      case "skipped":
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/15 text-success ring-2 ring-success/30">
            <Check className="h-4 w-4" />
          </div>
        );
      case "locked":
      default:
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground ring-2 ring-border">
            <Lock className="h-3.5 w-3.5" />
          </div>
        );
    }
  };

  const content = (
    <div
      className={cn(
        "group relative flex gap-4 rounded-xl border p-4 transition-all duration-200",
        step.status === "completed" && "border-success/20 bg-success/5",
        step.status === "in_progress" && "border-info/30 bg-info/5 shadow-sm",
        step.status === "available" && "border-accent/20 bg-card hover:border-accent/40 hover:shadow-md cursor-pointer",
        step.status === "skipped" && "border-success/20 bg-success/5",
        step.status === "locked" && "border-border bg-muted/20 opacity-60"
      )}
    >
      {/* Step number + icon */}
      <div className="flex flex-col items-center gap-1">
        {statusIndicator()}
        <span className="text-[10px] font-medium text-muted-foreground">
          {step.order}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4
            className={cn(
              "text-sm font-semibold",
              step.status === "skipped" && "text-foreground",
              step.status === "locked" && "text-muted-foreground",
              step.status === "completed" && "text-foreground",
              step.status === "in_progress" && "text-foreground",
              step.status === "available" && "text-foreground group-hover:text-accent"
            )}
          >
            {step.title}
          </h4>
          {step.duration && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
              <Clock className="h-3 w-3" />
              {step.duration}
            </span>
          )}
        </div>
        <p className={cn(
          "mt-0.5 text-xs",
          step.status === "locked" ? "text-muted-foreground/60" : "text-muted-foreground"
        )}>
          {step.description}
        </p>

        {/* Badges */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className={cn(
            "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium capitalize",
            "bg-secondary text-muted-foreground"
          )}>
            <TypeIcon className="h-3 w-3" />
            {step.type.replace("_", " ")}
          </span>
          {step.status === "skipped" && (
            <span className="inline-flex items-center gap-1 rounded-md bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
              <Check className="h-3 w-3" />
              Passed via assessment
            </span>
          )}
          {step.skippable && step.skipCondition && step.status !== "skipped" && (
            <span className="inline-flex items-center gap-1 rounded-md bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning">
              <SkipForward className="h-3 w-3" />
              {step.skipCondition}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-start">
      <motion.div
        className="w-full"
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.08, duration: 0.35, ease: "easeOut" }}
      >
        {isClickable ? (
          <Link to={href}>{content}</Link>
        ) : (
          content
        )}
      </motion.div>

      {/* Connecting line between steps */}
      {!isLast && (
        <div className="flex justify-start pl-[1.65rem] py-0">
          <div className={cn(
            "w-0.5 h-3",
            showAccentLine ? "gradient-accent" : "bg-border"
          )} />
        </div>
      )}
    </div>
  );
}

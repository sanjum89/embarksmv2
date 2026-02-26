import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Target, BookOpen, MessageSquare, ClipboardCheck, ArrowRight } from "lucide-react";
import type { SkillTarget, StepType } from "@/types/learning";
import { cn } from "@/lib/utils";

const stepTypeIcons: Record<StepType, React.ElementType> = {
  assessment: ClipboardCheck,
  role_play: MessageSquare,
  module: BookOpen,
};

interface SkillTargetCardProps {
  target: SkillTarget;
  index: number;
}

export function SkillTargetCard({ target, index }: SkillTargetCardProps) {
  const completedSteps = target.steps.filter((s) => s.status === "completed" || s.status === "skipped").length;
  const totalSteps = target.steps.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: "easeOut" }}
    >
      <Link
        to={`/skill-target/${target.id}`}
        className="group block rounded-xl bg-card p-5 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 border border-border/60"
      >
        {/* Category badge */}
        <div className="mb-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
            <Target className="h-3 w-3" />
            {target.category}
          </span>
          {target.dueDate && (
            <span className="text-xs text-muted-foreground">
              Due {new Date(target.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          )}
        </div>

        {/* Title */}
        <h4 className="font-display text-base font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors">
          {target.title}
        </h4>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {target.description}
        </p>

        {/* Step type pills */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {target.steps.map((step) => {
            const Icon = stepTypeIcons[step.type];
            return (
              <span
                key={step.id}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
                  step.status === "completed" || step.status === "skipped"
                    ? "bg-success/10 text-success"
                    : step.status === "in_progress"
                    ? "bg-info/10 text-info"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                <Icon className="h-3 w-3" />
              </span>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
            <motion.div
              className="h-full rounded-full gradient-accent"
              initial={{ width: 0 }}
              animate={{ width: `${target.progress}%` }}
              transition={{ delay: index * 0.08 + 0.3, duration: 0.6, ease: "easeOut" }}
            />
          </div>
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            {completedSteps}/{totalSteps}
          </span>
          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0" />
        </div>
      </Link>
    </motion.div>
  );
}

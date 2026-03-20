import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Target, BookOpen, MessageSquare, ClipboardCheck, ArrowRight, Clock } from "lucide-react";
import type { SkillTarget, StepType } from "@/types/learning";
import { proficiencyShort } from "@/types/learning";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const stepTypeIcons: Record<string, React.ElementType> = {
  assessment: ClipboardCheck,
  role_play: MessageSquare,
  module: BookOpen,
};

const fallbackIcon = BookOpen;

interface SkillTargetCardProps {
  target: SkillTarget;
  index: number;
}

export function SkillTargetCard({ target, index }: SkillTargetCardProps) {
  const completedSteps = target.steps.filter((s) => s.status === "completed" || s.status === "skipped").length;
  const totalSteps = target.steps.length;
  const [skillsDialogOpen, setSkillsDialogOpen] = useState(false);

  // Find next step (first in_progress or available)
  const nextStep = target.steps
    .sort((a, b) => a.order - b.order)
    .find((s) => s.status === "in_progress" || s.status === "available");

  const skills = target.skills || [];
  const visibleSkills = skills.slice(0, 3);
  const remainingCount = skills.length - 3;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.08, duration: 0.4, ease: "easeOut" }}
      >
        <Link
          to={`/skill-target/${target.id}`}
          className="group block rounded-xl bg-card p-5 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 border border-border/60"
        >
          {/* Category badge + due date */}
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
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {target.description}
          </p>

          {/* Skills being developed */}
          {skills.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {visibleSkills.map((skill) => (
                <span
                  key={skill.name}
                  className="inline-flex items-center gap-1 rounded-md bg-primary/8 border border-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary"
                >
                  {skill.name} {proficiencyShort[skill.current]}→{proficiencyShort[skill.target]}
                </span>
              ))}
              {remainingCount > 0 && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSkillsDialogOpen(true);
                  }}
                  className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                >
                  +{remainingCount} more
                </button>
              )}
            </div>
          )}

          {/* Next step indicator */}
          {nextStep && (
            <div className="mb-4 rounded-lg bg-secondary/50 border border-border/50 px-3 py-2.5">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                {nextStep.status === "in_progress" ? "Continue" : "Up Next"}
              </p>
              <div className="flex items-center gap-2">
                {(() => {
                  const Icon = stepTypeIcons[nextStep.type] || fallbackIcon;
                  return (
                    <div className={cn(
                      "flex h-5 w-5 items-center justify-center rounded",
                      nextStep.status === "in_progress" ? "text-info" : "text-accent"
                    )}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                  );
                })()}
                <span className="text-xs font-medium text-foreground truncate">{nextStep.title}</span>
                {nextStep.duration && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground ml-auto whitespace-nowrap">
                    <Clock className="h-2.5 w-2.5" />
                    {nextStep.duration}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Step type pills */}
          <div className="mb-4 flex flex-wrap gap-1.5">
            {target.steps.map((step) => {
              const Icon = stepTypeIcons[step.type] || fallbackIcon;
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

      {/* Skills dialog for overflow */}
      <Dialog open={skillsDialogOpen} onOpenChange={setSkillsDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Skills Being Developed</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 pt-2">
            {skills.map((skill) => (
              <div key={skill.name} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
                <span className="text-sm font-medium text-foreground">{skill.name}</span>
                <span className="text-xs font-medium text-primary">
                  {proficiencyShort[skill.current]} → {proficiencyShort[skill.target]}
                </span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

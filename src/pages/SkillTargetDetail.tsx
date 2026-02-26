import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Target, CalendarDays } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { StepTimeline } from "@/components/skill-target/StepTimeline";
import { Progress } from "@/components/ui/progress";
import { mockSkillTargets } from "@/data/mock";

export default function SkillTargetDetail() {
  const { id } = useParams();
  const target = mockSkillTargets.find((st) => st.id === id);

  if (!target) {
    return (
      <div>
        <AppHeader title="Skill Target" />
        <div className="flex items-center justify-center p-20 text-muted-foreground">
          Skill Target not found.
        </div>
      </div>
    );
  }

  const completedSteps = target.steps.filter(
    (s) => s.status === "completed" || s.status === "skipped"
  ).length;

  return (
    <div>
      <AppHeader title={target.title} />
      <div className="mx-auto max-w-2xl p-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        {/* Header card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-xl bg-card border border-border p-6 shadow-card mb-6"
        >
          <div className="flex items-start justify-between gap-4 mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
              <Target className="h-3 w-3" />
              {target.category}
            </span>
            {target.dueDate && (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                Due{" "}
                {new Date(target.dueDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
          </div>

          <h1 className="font-display text-xl font-bold text-foreground mb-1.5">
            {target.title}
          </h1>
          <p className="text-sm text-muted-foreground mb-4">{target.description}</p>

          <div className="flex items-center gap-3">
            <Progress value={target.progress} className="h-2 flex-1" />
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
              {completedSteps}/{target.steps.length} steps · {target.progress}%
            </span>
          </div>
        </motion.div>

        {/* Step timeline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
        >
          <h3 className="font-display text-sm font-semibold text-foreground mb-4">
            Learning Path
          </h3>
          <StepTimeline steps={target.steps} skillTargetId={target.id} />
        </motion.div>
      </div>
    </div>
  );
}

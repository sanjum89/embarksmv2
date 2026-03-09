import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Play, FileText, CheckCircle2 } from "lucide-react";

import { mockLearningModules } from "@/data/mock";
import { cn } from "@/lib/utils";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { useTheme } from "@/contexts/ThemeContext";
import { AIChatPanel } from "@/components/chat/AIChatPanel";

export default function LearningModulePage() {
  const { mid, id: skillTargetId } = useParams();
  const foundModule = mockLearningModules.find((m) => m.id === mid);
  const { updateSkillTarget, skillTargets } = useSkillTargets();
  const { styleTheme } = useTheme();
  const isNewUI = styleTheme === "new";

  // Generate fallback module from skill target step data when not found in mock catalog
  const module = foundModule ?? (() => {
    const target = skillTargets.find((st) => st.id === skillTargetId);
    const step = target?.steps.find((s) => s.referenceId === mid);
    if (!step) return null;
    return {
      id: mid!,
      title: step.title,
      contentType: "video" as const,
      contentUrl: "",
      duration: step.duration || "20 min",
      transcript: `This module covers ${step.title}. ${step.description}\n\nKey Topics:\n\n1. Core concepts and fundamentals\n2. Practical techniques and frameworks\n3. Real-world application scenarios\n4. Best practices and common pitfalls\n5. Summary and key takeaways\n\nBy completing this module, you'll have a solid understanding of ${step.title.toLowerCase()} and be ready to apply these skills in your day-to-day work.`,
    };
  })();

  const [completed, setCompleted] = useState(false);

  if (!module) {
    return (
      <div className="flex items-center justify-center p-20 text-muted-foreground">
        Module not found.
      </div>
    );
  }

  const handleMarkComplete = () => {
    if (!skillTargetId || !mid) return;

    updateSkillTarget(skillTargetId, (target) => {
      const sorted = [...target.steps].sort((a, b) => a.order - b.order);
      const stepIndex = sorted.findIndex((s) => s.referenceId === mid);

      const updatedSteps = target.steps.map((step) => {
        if (step.referenceId === mid) {
          return { ...step, status: "completed" as const };
        }
        if (stepIndex >= 0) {
          const currentOrder = sorted[stepIndex].order;
          const nextLocked = sorted.find((s) => s.order > currentOrder && s.status === "locked");
          if (nextLocked && step.id === nextLocked.id) {
            return { ...step, status: "available" as const };
          }
        }
        return step;
      });

      const doneCount = updatedSteps.filter(
        (s) => s.status === "completed" || s.status === "skipped"
      ).length;
      const progress = Math.round((doneCount / updatedSteps.length) * 100);

      return { ...target, steps: updatedSteps, progress };
    });

    setCompleted(true);
  };

  const contentArea = (
    <div className="flex-1 overflow-y-auto p-6">
      <div>
        <Link
          to={`/skill-target/${skillTargetId}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Skill Target
        </Link>

        {completed ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl bg-card border border-border p-8 shadow-card text-center"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-1">
              Module Complete!
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              You've completed <span className="font-medium text-foreground">{module.title}</span>
            </p>
            <Link
              to={`/skill-target/${skillTargetId}`}
              className="inline-flex items-center gap-2 rounded-lg gradient-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity"
            >
              Continue
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Module header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-card border border-border p-5 shadow-card mb-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {module.contentType === "video" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-info/10 px-2.5 py-0.5 text-xs font-medium text-info">
                        <Play className="h-3 w-3" /> Video
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                        <FileText className="h-3 w-3" /> Document
                      </span>
                    )}
                    {module.duration && (
                      <span className="text-xs text-muted-foreground">{module.duration}</span>
                    )}
                  </div>
                  <h1 className="font-display text-lg font-bold text-foreground">
                    {module.title}
                  </h1>
                </div>
                <button
                  onClick={handleMarkComplete}
                  className="inline-flex items-center gap-2 rounded-lg gradient-accent px-5 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity shrink-0 ml-4"
                >
                  <CheckCircle2 className="h-4 w-4" /> Mark as Complete
                </button>
              </div>
            </motion.div>

            {/* Content viewer */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl bg-card border border-border overflow-hidden shadow-card mb-6"
            >
              {module.contentType === "video" ? (
                <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-accent/15">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,hsl(var(--background)/0.4))]" />
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                    <span className="text-xs font-medium text-foreground/70">PREVIEW</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary">
                    <div className="h-full w-1/3 bg-accent rounded-r-full" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm shadow-lg border border-border">
                      <Play className="h-7 w-7 text-accent ml-1" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="aspect-[3/4] max-h-[500px] bg-background relative overflow-hidden p-8">
                  <div className="space-y-3">
                    <div className="h-6 w-2/3 rounded bg-muted" />
                    <div className="h-px w-full bg-border" />
                    <div className="space-y-2 mt-4">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="h-3 rounded bg-muted/60" style={{ width: `${65 + Math.sin(i) * 25}%` }} />
                      ))}
                    </div>
                    <div className="h-px w-full bg-border mt-4" />
                    <div className="space-y-2 mt-2">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-3 rounded bg-muted/60" style={{ width: `${70 + Math.cos(i) * 20}%` }} />
                      ))}
                    </div>
                  </div>
                  <div className="absolute top-3 right-3">
                    <FileText className="h-5 w-5 text-muted-foreground/40" />
                  </div>
                </div>
              )}
            </motion.div>

            {/* Transcript */}
            {module.transcript && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-xl bg-card border border-border p-5 shadow-card mb-6"
              >
                <h3 className="font-display text-sm font-semibold text-foreground mb-3">Transcript</h3>
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {module.transcript}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );

  // New UI: two-column with AgentOne on the right
  if (isNewUI) {
    return (
      <div className="flex flex-1 min-h-0">
        {contentArea}
        <div className="w-[400px] shrink-0 border-l border-border h-full">
          <AIChatPanel
            contextLabel={`Module: ${module.title}`}
            suggestedActions={[
              { label: "Summarise this module" },
              { label: "Quiz me on key concepts" },
              { label: "Explain the main takeaways" },
            ]}
          />
        </div>
      </div>
    );
  }

  // Traditional UI: just content (global FAB chat handles the rest)
  return (
    <div className="flex flex-1 min-h-0">
      {contentArea}
    </div>
  );
}

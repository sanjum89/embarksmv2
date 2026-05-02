import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, CheckCircle2, Clock } from "lucide-react";
import { trainingModules } from "@/data/aiManagerFlow";
import { cn } from "@/lib/utils";

export function TrainingRecommendationCard() {
  const [reviewed, setReviewed] = useState<Set<number>>(new Set());

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-4 shadow-sm max-w-lg"
    >
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Recommended Training</span>
      </div>

      <div className="space-y-2">
        {trainingModules.map((mod, i) => {
          const done = reviewed.has(i);
          return (
            <button
              key={i}
              onClick={() =>
                setReviewed((prev) => {
                  const next = new Set(prev);
                  next.add(i);
                  return next;
                })
              }
              className={cn(
                "w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all",
                done
                  ? "border-[hsl(var(--success)/0.3)] bg-[hsl(var(--success)/0.05)]"
                  : "border-border hover:border-primary/30"
              )}
            >
              {done ? (
                <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))] shrink-0" />
              ) : (
                <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <span className="text-xs font-medium text-foreground flex-1">{mod.title}</span>
              <span className="inline-flex items-center gap-1 text-[0.65rem] text-muted-foreground">
                <Clock className="h-2.5 w-2.5" />
                {mod.duration}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-[0.65rem] text-muted-foreground mt-3">
        Click a module to mark as reviewed
      </p>
    </motion.div>
  );
}

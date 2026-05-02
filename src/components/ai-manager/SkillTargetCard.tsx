import { motion } from "framer-motion";
import { Target, BookOpen, ClipboardCheck, CheckCircle2, Clock, Lock } from "lucide-react";
import { generatedSkillTarget } from "@/data/aiManagerFlow";
import { cn } from "@/lib/utils";

const typeIcons = {
  module: BookOpen,
  assessment: ClipboardCheck,
};

const statusStyles = {
  completed: "border-[hsl(var(--success)/0.3)] bg-[hsl(var(--success)/0.05)]",
  in_progress: "border-[hsl(var(--info)/0.3)] bg-[hsl(var(--info)/0.05)]",
  available: "border-border",
  locked: "border-border opacity-60",
};

export function SkillTargetCard() {
  const allItems = [...generatedSkillTarget.modules, generatedSkillTarget.assessment];
  const completed = allItems.filter((i) => i.status === "completed").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-4 shadow-sm max-w-lg"
    >
      <div className="flex items-center gap-2 mb-1">
        <Target className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Your Learning Path</span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">{generatedSkillTarget.title}</p>

      <div className="space-y-1.5">
        {allItems.map((item, i) => {
          const Icon = typeIcons[item.type];
          return (
            <div
              key={i}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3 py-2.5",
                statusStyles[item.status]
              )}
            >
              {item.status === "completed" ? (
                <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))] shrink-0" />
              ) : item.status === "locked" ? (
                <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : item.status === "in_progress" ? (
                <Clock className="h-4 w-4 text-[hsl(var(--info))] shrink-0" />
              ) : (
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <span className="text-xs font-medium text-foreground flex-1">{item.title}</span>
              <span className="text-[0.65rem] text-muted-foreground capitalize">{item.status.replace("_", " ")}</span>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${(completed / allItems.length) * 100}%` }}
          />
        </div>
        <span className="text-[0.65rem] font-medium text-muted-foreground">
          {completed}/{allItems.length}
        </span>
      </div>
    </motion.div>
  );
}

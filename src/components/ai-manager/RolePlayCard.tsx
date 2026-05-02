import { useState } from "react";
import { motion } from "framer-motion";
import { Drama, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { rolePlayScenario } from "@/data/aiManagerFlow";

export function RolePlayCard() {
  const [completed, setCompleted] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-4 shadow-sm max-w-lg"
    >
      <div className="flex items-center gap-2 mb-3">
        <Drama className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Role Play Scenario</span>
        <span className="ml-auto rounded-full bg-accent/15 px-2 py-0.5 text-[0.65rem] font-medium text-accent">
          {rolePlayScenario.difficulty}
        </span>
      </div>

      <h4 className="text-sm font-medium text-foreground mb-1">{rolePlayScenario.title}</h4>
      <p className="text-xs text-muted-foreground mb-3">{rolePlayScenario.description}</p>

      <div className="flex items-center gap-2 text-[0.65rem] text-muted-foreground mb-3">
        <Clock className="h-3 w-3" />
        {rolePlayScenario.duration}
      </div>

      {!completed ? (
        <Button size="sm" className="w-full" onClick={() => setCompleted(true)}>
          Start Role Play
        </Button>
      ) : (
        <div className="flex items-center gap-2 rounded-lg bg-[hsl(var(--success)/0.08)] border border-[hsl(var(--success)/0.2)] px-3 py-2">
          <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />
          <span className="text-xs font-medium text-foreground">Role play completed!</span>
        </div>
      )}
    </motion.div>
  );
}

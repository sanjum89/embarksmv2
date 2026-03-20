import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, CheckCircle2, Trash2, Plus } from "lucide-react";
import { useAccount } from "@/contexts/AccountContext";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TrainingAssignPanelProps {
  onAssigned?: () => void;
}

export default function TrainingAssignPanel({ onAssigned }: TrainingAssignPanelProps) {
  const { skillTargets } = useSkillTargets();
  const { normalizedAccount, activeAccount } = useAccount();
  const programContexts = normalizedAccount?.programContexts || activeAccount?.data?.programContexts || [];
  const newHires = normalizedAccount?.newHires || activeAccount?.data?.newHires || [];
  const program = programContexts[0];
  const st4 = program ? skillTargets.find((st) => st.id === program.skillTargetId) : undefined;
  const steps = st4?.steps ?? [];

  const [passPercent, setPassPercent] = useState(program?.assessmentPassPercentage ?? 70);
  const [enabledSteps, setEnabledSteps] = useState<Set<string>>(new Set(steps.map((s) => s.id)));
  const [assigned, setAssigned] = useState(false);
  const [selectedLearners, setSelectedLearners] = useState<Set<string>>(new Set(program?.assignedLearners || []));

  const toggleStep = (id: string) => {
    setEnabledSteps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleLearner = (id: string) => {
    setSelectedLearners((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAssign = () => {
    setAssigned(true);
    onAssigned?.();
  };

  if (assigned) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/20 mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h3 className="font-display text-xl font-bold text-foreground mb-2">Training Assigned!</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Apple L1 Customer Support Readiness has been assigned to {selectedLearners.size} learner(s).
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-1">
        <BookOpen className="h-4 w-4 text-success" />
        <h3 className="font-display text-lg font-bold text-foreground">Assign Training</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-6">Apple L1 Customer Support Readiness</p>

      {/* Pass % */}
      <div className="rounded-xl border border-border bg-background p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-foreground">Assessment Pass %</span>
          <span className="text-sm font-bold text-foreground">{passPercent}%</span>
        </div>
        <Slider value={[passPercent]} onValueChange={([v]) => setPassPercent(v)} min={50} max={100} step={5} />
        <p className="text-[10px] text-muted-foreground mt-2">
          &gt;{program.adaptiveSkipThresholds.skipOne}% skips Module 2 · ≥{program.adaptiveSkipThresholds.skipTwo}% skips Modules 2 & 3
        </p>
      </div>

      {/* Chapters */}
      <div className="rounded-xl border border-border bg-background p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-foreground">Chapters</p>
          <span className="text-xs text-muted-foreground">{enabledSteps.size} selected</span>
        </div>
        <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
          {steps.map((step, i) => (
            <label
              key={step.id}
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-secondary/50 transition-colors cursor-pointer group"
            >
              <Checkbox checked={enabledSteps.has(step.id)} onCheckedChange={() => toggleStep(step.id)} />
              <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}</span>
              <span className={cn("text-xs flex-1", enabledSteps.has(step.id) ? "text-foreground" : "text-muted-foreground line-through")}>
                {step.title}
              </span>
              <Badge variant="outline" className="text-[9px] shrink-0">{step.type}</Badge>
            </label>
          ))}
        </div>
      </div>

      {/* Learners */}
      <div className="rounded-xl border border-border bg-background p-4 mb-5">
        <p className="text-sm font-medium text-foreground mb-3">Assign To</p>
        <div className="space-y-2">
          {mockNewHires.map((hire) => (
            <label key={hire.user.id} className="flex items-center gap-2.5 cursor-pointer">
              <Checkbox
                checked={selectedLearners.has(hire.user.id)}
                onCheckedChange={() => toggleLearner(hire.user.id)}
              />
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shrink-0">
                {hire.user.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground">{hire.user.name}</p>
                <p className="text-[10px] text-muted-foreground">{hire.location}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <Button className="w-full" onClick={handleAssign} disabled={selectedLearners.size === 0 || enabledSteps.size === 0}>
        Assign Training ({selectedLearners.size} learner{selectedLearners.size !== 1 ? "s" : ""})
      </Button>
    </div>
  );
}

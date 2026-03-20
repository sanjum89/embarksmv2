import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Users, Target, BookOpen, CheckCircle2 } from "lucide-react";
import { useAccount } from "@/contexts/AccountContext";
import { useAccount } from "@/contexts/AccountContext";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ProgramContextPanel() {
  const { normalizedAccount, activeAccount } = useAccount();
  const { skillTargets } = useSkillTargets();
  const programContexts = Array.isArray(normalizedAccount?.programContexts) ? normalizedAccount.programContexts
    : Array.isArray(activeAccount?.data?.programContexts) ? activeAccount.data.programContexts
    : defaultProgramContexts;
  const newHires = Array.isArray(normalizedAccount?.newHires) ? normalizedAccount.newHires
    : Array.isArray(activeAccount?.data?.newHires) ? activeAccount.data.newHires
    : defaultNewHires;
  const program = programContexts[0];
  const st4 = program ? skillTargets.find((st) => st.id === program.skillTargetId) : undefined;
  const steps = st4?.steps ?? [];

  const [passPercent, setPassPercent] = useState(program?.assessmentPassPercentage ?? 70);
  const [enabledSteps, setEnabledSteps] = useState<Set<string>>(new Set(steps.map((s) => s.id)));
  const [saved, setSaved] = useState(false);

  if (!program) return <div className="p-6 text-sm text-muted-foreground">No program context available.</div>;

  const toggleStep = (id: string) => {
    setEnabledSteps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setSaved(false);
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-1">
        <Settings className="h-4 w-4 text-primary" />
        <h3 className="font-display text-lg font-bold text-foreground">Program Context</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-6">{program.name}</p>

      {/* Overview */}
      <div className="rounded-xl border border-border bg-background p-4 mb-5">
        <p className="text-sm text-foreground mb-2 font-medium">About</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{program.description}</p>
        <div className="flex gap-3 mt-3">
          <Badge variant="secondary" className="text-[10px]">{program.category}</Badge>
        </div>
      </div>

      {/* Assessment Config */}
      <div className="rounded-xl border border-border bg-background p-4 mb-5">
        <p className="text-sm font-medium text-foreground mb-3">Assessment Configuration</p>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Pass Percentage</span>
            <span className="text-sm font-bold text-foreground">{passPercent}%</span>
          </div>
          <Slider
            value={[passPercent]}
            onValueChange={([v]) => { setPassPercent(v); setSaved(false); }}
            min={50}
            max={100}
            step={5}
          />
        </div>

        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Target className="h-3 w-3 text-warning" />
            <span>Score &gt; {program.adaptiveSkipThresholds.skipOne}% → Skip Module 2</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-3 w-3 text-success" />
            <span>Score ≥ {program.adaptiveSkipThresholds.skipTwo}% → Skip Modules 2 & 3</span>
          </div>
        </div>
      </div>

      {/* Chapters */}
      <div className="rounded-xl border border-border bg-background p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-foreground">Training Chapters</p>
          <span className="text-xs text-muted-foreground">{enabledSteps.size}/{steps.length} active</span>
        </div>
        <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
          {steps.map((step, i) => (
            <label
              key={step.id}
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-secondary/50 transition-colors cursor-pointer"
            >
              <Checkbox
                checked={enabledSteps.has(step.id)}
                onCheckedChange={() => toggleStep(step.id)}
              />
              <span className="text-xs text-muted-foreground w-5 shrink-0">{i + 1}.</span>
              <span className={cn("text-xs flex-1", enabledSteps.has(step.id) ? "text-foreground" : "text-muted-foreground line-through")}>
                {step.title}
              </span>
              <Badge variant="outline" className="text-[9px] shrink-0">{step.type}</Badge>
            </label>
          ))}
        </div>
      </div>

      {/* Final Role Play */}
      <div className="rounded-xl border border-border bg-background p-4 mb-5">
        <p className="text-sm font-medium text-foreground mb-2">Final Assessment</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <BookOpen className="h-3 w-3" />
          <span>Live Customer Call Simulation (Role Play)</span>
        </div>
      </div>

      {/* Assigned Learners */}
      <div className="rounded-xl border border-border bg-background p-4 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-3.5 w-3.5 text-primary" />
          <p className="text-sm font-medium text-foreground">Assigned Learners</p>
        </div>
        <div className="space-y-2">
          {newHires.filter((h) => program.assignedLearners.includes(h.user.id)).map((hire) => (
            <div key={hire.user.id} className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shrink-0">
                {hire.user.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{hire.user.name}</p>
                <p className="text-[10px] text-muted-foreground">{hire.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button
        className="w-full"
        onClick={() => setSaved(true)}
      >
        {saved ? (
          <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Configuration Saved</span>
        ) : (
          "Save Configuration"
        )}
      </Button>
    </div>
  );
}

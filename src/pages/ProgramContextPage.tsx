import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Layers, ChevronRight, Settings, Users, Target, BookOpen, CheckCircle2 } from "lucide-react";
import { mockProgramContexts as defaultProgramContexts, mockNewHires as defaultNewHires } from "@/data/mock";
import { useAccount } from "@/contexts/AccountContext";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProgramContext } from "@/data/mock";

export default function ProgramContextPage() {
  const { normalizedAccount, activeAccount } = useAccount();
  const programContexts = normalizedAccount?.programContexts ?? activeAccount?.data?.programContexts ?? defaultProgramContexts;
  const newHires = normalizedAccount?.newHires ?? activeAccount?.data?.newHires ?? defaultNewHires;
  const [selectedProgram, setSelectedProgram] = useState<ProgramContext | null>(null);

  if (selectedProgram) {
    return <ProgramDetail program={selectedProgram} onBack={() => setSelectedProgram(null)} />;
  }

  return (
    <div className="p-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Program Context</h1>
            <p className="text-sm text-muted-foreground mt-1">Configure and manage training programs</p>
          </div>
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            New Program
          </Button>
        </div>

        <div className="space-y-3">
          {programContexts.map((pc, i) => (
            <motion.button
              key={pc.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedProgram(pc)}
              className="w-full flex items-center gap-4 rounded-xl border border-border bg-card p-5 text-left hover:shadow-md hover:border-primary/30 transition-all group"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                <Layers className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-base font-semibold text-foreground">{pc.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{pc.description}</p>
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant="secondary" className="text-[10px]">{pc.category}</Badge>
                  <span className="text-[10px] text-muted-foreground">{pc.assignedLearners.length} learners</span>
                  <span className="text-[10px] text-muted-foreground">Pass: {pc.assessmentPassPercentage}%</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            </motion.button>
          ))}

          {/* Placeholder for empty state */}
          {programContexts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Layers className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No programs configured yet.</p>
              <Button variant="outline" className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Create your first program
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Program Detail View ─── */
function ProgramDetail({ program, onBack }: { program: ProgramContext; onBack: () => void }) {
  const { skillTargets } = useSkillTargets();
  const st4 = skillTargets.find((st) => st.id === program.skillTargetId);
  const steps = st4?.steps ?? [];

  const [passPercent, setPassPercent] = useState(program.assessmentPassPercentage);
  const [enabledSteps, setEnabledSteps] = useState<Set<string>>(new Set(steps.map((s) => s.id)));
  const [saved, setSaved] = useState(false);

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
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        {/* Breadcrumb */}
        <button onClick={onBack} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ChevronRight className="h-3 w-3 rotate-180" />
          Back to Programs
        </button>

        <div className="flex items-start gap-4 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0">
            <Layers className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">{program.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{program.description}</p>
            <Badge variant="secondary" className="text-[10px] mt-2">{program.category}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Chapters */}
          <div className="lg:col-span-2 space-y-5">
            {/* Assessment Config */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Assessment Configuration</p>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Pass Percentage</span>
                  <span className="text-sm font-bold text-foreground">{passPercent}%</span>
                </div>
                <Slider value={[passPercent]} onValueChange={([v]) => { setPassPercent(v); setSaved(false); }} min={50} max={100} step={5} />
              </div>

              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Target className="h-3 w-3 text-warning" />
                  <span>Score &gt;{program.adaptiveSkipThresholds.skipOne}% → Skip Module 2 (adaptive)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-3 w-3 text-success" />
                  <span>Score ≥{program.adaptiveSkipThresholds.skipTwo}% → Skip Modules 2 & 3 (adaptive)</span>
                </div>
              </div>
            </div>

            {/* Chapters list */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-foreground">Training Chapters</p>
                </div>
                <span className="text-xs text-muted-foreground">{enabledSteps.size}/{steps.length} active</span>
              </div>

              <div className="space-y-1">
                {steps.map((step, i) => (
                  <label
                    key={step.id}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-secondary/50 transition-colors cursor-pointer"
                  >
                    <Checkbox checked={enabledSteps.has(step.id)} onCheckedChange={() => toggleStep(step.id)} />
                    <span className="text-xs text-muted-foreground w-6 shrink-0 font-medium">{i + 1}.</span>
                    <span className={cn("text-sm flex-1", enabledSteps.has(step.id) ? "text-foreground" : "text-muted-foreground line-through")}>
                      {step.title}
                    </span>
                    <Badge variant="outline" className="text-[9px] shrink-0 capitalize">{step.type.replace("_", " ")}</Badge>
                    {step.duration && <span className="text-[10px] text-muted-foreground shrink-0">{step.duration}</span>}
                  </label>
                ))}
              </div>
            </div>

            {/* Final Role Play */}
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm font-semibold text-foreground mb-2">Final Assessment</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                <span>Live Customer Call Simulation — Role Play</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                End-to-end simulated customer call covering Apple L1 support scenarios. This is the final gate before the learner is marked as ready.
              </p>
            </div>
          </div>

          {/* Right: Sidebar info */}
          <div className="space-y-5">
            {/* Assigned Learners */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Assigned Learners</p>
              </div>
              <div className="space-y-2.5">
                {newHires.filter((h) => program.assignedLearners.includes(h.user.id)).map((hire) => (
                  <div key={hire.user.id} className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shrink-0">
                      {hire.user.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{hire.user.name}</p>
                      <p className="text-[10px] text-muted-foreground">{hire.location} · {hire.yearsExperience} yrs</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick stats */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <p className="text-sm font-semibold text-foreground">Quick Stats</p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Chapters</span>
                  <span className="font-medium text-foreground">{steps.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assessments</span>
                  <span className="font-medium text-foreground">{steps.filter(s => s.type === "assessment").length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Modules</span>
                  <span className="font-medium text-foreground">{steps.filter(s => s.type === "module").length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Role Plays</span>
                  <span className="font-medium text-foreground">{steps.filter(s => s.type === "role_play").length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Est. Duration</span>
                  <span className="font-medium text-foreground">
                    {steps.reduce((acc, s) => acc + (parseInt(s.duration || "0") || 0), 0)} min
                  </span>
                </div>
              </div>
            </div>

            <Button className="w-full" onClick={() => setSaved(true)}>
              {saved ? (
                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Saved</span>
              ) : (
                "Save Configuration"
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

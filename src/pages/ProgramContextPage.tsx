import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Layers, ChevronRight, Settings, Users, Target, BookOpen,
  CheckCircle2, Search, Calendar, Star, AlertTriangle, Clock,
  Send, Award, UserPlus, MessageSquare, TrendingUp, BarChart3,
  ArrowLeft, Play, Pause, Check, X,
} from "lucide-react";
import { mockCohorts as defaultCohorts, mockNewHires as defaultNewHires } from "@/data/mock";
import type { Cohort, CohortLearnerProgress } from "@/data/mock";
import { useAccount } from "@/contexts/AccountContext";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import BackButton from "@/components/layout/BackButton";

type View = "list" | "create" | "detail";

/* ─── Helper: Learner name from newHires ─── */
function useLearnerMap() {
  const { normalizedAccount, activeAccount } = useAccount();
  const newHires = Array.isArray(normalizedAccount?.newHires) ? normalizedAccount.newHires
    : Array.isArray(activeAccount?.data?.newHires) ? activeAccount.data.newHires
    : defaultNewHires;
  return useMemo(() => {
    const map = new Map<string, typeof newHires[0]>();
    newHires.forEach((h) => {
      if (h?.user?.id) map.set(h.user.id, h);
    });
    return { newHires, learnerMap: map };
  }, [newHires]);
}

/* ─── Status Colors ─── */
function statusColor(s: Cohort["status"]) {
  switch (s) {
    case "active": return "bg-emerald-500/15 text-emerald-700 border-emerald-200";
    case "completed": return "bg-primary/10 text-primary border-primary/20";
    case "draft": return "bg-muted text-muted-foreground border-border";
  }
}

function tagBadge(tag: CohortLearnerProgress["tags"][0]) {
  switch (tag) {
    case "rising_star": return { label: "Rising Star", cls: "bg-amber-500/15 text-amber-700 border-amber-200" };
    case "at_risk": return { label: "At Risk", cls: "bg-destructive/15 text-destructive border-destructive/20" };
    case "needs_attention": return { label: "Needs Attention", cls: "bg-orange-500/15 text-orange-700 border-orange-200" };
    case "completed": return { label: "Completed", cls: "bg-emerald-500/15 text-emerald-700 border-emerald-200" };
    case "ahead_of_pace": return { label: "Ahead of Pace", cls: "bg-sky-500/15 text-sky-700 border-sky-200" };
  }
}

/* ═══════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════ */
export default function ProgramContextPage() {
  const [view, setView] = useState<View>("list");
  const [cohorts, setCohorts] = useState<Cohort[]>(defaultCohorts);
  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(null);

  const openDetail = (id: string) => { setSelectedCohortId(id); setView("detail"); };
  const goList = () => { setView("list"); setSelectedCohortId(null); };

  const addCohort = (c: Cohort) => {
    setCohorts((prev) => [c, ...prev]);
    setView("list");
    toast.success("Cohort created successfully");
  };

  const selectedCohort = cohorts.find((c) => c.id === selectedCohortId) ?? null;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <BackButton />
      <AnimatePresence mode="wait">
        {view === "list" && (
          <CohortList key="list" cohorts={cohorts} onCreate={() => setView("create")} onSelect={openDetail} />
        )}
        {view === "create" && (
          <CreateCohort key="create" onBack={goList} onSubmit={addCohort} />
        )}
        {view === "detail" && selectedCohort && (
          <CohortDetail key="detail" cohort={selectedCohort} onBack={goList} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   1. COHORT LIST
   ═══════════════════════════════════════════════════ */
function CohortList({ cohorts, onCreate, onSelect }: { cohorts: Cohort[]; onCreate: () => void; onSelect: (id: string) => void }) {
  const { learnerMap } = useLearnerMap();
  const [filter, setFilter] = useState<"all" | Cohort["status"]>("all");
  const filtered = filter === "all" ? cohorts : cohorts.filter((c) => c.status === filter);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Cohorts</h1>
          <p className="text-sm text-muted-foreground mt-1">Create, manage, and track learning cohorts</p>
        </div>
        <Button onClick={onCreate} className="gap-2"><Plus className="h-4 w-4" />New Cohort</Button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-5">
        {(["all", "active", "draft", "completed"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize",
              filter === f ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/30"
            )}>
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((cohort, i) => {
          const avgProgress = cohort.learnerProgress.length
            ? Math.round(cohort.learnerProgress.reduce((a, l) => a + l.overallProgress, 0) / cohort.learnerProgress.length)
            : 0;
          const risingStar = cohort.learnerProgress.filter((l) => l.tags.includes("rising_star")).length;
          const atRisk = cohort.learnerProgress.filter((l) => l.tags.includes("at_risk")).length;

          return (
            <motion.button key={cohort.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }} onClick={() => onSelect(cohort.id)}
              className="w-full text-left rounded-xl border border-border bg-card p-5 hover:shadow-md hover:border-primary/30 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <Layers className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-display text-sm font-semibold text-foreground">{cohort.name}</p>
                    <Badge variant="outline" className={cn("text-[10px] mt-1", statusColor(cohort.status))}>{cohort.status}</Badge>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 mt-1" />
              </div>

              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{cohort.description}</p>

              {/* Progress */}
              <div className="mb-3">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Overall Progress</span><span className="font-semibold text-foreground">{avgProgress}%</span>
                </div>
                <Progress value={avgProgress} className="h-1.5" />
              </div>

              {/* Meta row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{cohort.assignedLearnerIds.length}</span>
                  <span className="flex items-center gap-1"><Target className="h-3 w-3" />{cohort.skillTargetIds.length} targets</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{cohort.startDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  {risingStar > 0 && <span className="flex items-center gap-0.5 text-[10px] text-amber-600"><Star className="h-3 w-3" />{risingStar}</span>}
                  {atRisk > 0 && <span className="flex items-center gap-0.5 text-[10px] text-destructive"><AlertTriangle className="h-3 w-3" />{atRisk}</span>}
                </div>
              </div>

              {/* Stacked avatars */}
              {cohort.assignedLearnerIds.length > 0 && (
                <div className="flex -space-x-2 mt-3">
                  {cohort.assignedLearnerIds.slice(0, 5).map((lid) => {
                    const hire = learnerMap.get(lid);
                    const initials = hire ? hire.user.name.split(" ").map(n => n[0]).join("") : "?";
                    return (
                      <div key={lid} className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground border-2 border-card">
                        {initials}
                      </div>
                    );
                  })}
                  {cohort.assignedLearnerIds.length > 5 && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[9px] font-medium text-muted-foreground border-2 border-card">
                      +{cohort.assignedLearnerIds.length - 5}
                    </div>
                  )}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Layers className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No cohorts found.</p>
        </div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   2. CREATE COHORT WIZARD
   ═══════════════════════════════════════════════════ */
function CreateCohort({ onBack, onSubmit }: { onBack: () => void; onSubmit: (c: Cohort) => void }) {
  const { newHires } = useLearnerMap();
  const { skillTargets } = useSkillTargets();
  const [step, setStep] = useState(1);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedLearners, setSelectedLearners] = useState<Set<string>>(new Set());
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set());
  const [passPercent, setPassPercent] = useState(70);
  const [skipOne, setSkipOne] = useState(80);
  const [skipTwo, setSkipTwo] = useState(90);
  const [searchLearner, setSearchLearner] = useState("");
  const [searchTarget, setSearchTarget] = useState("");

  const toggleLearner = (id: string) => setSelectedLearners((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleTarget = (id: string) => setSelectedTargets((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const canNext = () => {
    if (step === 1) return name.trim().length > 0;
    if (step === 2) return selectedLearners.size > 0;
    if (step === 3) return selectedTargets.size > 0;
    return true;
  };

  const handleSubmit = () => {
    const cohort: Cohort = {
      id: `coh_${Date.now()}`,
      name, description, category: category || "General",
      status: "draft",
      startDate: startDate || new Date().toISOString().split("T")[0],
      endDate: endDate || "",
      skillTargetIds: Array.from(selectedTargets),
      assignedLearnerIds: Array.from(selectedLearners),
      passPercentage: passPercent,
      adaptiveSkipThresholds: { skipOne, skipTwo },
      learnerProgress: Array.from(selectedLearners).map((lid) => ({
        learnerId: lid, overallProgress: 0, avgScore: 0, lastActive: "", currentStep: "Not started",
        status: "not_started" as const, tags: [], skillTargetProgress: {},
      })),
      createdAt: new Date().toISOString().split("T")[0],
    };
    onSubmit(cohort);
  };

  const steps = ["Basics", "Learners", "Skill Targets", "Rules", "Review"];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
      <button onClick={onBack} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
        <ArrowLeft className="h-3 w-3" />Back to Cohorts
      </button>

      <h1 className="font-display text-2xl font-bold text-foreground mb-1">Create Cohort</h1>
      <p className="text-sm text-muted-foreground mb-6">Set up a new learning cohort in {steps.length} steps</p>

      {/* Stepper */}
      <div className="flex items-center gap-1 mb-8">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-1 flex-1">
            <button onClick={() => i + 1 < step ? setStep(i + 1) : undefined}
              className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors w-full",
                i + 1 === step ? "bg-primary text-primary-foreground" :
                i + 1 < step ? "bg-primary/10 text-primary cursor-pointer" :
                "bg-muted text-muted-foreground"
              )}>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background/20 text-[10px] font-bold shrink-0">
                {i + 1 < step ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span className="hidden sm:inline">{s}</span>
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        {/* Step 1: Basics */}
        {step === 1 && (
          <div className="space-y-4 max-w-lg">
            <div><Label>Cohort Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Apple L1 Support — Q2 2026" className="mt-1.5" /></div>
            <div><Label>Description</Label><textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the cohort's purpose..." className="mt-1.5 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[80px]" /></div>
            <div><Label>Category</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Onboarding, Career Development" className="mt-1.5" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Start Date</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1.5" /></div>
              <div><Label>End Date</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1.5" /></div>
            </div>
          </div>
        )}

        {/* Step 2: Select Learners */}
        {step === 2 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-foreground">{selectedLearners.size} learners selected</p>
              <div className="relative w-60"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={searchLearner} onChange={(e) => setSearchLearner(e.target.value)} placeholder="Search learners..." className="pl-9 h-9" /></div>
            </div>
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {newHires.filter((h) => h?.user?.name?.toLowerCase().includes(searchLearner.toLowerCase())).map((hire) => (
                <label key={hire.user.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-secondary/50 transition-colors cursor-pointer">
                  <Checkbox checked={selectedLearners.has(hire.user.id)} onCheckedChange={() => toggleLearner(hire.user.id)} />
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shrink-0">
                    {hire.user.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{hire.user.name}</p>
                    <p className="text-[10px] text-muted-foreground">{hire.title} · {hire.location}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">{hire.yearsExperience} yrs exp</Badge>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Assign Skill Targets */}
        {step === 3 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-foreground">{selectedTargets.size} skill targets selected</p>
              <div className="relative w-60"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={searchTarget} onChange={(e) => setSearchTarget(e.target.value)} placeholder="Search targets..." className="pl-9 h-9" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
              {skillTargets.filter((st) => st.title.toLowerCase().includes(searchTarget.toLowerCase())).map((st) => (
                <button key={st.id} onClick={() => toggleTarget(st.id)}
                  className={cn("text-left rounded-lg border p-4 transition-all",
                    selectedTargets.has(st.id) ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/30"
                  )}>
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium text-foreground">{st.title}</p>
                    {selectedTargets.has(st.id) && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{st.category}</p>
                  <div className="flex gap-3 mt-2 text-[10px] text-muted-foreground">
                    <span>{st.steps?.length ?? 0} steps</span>
                    <span>{st.steps?.reduce((a, s) => a + (parseInt(s.duration || "0") || 0), 0) ?? 0} min est.</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Rules */}
        {step === 4 && (
          <div className="space-y-6 max-w-lg">
            <div>
              <div className="flex items-center justify-between mb-2"><Label>Pass Percentage</Label><span className="text-sm font-bold text-foreground">{passPercent}%</span></div>
              <Slider value={[passPercent]} onValueChange={([v]) => setPassPercent(v)} min={50} max={100} step={5} />
              <p className="text-[10px] text-muted-foreground mt-1">Minimum score learners must achieve to pass assessments</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2"><Label>Adaptive Skip — Level 1</Label><span className="text-sm font-bold text-foreground">{skipOne}%</span></div>
              <Slider value={[skipOne]} onValueChange={([v]) => setSkipOne(v)} min={60} max={100} step={5} />
              <p className="text-[10px] text-muted-foreground mt-1">Score above this to skip the next module</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2"><Label>Adaptive Skip — Level 2</Label><span className="text-sm font-bold text-foreground">{skipTwo}%</span></div>
              <Slider value={[skipTwo]} onValueChange={([v]) => setSkipTwo(v)} min={70} max={100} step={5} />
              <p className="text-[10px] text-muted-foreground mt-1">Score above this to skip two modules ahead</p>
            </div>
            <div className="rounded-lg border border-border p-4 bg-secondary/30">
              <p className="text-xs font-medium text-foreground mb-2">Automated Rules</p>
              <div className="space-y-2 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-2"><AlertTriangle className="h-3 w-3 text-destructive" />Flag learner as "At Risk" after 7 days of inactivity</div>
                <div className="flex items-center gap-2"><Star className="h-3 w-3 text-amber-500" />Tag learner as "Rising Star" when progress &gt;80% and ahead of pace</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-emerald-500" />Mark cohort complete when all learners pass all assessments</div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-foreground">Review Your Cohort</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-border p-4">
                <p className="text-[10px] text-muted-foreground mb-1">Cohort Name</p>
                <p className="text-sm font-medium text-foreground">{name || "—"}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-[10px] text-muted-foreground mb-1">Category</p>
                <p className="text-sm font-medium text-foreground">{category || "General"}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-[10px] text-muted-foreground mb-1">Date Range</p>
                <p className="text-sm font-medium text-foreground">{startDate || "TBD"} → {endDate || "TBD"}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-[10px] text-muted-foreground mb-1">Pass Percentage</p>
                <p className="text-sm font-medium text-foreground">{passPercent}%</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-[10px] text-muted-foreground mb-1">Learners</p>
                <p className="text-sm font-medium text-foreground">{selectedLearners.size} selected</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-[10px] text-muted-foreground mb-1">Skill Targets</p>
                <p className="text-sm font-medium text-foreground">{selectedTargets.size} selected</p>
              </div>
            </div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <Button variant="outline" onClick={step === 1 ? onBack : () => setStep(step - 1)}>
          {step === 1 ? "Cancel" : "Back"}
        </Button>
        <div className="flex gap-2">
          {step < 5 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext()}>Continue</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!name.trim()}>
              <CheckCircle2 className="h-4 w-4 mr-1" />Create Cohort
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   3. COHORT DETAIL
   ═══════════════════════════════════════════════════ */
function CohortDetail({ cohort, onBack }: { cohort: Cohort; onBack: () => void }) {
  const { learnerMap } = useLearnerMap();
  const { skillTargets } = useSkillTargets();

  const avgProgress = cohort.learnerProgress.length
    ? Math.round(cohort.learnerProgress.reduce((a, l) => a + l.overallProgress, 0) / cohort.learnerProgress.length)
    : 0;
  const avgScore = cohort.learnerProgress.length
    ? Math.round(cohort.learnerProgress.reduce((a, l) => a + l.avgScore, 0) / cohort.learnerProgress.length)
    : 0;
  const completedCount = cohort.learnerProgress.filter((l) => l.status === "completed").length;
  const risingStar = cohort.learnerProgress.filter((l) => l.tags.includes("rising_star")).length;
  const atRisk = cohort.learnerProgress.filter((l) => l.tags.includes("at_risk")).length;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
      <button onClick={onBack} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
        <ArrowLeft className="h-3 w-3" />Back to Cohorts
      </button>

      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0">
          <Layers className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-foreground">{cohort.name}</h1>
            <Badge variant="outline" className={cn("text-xs", statusColor(cohort.status))}>{cohort.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{cohort.description}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{cohort.startDate} → {cohort.endDate}</span>
            <Badge variant="secondary" className="text-[10px]">{cohort.category}</Badge>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Learners", value: cohort.assignedLearnerIds.length, icon: Users },
          { label: "Avg Progress", value: `${avgProgress}%`, icon: TrendingUp },
          { label: "Avg Score", value: `${avgScore}%`, icon: BarChart3 },
          { label: "Rising Stars", value: risingStar, icon: Star },
          { label: "At Risk", value: atRisk, icon: AlertTriangle },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-1"><Icon className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-[10px] text-muted-foreground">{label}</span></div>
            <p className="text-lg font-bold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="learners">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="learners">Learners</TabsTrigger>
          <TabsTrigger value="targets">Skill Targets</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm font-semibold text-foreground mb-4">Progress Distribution</p>
              <div className="space-y-2">
                {[
                  { label: "Completed (100%)", count: cohort.learnerProgress.filter(l => l.overallProgress === 100).length, color: "bg-emerald-500" },
                  { label: "On Track (50-99%)", count: cohort.learnerProgress.filter(l => l.overallProgress >= 50 && l.overallProgress < 100).length, color: "bg-primary" },
                  { label: "Getting Started (1-49%)", count: cohort.learnerProgress.filter(l => l.overallProgress > 0 && l.overallProgress < 50).length, color: "bg-amber-500" },
                  { label: "Not Started (0%)", count: cohort.learnerProgress.filter(l => l.overallProgress === 0).length, color: "bg-muted-foreground" },
                ].map(({ label, count, color }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", color)} />
                    <span className="text-xs text-muted-foreground flex-1">{label}</span>
                    <span className="text-xs font-medium text-foreground">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm font-semibold text-foreground mb-4">Cohort Timeline</p>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Start Date</span><span className="font-medium text-foreground">{cohort.startDate}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">End Date</span><span className="font-medium text-foreground">{cohort.endDate}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Completion Rate</span><span className="font-medium text-foreground">{cohort.learnerProgress.length ? Math.round((completedCount / cohort.learnerProgress.length) * 100) : 0}%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Pass Threshold</span><span className="font-medium text-foreground">{cohort.passPercentage}%</span></div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Learners Tab */}
        <TabsContent value="learners">
          <div className="space-y-2">
            {cohort.learnerProgress.map((lp) => {
              const hire = learnerMap.get(lp.learnerId);
              const name = hire?.user?.name ?? lp.learnerId;
              const initials = name.split(" ").map(n => n[0]).join("");
              return (
                <div key={lp.learnerId} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shrink-0">{initials}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-foreground">{name}</p>
                        {lp.tags.map((tag) => {
                          const b = tagBadge(tag);
                          return <Badge key={tag} variant="outline" className={cn("text-[9px]", b.cls)}>{b.label}</Badge>;
                        })}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{hire?.title ?? ""} · {hire?.location ?? ""}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex-1 max-w-xs">
                          <div className="flex justify-between text-[10px] mb-0.5"><span className="text-muted-foreground">Progress</span><span className="font-medium text-foreground">{lp.overallProgress}%</span></div>
                          <Progress value={lp.overallProgress} className="h-1.5" />
                        </div>
                        <span className="text-[10px] text-muted-foreground">Score: {lp.avgScore}%</span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{lp.lastActive || "—"}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">Current: {lp.currentStep}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button variant="outline" size="sm" className="h-7 text-[10px] px-2" onClick={() => toast.success(`1:1 scheduled with ${name}`)}>
                        <Calendar className="h-3 w-3 mr-1" />1:1
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-[10px] px-2" onClick={() => toast.success(`Kudos sent to ${name}!`)}>
                        <Award className="h-3 w-3 mr-1" />Kudos
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-[10px] px-2" onClick={() => toast.success(`Mentor assigned to ${name}`)}>
                        <UserPlus className="h-3 w-3 mr-1" />Mentor
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-[10px] px-2" onClick={() => toast.success(`Nudge sent to ${name}`)}>
                        <Send className="h-3 w-3 mr-1" />Nudge
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            {cohort.learnerProgress.length === 0 && (
              <div className="text-center py-12 text-sm text-muted-foreground">No learners assigned yet.</div>
            )}
          </div>
        </TabsContent>

        {/* Skill Targets Tab */}
        <TabsContent value="targets">
          <div className="space-y-3">
            {cohort.skillTargetIds.map((stId) => {
              const st = skillTargets.find((s) => s.id === stId);
              if (!st) return null;
              const avgTargetProgress = cohort.learnerProgress.length
                ? Math.round(cohort.learnerProgress.reduce((a, l) => a + (l.skillTargetProgress[stId] ?? 0), 0) / cohort.learnerProgress.length)
                : 0;
              return (
                <div key={stId} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{st.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{st.category} · {st.steps?.length ?? 0} steps</p>
                    </div>
                    <span className="text-lg font-bold text-foreground">{avgTargetProgress}%</span>
                  </div>
                  <Progress value={avgTargetProgress} className="h-1.5 mb-3" />
                  <div className="space-y-1.5">
                    {cohort.learnerProgress.map((lp) => {
                      const hire = learnerMap.get(lp.learnerId);
                      const prog = lp.skillTargetProgress[stId] ?? 0;
                      return (
                        <div key={lp.learnerId} className="flex items-center gap-3 text-xs">
                          <span className="text-muted-foreground w-28 truncate">{hire?.user.name ?? lp.learnerId}</span>
                          <div className="flex-1"><Progress value={prog} className="h-1" /></div>
                          <span className="text-muted-foreground w-8 text-right">{prog}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {cohort.skillTargetIds.length === 0 && (
              <div className="text-center py-12 text-sm text-muted-foreground">No skill targets assigned.</div>
            )}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <div className="rounded-xl border border-border bg-card p-5 max-w-lg space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2"><Label>Pass Percentage</Label><span className="text-sm font-bold text-foreground">{cohort.passPercentage}%</span></div>
              <Slider value={[cohort.passPercentage]} min={50} max={100} step={5} disabled />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2"><Label>Adaptive Skip — Level 1</Label><span className="text-sm font-bold text-foreground">{cohort.adaptiveSkipThresholds.skipOne}%</span></div>
              <Slider value={[cohort.adaptiveSkipThresholds.skipOne]} min={60} max={100} step={5} disabled />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2"><Label>Adaptive Skip — Level 2</Label><span className="text-sm font-bold text-foreground">{cohort.adaptiveSkipThresholds.skipTwo}%</span></div>
              <Slider value={[cohort.adaptiveSkipThresholds.skipTwo]} min={70} max={100} step={5} disabled />
            </div>
            <div className="rounded-lg border border-border p-4 bg-secondary/30">
              <p className="text-xs font-medium text-foreground mb-2">Automated Rules</p>
              <div className="space-y-2 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-2"><AlertTriangle className="h-3 w-3 text-destructive" />Flag as "At Risk" after 7 days inactive</div>
                <div className="flex items-center gap-2"><Star className="h-3 w-3 text-amber-500" />Tag "Rising Star" at &gt;80% ahead of pace</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-emerald-500" />Complete when all learners pass</div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
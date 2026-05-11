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
import { TeamAvatar } from "@/components/team-home/Avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

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

/* ─── Status Colors (semantic tokens) ─── */
function statusColor(s: Cohort["status"]) {
  switch (s) {
    case "active": return "bg-primary/10 text-primary border-primary/20";
    case "completed": return "bg-success/10 text-success border-success/20";
    case "draft": return "bg-muted text-muted-foreground border-border";
  }
}

function tagBadge(tag: CohortLearnerProgress["tags"][0]) {
  switch (tag) {
    case "rising_star": return { label: "Rising star", cls: "bg-warning/10 text-warning border-warning/20" };
    case "at_risk": return { label: "At risk", cls: "bg-destructive/10 text-destructive border-destructive/20" };
    case "needs_attention": return { label: "Needs attention", cls: "bg-warning/10 text-warning border-warning/20" };
    case "completed": return { label: "Completed", cls: "bg-success/10 text-success border-success/20" };
    case "ahead_of_pace": return { label: "Ahead of pace", cls: "bg-primary/10 text-primary border-primary/20" };
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
    <div className="p-6 max-w-3xl mx-auto">
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
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"recent" | "progress" | "name" | "start">("recent");

  const enriched = useMemo(() => {
    return cohorts.map((c) => {
      const avgProgress = c.learnerProgress.length
        ? Math.round(c.learnerProgress.reduce((a, l) => a + l.overallProgress, 0) / c.learnerProgress.length)
        : 0;
      const risingStar = c.learnerProgress.filter((l) => l.tags.includes("rising_star")).length;
      const atRisk = c.learnerProgress.filter((l) => l.tags.includes("at_risk")).length;
      const needsAttention = c.learnerProgress.filter((l) => l.tags.includes("needs_attention")).length;
      return { c, avgProgress, risingStar, atRisk, needsAttention };
    });
  }, [cohorts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = enriched;
    if (filter !== "all") rows = rows.filter((r) => r.c.status === filter);
    if (q) rows = rows.filter((r) =>
      r.c.name.toLowerCase().includes(q) || (r.c.description ?? "").toLowerCase().includes(q)
    );
    const sorted = [...rows];
    sorted.sort((a, b) => {
      switch (sort) {
        case "progress": return b.avgProgress - a.avgProgress;
        case "name": return a.c.name.localeCompare(b.c.name);
        case "start": return (b.c.startDate ?? "").localeCompare(a.c.startDate ?? "");
        default: return (b.c.createdAt ?? "").localeCompare(a.c.createdAt ?? "");
      }
    });
    return sorted;
  }, [enriched, filter, search, sort]);

  // Hero stats (from full cohort list, not filtered)
  const stats = useMemo(() => {
    const total = cohorts.length;
    const activeCohorts = cohorts.filter((c) => c.status === "active");
    const activeLearners = activeCohorts.reduce((s, c) => s + c.assignedLearnerIds.length, 0);
    const measured = enriched.filter((r) => r.c.status !== "draft");
    const avg = measured.length
      ? Math.round(measured.reduce((s, r) => s + r.avgProgress, 0) / measured.length)
      : 0;
    const attention = enriched.reduce((s, r) => s + r.atRisk + r.needsAttention, 0);
    return { total, activeLearners, avg, attention };
  }, [cohorts, enriched]);

  const fmtDate = (d?: string) => {
    if (!d) return "";
    try {
      return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    } catch { return d; }
  };

  const plural = (n: number, s: string) => `${n} ${s}${n === 1 ? "" : "s"}`;

  const clearFilters = () => { setSearch(""); setFilter("all"); };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
      {/* Compact header (Program Context style) */}
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <h1 className="font-display text-lg font-bold text-foreground">Cohorts</h1>
        </div>
        <Button size="sm" onClick={onCreate} className="gap-1.5 h-8">
          <Plus className="h-3.5 w-3.5" /> New cohort
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        {stats.total} {stats.total === 1 ? "cohort" : "cohorts"} · {stats.activeLearners} active learner{stats.activeLearners === 1 ? "" : "s"} · {stats.avg}% avg progress
        {stats.attention > 0 && (
          <span className="text-destructive"> · {stats.attention} need{stats.attention === 1 ? "s" : ""} attention</span>
        )}
      </p>

      {/* Toolbar */}
      <div className="rounded-xl border border-border bg-background p-3 mb-5">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cohorts…"
              className="pl-8 h-8 text-xs"
            />
          </div>
          <div className="flex gap-1">
            {(["all", "active", "draft", "completed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[0.65rem] font-medium border transition-colors capitalize",
                  filter === f
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/30"
                )}
              >
                {f === "all" ? "All" : f}
              </button>
            ))}
          </div>
          <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recent</SelectItem>
              <SelectItem value="progress">Progress</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="start">Start date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cohort cards — panel style */}
      <div className="space-y-3">
        {filtered.map(({ c: cohort, avgProgress, risingStar, atRisk }, i) => {
          const isDraftEmpty = cohort.status === "draft" && cohort.assignedLearnerIds.length === 0;
          return (
            <motion.button
              key={cohort.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => onSelect(cohort.id)}
              className="w-full text-left rounded-xl border border-border bg-background p-4 hover:bg-secondary/40 hover:border-primary/40 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <Layers className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-display text-sm font-semibold text-foreground truncate">{cohort.name}</p>
                    <Badge variant="outline" className={cn("text-[0.6rem] capitalize", statusColor(cohort.status))}>
                      {cohort.status}
                    </Badge>
                  </div>
                  {cohort.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-1 mt-1">{cohort.description}</p>
                  )}

                  {/* Meta row */}
                  <div className="flex items-center gap-x-2 gap-y-1 mt-2 flex-wrap text-[0.65rem] text-muted-foreground">
                    {isDraftEmpty ? (
                      <span className="italic">No learners assigned yet</span>
                    ) : (
                      <>
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {plural(cohort.assignedLearnerIds.length, "learner")}
                        </span>
                        <span className="text-muted-foreground/40">·</span>
                        <span className="inline-flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {plural(cohort.skillTargetIds.length, "target")}
                        </span>
                        {cohort.startDate && (
                          <>
                            <span className="text-muted-foreground/40">·</span>
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {fmtDate(cohort.startDate)}
                            </span>
                          </>
                        )}
                        {risingStar > 0 && (
                          <Badge variant="outline" className={cn("text-[0.6rem] gap-1", tagBadge("rising_star").cls)}>
                            <Star className="h-2.5 w-2.5" /> {risingStar}
                          </Badge>
                        )}
                        {atRisk > 0 && (
                          <Badge variant="outline" className={cn("text-[0.6rem] gap-1", tagBadge("at_risk").cls)}>
                            <AlertTriangle className="h-2.5 w-2.5" /> {atRisk}
                          </Badge>
                        )}
                      </>
                    )}
                  </div>

                  {/* Progress + avatars */}
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex-1">
                      <Progress value={avgProgress} className="h-1" />
                    </div>
                    <span className="text-xs font-medium text-foreground tabular-nums">{avgProgress}%</span>
                    {cohort.assignedLearnerIds.length > 0 && (
                      <div className="flex -space-x-1.5">
                        {cohort.assignedLearnerIds.slice(0, 4).map((lid) => {
                          const hire = learnerMap.get(lid);
                          const name = hire?.user?.name ?? lid;
                          return (
                            <TeamAvatar key={lid} name={name} size={20} className="ring-2 ring-background" />
                          );
                        })}
                        {cohort.assignedLearnerIds.length > 4 && (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[0.55rem] font-medium text-muted-foreground ring-2 ring-background">
                            +{cohort.assignedLearnerIds.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Empty states */}
      {filtered.length === 0 && cohorts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-border bg-background">
          <Layers className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm font-semibold text-foreground">No cohorts yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Create your first cohort to start tracking groups of learners together.
          </p>
          <Button size="sm" onClick={onCreate} className="gap-1.5 mt-4"><Plus className="h-3.5 w-3.5" />New cohort</Button>
        </div>
      )}
      {filtered.length === 0 && cohorts.length > 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center text-xs text-muted-foreground">
          <p>No cohorts match your filters.</p>
          <button onClick={clearFilters} className="mt-2 text-primary hover:underline">Clear filters</button>
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
        <ArrowLeft className="h-3 w-3" />Back to cohorts
      </button>

      <div className="flex items-center gap-2 mb-1">
        <Plus className="h-4 w-4 text-primary" />
        <h1 className="font-display text-lg font-bold text-foreground">Create cohort</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-5">Step {step} of {steps.length} — {steps[step - 1]}</p>

      {/* Stepper */}
      <div className="flex items-center gap-1 mb-5">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-1 flex-1">
            <button onClick={() => i + 1 < step ? setStep(i + 1) : undefined}
              className={cn("flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[0.7rem] font-medium transition-colors w-full border",
                i + 1 === step ? "bg-primary text-primary-foreground border-primary" :
                i + 1 < step ? "bg-primary/5 text-primary border-primary/20 cursor-pointer" :
                "bg-background text-muted-foreground border-border"
              )}>
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-background/20 text-[0.6rem] font-bold shrink-0">
                {i + 1 < step ? <Check className="h-2.5 w-2.5" /> : i + 1}
              </span>
              <span className="hidden sm:inline">{s}</span>
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-background p-4 mb-5">
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
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[0.65rem] font-bold text-primary-foreground shrink-0">
                    {hire.user.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{hire.user.name}</p>
                    <p className="text-[0.65rem] text-muted-foreground">{hire.title} · {hire.location}</p>
                  </div>
                  <Badge variant="outline" className="text-[0.65rem] shrink-0">{hire.yearsExperience} yrs exp</Badge>
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
                  <p className="text-[0.65rem] text-muted-foreground mt-1">{st.category}</p>
                  <div className="flex gap-3 mt-2 text-[0.65rem] text-muted-foreground">
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
              <p className="text-[0.65rem] text-muted-foreground mt-1">Minimum score learners must achieve to pass assessments</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2"><Label>Adaptive Skip — Level 1</Label><span className="text-sm font-bold text-foreground">{skipOne}%</span></div>
              <Slider value={[skipOne]} onValueChange={([v]) => setSkipOne(v)} min={60} max={100} step={5} />
              <p className="text-[0.65rem] text-muted-foreground mt-1">Score above this to skip the next module</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2"><Label>Adaptive Skip — Level 2</Label><span className="text-sm font-bold text-foreground">{skipTwo}%</span></div>
              <Slider value={[skipTwo]} onValueChange={([v]) => setSkipTwo(v)} min={70} max={100} step={5} />
              <p className="text-[0.65rem] text-muted-foreground mt-1">Score above this to skip two modules ahead</p>
            </div>
            <div className="rounded-lg border border-border p-4 bg-secondary/30">
              <p className="text-xs font-medium text-foreground mb-2">Automated Rules</p>
              <div className="space-y-2 text-[0.7rem] text-muted-foreground">
                <div className="flex items-center gap-2"><AlertTriangle className="h-3 w-3 text-destructive" />Flag learner as "At Risk" after 7 days of inactivity</div>
                <div className="flex items-center gap-2"><Star className="h-3 w-3 text-warning" />Tag learner as "Rising Star" when progress &gt;80% and ahead of pace</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-success" />Mark cohort complete when all learners pass all assessments</div>
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
                <p className="text-[0.65rem] text-muted-foreground mb-1">Cohort Name</p>
                <p className="text-sm font-medium text-foreground">{name || "—"}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-[0.65rem] text-muted-foreground mb-1">Category</p>
                <p className="text-sm font-medium text-foreground">{category || "General"}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-[0.65rem] text-muted-foreground mb-1">Date Range</p>
                <p className="text-sm font-medium text-foreground">{startDate || "TBD"} → {endDate || "TBD"}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-[0.65rem] text-muted-foreground mb-1">Pass Percentage</p>
                <p className="text-sm font-medium text-foreground">{passPercent}%</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-[0.65rem] text-muted-foreground mb-1">Learners</p>
                <p className="text-sm font-medium text-foreground">{selectedLearners.size} selected</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-[0.65rem] text-muted-foreground mb-1">Skill Targets</p>
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
        <ArrowLeft className="h-3 w-3" />Back to cohorts
      </button>

      {/* Compact header (Program Context style) */}
      <div className="flex items-center gap-2 mb-1">
        <Layers className="h-4 w-4 text-primary" />
        <h1 className="font-display text-lg font-bold text-foreground">{cohort.name}</h1>
        <Badge variant="outline" className={cn("text-[0.6rem] capitalize ml-1", statusColor(cohort.status))}>{cohort.status}</Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-1">{cohort.description}</p>
      <div className="flex items-center gap-3 mb-5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{cohort.startDate} → {cohort.endDate}</span>
        <Badge variant="secondary" className="text-[0.6rem]">{cohort.category}</Badge>
      </div>

      {/* Stat strip — single bordered card */}
      <div className="rounded-xl border border-border bg-background p-3 mb-5 grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Learners", value: cohort.assignedLearnerIds.length, icon: Users },
          { label: "Avg progress", value: `${avgProgress}%`, icon: TrendingUp },
          { label: "Avg score", value: `${avgScore}%`, icon: BarChart3 },
          { label: "Rising stars", value: risingStar, icon: Star },
          { label: "At risk", value: atRisk, icon: AlertTriangle },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex flex-col">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Icon className="h-3 w-3 text-muted-foreground" />
              <span className="text-[0.6rem] uppercase tracking-wide text-muted-foreground">{label}</span>
            </div>
            <p className="text-base font-bold text-foreground tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="learners">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="learners">Learners</TabsTrigger>
          <TabsTrigger value="targets">Skill targets</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm font-semibold text-foreground mb-4">Progress Distribution</p>
              <div className="space-y-2">
                {[
                  { label: "Completed (100%)", count: cohort.learnerProgress.filter(l => l.overallProgress === 100).length, color: "bg-success" },
                  { label: "On Track (50-99%)", count: cohort.learnerProgress.filter(l => l.overallProgress >= 50 && l.overallProgress < 100).length, color: "bg-primary" },
                  { label: "Getting Started (1-49%)", count: cohort.learnerProgress.filter(l => l.overallProgress > 0 && l.overallProgress < 50).length, color: "bg-warning" },
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
                          return <Badge key={tag} variant="outline" className={cn("text-[0.6rem]", b.cls)}>{b.label}</Badge>;
                        })}
                      </div>
                      <p className="text-[0.65rem] text-muted-foreground mt-0.5">{hire?.title ?? ""} · {hire?.location ?? ""}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex-1 max-w-xs">
                          <div className="flex justify-between text-[0.65rem] mb-0.5"><span className="text-muted-foreground">Progress</span><span className="font-medium text-foreground">{lp.overallProgress}%</span></div>
                          <Progress value={lp.overallProgress} className="h-1.5" />
                        </div>
                        <span className="text-[0.65rem] text-muted-foreground">Score: {lp.avgScore}%</span>
                        <span className="text-[0.65rem] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{lp.lastActive || "—"}</span>
                      </div>
                      <p className="text-[0.65rem] text-muted-foreground mt-1">Current: {lp.currentStep}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button variant="outline" size="sm" className="h-7 text-[0.65rem] px-2" onClick={() => toast.success(`1:1 scheduled with ${name}`)}>
                        <Calendar className="h-3 w-3 mr-1" />1:1
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-[0.65rem] px-2" onClick={() => toast.success(`Kudos sent to ${name}!`)}>
                        <Award className="h-3 w-3 mr-1" />Kudos
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-[0.65rem] px-2" onClick={() => toast.success(`Mentor assigned to ${name}`)}>
                        <UserPlus className="h-3 w-3 mr-1" />Mentor
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-[0.65rem] px-2" onClick={() => toast.success(`Nudge sent to ${name}`)}>
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
                      <p className="text-[0.65rem] text-muted-foreground mt-0.5">{st.category} · {st.steps?.length ?? 0} steps</p>
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
                          <span className="text-muted-foreground w-28 truncate">{hire?.user?.name ?? lp.learnerId}</span>
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
              <div className="space-y-2 text-[0.7rem] text-muted-foreground">
                <div className="flex items-center gap-2"><AlertTriangle className="h-3 w-3 text-destructive" />Flag as "At Risk" after 7 days inactive</div>
                <div className="flex items-center gap-2"><Star className="h-3 w-3 text-warning" />Tag "Rising Star" at &gt;80% ahead of pace</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-success" />Complete when all learners pass</div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
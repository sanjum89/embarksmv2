import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Wrench, CheckCircle2, ArrowRight, Search, Plus,
  BookOpen, Video, FileText, ChevronLeft, Loader2, Target
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { useToast } from "@/hooks/use-toast";
import { mockLearningModules as defaultLearningModules, profileDataByUser as defaultProfileData } from "@/data/mock";
import { getRecommendationsForUser, type SkillGap, type RecommendationGroup } from "@/lib/skillRecommendations";
import type { SkillTarget, StepItem, LearningModule } from "@/types/learning";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

/* ─── Proficiency helpers ─── */
const levelColors: Record<string, string> = {
  B: "bg-warning/15 text-warning",
  I: "bg-info/15 text-info",
  A: "bg-accent/15 text-accent",
  E: "bg-success/15 text-success",
  M: "bg-primary/15 text-primary",
};

const proficiencyLevels = ["B", "I", "A", "E", "M"] as const;

function LevelBadge({ level, size = "sm" }: { level: string | null; size?: "sm" | "md" }) {
  const dim = size === "md" ? "h-7 w-7 text-xs" : "h-6 w-6 text-[10px]";
  if (!level) {
    return (
      <span className={cn("flex items-center justify-center rounded-full bg-muted font-bold text-muted-foreground", dim)}>
        —
      </span>
    );
  }
  return (
    <span className={cn("flex items-center justify-center rounded-full font-bold", dim, levelColors[level])}>
      {level}
    </span>
  );
}

/* ─── AI mock generator ─── */
function generateMockTarget(prompt: string): {
  title: string;
  description: string;
  category: string;
  skill: string;
  currentLevel: string | null;
  targetLevel: string;
  modules: { title: string; type: "video" | "document"; duration: string }[];
} {
  const lower = prompt.toLowerCase();
  if (lower.includes("figma") || lower.includes("design")) {
    return {
      title: "Design Prototyping Mastery",
      description: "Build advanced prototyping and wireframing skills using modern design tools.",
      category: "Design Tools",
      skill: "Figma Wireframing",
      currentLevel: "I",
      targetLevel: "A",
      modules: [
        { title: "Wireframing Best Practices", type: "video", duration: "30 min" },
        { title: "Component-based Wireframes", type: "document", duration: "20 min" },
        { title: "Interactive Prototyping", type: "video", duration: "25 min" },
      ],
    };
  }
  if (lower.includes("product") || lower.includes("prioriti")) {
    return {
      title: "Product Ops Excellence",
      description: "Scale your product operations skills to expert level through advanced frameworks and case studies.",
      category: "Product Skills",
      skill: "Product Ops & Scaling",
      currentLevel: "A",
      targetLevel: "E",
      modules: [
        { title: "Scaling Product Operations", type: "video", duration: "30 min" },
        { title: "Advanced Product Ops Frameworks", type: "document", duration: "20 min" },
        { title: "Product Ops Case Studies", type: "video", duration: "25 min" },
      ],
    };
  }
  if (lower.includes("training") || lower.includes("lms") || lower.includes("coaching")) {
    return {
      title: "Training Program Excellence",
      description: "Master training design and delivery for measurable learning outcomes.",
      category: "Training & Development",
      skill: "Training Design",
      currentLevel: "I",
      targetLevel: "A",
      modules: [
        { title: "Instructional Design Principles", type: "video", duration: "30 min" },
        { title: "Blended Learning Strategies", type: "document", duration: "25 min" },
        { title: "Measuring Training Impact", type: "video", duration: "20 min" },
      ],
    };
  }
  if (lower.includes("analytics") || lower.includes("data")) {
    return {
      title: "Performance Analytics Mastery",
      description: "Build advanced data analytics skills for performance tracking and coaching.",
      category: "Analytics",
      skill: "Performance Analytics",
      currentLevel: "I",
      targetLevel: "A",
      modules: [
        { title: "Analytics Fundamentals", type: "video", duration: "25 min" },
        { title: "Building Dashboards", type: "document", duration: "20 min" },
        { title: "Data-Driven Decision Making", type: "video", duration: "30 min" },
      ],
    };
  }
  return {
    title: "Custom Learning Path",
    description: `Personalized learning path based on: "${prompt}"`,
    category: "General Skills",
    skill: prompt.slice(0, 30),
    currentLevel: null,
    targetLevel: "I",
    modules: [
      { title: `Introduction to ${prompt.slice(0, 25)}`, type: "video", duration: "20 min" },
      { title: `${prompt.slice(0, 25)} — Deep Dive`, type: "document", duration: "25 min" },
      { title: `Practical ${prompt.slice(0, 25)}`, type: "video", duration: "30 min" },
    ],
  };
}

/* ─── Steps ─── */
type Step = "method" | "ai" | "manual" | "confirm";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSkillTargetDialog({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { user } = useUser();
  const { addSkillTargets } = useSkillTargets();
  const { toast } = useToast();
  const { normalizedAccount } = useAccount();

  const accountModules = normalizedAccount?.learningModules?.length ? normalizedAccount.learningModules : defaultLearningModules;

  const [step, setStep] = useState<Step>("method");

  // AI flow
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<ReturnType<typeof generateMockTarget> | null>(null);

  // Manual flow
  const [manualTitle, setManualTitle] = useState("");
  const [manualCategory, setManualCategory] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualTargetLevel, setManualTargetLevel] = useState("I");
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());
  const [moduleSearch, setModuleSearch] = useState("");

  // Group creation tracking
  const [groupCreated, setGroupCreated] = useState<Set<string>>(new Set());

  // Confirmation result
  const [createdTarget, setCreatedTarget] = useState<SkillTarget | null>(null);

  // Dynamic recommendations based on current user
  const profile = normalizedAccount?.profileData?.[user.id] || defaultProfileData[user.id];
  const { groups, hasRoleGaps } = useMemo(() => getRecommendationsForUser(profile), [profile]);

  const filteredModules = useMemo(() => {
    if (!moduleSearch.trim()) return mockLearningModules;
    const q = moduleSearch.toLowerCase();
    return mockLearningModules.filter((m) => m.title.toLowerCase().includes(q));
  }, [moduleSearch]);

  const reset = () => {
    setStep("method");
    setAiPrompt("");
    setAiLoading(false);
    setAiResult(null);
    setManualTitle("");
    setManualCategory("");
    setManualDescription("");
    setManualTargetLevel("I");
    setSelectedModules(new Set());
    setModuleSearch("");
    setCreatedTarget(null);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleGapClick = (gap: SkillGap) => {
    setAiPrompt(`I want to improve my ${gap.skill} skill from ${gap.currentLevel ?? "—"} to ${gap.targetLevel}`);
    setStep("ai");
  };

  const handleCreateGroupFromGaps = (group: RecommendationGroup) => {
    const steps: StepItem[] = group.recommendations.flatMap((rec, ri) =>
      rec.modules.map((mod, mi) => ({
        id: `step-grp-${Date.now()}-${ri}-${mi}`,
        type: "module" as const,
        title: mod.title,
        description: `Part of ${rec.skill} learning path.`,
        order: ri * 10 + mi + 1,
        skippable: mi > 0,
        status: ri === 0 && mi === 0 ? ("available" as const) : ("locked" as const),
        duration: mod.duration,
        referenceId: `ref-grp-${Date.now()}-${ri}-${mi}`,
      }))
    );
    const target = buildSkillTarget(group.title, group.subtitle, group.id.includes("role") ? "Role Skills" : "Project Skills", steps);
    setCreatedTarget(target);
    addSkillTargets([target]);
    setGroupCreated((prev) => new Set(prev).add(group.id));
    setStep("confirm");
  };

  /* AI flow */
  const handleAiGenerate = () => {
    setAiLoading(true);
    setTimeout(() => {
      setAiResult(generateMockTarget(aiPrompt));
      setAiLoading(false);
    }, 1200);
  };

  const handleAiCreate = () => {
    if (!aiResult) return;
    const target = buildSkillTarget(
      aiResult.title,
      aiResult.description,
      aiResult.category,
      aiResult.modules.map((m, i) => ({
        id: `step-ai-${Date.now()}-${i}`,
        type: "module" as const,
        title: m.title,
        description: `Part of AI-generated learning path.`,
        order: i + 1,
        skippable: i > 0,
        status: i === 0 ? ("available" as const) : ("locked" as const),
        duration: m.duration,
        referenceId: `ref-ai-${Date.now()}-${i}`,
      }))
    );
    setCreatedTarget(target);
    addSkillTargets([target]);
    setStep("confirm");
  };

  /* Manual flow */
  const handleManualCreate = () => {
    const selected = mockLearningModules.filter((m) => selectedModules.has(m.id));
    const steps: StepItem[] = selected.map((m, i) => ({
      id: `step-man-${Date.now()}-${i}`,
      type: "module" as const,
      title: m.title,
      description: `Manually selected module.`,
      order: i + 1,
      skippable: i > 0,
      status: i === 0 ? ("available" as const) : ("locked" as const),
      duration: m.duration,
      referenceId: m.id,
    }));
    const target = buildSkillTarget(
      manualTitle || "Custom Skill Target",
      manualDescription || "A custom-built learning path.",
      manualCategory || "General",
      steps
    );
    setCreatedTarget(target);
    addSkillTargets([target]);
    setStep("confirm");
  };

  const buildSkillTarget = (
    title: string,
    description: string,
    category: string,
    steps: StepItem[]
  ): SkillTarget => ({
    id: `st-custom-${Date.now()}`,
    title,
    description,
    category,
    assignedTo: [user.id],
    progress: 0,
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    steps,
  });

  const toggleModule = (id: string) => {
    setSelectedModules((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col gap-0 p-0">
        <DialogHeader className="p-6 pb-4 shrink-0">
          <DialogTitle className="font-display text-lg">
            {step === "method" && "Create Skill Target"}
            {step === "ai" && "Describe Your Goal"}
            {step === "manual" && "Build Manually"}
            {step === "confirm" && "Skill Target Created"}
          </DialogTitle>
          <DialogDescription>
            {step === "method" && "Choose how you'd like to create your learning path."}
            {step === "ai" && "Describe what you want to learn and we'll generate a path."}
            {step === "manual" && "Search and select courses to build your path."}
            {step === "confirm" && "Your new skill target is ready."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="px-6 pb-6">
            <AnimatePresence mode="wait">
              {/* ─── STEP: Method Selection ─── */}
              {step === "method" && (
                <motion.div key="method" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setStep("ai")}
                      className="group flex flex-col items-center gap-3 rounded-xl border-2 border-border bg-card p-5 text-center transition-all hover:border-accent hover:shadow-md"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
                        <Sparkles className="h-6 w-6 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Describe your goal</p>
                        <p className="text-xs text-muted-foreground mt-1">AI generates a personalized path</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setStep("manual")}
                      className="group flex flex-col items-center gap-3 rounded-xl border-2 border-border bg-card p-5 text-center transition-all hover:border-info hover:shadow-md"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info/10 group-hover:bg-info/20 transition-colors">
                        <Wrench className="h-6 w-6 text-info" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Build manually</p>
                        <p className="text-xs text-muted-foreground mt-1">Search & select existing courses</p>
                      </div>
                    </button>
                  </div>

                  {/* Skill Gap Recommendations */}
                  <div className="space-y-3">
                    {/* AI recommendation banner */}
                    <div className="flex items-center gap-2 rounded-lg bg-accent/10 border border-accent/20 px-4 py-3">
                      <Sparkles className="h-4 w-4 text-accent shrink-0" />
                      <p className="text-sm text-foreground">
                        <span className="font-semibold">AI-powered recommendations</span> based on your skills gap analysis
                      </p>
                    </div>

                    {/* No role gaps message */}
                    {!hasRoleGaps && (
                      <div className="flex items-center gap-2 rounded-lg bg-success/10 border border-success/20 px-4 py-3">
                        <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-foreground">No role skill gaps</p>
                          <p className="text-xs text-muted-foreground">You're fully aligned with your role requirements</p>
                        </div>
                      </div>
                    )}

                    {/* Dynamic recommendation groups */}
                    {groups.map((group) => (
                      <GapGroupCard
                        key={group.id}
                        group={group}
                        onGapClick={handleGapClick}
                        onCreateGroup={() => handleCreateGroupFromGaps(group)}
                        groupCreated={groupCreated.has(group.id)}
                      />
                    ))}

                    {groups.length === 0 && hasRoleGaps && (
                      <p className="text-xs text-muted-foreground text-center py-4">No profile data available to generate recommendations.</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ─── STEP: AI-Generated ─── */}
              {step === "ai" && (
                <motion.div key="ai" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  <button onClick={() => { setStep("method"); setAiResult(null); }} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronLeft className="h-3 w-3" /> Back
                  </button>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">What skill do you want to develop?</label>
                    <Textarea
                      placeholder="e.g. I want to master product prioritization frameworks..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      rows={3}
                    />
                    <Button
                      onClick={handleAiGenerate}
                      disabled={!aiPrompt.trim() || aiLoading}
                      className="w-full gap-2"
                    >
                      {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {aiLoading ? "Generating..." : "Generate Learning Path"}
                    </Button>
                  </div>

                  {/* AI Result Preview */}
                  {aiResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-border bg-card p-4 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{aiResult.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{aiResult.category}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <LevelBadge level={aiResult.currentLevel} size="md" />
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                          <LevelBadge level={aiResult.targetLevel} size="md" />
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground">{aiResult.description}</p>

                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-foreground">Auto-assigned modules</p>
                        {aiResult.modules.map((m, i) => (
                          <div key={i} className="flex items-center gap-2.5 py-1.5 px-2 rounded-md bg-secondary/50">
                            {m.type === "video" ? (
                              <Video className="h-3.5 w-3.5 text-info shrink-0" />
                            ) : (
                              <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            )}
                            <span className="text-xs font-medium text-foreground flex-1">{m.title}</span>
                            <span className="text-[10px] text-muted-foreground">{m.duration}</span>
                          </div>
                        ))}
                      </div>

                      <Button onClick={handleAiCreate} className="w-full gap-2">
                        <Plus className="h-4 w-4" /> Create Skill Target
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* ─── STEP: Manual Build ─── */}
              {step === "manual" && (
                <motion.div key="manual" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  <button onClick={() => setStep("method")} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronLeft className="h-3 w-3" /> Back
                  </button>

                  {/* Form fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">Title</label>
                      <Input value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} placeholder="e.g. Design Foundations" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">Category</label>
                      <Input value={manualCategory} onChange={(e) => setManualCategory(e.target.value)} placeholder="e.g. Design Tools" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Description</label>
                    <Textarea value={manualDescription} onChange={(e) => setManualDescription(e.target.value)} placeholder="Brief description..." rows={2} />
                  </div>

                  {/* Target proficiency */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Target Proficiency</label>
                    <div className="flex gap-2">
                      {proficiencyLevels.map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() => setManualTargetLevel(lvl)}
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold transition-all border-2",
                            manualTargetLevel === lvl
                              ? cn(levelColors[lvl], "border-current scale-110")
                              : "border-border bg-secondary/50 text-muted-foreground hover:border-muted-foreground"
                          )}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Module search */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground">Select Modules</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        value={moduleSearch}
                        onChange={(e) => setModuleSearch(e.target.value)}
                        placeholder="Search modules..."
                        className="pl-9"
                      />
                    </div>
                    <div className="space-y-1 max-h-40 overflow-y-auto rounded-lg border border-border p-1">
                      {filteredModules.map((m) => (
                        <label
                          key={m.id}
                          className="flex items-center gap-2.5 rounded-md px-2.5 py-2 hover:bg-secondary/50 cursor-pointer transition-colors"
                        >
                          <Checkbox
                            checked={selectedModules.has(m.id)}
                            onCheckedChange={() => toggleModule(m.id)}
                          />
                          <ModuleIcon mod={m} />
                          <span className="text-xs font-medium text-foreground flex-1 truncate">{m.title}</span>
                          {m.duration && (
                            <span className="text-[10px] text-muted-foreground">{m.duration}</span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Selected modules summary */}
                  {selectedModules.size > 0 && (
                    <div className="flex items-center justify-between rounded-lg bg-accent/10 border border-accent/20 px-3 py-2">
                      <span className="text-xs font-medium text-foreground">
                        {selectedModules.size} module{selectedModules.size > 1 ? "s" : ""} selected
                      </span>
                      <div className="flex items-center gap-1.5">
                        <LevelBadge level={null} />
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <LevelBadge level={manualTargetLevel} />
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleManualCreate}
                    disabled={selectedModules.size === 0}
                    className="w-full gap-2"
                  >
                    <Plus className="h-4 w-4" /> Create Skill Target
                  </Button>
                </motion.div>
              )}

              {/* ─── STEP: Confirmation ─── */}
              {step === "confirm" && createdTarget && (
                <motion.div key="confirm" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4 text-center py-2">
                  <div className="flex justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10">
                      <CheckCircle2 className="h-7 w-7 text-success" />
                    </div>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-foreground">{createdTarget.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{createdTarget.category} · {createdTarget.steps.length} modules</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{createdTarget.description}</p>

                  <div className="flex gap-3 justify-center pt-2">
                    <Button variant="outline" onClick={() => handleOpenChange(false)}>
                      Close
                    </Button>
                    <Button
                      onClick={() => {
                        handleOpenChange(false);
                        navigate(`/skill-target/${createdTarget.id}`);
                      }}
                      className="gap-2"
                    >
                      View Skill Target <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function ModuleIcon({ mod }: { mod: LearningModule }) {
  return mod.contentType === "video" ? (
    <Video className="h-3.5 w-3.5 text-info shrink-0" />
  ) : (
    <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
  );
}

/* ─── Gap Group Card ─── */
function GapGroupCard({
  group, onGapClick, onCreateGroup, groupCreated,
}: {
  group: RecommendationGroup;
  onGapClick: (gap: SkillGap) => void;
  onCreateGroup: () => void;
  groupCreated: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", group.iconBg)}>
            <Target className={cn("h-4 w-4", group.iconColor)} />
          </div>
          <div>
            <h5 className="font-display text-sm font-semibold text-foreground">{group.title}</h5>
            <p className="text-xs text-muted-foreground">{group.subtitle}</p>
          </div>
        </div>
        <button
          onClick={onCreateGroup}
          disabled={groupCreated}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
            groupCreated
              ? "bg-success/10 text-success cursor-default"
              : "gradient-accent text-accent-foreground hover:opacity-90"
          )}
        >
          {groupCreated ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Created
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" />
              Create Skill Target
            </>
          )}
        </button>
      </div>

      <div className="space-y-1">
        {group.recommendations.map((rec) => (
          <button
            key={rec.skill}
            onClick={() => onGapClick(rec)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border hover:bg-secondary/50 transition-colors text-left"
          >
            <span className="text-sm font-medium text-foreground flex-1 truncate">{rec.skill}</span>
            {rec.isNew && (
              <span className="rounded-full bg-accent/10 border border-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent shrink-0">
                NEW
              </span>
            )}
            <div className="flex items-center gap-1.5 shrink-0">
              <LevelBadge level={rec.currentLevel} />
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <LevelBadge level={rec.targetLevel} />
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {rec.modules.length} modules
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

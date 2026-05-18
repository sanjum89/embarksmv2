import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import {
  ArrowLeft,
  Send,
  Upload,
  BookOpen,
  ClipboardCheck,
  Drama,
  GripVertical,
  X,
  Plus,
  Play,
  FileText,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Check,
  Loader2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { useUser } from "@/contexts/UserContext";
import { mockLearningModules as defaultLearningModules, mockAssessments as defaultAssessments, mockRolePlayBank as defaultRolePlayBank } from "@/data/mock";
import { useAccount } from "@/contexts/AccountContext";
import { AssessmentCreator } from "@/components/skill-target/AssessmentCreator";
import type { StepItem, LearningModule, Assessment, RolePlay } from "@/types/learning";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { getRecommendationsForUser } from "@/lib/skillRecommendations";

type ContentItem =
  | { kind: "module"; data: LearningModule }
  | { kind: "assessment"; data: Assessment }
  | { kind: "roleplay"; data: RolePlay };

type ChatMsg = { role: "assistant" | "user"; text: string; results?: ContentItem[]; isThinking?: boolean };
type LeftView = "chat" | "detail";
type ContentFilter = "all" | "modules" | "assessments" | "roleplays";

const FALLBACK_WELCOME =
  "Describe the skill target you want to create and I'll find the right courses for you from our repo. You can also add your own content by clicking the upload button below.";

const FALLBACK_PILLS = [
  "Customer Onboarding",
  "De-escalation Techniques",
  "Apple L1 Support",
  "Empathy & Active Listening",
  "Billing & Subscriptions",
  "Product Knowledge",
  "Troubleshooting Workflows",
  "Escalation Handling",
  "CRM & Tools",
  "Quality Assurance",
  "Customer Retention",
];

/* ─── Build a compact content catalog string for the LLM ─── */
function buildContentCatalog(modules: any[], assessments: any[], roleplays: any[]): string {
  const m = modules.map(
    (m: any) => `[${m.id}] MODULE: "${m.title}" (${m.contentType}, ${m.duration || "?"})`
  );
  const a = assessments.map(
    (a: any) => `[${a.id}] ASSESSMENT: "${a.title}" (${a.type}, pass: ${a.passingScore}%)`
  );
  const r = roleplays.map(
    (r: any) => `[${r.id}] ROLEPLAY: "${r.title}" (${r.difficulty}, tags: ${r.tags.join(", ")})`
  );
  return [...m, ...a, ...r].join("\n");
}

function resolveIds(ids: string[], modules: any[], assessments: any[], roleplays: any[]): ContentItem[] {
  const items: ContentItem[] = [];
  const idSet = new Set(ids);

  modules.forEach((m: any) => {
    if (idSet.has(m.id)) items.push({ kind: "module", data: m });
  });
  assessments.forEach((a: any) => {
    if (idSet.has(a.id)) items.push({ kind: "assessment", data: a });
  });
  roleplays.forEach((r: any) => {
    if (idSet.has(r.id)) items.push({ kind: "roleplay", data: r });
  });
  return items;
}

function contentIcon(kind: ContentItem["kind"]) {
  switch (kind) {
    case "module": return <BookOpen className="h-4 w-4" />;
    case "assessment": return <ClipboardCheck className="h-4 w-4" />;
    case "roleplay": return <Drama className="h-4 w-4" />;
  }
}

function contentLabel(kind: ContentItem["kind"]) {
  switch (kind) {
    case "module": return "Module";
    case "assessment": return "Assessment";
    case "roleplay": return "Role Play";
  }
}

export default function SkillTargetBuilder() {
  const navigate = useNavigate();
  const { addSkillTargets } = useSkillTargets();
  const { user } = useUser();
  const { normalizedAccount, activeAccount } = useAccount();

  // Account-aware content sources with fallback
  const mockLearningModules = normalizedAccount?.learningModules?.length ? normalizedAccount.learningModules : activeAccount?.data?.learningModules ?? defaultLearningModules;
  const mockAssessments = normalizedAccount?.assessments?.length ? normalizedAccount.assessments : activeAccount?.data?.assessments ?? defaultAssessments;
  const mockRolePlayBank = normalizedAccount?.rolePlays?.length ? normalizedAccount.rolePlays : activeAccount?.data?.rolePlays ?? defaultRolePlayBank;

  // ── Derive contextual data from account ──
  const profileData = normalizedAccount?.profileData?.[user.id];
  const { roleGaps, projectGaps } = useMemo(
    () => getRecommendationsForUser(profileData),
    [profileData]
  );

  const projects = useMemo(() => {
    if (!normalizedAccount?.projectsById) return [];
    return Object.values(normalizedAccount.projectsById);
  }, [normalizedAccount?.projectsById]);

  const employeeTitle = normalizedAccount?.employeesById?.[user.id]?.title;

  // ── Context-aware suggestion pills ──
  const suggestionPills = useMemo(() => {
    const pills: string[] = [];
    // 1. Skill gaps first
    for (const gap of roleGaps) {
      if (pills.length >= 8) break;
      pills.push(gap.skill);
    }
    for (const gap of projectGaps) {
      if (pills.length >= 8) break;
      if (!pills.includes(gap.skill)) pills.push(gap.skill);
    }
    // 2. Project names / required skills
    for (const proj of projects) {
      if (pills.length >= 8) break;
      if (proj.name && !pills.includes(proj.name)) pills.push(proj.name);
    }
    // 3. Top module topics from content library
    for (const mod of mockLearningModules.slice(0, 6)) {
      if (pills.length >= 8) break;
      const t = (mod as any).title;
      if (t && !pills.includes(t)) pills.push(t);
    }
    return pills.length > 0 ? pills : FALLBACK_PILLS;
  }, [roleGaps, projectGaps, projects, mockLearningModules]);

  // ── Context-aware welcome message ──
  const welcomeMessage = useMemo(() => {
    if (roleGaps.length > 0) {
      const gapNames = roleGaps.slice(0, 3).map((g) => `**${g.skill}**`).join(", ");
      return `Based on your profile, you have gaps in ${gapNames}. I can help you find the right courses — or search for anything below.`;
    }
    if (projects.length > 0) {
      const projName = projects[0].name || "your current project";
      return `You're assigned to **${projName}**. I can build a learning path for that — or search for any topic.`;
    }
    return FALLBACK_WELCOME;
  }, [roleGaps, projects]);

  // ── Context-aware placeholders ──
  const inputPlaceholder = useMemo(() => {
    const count = mockLearningModules.length + mockAssessments.length + mockRolePlayBank.length;
    if (employeeTitle && count > 0) return `Search ${count} items for ${employeeTitle} or any topic...`;
    if (count > 3) return `Search ${count} modules, assessments, role plays...`;
    return "Search for modules, assessments, role plays...";
  }, [mockLearningModules.length, mockAssessments.length, mockRolePlayBank.length, employeeTitle]);

  const titlePlaceholder = useMemo(() => {
    if (roleGaps.length > 0) return `e.g. ${roleGaps[0].skill} Mastery`;
    if (projects.length > 0) return `e.g. ${projects[0].name || "Project"} Skills`;
    return "e.g. Customer Support Fundamentals";
  }, [roleGaps, projects]);

  const descPlaceholder = useMemo(() => {
    if (roleGaps.length > 0) {
      const g = roleGaps[0];
      return `e.g. Build ${g.skill} skills from ${g.currentLevel || "—"} to ${g.targetLevel} level`;
    }
    return "Describe what this skill target covers...";
  }, [roleGaps]);

  // Left panel
  const [messages, setMessages] = useState<ChatMsg[]>([{ role: "assistant", text: welcomeMessage }]);
  const [input, setInput] = useState("");
  const [leftView, setLeftView] = useState<LeftView>("chat");
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [contentFilter, setContentFilter] = useState<ContentFilter>("all");
  const [showAssessmentCreator, setShowAssessmentCreator] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pillsUsed, setPillsUsed] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Right panel
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<StepItem[]>([]);

  const addedIds = useMemo(() => new Set(steps.map((s) => s.referenceId)), [steps]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = useCallback(async (query?: string) => {
    const q = (query ?? input).trim();
    if (!q || isSearching) return;
    if (!query) setInput("");

    const userMsg: ChatMsg = { role: "user", text: q };
    const thinkingMsg: ChatMsg = { role: "assistant", text: "", isThinking: true };
    setMessages((prev) => [...prev, userMsg, thinkingMsg]);
    setPillsUsed(true);
    setIsSearching(true);

    try {
      const { data, error } = await supabase.functions.invoke("content-search", {
        body: { query: q, contentCatalog: buildContentCatalog(mockLearningModules, mockAssessments, mockRolePlayBank) },
      });

      if (error) throw error;

      const matchedIds: string[] = data?.matchedIds || [];
      const explanation: string = data?.explanation || "Here are the results I found:";
      const results = resolveIds(matchedIds, mockLearningModules, mockAssessments, mockRolePlayBank);

      const assistantMsg: ChatMsg = results.length
        ? { role: "assistant", text: explanation, results }
        : { role: "assistant", text: data?.explanation || `No results found for "${q}". Try different keywords or use the upload button to add your own content.` };

      // Replace thinking message with actual response
      setMessages((prev) => {
        const withoutThinking = prev.filter((m) => !m.isThinking);
        return [...withoutThinking, assistantMsg];
      });
    } catch (err) {
      console.error("Content search error:", err);
      // Fallback to local search
      const results = localSearchContent(q);
      const assistantMsg: ChatMsg = results.length
        ? { role: "assistant", text: `I found ${results.length} result${results.length > 1 ? "s" : ""} matching "${q}":`, results }
        : { role: "assistant", text: `No results found for "${q}". Try different keywords or use the upload button to add your own content.` };

      setMessages((prev) => {
        const withoutThinking = prev.filter((m) => !m.isThinking);
        return [...withoutThinking, assistantMsg];
      });
    } finally {
      setIsSearching(false);
    }
  }, [input, isSearching]);

  /* Fallback local search */
  function localSearchContent(query: string): ContentItem[] {
    const q = query.toLowerCase();
    const words = q.split(/\s+/).filter(Boolean);
    const items: ContentItem[] = [];
    mockLearningModules.forEach((m) => {
      const hay = `${m.title} ${m.transcript ?? ""}`.toLowerCase();
      if (words.some((w) => hay.includes(w))) items.push({ kind: "module", data: m });
    });
    mockAssessments.forEach((a) => {
      const hay = `${a.title} ${a.questions.map((aq) => aq.question).join(" ")}`.toLowerCase();
      if (words.some((w) => hay.includes(w))) items.push({ kind: "assessment", data: a });
    });
    mockRolePlayBank.forEach((r) => {
      const hay = `${r.title} ${r.scenario} ${r.tags.join(" ")}`.toLowerCase();
      if (words.some((w) => hay.includes(w))) items.push({ kind: "roleplay", data: r });
    });
    return items;
  }

  const addStep = useCallback(
    (item: ContentItem) => {
      const refId = item.data.id;
      if (addedIds.has(refId)) return;
      const step: StepItem = {
        id: `builder-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: item.kind === "module" ? "module" : item.kind === "assessment" ? "assessment" : "role_play",
        title: item.data.title,
        description: item.kind === "roleplay" ? (item.data as RolePlay).scenario : item.kind === "module" ? `Learning module: ${item.data.title}` : `Assessment: ${item.data.title}`,
        order: steps.length + 1,
        skippable: false,
        status: "available",
        duration: item.kind === "module" ? (item.data as LearningModule).duration ?? "" : "15 min",
        referenceId: refId,
      };
      setSteps((prev) => [...prev, step]);
    },
    [addedIds, steps.length]
  );

  const removeStep = (idx: number) => setSteps((prev) => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i + 1 })));
  const moveStep = (from: number, to: number) => {
    if (to < 0 || to >= steps.length) return;
    setSteps((prev) => {
      const arr = [...prev];
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      return arr.map((s, i) => ({ ...s, order: i + 1 }));
    });
  };

  const handleCreate = () => {
    if (!title.trim() || steps.length === 0) return;
    const id = `st-${Date.now()}`;
    addSkillTargets([
      {
        id,
        title: title.trim(),
        description: description.trim(),
        category: "Custom",
        assignedTo: [user.id],
        steps: steps.map((s, i) => ({ ...s, order: i + 1, status: i === 0 ? "available" : "locked" })),
        progress: 0,
      },
    ]);
    navigate(`/skill-target/${id}`);
  };

  // Filter results in chat messages
  const filterResults = (items: ContentItem[]) => {
    if (contentFilter === "all") return items;
    return items.filter((i) => {
      if (contentFilter === "modules") return i.kind === "module";
      if (contentFilter === "assessments") return i.kind === "assessment";
      return i.kind === "roleplay";
    });
  };

  const addAssessmentStep = (assessment: { title: string; questions: { id: string; question: string; options: string[]; correctIndex: number }[]; passingScore: number; linkedModuleIds: string[]; skipThreshold: number }) => {
    const id = `custom-a-${Date.now()}`;
    const step: StepItem = {
      id: `builder-${Date.now()}`,
      type: "assessment",
      title: assessment.title,
      description: `Custom assessment — ${assessment.questions.length} questions, passing score ${assessment.passingScore}%`,
      order: steps.length + 1,
      skippable: false,
      status: "available",
      duration: `${Math.max(5, assessment.questions.length * 3)} min`,
      referenceId: id,
    };
    if (assessment.linkedModuleIds.length > 0 && assessment.skipThreshold > 0) {
      setSteps((prev) => {
        const updated = prev.map((s) =>
          assessment.linkedModuleIds.includes(s.referenceId)
            ? { ...s, skippable: true, skipCondition: `Assessment score > ${assessment.skipThreshold}%` }
            : s
        );
        const firstLinkedIdx = updated.findIndex((s) => assessment.linkedModuleIds.includes(s.referenceId));
        const insertIdx = firstLinkedIdx !== -1 ? firstLinkedIdx : updated.length;
        const linked = updated.filter((s) => assessment.linkedModuleIds.includes(s.referenceId));
        const rest = updated.filter((s) => !assessment.linkedModuleIds.includes(s.referenceId));
        const before = rest.slice(0, insertIdx > rest.length ? rest.length : insertIdx);
        const after = rest.slice(insertIdx > rest.length ? rest.length : insertIdx);
        return [...before, step, ...linked, ...after].map((s, i) => ({ ...s, order: i + 1 }));
      });
    } else {
      setSteps((prev) => [...prev, step].map((s, i) => ({ ...s, order: i + 1 })));
    }
    setShowAssessmentCreator(false);
  };

  /* ─── Detail view (full left panel) ─── */
  if (leftView === "detail" && selectedItem) {
    return (
      <div className="flex flex-1 min-h-0 h-full overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 border-r border-border">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-card">
            <button onClick={() => { setLeftView("chat"); setSelectedItem(null); }} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <span className="text-sm font-medium text-foreground truncate">{selectedItem.data.title}</span>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-6 max-w-2xl mx-auto">
              <ContentDetailView item={selectedItem} onAdd={() => { addStep(selectedItem); setLeftView("chat"); setSelectedItem(null); }} isAdded={addedIds.has(selectedItem.data.id)} />
            </div>
          </ScrollArea>
        </div>
        <BuilderPanel title={title} setTitle={setTitle} description={description} setDescription={setDescription} steps={steps} removeStep={removeStep} moveStep={moveStep} onCreate={handleCreate} titlePlaceholder={titlePlaceholder} descPlaceholder={descPlaceholder} />
      </div>
    );
  }

  /* ─── Chat view ─── */
  return (
    <div className="flex flex-1 min-h-0 h-full overflow-hidden">
      {/* Left: Chat */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-border relative">
        {/* Header */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-card shrink-0">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-sm font-semibold text-foreground">Content Discovery</h2>
        </div>

        {/* Scrollable results area — with bottom padding for floating input */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto pb-28">
          <div className="p-5 space-y-4 max-w-2xl mx-auto">
            {messages.map((msg, i) => (
              <div key={i}>
                {/* Thinking indicator */}
                {msg.isThinking ? (
                  <div className="flex gap-3 justify-start">
                    <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary flex items-center justify-center">
                      <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                    <div className="rounded-xl px-4 py-2.5 text-sm bg-secondary text-foreground flex items-center gap-2">
                      <motion.div
                        className="flex items-center gap-1.5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                        <span className="text-muted-foreground">Searching content library...</span>
                      </motion.div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
                      {msg.role === "assistant" && (
                        <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary flex items-center justify-center">
                          <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
                        </div>
                      )}
                      <div className={cn("rounded-xl px-4 py-2.5 text-sm max-w-[80%]", msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground")}>
                        {msg.role === "assistant" ? (
                          <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-0.5 prose-ul:my-1 prose-li:my-0">
                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                          </div>
                        ) : msg.text}
                      </div>
                    </div>
                    {/* Results list */}
                    {msg.results && msg.results.length > 0 && (
                      <div className="mt-3 ml-10">
                        <div className="flex gap-1.5 mb-3 flex-wrap">
                          {(["all", "modules", "assessments", "roleplays"] as ContentFilter[]).map((f) => (
                            <button
                              key={f}
                              onClick={() => setContentFilter(f)}
                              className={cn("rounded-full px-3 py-1 text-xs font-medium transition-colors", contentFilter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground")}
                            >
                              {f === "all" ? "All" : f === "modules" ? "Modules" : f === "assessments" ? "Assessments" : "Role Plays"}
                            </button>
                          ))}
                        </div>
                        <div className="space-y-2">
                          {filterResults(msg.results).map((item, j) => {
                            const id = item.data.id;
                            const added = addedIds.has(id);
                            return (
                              <motion.div
                                key={j}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: j * 0.03 }}
                                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:bg-secondary/50 transition-colors cursor-pointer group"
                                onClick={() => { setSelectedItem(item); setLeftView("detail"); }}
                              >
                                <div className="flex-shrink-0 h-8 w-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                                  {contentIcon(item.kind)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">{item.data.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {contentLabel(item.kind)}
                                    {item.kind === "module" && (item.data as LearningModule).duration && ` · ${(item.data as LearningModule).duration}`}
                                    {item.kind === "module" && ` · ${(item.data as LearningModule).contentType === "video" ? "Video" : "Document"}`}
                                    {item.kind === "roleplay" && ` · ${(item.data as RolePlay).difficulty}`}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant={added ? "secondary" : "default"}
                                  className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => { e.stopPropagation(); addStep(item); }}
                                  disabled={added}
                                >
                                  {added ? "Added" : "Add"}
                                </Button>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}

            {/* Suggestion pills — show after welcome, before user searches */}
            {!pillsUsed && messages.length === 1 && (
              <div className="ml-10">
                <p className="text-xs text-muted-foreground mb-2">Suggested topics:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestionPills.map((pill) => (
                    <button
                      key={pill}
                      onClick={() => handleSend(pill)}
                      className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                    >
                      {pill}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Assessment Creator */}
            {showAssessmentCreator && (
              <div className="ml-10">
                <AssessmentCreator
                  existingModules={steps.filter((s) => s.type === "module")}
                  onAdd={addAssessmentStep}
                  onCancel={() => setShowAssessmentCreator(false)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Floating input bar — PINNED AT BOTTOM */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-3 bg-gradient-to-t from-background via-background to-transparent">
          <div className="flex items-center gap-2 max-w-2xl mx-auto rounded-2xl border border-border bg-card px-3 py-2.5 shadow-lg">
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex-shrink-0 h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              title="Upload content"
            >
              <Upload className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowAssessmentCreator(true)}
              className="flex-shrink-0 h-8 px-3 rounded-lg bg-secondary flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              title="Create assessment"
            >
              <ClipboardCheck className="h-3.5 w-3.5" />
              Assessment
            </button>
            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={inputPlaceholder}
                className="pr-10 h-8 text-sm border-0 shadow-none focus-visible:ring-0"
                disabled={isSearching}
              />
              <button
                onClick={() => handleSend()}
                disabled={isSearching}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Builder */}
      <BuilderPanel title={title} setTitle={setTitle} description={description} setDescription={setDescription} steps={steps} removeStep={removeStep} moveStep={moveStep} onCreate={handleCreate} titlePlaceholder={titlePlaceholder} descPlaceholder={descPlaceholder} />

      {/* Upload Modal */}
      <UploadModal open={showUploadModal} onClose={() => setShowUploadModal(false)} addedIds={addedIds} onAdd={(items) => items.forEach((item) => addStep(item))} />
    </div>
  );
}

/* ── Upload Modal ── */
function UploadModal({ open, onClose, addedIds, onAdd }: { open: boolean; onClose: () => void; addedIds: Set<string>; onAdd: (items: ContentItem[]) => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const allModules: ContentItem[] = defaultLearningModules.map((m) => ({ kind: "module" as const, data: m }));
  const allRolePlays: ContentItem[] = defaultRolePlayBank.map((r) => ({ kind: "roleplay" as const, data: r }));
  const allItems = [...allModules, ...allRolePlays];

  const filtered = search.trim()
    ? allItems.filter((item) => item.data.title.toLowerCase().includes(search.toLowerCase()))
    : allItems;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleAdd = () => {
    const toAdd = filtered.filter((item) => selected.has(item.data.id) && !addedIds.has(item.data.id));
    onAdd(toAdd);
    setSelected(new Set());
    setSearch("");
    onClose();
  };

  const selectableCount = filtered.filter((item) => !addedIds.has(item.data.id)).length;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); setSelected(new Set()); setSearch(""); } }}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base">Add Content from Library</DialogTitle>
        </DialogHeader>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search modules and role plays..."
          className="h-9 text-sm"
        />
        <ScrollArea className="flex-1 -mx-6 px-6" style={{ maxHeight: "400px" }}>
          <div className="space-y-1">
            {filtered.map((item) => {
              const added = addedIds.has(item.data.id);
              const checked = selected.has(item.data.id);
              return (
                <label
                  key={item.data.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg p-2.5 cursor-pointer transition-colors",
                    added ? "opacity-50 cursor-not-allowed" : "hover:bg-secondary/50",
                    checked && !added && "bg-primary/5 border border-primary/20 rounded-lg"
                  )}
                >
                  <Checkbox
                    checked={checked || added}
                    disabled={added}
                    onCheckedChange={() => !added && toggle(item.data.id)}
                  />
                  <div className="flex-shrink-0 h-7 w-7 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                    {contentIcon(item.kind)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.data.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {contentLabel(item.kind)}
                      {item.kind === "module" && (item.data as LearningModule).duration && ` · ${(item.data as LearningModule).duration}`}
                    </p>
                  </div>
                  {added && <Badge variant="secondary" className="text-[0.65rem]">Added</Badge>}
                </label>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No content found</p>
            )}
          </div>
        </ScrollArea>
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">{selected.size} selected</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleAdd} disabled={selected.size === 0}>
              Add {selected.size > 0 ? `(${selected.size})` : ""}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Right panel component ── */
function BuilderPanel({
  title, setTitle, description, setDescription, steps, removeStep, moveStep, onCreate, titlePlaceholder, descPlaceholder,
}: {
  title: string; setTitle: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  steps: StepItem[]; removeStep: (i: number) => void;
  moveStep: (from: number, to: number) => void;
  onCreate: () => void;
  titlePlaceholder?: string;
  descPlaceholder?: string;
}) {
  return (
    <div className="w-[400px] flex-shrink-0 flex flex-col bg-background">
      <div className="px-5 py-3 border-b border-border bg-card">
        <h2 className="text-sm font-semibold text-foreground">Skill Target Builder</h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-5 space-y-5">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Name</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={titlePlaceholder || "e.g. Customer Support Fundamentals"} className="h-9 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={descPlaceholder || "Describe what this skill target covers..."} className="text-sm min-h-[60px]" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-muted-foreground">Steps ({steps.length})</label>
            </div>
            {steps.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">No steps added yet. Use the chat to search and add content.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <AnimatePresence>
                  {steps.map((step, i) => (
                    <motion.div
                      key={step.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex items-center gap-2 rounded-lg border border-border bg-card p-2.5 group"
                    >
                      <div className="flex flex-col gap-0.5 flex-shrink-0">
                        <button onClick={() => moveStep(i, i - 1)} disabled={i === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button onClick={() => moveStep(i, i + 1)} disabled={i === steps.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </div>
                      <GripVertical className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                      <div className="flex-shrink-0 h-7 w-7 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                        {step.type === "module" ? <BookOpen className="h-3.5 w-3.5" /> : step.type === "assessment" ? <ClipboardCheck className="h-3.5 w-3.5" /> : <Drama className="h-3.5 w-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{step.title}</p>
                        <p className="text-[0.65rem] text-muted-foreground">
                          {step.type === "module" ? "Module" : step.type === "assessment" ? "Assessment" : "Role Play"}
                          {step.duration && ` · ${step.duration}`}
                          {step.skippable && step.skipCondition && (
                            <span className="text-orange-500 ml-1">· Skip: {step.skipCondition}</span>
                          )}
                        </p>
                      </div>
                      <button onClick={() => removeStep(i)} className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
      <div className="border-t border-border bg-card px-5 py-3">
        <Button onClick={onCreate} disabled={!title.trim() || steps.length === 0} className="w-full h-9 text-sm">
          Create Skill Target
        </Button>
      </div>
    </div>
  );
}

/* ── Content detail view ── */
function ContentDetailView({ item, onAdd, isAdded }: { item: ContentItem; onAdd: () => void; isAdded: boolean }) {
  if (item.kind === "module") {
    const m = item.data as LearningModule;
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">{m.contentType === "video" ? "Video" : "Document"}</Badge>
          {m.duration && <span className="text-xs text-muted-foreground">{m.duration}</span>}
        </div>
        <h3 className="text-lg font-semibold text-foreground">{m.title}</h3>
        {m.contentType === "video" ? (
          <div className="relative rounded-xl overflow-hidden aspect-video bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-primary/80 flex items-center justify-center">
              <Play className="h-7 w-7 text-primary-foreground ml-1" />
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-6 space-y-2">
            <FileText className="h-10 w-10 text-muted-foreground mb-3" />
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-2.5 rounded-full bg-muted" style={{ width: `${60 + Math.random() * 40}%` }} />
            ))}
          </div>
        )}
        {m.transcript && (
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Transcript</h4>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{m.transcript}</p>
          </div>
        )}
        <Button onClick={onAdd} disabled={isAdded} className="w-full">
          {isAdded ? "Already Added" : "Add to Skill Target"}
        </Button>
      </div>
    );
  }

  if (item.kind === "assessment") {
    const a = item.data as Assessment;
    return (
      <div className="space-y-5">
        <Badge variant="secondary" className="text-xs">{a.type === "pre" ? "Pre-Assessment" : "Post-Assessment"}</Badge>
        <h3 className="text-lg font-semibold text-foreground">{a.title}</h3>
        <div className="text-sm text-muted-foreground">Passing score: {a.passingScore}%</div>
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">Questions ({a.questions.length})</h4>
          {a.questions.map((q, i) => (
            <div key={q.id} className="rounded-lg border border-border bg-card p-3">
              <p className="text-sm font-medium text-foreground mb-2">{i + 1}. {q.question}</p>
              <div className="space-y-1">
                {q.options.map((opt, oi) => (
                  <div key={oi} className={cn("text-xs px-2 py-1 rounded", oi === q.correctIndex ? "bg-green-500/10 text-green-600 font-medium" : "text-muted-foreground")}>
                    {opt}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <Button onClick={onAdd} disabled={isAdded} className="w-full">
          {isAdded ? "Already Added" : "Add to Skill Target"}
        </Button>
      </div>
    );
  }

  const r = item.data as RolePlay;
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs">{r.difficulty}</Badge>
        {r.tags.map((t) => (
          <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
        ))}
      </div>
      <h3 className="text-lg font-semibold text-foreground">{r.title}</h3>
      <div>
        <h4 className="text-sm font-medium text-foreground mb-2">Scenario</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">{r.scenario}</p>
      </div>
      <div className="rounded-lg border border-border bg-card p-4 space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">AI Configuration</h4>
        <p className="text-sm text-foreground"><span className="font-medium">Persona:</span> {r.aiCloneConfig.persona}</p>
        <p className="text-sm text-foreground"><span className="font-medium">Context:</span> {r.aiCloneConfig.context}</p>
      </div>
      <Button onClick={onAdd} disabled={isAdded} className="w-full">
        {isAdded ? "Already Added" : "Add to Skill Target"}
      </Button>
    </div>
  );
}

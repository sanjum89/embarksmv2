import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageSquare, ThumbsUp, ThumbsDown, Link2, X, Maximize2, Download, Layers } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useUser } from "@/contexts/UserContext";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { mockNewHires, mockProgramContexts } from "@/data/mock";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import NewHiresPanel from "@/components/manager/NewHiresPanel";
import TrainingAssignPanel from "@/components/manager/TrainingAssignPanel";
import AssignedPanel from "@/components/manager/AssignedPanel";
import ProgressPanel from "@/components/manager/ProgressPanel";

/* ─── Card illustration SVGs ─── */
const CardIllustration = ({ type }: { type: string }) => {
  const illustrations: Record<string, React.ReactNode> = {
    hires: (
      <svg viewBox="0 0 120 80" className="w-full h-full">
        <path d="M20 55 Q30 20 60 30 Q90 40 100 55" stroke="hsl(var(--primary))" strokeWidth="2" fill="none" opacity="0.3" />
        <path d="M20 60 Q40 30 60 40 Q80 50 100 60" stroke="hsl(var(--primary))" strokeWidth="2.5" fill="none" opacity="0.5" />
        <circle cx="60" cy="35" r="3" fill="hsl(var(--primary))" opacity="0.4" />
        <circle cx="85" cy="48" r="2.5" fill="hsl(var(--primary))" opacity="0.3" />
      </svg>
    ),
    reports: (
      <svg viewBox="0 0 120 80" className="w-full h-full">
        <line x1="25" y1="30" x2="95" y2="30" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.3" />
        <line x1="25" y1="42" x2="85" y2="42" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.25" />
        <line x1="25" y1="54" x2="75" y2="54" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.2" />
        <rect x="25" y="24" width="6" height="6" rx="1" fill="hsl(var(--primary))" opacity="0.4" />
        <rect x="25" y="36" width="6" height="6" rx="1" fill="hsl(var(--primary))" opacity="0.3" />
        <rect x="25" y="48" width="6" height="6" rx="1" fill="hsl(var(--primary))" opacity="0.2" />
      </svg>
    ),
    mobility: (
      <svg viewBox="0 0 120 80" className="w-full h-full">
        <rect x="45" y="15" width="30" height="12" rx="3" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="hsl(var(--primary))" fillOpacity="0.1" />
        <rect x="20" y="45" width="30" height="12" rx="3" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="hsl(var(--primary))" fillOpacity="0.1" />
        <rect x="70" y="45" width="30" height="12" rx="3" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="hsl(var(--primary))" fillOpacity="0.1" />
        <line x1="50" y1="27" x2="35" y2="45" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.3" />
        <line x1="70" y1="27" x2="85" y2="45" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.3" />
      </svg>
    ),
    gaps: (
      <svg viewBox="0 0 120 80" className="w-full h-full">
        <rect x="20" y="50" width="12" height="20" rx="2" fill="hsl(var(--primary))" opacity="0.2" />
        <rect x="38" y="35" width="12" height="35" rx="2" fill="hsl(var(--primary))" opacity="0.3" />
        <rect x="56" y="25" width="12" height="45" rx="2" fill="hsl(var(--primary))" opacity="0.4" />
        <rect x="74" y="40" width="12" height="30" rx="2" fill="hsl(var(--primary))" opacity="0.35" />
        <rect x="92" y="20" width="12" height="50" rx="2" fill="hsl(var(--primary))" opacity="0.5" />
      </svg>
    ),
    evolution: (
      <svg viewBox="0 0 120 80" className="w-full h-full">
        <path d="M15 60 Q35 50 50 40 Q65 30 80 35 Q95 40 110 20" stroke="hsl(var(--primary))" strokeWidth="2" fill="none" opacity="0.4" />
        <path d="M15 65 Q35 55 50 50 Q65 45 80 42 Q95 39 110 30" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="none" opacity="0.25" strokeDasharray="4 3" />
      </svg>
    ),
    roles: (
      <svg viewBox="0 0 120 80" className="w-full h-full">
        {[0,1,2,3].map(r => [0,1,2,3].map(c => (
          <rect key={`${r}-${c}`} x={25 + c * 20} y={15 + r * 16} width="14" height="10" rx="2"
            fill="hsl(var(--primary))" opacity={0.1 + Math.random() * 0.3} />
        )))}
      </svg>
    ),
  };
  return <div className="w-full h-16 sm:h-20">{illustrations[type]}</div>;
};

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  topicLabel?: string;
  panel?: "new_hires" | "assign_training" | "assigned" | "progress";
  suggestions?: string[];
}

const suggestionCards = [
  { label: "New hires added to your team", prompt: "Show me my new hires", illustration: "hires" },
  { label: "View my direct reports and their profiles", prompt: "View my direct reports", illustration: "reports" },
  { label: "Talent mobility & redeployment", prompt: "Show me talent mobility options", illustration: "mobility" },
  { label: "Organizational skill gaps", prompt: "Show me organizational skill gaps", illustration: "gaps" },
  { label: "See workforce skill evolution", prompt: "See workforce skill evolution", illustration: "evolution" },
  { label: "Analyze the job roles in my org", prompt: "Analyze job roles in my organization", illustration: "roles" },
];

function generateResponse(prompt: string, skillTargets: any[]): Omit<ChatMessage, "id"> {
  const lower = prompt.toLowerCase();

  if (lower.includes("new hire")) {
    return {
      role: "assistant",
      topicLabel: "New Hires Overview",
      content: `You have **${mockNewHires.length} new hires** added to your team:\n\n${mockNewHires.map((h, i) => `${i + 1}. **${h.user.name}** — ${h.title}, ${h.location} (${h.yearsExperience} yrs exp)`).join("\n")}\n\nI've loaded their details in the panel on the right. You can review each hire's skills, experience, and training status.`,
      panel: "new_hires",
      suggestions: ["Assign Maya to Apple L1", "Show me Maya's progress", "Show me organizational skill gaps"],
    };
  }

  if (lower.includes("assign") && (lower.includes("apple l1") || lower.includes("training"))) {
    return {
      role: "assistant",
      topicLabel: "Training Assigned",
      content: `✅ **Apple L1 Customer Support Readiness** has been assigned to **${mockNewHires.length} new hires**:\n\n${mockNewHires.map((h) => `- **${h.user.name}** — ${h.title}, ${h.location}`).join("\n")}\n\nThe training includes ${mockProgramContexts[0].assignedLearners.length} chapters with adaptive skipping enabled. Assessment pass threshold is set to **${mockProgramContexts[0].assessmentPassPercentage}%**.\n\nYou can view the full assignment details in the panel on the right.`,
      panel: "assigned",
      suggestions: ["Show me Maya's progress", "Show me program context", "Show me my new hires"],
    };
  }

  if (lower.includes("maya") && lower.includes("progress")) {
    const st4 = skillTargets.find((st) => st.id === "st4");
    if (st4) {
      const completed = st4.steps.filter((s: any) => s.status === "completed").length;
      const skipped = st4.steps.filter((s: any) => s.status === "skipped").length;
      const current = st4.steps.find((s: any) => s.status === "available" || s.status === "in_progress");
      return {
        role: "assistant",
        topicLabel: "Learner Progress",
        content: `**Maya Thompson's Progress — Apple L1 Customer Support Readiness**\n\n- **Overall:** ${st4.progress}% complete\n- **Steps completed:** ${completed}/${st4.steps.length}${skipped > 0 ? ` (${skipped} skipped)` : ""}\n- **Current step:** ${current ? current.title : "All complete"}\n\nDetailed timeline is shown in the panel.`,
        panel: "progress",
        suggestions: ["Assign Maya to Apple L1", "Show me my new hires"],
      };
    }
  }

  if (lower.includes("direct report")) {
    return {
      role: "assistant",
      topicLabel: "Direct Reports",
      content: `You have **${mockNewHires.length} direct reports** in the Apple Support Program:\n\n${mockNewHires.map((h, i) => `- **${h.user.name}** — ${h.title}, ${h.location}`).join("\n")}\n\nSelect a team member to view their profile and training progress.`,
      panel: "new_hires",
      suggestions: ["Show me Maya's progress", "Assign training to my new hires"],
    };
  }

  return {
    role: "assistant",
    content: `I can help you with:\n- **New hires** — view your team additions\n- **Assign training** — set up and assign modules\n- **Progress tracking** — see how learners are doing\n- **Skill gaps** — identify areas for development\n\nTry clicking one of the suggestion cards or ask me directly!`,
    suggestions: ["Show me my new hires", "Show me Maya's progress", "Assign Maya to Apple L1"],
  };
}

/* ─── Thinking Indicator ─── */
function ThinkingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground"
    >
      <div className="flex gap-1">
        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0 }} className="h-1.5 w-1.5 rounded-full bg-primary" />
        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }} className="h-1.5 w-1.5 rounded-full bg-primary" />
        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }} className="h-1.5 w-1.5 rounded-full bg-primary" />
      </div>
      <span className="text-xs italic">Thinking...</span>
    </motion.div>
  );
}

export default function ManagerView() {
  const { user } = useUser();
  const { skillTargets } = useSkillTargets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Programs available for mention
  const mentionablePrograms = mockProgramContexts.map((pc) => ({
    id: pc.id,
    name: pc.name,
    category: pc.category,
    skillTargetId: pc.skillTargetId,
  }));

  const filteredPrograms = useMemo(() => {
    if (!mentionFilter) return mentionablePrograms;
    const lower = mentionFilter.toLowerCase();
    return mentionablePrograms.filter((p) => p.name.toLowerCase().includes(lower));
  }, [mentionFilter, mentionablePrograms]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // Detect typing to trigger mention popup
  const handleInputChange = (value: string) => {
    setInput(value);
    // Check if user is typing something that looks like a program name
    const words = value.toLowerCase();
    if (words.includes("apple") || words.includes("l1") || words.includes("program")) {
      setMentionFilter(value.split(/\s+/).pop() || "");
      setShowMentionPopup(true);
    } else {
      setShowMentionPopup(false);
    }
  };

  const insertMention = (programName: string) => {
    // Replace the trigger text with the program mention
    const beforeText = input.replace(/\b(apple|l1|program)\S*/gi, "").trim();
    const newInput = beforeText ? `${beforeText} [${programName}]` : `Assign [${programName}] to new hires`;
    setInput(newInput);
    setShowMentionPopup(false);
    inputRef.current?.focus();
  };

  const handleSend = useCallback((prompt: string) => {
    if (!prompt.trim() || isThinking) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: prompt };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setShowMentionPopup(false);
    setIsThinking(true);

    setTimeout(() => {
      const responseData = generateResponse(prompt, skillTargets);
      const response: ChatMessage = { id: (Date.now() + 1).toString(), ...responseData };
      setMessages((prev) => [...prev, response]);
      if (response.panel) setActivePanel(response.panel);
      setIsThinking(false);
    }, 2000);
  }, [isThinking, skillTargets]);

  const firstName = user.name.split(" ")[0];
  const showHome = messages.length === 0;

  return (
    <div className="flex flex-1 h-full min-h-0">
      {/* Left: Chat */}
      <div className={cn("flex flex-col min-h-0 flex-1 transition-all duration-300", activePanel ? "w-[55%]" : "w-full")}>
        <div className="flex-1 overflow-y-auto">
          {showHome ? (
            <div className="flex flex-col items-center justify-center min-h-full px-6">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[540px] pt-16 pb-8">
                <h1 className="font-display text-[28px] font-bold text-foreground mb-8">
                  Hi {firstName}, let's dive in
                </h1>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  {suggestionCards.map((card, i) => (
                    <motion.button
                      key={card.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 + i * 0.04 }}
                      onClick={() => handleSend(card.prompt)}
                      className="flex flex-col rounded-xl border border-border bg-card p-3 text-left hover:shadow-md hover:border-primary/30 transition-all group"
                    >
                      <div className="bg-primary/5 rounded-lg p-2 mb-3">
                        <CardIllustration type={card.illustration} />
                      </div>
                      <span className="text-[13px] font-medium text-foreground leading-snug">{card.label}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="max-w-[600px] mx-auto px-6 py-6 space-y-4">
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {msg.role === "user" ? (
                      <div className="flex justify-end mb-1">
                        <div className="rounded-xl bg-muted px-4 py-2.5 text-sm text-foreground max-w-[85%]">
                          {msg.content}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Topic pill */}
                        {msg.topicLabel && (
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-accent" />
                            <div className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-primary-foreground text-xs font-medium">
                              <MessageSquare className="h-3 w-3" />
                              {msg.topicLabel}
                            </div>
                          </div>
                        )}

                        {/* Response */}
                        <div className="prose prose-sm max-w-none text-foreground text-sm leading-relaxed">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>

                        {/* Suggestion pills */}
                        {msg.suggestions && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {msg.suggestions.map((pill) => (
                              <button
                                key={pill}
                                onClick={() => handleSend(pill)}
                                className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-secondary hover:border-primary/30 transition-colors"
                              >
                                {pill}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Feedback row */}
                        <div className="flex items-center gap-3 pt-1">
                          <button className="text-muted-foreground hover:text-foreground transition-colors">
                            <ThumbsUp className="h-3.5 w-3.5" />
                          </button>
                          <button className="text-muted-foreground hover:text-foreground transition-colors">
                            <ThumbsDown className="h-3.5 w-3.5" />
                          </button>
                          <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-xs">
                            <Link2 className="h-3.5 w-3.5" />
                            Source
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Thinking */}
              <AnimatePresence>
                {isThinking && <ThinkingIndicator />}
              </AnimatePresence>

              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="px-6 pb-4 pt-2">
          <div className="max-w-[540px] mx-auto">
            {showHome && (
              <p className="text-xs font-medium text-primary mb-2">Or ask a question about</p>
            )}
            <div className="relative">
              {/* Mention autocomplete popup */}
              <AnimatePresence>
                {showMentionPopup && filteredPrograms.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="absolute bottom-full mb-2 left-0 right-0 z-20 rounded-xl border border-border bg-card shadow-lg overflow-hidden"
                  >
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Programs</p>
                    </div>
                    {filteredPrograms.map((program) => (
                      <button
                        key={program.id}
                        onClick={() => insertMention(program.name)}
                        className="flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-secondary/70 transition-colors"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                          <Layers className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{program.name}</p>
                          <p className="text-[10px] text-muted-foreground">{program.category}</p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (showMentionPopup && filteredPrograms.length > 0) {
                      insertMention(filteredPrograms[0].name);
                    } else {
                      handleSend(input);
                    }
                  }
                  if (e.key === "Escape") setShowMentionPopup(false);
                }}
                placeholder={showHome ? "Diversity across departments" : "Reply..."}
                className="pr-20 h-11 rounded-xl border-border"
                disabled={isThinking}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => handleSend(input)}
                  disabled={!input.trim() || isThinking}
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              AI can make mistakes. Check for accuracy.
            </p>
          </div>
        </div>
      </div>

      {/* Right: Context Panel */}
      <AnimatePresence>
        {activePanel && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-[45%] border-l border-border bg-card min-h-0 flex-1 overflow-y-auto relative flex flex-col"
          >
            {/* Panel toolbar */}
            <div className="sticky top-0 z-10 flex items-center justify-end gap-1 p-3 bg-card/80 backdrop-blur-sm border-b border-border">
              <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                <Download className="h-3.5 w-3.5" />
              </button>
              <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setActivePanel(null)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {activePanel === "new_hires" && <NewHiresPanel />}
            {activePanel === "assign_training" && (
              <TrainingAssignPanel
                onAssigned={() => {
                  const msg: ChatMessage = {
                    id: Date.now().toString(),
                    role: "assistant",
                    content: "✅ Training has been assigned successfully! The learners will see the **Apple L1 Customer Support Readiness** skill target in their dashboard.",
                    suggestions: ["Show me Maya's progress", "Show me my new hires"],
                  };
                  setMessages((prev) => [...prev, msg]);
                }}
              />
            )}
            {activePanel === "progress" && <ProgressPanel />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

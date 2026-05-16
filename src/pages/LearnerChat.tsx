import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { resolvePillAction } from "@/lib/pillActionResolver";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Home, ArrowRight, X, ChevronUp, RotateCcw, Compass, UserCircle2, Inbox, Users, BarChart3, Target, Briefcase, Activity, ClipboardList, MessageCircle, CornerDownRight } from "lucide-react";
import { ChatContextRail } from "@/components/chat/ChatContextRail";
import { VoiceDictateButton } from "@/components/chat/VoiceDictateButton";
import ReactMarkdown from "react-markdown";
import { useUser } from "@/contexts/UserContext";
import { useAgentOne, parseSuggestions } from "@/contexts/AgentOneContext";
import { InlineAssessment } from "@/components/chat/InlineAssessment";
import { RichContentBlock } from "@/components/chat/RichContentBlock";
import { CollapsedBlockCard } from "@/components/chat/CollapsedBlockCard";
import { SuperAgentCard } from "@/components/chat/SuperAgentCard";
import { NudgeStack } from "@/components/chat/OnboardingNudge";
import { AgentOneNudgeStack } from "@/components/chat/AgentOneNudgeStack";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ─── Suggestion Card Illustrations ─── */
const CardIllustration = ({ type }: { type: string }) => {
  const illustrations: Record<string, React.ReactNode> = {
    skills: (
      <svg viewBox="0 0 120 80" className="w-full h-full">
        <rect x="20" y="50" width="12" height="20" rx="2" fill="hsl(var(--primary))" opacity="0.2" />
        <rect x="38" y="35" width="12" height="35" rx="2" fill="hsl(var(--primary))" opacity="0.3" />
        <rect x="56" y="25" width="12" height="45" rx="2" fill="hsl(var(--primary))" opacity="0.4" />
        <rect x="74" y="40" width="12" height="30" rx="2" fill="hsl(var(--primary))" opacity="0.35" />
        <rect x="92" y="20" width="12" height="50" rx="2" fill="hsl(var(--primary))" opacity="0.5" />
      </svg>
    ),
    profile: (
      <svg viewBox="0 0 120 80" className="w-full h-full">
        <circle cx="60" cy="30" r="12" stroke="hsl(var(--primary))" strokeWidth="2" fill="hsl(var(--primary))" fillOpacity="0.1" />
        <line x1="30" y1="55" x2="90" y2="55" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.25" />
        <line x1="35" y1="63" x2="85" y2="63" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.2" />
        <line x1="40" y1="71" x2="80" y2="71" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.15" />
      </svg>
    ),
    career: (
      <svg viewBox="0 0 120 80" className="w-full h-full">
        <path d="M15 60 Q35 50 50 40 Q65 30 80 35 Q95 40 110 20" stroke="hsl(var(--primary))" strokeWidth="2" fill="none" opacity="0.4" />
        <path d="M15 65 Q35 55 50 50 Q65 45 80 42 Q95 39 110 30" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="none" opacity="0.25" strokeDasharray="4 3" />
      </svg>
    ),
    activities: (
      <svg viewBox="0 0 120 80" className="w-full h-full">
        <line x1="25" y1="30" x2="95" y2="30" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.3" />
        <line x1="25" y1="42" x2="85" y2="42" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.25" />
        <line x1="25" y1="54" x2="75" y2="54" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.2" />
        <rect x="25" y="24" width="6" height="6" rx="1" fill="hsl(var(--primary))" opacity="0.4" />
        <rect x="25" y="36" width="6" height="6" rx="1" fill="hsl(var(--primary))" opacity="0.3" />
        <rect x="25" y="48" width="6" height="6" rx="1" fill="hsl(var(--primary))" opacity="0.2" />
      </svg>
    ),
    reflection: (
      <svg viewBox="0 0 120 80" className="w-full h-full">
        <rect x="30" y="20" width="60" height="40" rx="6" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="hsl(var(--primary))" fillOpacity="0.08" />
        <line x1="40" y1="32" x2="80" y2="32" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.3" />
        <line x1="40" y1="40" x2="75" y2="40" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.25" />
        <line x1="40" y1="48" x2="65" y2="48" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.2" />
      </svg>
    ),
    required: (
      <svg viewBox="0 0 120 80" className="w-full h-full">
        {[0, 1, 2, 3].map((r) =>
          [0, 1, 2, 3].map((c) => (
            <rect
              key={`${r}-${c}`}
              x={25 + c * 20}
              y={15 + r * 16}
              width="14"
              height="10"
              rx="2"
              fill="hsl(var(--primary))"
              opacity={0.15 + ((r * 4 + c) % 5) * 0.08}
            />
          ))
        )}
      </svg>
    ),
  };
  return <div className="w-full h-16 sm:h-20">{illustrations[type]}</div>;
};

const suggestionCards = [
  { label: "Grow My Skills", description: "Get recommendations for growing your skills.", prompt: "Show me recommendations for growing my skills", illustration: "skills", icon: BarChart3 },
  { label: "Required Skills", description: "Required skills for your job role.", prompt: "Show me the required skills for my role", illustration: "required", icon: Target },
  { label: "Explore Career Paths", description: "Discover potential career paths.", prompt: "Explore career paths based on my current skills", illustration: "career", icon: Briefcase },
  { label: "View My Activities", description: "Track your recent activities.", prompt: "Show me my recent learning activities", illustration: "activities", icon: Activity },
  { label: "Build Your Profile", description: "Upload resume to build your profile.", prompt: "Help me build my professional profile", illustration: "profile", icon: UserCircle2 },
  { label: "Create a Reflection", description: "Reflect on your learning journey.", prompt: "Help me create a reflection on my recent learning", illustration: "reflection", icon: ClipboardList },
];

const quickLinks = [
  { label: "Embark AI", path: "/", icon: Compass, desc: "Your guided learning journey" },
  { label: "My 360", path: "/my-360", icon: UserCircle2, desc: "Profile, skills, gaps" },
  { label: "Action Centre", path: "/action-centre", icon: Inbox, desc: "Tasks and reflections" },
  { label: "Cohort", path: "/cohort", icon: Users, desc: "Your group and peers" },
];

function ThinkingIndicator() {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-start gap-2 px-1 py-2">
      <div className="shrink-0 h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
        <Sparkles className="h-3 w-3 text-primary" />
      </div>
      <div className="flex items-center gap-2 pt-1">
        <div className="flex gap-1">
          {[0, 0.2, 0.4].map((d) => (
            <motion.div key={d} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: d }} className="h-1.5 w-1.5 rounded-full bg-primary" />
          ))}
        </div>
        <span className="text-[0.7rem] italic text-muted-foreground">Thinking...</span>
      </div>
    </motion.div>
  );
}

export default function LearnerChat() {
  const { user } = useUser();
  const {
    messages,
    suggestions,
    contextualSuggestions,
    input,
    setInput,
    isStreaming,
    isOpen,
    setIsOpen,
    handleSend,
    handleReset,
    showInlineAssessment,
    assessmentCompleted,
    handleInlineAssessmentComplete,
    loaded,
    richBlocksMap,
    collapsedBlockIds,
    toggleBlockCollapse,
  } = useAgentOne();
  const navigate = useNavigate();
  const { skillTargets } = useSkillTargets();

  const [chatActive, setChatActive] = useState(false);
  const [dismissedNudgeIds] = useState<Set<string>>(new Set());
  const [ctaLabel, setCtaLabel] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastUserMsgRef = useRef<HTMLDivElement>(null);
  const openedFromCta = useRef(false);
  const isNearBottom = useRef(true);
  const prevMsgCount = useRef(0);
  const prevIsStreaming = useRef(false);

  const firstName = user.name.split(" ")[0];
  const hasMessages = messages.filter((m) => m.role !== "system").length > 0;
  const isActive = chatActive;

  // Derive CTA label from prompt content
  const deriveCTALabel = (prompt: string): string => {
    const lower = prompt.toLowerCase();
    if (lower.includes("onboarding")) return "Starting your onboarding journey";
    if (lower.includes("reflection")) return "Opening reflection request";
    if (lower.includes("skill") || lower.includes("target")) return "Loading your assigned targets";
    return "Agent One is responding...";
  };

  // Scroll to bottom helper
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const container = messagesContainerRef.current;
        if (container) {
          container.scrollTo({ top: container.scrollHeight, behavior });
        }
        chatEndRef.current?.scrollIntoView({ behavior, block: "end" });
      });
    });
  }, []);

  // Scroll so the last user message is at the TOP of the viewport (for CTA-triggered flows)
  const scrollToLastUserMessage = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        lastUserMsgRef.current?.scrollIntoView({ behavior: "auto", block: "start" });
      });
    });
  }, []);

  // Handle scroll on messages container — near-bottom detection
  const handleMessagesScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottom.current = distanceFromBottom < 80;
  }, []);

  // When nudge card is clicked, activate chat mode
  const handleNudgeClick = () => {
    setChatActive(true);
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Send via suggestion card also activates chat (treated as CTA)
  const handleCardSend = (prompt: string) => {
    openedFromCta.current = true;
    prevMsgCount.current = messages.length;
    setCtaLabel(deriveCTALabel(prompt));
    setChatActive(true);
    setIsOpen(true);
    handleSend(prompt);
  };

  // Normal auto-scroll: only when near bottom
  useEffect(() => {
    if (isNearBottom.current) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isStreaming]);

  // CTA dual scroll: second scroll when streaming starts after CTA
  useEffect(() => {
    if (openedFromCta.current && isStreaming && !prevIsStreaming.current) {
      scrollToLastUserMessage();
    }
    prevIsStreaming.current = isStreaming;
  }, [isStreaming, scrollToLastUserMessage]);

  // CTA first scroll: wait until the chat panel has mounted before jumping down
  useEffect(() => {
    if (isActive && openedFromCta.current) {
      scrollToLastUserMessage();
    }
  }, [isActive, scrollToLastUserMessage]);

  // CTA context cleanup: clear after first assistant response is rendered
  useEffect(() => {
    const currentMsgCount = messages.length;
    if (openedFromCta.current && currentMsgCount > prevMsgCount.current) {
      // A new message appeared — check if streaming just ended (response complete)
      if (!isStreaming) {
        openedFromCta.current = false;
        setCtaLabel(null);
      }
    }
    // Also handle error/cancel: streaming stopped without new messages
    if (openedFromCta.current && !isStreaming && prevIsStreaming.current && currentMsgCount === prevMsgCount.current) {
      openedFromCta.current = false;
      setCtaLabel(null);
    }
    prevMsgCount.current = currentMsgCount;
  }, [messages.length, isStreaming]);

  useEffect(() => {
    if (isActive) inputRef.current?.focus();
  }, [isActive]);

  return (
    <div className="flex flex-1 h-full min-h-0 overflow-hidden">
      <div className="flex flex-col min-h-0 flex-1">
        <AnimatePresence mode="wait">
          {!isActive ? (
            /* ── Home State ── */
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 overflow-y-auto min-h-0"
            >
              <div className="mx-auto w-full max-w-[1180px] grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 px-4 lg:px-6 pt-8 pb-10">
                {/* ── Left rail ── */}
                <aside className="hidden lg:flex flex-col gap-6">
                  {/* Quick links */}
                  <div>
                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Quick links
                    </div>
                    <div className="space-y-1">
                      {quickLinks.map((q) => (
                        <button
                          key={q.path}
                          onClick={() => navigate(q.path)}
                          className="group w-full text-left rounded-lg border border-border/60 bg-card px-2.5 py-2 hover:border-primary/40 hover:bg-muted/40 transition-all flex items-start gap-2.5"
                        >
                          <div className="rounded-md bg-primary/10 p-1.5 text-primary shrink-0 transition-transform group-hover:scale-110">
                            <q.icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium leading-tight">{q.label}</div>
                            <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{q.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Suggested topics */}
                  <div>
                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Suggested topics
                    </div>
                    <div className="space-y-1">
                      {suggestionCards.map((card, i) => (
                        <motion.button
                          key={card.label}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.04 * i }}
                          onClick={() => handleCardSend(card.prompt)}
                          title={card.description}
                          className="group w-full text-left rounded-lg border border-border/60 bg-card px-2.5 py-2 hover:border-primary/40 hover:bg-muted/40 transition-all flex items-start gap-2.5"
                        >
                          <div className="rounded-md bg-primary/10 p-1.5 text-primary shrink-0 transition-transform group-hover:scale-110">
                            <card.icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium leading-tight">{card.label}</div>
                            <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{card.description}</div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Recent prompts */}
                  {(() => {
                    const recent = messages.filter((m) => m.role === "user").slice(-5).reverse();
                    if (recent.length === 0) return null;
                    return (
                      <div>
                        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          Recent
                        </div>
                        <div className="space-y-1">
                          {recent.map((m, i) => (
                            <button
                              key={i}
                              onClick={() => handleCardSend(m.content)}
                              className="w-full text-left rounded-lg px-2 py-1.5 hover:bg-muted/40 transition-colors flex items-center gap-2"
                            >
                              <MessageCircle className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="text-[11px] truncate text-foreground">{m.content}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </aside>

                {/* ── Main column ── */}
                <div className="min-w-0">
                  <motion.h1
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="font-display text-[1.6rem] font-bold text-foreground mb-5"
                  >
                    Hi {firstName}, let's grow together
                  </motion.h1>

                  <div className="mb-5">
                    <AgentOneNudgeStack
                      onAgentClick={handleNudgeClick}
                      onChatAction={async (prompt) => {
                        if (prompt === "__ASSESSMENT__") {
                          setChatActive(true);
                          return;
                        }
                        if (hasMessages) {
                          await handleReset(prompt);
                        }
                        openedFromCta.current = true;
                        isNearBottom.current = true;
                        setCtaLabel(deriveCTALabel(prompt));
                        setChatActive(true);
                        setIsOpen(true);
                        setTimeout(() => handleSend(prompt), 100);
                      }}
                    />
                  </div>

                  {/* Composer */}
                  <div className="relative w-full mb-3">
                    <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary pointer-events-none" />
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && input.trim()) {
                          setChatActive(true);
                          setIsOpen(true);
                          handleSend(input);
                        }
                      }}
                      placeholder="Ask anything..."
                      className="h-12 rounded-xl border-border text-[0.85rem] focus-visible:ring-primary/30 pl-9 pr-12 shadow-sm"
                      disabled={isStreaming}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className={cn(
                        "absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-lg transition-all",
                        input.trim() && "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                      )}
                      onClick={() => {
                        if (input.trim()) {
                          setChatActive(true);
                          setIsOpen(true);
                          handleSend(input);
                        }
                      }}
                      disabled={!input.trim() || isStreaming}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>

                  <p className="text-[11px] text-muted-foreground mb-6">
                    Tip: pick a suggested topic on the left, or just type your own question.
                  </p>

                  {/* Mobile suggestions — visible only when left rail is hidden */}
                  <div className="lg:hidden">
                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Suggested topics
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {suggestionCards.map((card) => (
                        <button
                          key={card.label}
                          onClick={() => handleCardSend(card.prompt)}
                          className="text-left rounded-lg border border-border/60 bg-card p-2.5 hover:border-primary/40 transition-all flex items-start gap-2"
                        >
                          <div className="rounded-md bg-primary/10 p-1.5 text-primary shrink-0">
                            <card.icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium leading-tight">{card.label}</div>
                            <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{card.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ── Chat State ── */
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col min-h-0 flex-1"
            >
              {/* Pinned Agent One header card */}
              <div className="shrink-0 px-4 pt-3 pb-2">
                <div className="max-w-[720px] mx-auto">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center gap-3 rounded-xl bg-primary text-primary-foreground px-4 py-3 shadow-md"
                  >
                    <motion.div
                      className="h-9 w-9 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center"
                      animate={{ rotate: [0, 3, -3, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Sparkles className="h-4 w-4" />
                    </motion.div>
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold leading-tight">Agent One</h3>
                          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider">Live</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-50" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
                          </span>
                          <p className="text-[0.65rem] text-primary-foreground/75">Online now</p>
                        </div>
                      </div>
                      <button
                        onClick={async () => { await handleReset(); setChatActive(false); }}
                        disabled={isStreaming || !hasMessages}
                        className="text-primary-foreground/60 hover:text-primary-foreground disabled:opacity-30 transition-colors"
                        title="Reset conversation"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => setChatActive(false)}
                      className="text-[0.7rem] text-primary-foreground/60 hover:text-primary-foreground transition-colors px-2 py-1 rounded-md hover:bg-white/10 flex items-center gap-1"
                    >
                      <Home className="h-3 w-3" />
                      Home
                    </button>
                  </motion.div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto min-h-0 relative" ref={messagesContainerRef} onScroll={handleMessagesScroll}>
                {/* Earlier messages pill */}
                {openedFromCta.current && hasMessages && !isNearBottom.current && (
                  <div className="sticky top-0 z-10 flex justify-center py-1.5">
                    <button
                      onClick={() => {
                        messagesContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="flex items-center gap-1 rounded-full bg-card border border-border shadow-sm px-3 py-1 text-[0.7rem] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ChevronUp className="h-3 w-3" />
                      Earlier messages
                    </button>
                  </div>
                )}
                <div className="max-w-[720px] mx-auto px-4 py-4 space-y-3">
                  {!loaded && (
                    <div className="flex items-center justify-center py-8">
                      <div className="flex gap-1">
                        {[0, 0.2, 0.4].map((d) => (
                          <motion.div key={d} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: d }} className="h-2 w-2 rounded-full bg-primary" />
                        ))}
                      </div>
                    </div>
                  )}

                  <AnimatePresence>
                    {messages
                      .filter((m) => m.role !== "system")
                      .map((msg, i, arr) => {
                        const msgBlocks = richBlocksMap[i] || [];
                        const isLastUserMsg = msg.role === "user" && !arr.slice(i + 1).some((m) => m.role === "user");
                        return (
                          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                            {msg.role === "user" ? (
                              <div className="flex justify-end mb-1" ref={isLastUserMsg ? lastUserMsgRef : undefined}>
                                <div className="rounded-2xl bg-primary text-primary-foreground px-3.5 py-2.5 text-[0.8rem] max-w-[75%] shadow-sm">
                                  {msg.content}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start gap-2">
                                <div className="shrink-0 h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
                                  <Sparkles className="h-3 w-3 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="bg-secondary/50 border border-border/50 rounded-2xl px-3.5 py-3 shadow-sm max-w-[90%]">
                                    <div className="prose prose-sm max-w-none text-foreground text-[0.8rem] leading-relaxed [&_p]:mb-1.5 [&_ul]:mb-1.5 [&_li]:mb-0.5">
                                      <ReactMarkdown>{parseSuggestions(msg.content).clean}</ReactMarkdown>
                                    </div>
                                  </div>
                                  {msgBlocks.map((block) =>
                                    collapsedBlockIds.has(block.id) ? (
                                      <CollapsedBlockCard key={block.id} block={block} onExpand={() => toggleBlockCollapse(block.id)} />
                                    ) : (
                                      <RichContentBlock key={block.id} block={block} onCollapse={() => toggleBlockCollapse(block.id)} />
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                  </AnimatePresence>

                  {showInlineAssessment && !assessmentCompleted && (
                    <InlineAssessment onComplete={handleInlineAssessmentComplete} />
                  )}

                  {/* CTA context label + thinking indicator */}
                  <AnimatePresence>
                    {isStreaming && (
                      <div>
                        {ctaLabel && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[0.7rem] italic text-muted-foreground mb-1 px-1">
                            {ctaLabel}
                          </motion.div>
                        )}
                        <ThinkingIndicator />
                      </div>
                    )}
                  </AnimatePresence>

                  {/* Suggestion Pills — right below last AI response */}
                  {(() => {
                    const activePills = suggestions.length > 0 ? suggestions : contextualSuggestions;
                    const visiblePills = activePills.slice(0, 4);
                    return visiblePills.length > 0 && !isStreaming ? (
                      <motion.div initial={{ opacity: 0, y: 2 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-1.5 mt-2">
                        {visiblePills.map((pill) => (
                          <button
                            key={pill}
                            onClick={() => {
                              const action = resolvePillAction(pill, skillTargets);
                              if (action) { navigate(action.navigate); } else { handleSend(pill); }
                            }}
                            className="rounded-full border border-primary/20 bg-card px-3 py-1 text-[0.7rem] font-medium text-foreground hover:bg-primary/5 hover:border-primary/40 transition-all active:scale-[0.97]"
                          >
                            {pill}
                          </button>
                        ))}
                      </motion.div>
                    ) : null;
                  })()}

                  <div ref={chatEndRef} />
                </div>
              </div>

              {/* Input Bar — Send inside input */}
              <div className="shrink-0 max-w-[720px] mx-auto w-full px-4 pb-4 pt-2">
                <div className="relative w-full">
                  <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary pointer-events-none" />
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSend(input); }}
                    placeholder="Ask anything..."
                    className="h-11 rounded-xl border-border text-[0.8rem] focus-visible:ring-primary/30 pl-9 pr-11"
                    disabled={isStreaming}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn(
                      "absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg transition-all",
                      input.trim() && "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                    )}
                    onClick={() => handleSend(input)}
                    disabled={!input.trim() || isStreaming}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Home, ArrowRight, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useUser } from "@/contexts/UserContext";
import { useAgentOne, parseSuggestions } from "@/contexts/AgentOneContext";
import { InlineAssessment } from "@/components/chat/InlineAssessment";
import { RichContentBlock } from "@/components/chat/RichContentBlock";
import { CollapsedBlockCard } from "@/components/chat/CollapsedBlockCard";
import { SuperAgentCard } from "@/components/chat/SuperAgentCard";
import { NudgeStack } from "@/components/chat/OnboardingNudge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { managerNudges, ManagerNudge } from "@/data/managerNudges";

const nudgeThemeMap: Record<ManagerNudge["colorTheme"], { bg: string; border: string; icon: string; text: string; cta: string; ctaHover: string }> = {
  blue:    { bg: "bg-blue-50/80 dark:bg-blue-950/30",   border: "border-blue-200/60 dark:border-blue-800/40",   icon: "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400",     text: "text-blue-900 dark:text-blue-100",   cta: "bg-blue-600",   ctaHover: "hover:bg-blue-700" },
  emerald: { bg: "bg-emerald-50/80 dark:bg-emerald-950/30", border: "border-emerald-200/60 dark:border-emerald-800/40", icon: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400", text: "text-emerald-900 dark:text-emerald-100", cta: "bg-emerald-600", ctaHover: "hover:bg-emerald-700" },
  amber:   { bg: "bg-amber-50/80 dark:bg-amber-950/30",  border: "border-amber-200/60 dark:border-amber-800/40",  icon: "bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400",   text: "text-amber-900 dark:text-amber-100",  cta: "bg-amber-600",  ctaHover: "hover:bg-amber-700" },
  violet:  { bg: "bg-violet-50/80 dark:bg-violet-950/30", border: "border-violet-200/60 dark:border-violet-800/40", icon: "bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400", text: "text-violet-900 dark:text-violet-100", cta: "bg-violet-600", ctaHover: "hover:bg-violet-700" },
  rose:    { bg: "bg-rose-50/80 dark:bg-rose-950/30",    border: "border-rose-200/60 dark:border-rose-800/40",    icon: "bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400",      text: "text-rose-900 dark:text-rose-100",   cta: "bg-rose-600",   ctaHover: "hover:bg-rose-700" },
};

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
  { label: "Grow My Skills", description: "Get recommendations for growing your skills.", prompt: "Show me recommendations for growing my skills", illustration: "skills" },
  { label: "Required Skills", description: "Required skills for your job role.", prompt: "Show me the required skills for my role", illustration: "required" },
  { label: "Explore Career Paths", description: "Discover potential career paths.", prompt: "Explore career paths based on my current skills", illustration: "career" },
  { label: "View My Activities", description: "Track your recent activities.", prompt: "Show me my recent learning activities", illustration: "activities" },
  { label: "Build Your Profile", description: "Upload resume to build your profile.", prompt: "Help me build my professional profile", illustration: "profile" },
  { label: "Create a Reflection", description: "Reflect on your learning journey.", prompt: "Help me create a reflection on my recent learning", illustration: "reflection" },
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
        <span className="text-[11px] italic text-muted-foreground">Thinking...</span>
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

  const [chatActive, setChatActive] = useState(false);
  const [dismissedNudgeIds] = useState<Set<string>>(new Set());
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const firstName = user.name.split(" ")[0];
  const hasMessages = messages.filter((m) => m.role !== "system").length > 0;
  const isActive = chatActive;

  // Auto-open Agent One when on this page
  useEffect(() => {
    setIsOpen(true);
  }, [setIsOpen]);

  // When nudge card is clicked, activate chat mode
  const handleNudgeClick = () => {
    setChatActive(true);
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Send via suggestion card also activates chat
  const handleCardSend = (prompt: string) => {
    setChatActive(true);
    setIsOpen(true);
    handleSend(prompt);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

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
              <div className="flex flex-col items-center justify-center min-h-full px-6">
                <div className="w-full max-w-[680px] pt-16 pb-8">
                  <motion.h1
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="font-display text-[28px] font-bold text-foreground mb-6"
                  >
                    Hi {firstName}, let's grow together
                  </motion.h1>

                  {/* Agent One Nudge Card */}
                  <div className="mb-6" onClick={handleNudgeClick}>
                    <SuperAgentCard hasUnread unreadCount={0} />
                  </div>

                  {/* Manager Nudge Stack */}
                  <div className="mb-6">
                    <NudgeStack onChatAction={(prompt) => {
                      if (prompt === "__ASSESSMENT__") {
                        setChatActive(true);
                        return;
                      }
                      setChatActive(true);
                      setIsOpen(true);
                      handleSend(prompt);
                    }} />
                  </div>
                  {/* Suggestion Cards Grid */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {suggestionCards.map((card, i) => (
                      <motion.button
                        key={card.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 + i * 0.04 }}
                        onClick={() => handleCardSend(card.prompt)}
                        className="flex flex-col rounded-xl border border-border bg-card p-3 text-left hover:shadow-md hover:border-primary/30 transition-all group"
                      >
                        <div className="bg-primary/5 rounded-lg p-2 mb-3">
                          <CardIllustration type={card.illustration} />
                        </div>
                        <span className="text-[13px] font-medium text-foreground leading-snug mb-1">{card.label}</span>
                        <span className="text-[11px] text-muted-foreground leading-snug line-clamp-2">{card.description}</span>
                      </motion.button>
                    ))}
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
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[14px] font-bold leading-tight">Agent One</h3>
                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider">Live</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-50" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
                        </span>
                        <p className="text-[10px] text-primary-foreground/75">Online now</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setChatActive(false)}
                        className="text-[11px] text-primary-foreground/60 hover:text-primary-foreground transition-colors px-2 py-1 rounded-md hover:bg-white/10 flex items-center gap-1"
                      >
                        <Home className="h-3 w-3" />
                        Home
                      </button>
                      <button
                        onClick={() => { handleReset(); setChatActive(false); }}
                        disabled={isStreaming || !hasMessages}
                        className="text-[11px] text-primary-foreground/60 hover:text-primary-foreground disabled:opacity-30 transition-colors px-2 py-1 rounded-md hover:bg-white/10"
                      >
                        New chat
                      </button>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto min-h-0">
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
                      .map((msg, i) => {
                        const msgBlocks = richBlocksMap[i] || [];
                        return (
                          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                            {msg.role === "user" ? (
                              <div className="flex justify-end mb-1">
                                <div className="rounded-2xl bg-primary text-primary-foreground px-3.5 py-2.5 text-[13px] max-w-[75%] shadow-sm">
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
                                    <div className="prose prose-sm max-w-none text-foreground text-[13px] leading-relaxed [&_p]:mb-1.5 [&_ul]:mb-1.5 [&_li]:mb-0.5">
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

                  <AnimatePresence>{isStreaming && <ThinkingIndicator />}</AnimatePresence>
                  <div ref={chatEndRef} />
                </div>
              </div>

              {/* Onboarding Nudge */}
              <OnboardingNudge />

              {/* Suggestion Pills */}
              {(() => {
                const activePills = suggestions.length > 0 ? suggestions : contextualSuggestions;
                const visiblePills = activePills.slice(0, 4);
                return visiblePills.length > 0 && !isStreaming ? (
                  <div className="shrink-0 max-w-[720px] mx-auto w-full px-4 pt-1.5">
                    <motion.div initial={{ opacity: 0, y: 2 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-1.5">
                      {visiblePills.map((pill) => (
                        <button
                          key={pill}
                          onClick={() => handleSend(pill)}
                          className="rounded-full border border-primary/20 bg-card px-3 py-1 text-[11px] font-medium text-foreground hover:bg-primary/5 hover:border-primary/40 transition-all active:scale-[0.97]"
                        >
                          {pill}
                        </button>
                      ))}
                    </motion.div>
                  </div>
                ) : null;
              })()}

              {/* Input Bar — Sparkles icon outside input, next to send */}
              <div className="shrink-0 max-w-[720px] mx-auto w-full px-4 pb-4 pt-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSend(input); }}
                      placeholder="Ask anything..."
                      className="h-11 rounded-xl border-border text-[13px] focus-visible:ring-primary/30 pr-3"
                      disabled={isStreaming}
                    />
                  </div>
                  <div className="shrink-0 h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <Button
                    size="icon"
                    variant={input.trim() ? "default" : "ghost"}
                    className={cn(
                      "h-9 w-9 rounded-xl transition-all shrink-0",
                      input.trim() && "bg-primary text-primary-foreground shadow-sm"
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

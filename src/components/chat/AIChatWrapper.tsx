import { useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { resolvePillAction } from "@/lib/pillActionResolver";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  Send,
  RotateCcw,
  Minimize2,
  ChevronUp,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAgentOne, parseSuggestions } from "@/contexts/AgentOneContext";
import { InlineAssessment } from "@/components/chat/InlineAssessment";
import { RichContentBlock } from "@/components/chat/RichContentBlock";
import { CollapsedBlockCard } from "@/components/chat/CollapsedBlockCard";
import { OnboardingNudge } from "@/components/chat/OnboardingNudge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

export function AIChatWrapper() {
  const location = useLocation();
  const navigate = useNavigate();
  const { skillTargets } = useSkillTargets();
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
    isExpanded,
    toggleBlockCollapse,
    setIsExpanded,
  } = useAgentOne();

  // Hide floating chat on the /chat page (Agent One is rendered inline there)
  const isChatPage = location.pathname === "/chat";


  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottom = useRef(true);
  const prevIsStreaming = useRef(false);
  const prevMsgCount = useRef(0);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    requestAnimationFrame(() => {
      chatEndRef.current?.scrollIntoView({ behavior });
    });
  }, []);

  const handleMessagesScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottom.current = distanceFromBottom < 80;
  }, []);

  // Normal auto-scroll: only when near bottom
  useEffect(() => {
    if (isNearBottom.current) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isStreaming]);

  // When panel opens during streaming, scroll to bottom immediately
  useEffect(() => {
    if (isOpen && isStreaming) {
      scrollToBottom("auto");
    }
  }, [isOpen, isStreaming, scrollToBottom]);

  // CTA dual scroll: second scroll when streaming starts
  useEffect(() => {
    if (isStreaming && !prevIsStreaming.current) {
      if (isNearBottom.current) scrollToBottom("auto");
    }
    prevIsStreaming.current = isStreaming;
  }, [isStreaming, scrollToBottom]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const panelWidth = isExpanded ? 720 : 400;
  const panelHeight = isExpanded ? 700 : 600;

  if (isChatPage) return null;

  return (
    <>
      {/* Floating chat button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-200",
          isOpen
            ? "bg-muted text-muted-foreground hover:bg-muted/80"
            : "bg-primary text-primary-foreground hover:opacity-90"
        )}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
      </button>

      {/* Floating chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1, width: panelWidth, height: panelHeight }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="fixed bottom-20 right-6 z-50 rounded-2xl border border-border bg-card shadow-xl overflow-hidden flex flex-col"
            style={{ maxWidth: "calc(100vw - 48px)", maxHeight: "calc(100vh - 120px)" }}
          >
            {/* Header */}
            <div className="shrink-0 px-4 py-3 flex items-center gap-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
              <motion.div
                className="h-8 w-8 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center"
                animate={{ rotate: [0, 3, -3, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles className="h-4 w-4" />
              </motion.div>
              <div className="flex-1 flex items-center gap-2">
                <div>
                  <h2 className="text-sm font-bold leading-tight">Agent One</h2>
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-50" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
                    </span>
                    <p className="text-[10px] text-primary-foreground/75">Online now</p>
                  </div>
                </div>
                <button
                  onClick={async () => { await handleReset(); navigate("/chat"); }}
                  disabled={isStreaming || messages.length === 0}
                  className="text-primary-foreground/60 hover:text-primary-foreground disabled:opacity-30 transition-colors"
                  title="Reset conversation"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
              {isExpanded && (
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-primary-foreground/60 hover:text-primary-foreground transition-colors"
                  title="Collapse panel"
                >
                  <Minimize2 className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-primary-foreground/60 hover:text-primary-foreground transition-colors"
                title="Close panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto min-h-0" ref={messagesContainerRef} onScroll={handleMessagesScroll}>
              <div className="px-4 py-4 space-y-3">
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
                  {messages.filter((m) => m.role !== "system").map((msg, i) => {
                    const msgBlocks = richBlocksMap[i] || [];
                    return (
                      <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                        {msg.role === "user" ? (
                          <div className="flex justify-end mb-1">
                            <div className="rounded-2xl bg-primary text-primary-foreground px-3 py-2 text-[13px] max-w-[85%] shadow-sm">
                              {msg.content}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <div className="shrink-0 h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
                              <Sparkles className="h-3 w-3 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="bg-secondary/50 border border-border/50 rounded-2xl px-3.5 py-3 shadow-sm max-w-[95%]">
                                <div className="prose prose-sm max-w-none text-foreground text-[13px] leading-relaxed [&_p]:mb-1.5 [&_ul]:mb-1.5 [&_li]:mb-0.5">
                                  <ReactMarkdown>{parseSuggestions(msg.content).clean}</ReactMarkdown>
                                </div>
                              </div>
                              {/* Rich blocks for this message */}
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

                {/* Inline Assessment */}
                {showInlineAssessment && !assessmentCompleted && (
                  <InlineAssessment onComplete={handleInlineAssessmentComplete} />
                )}

                <AnimatePresence>{isStreaming && <ThinkingIndicator />}</AnimatePresence>
                <div ref={chatEndRef} />
              </div>
            </div>

            {/* Persistent onboarding nudge */}
            <OnboardingNudge />

            {/* Suggestion Pills */}
            {(() => {
              const activePills = suggestions.length > 0 ? suggestions : contextualSuggestions;
              const visiblePills = activePills.slice(0, 3);
              const extra = activePills.length - 3;
              return visiblePills.length > 0 && !isStreaming ? (
                <div className="shrink-0 px-3 pt-1.5">
                  <motion.div initial={{ opacity: 0, y: 2 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-1">
                    {visiblePills.map((pill) => (
                      <button key={pill} onClick={() => {
                              const action = resolvePillAction(pill, skillTargets);
                              if (action) { navigate(action.navigate); } else { handleSend(pill); }
                            }} className="rounded-full border border-primary/20 bg-card px-2.5 py-0.5 text-[10px] font-medium text-foreground hover:bg-primary/5 hover:border-primary/40 transition-all active:scale-[0.97]">
                        {pill}
                      </button>
                    ))}
                    {extra > 0 && (
                      <span className="rounded-full px-2 py-0.5 text-[10px] text-muted-foreground">+{extra}</span>
                    )}
                  </motion.div>
                </div>
              ) : null;
            })()}

            {/* Input */}
            <div className="shrink-0 px-3 pb-3 pt-1.5 border-t border-border/30">
              <div className="relative">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSend(input); }}
                  placeholder="Ask anything..."
                  className="pr-10 h-10 rounded-xl border-border text-[13px] focus-visible:ring-primary/30"
                  disabled={isStreaming}
                />
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                  <Button
                    size="icon"
                    variant={input.trim() ? "default" : "ghost"}
                    className={cn("h-7 w-7 rounded-lg transition-all", input.trim() && "bg-primary text-primary-foreground shadow-sm")}
                    onClick={() => handleSend(input)}
                    disabled={!input.trim() || isStreaming}
                  >
                    <Send className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ArrowLeft, Sparkles, ClipboardList, RotateCcw } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/UserContext";
import { useAccount } from "@/contexts/AccountContext";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { getProfileData } from "@/lib/accountSelectors";
import { profileDataByUser as defaultProfileData } from "@/data/mock";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InlineAssessment } from "@/components/chat/InlineAssessment";
import { cn } from "@/lib/utils";

const SUPER_AGENT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/super-agent-chat`;

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

function parseSuggestions(text: string): { clean: string; suggestions: string[] } {
  const lines = text.split("\n");
  const lastLine = lines[lines.length - 1];
  const match = lastLine?.match(/^SUGGESTIONS:\s*(\[.*\])\s*$/);
  if (match) {
    try {
      const suggestions = JSON.parse(match[1]);
      return { clean: lines.slice(0, -1).join("\n").trimEnd(), suggestions };
    } catch { /* fall through */ }
  }
  return { clean: text, suggestions: [] };
}

function ThinkingIndicator() {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-start gap-3 px-1 py-3">
      <div className="shrink-0 h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="flex items-center gap-2 pt-1.5">
        <div className="flex gap-1">
          {[0, 0.2, 0.4].map((d) => (
            <motion.div key={d} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: d }} className="h-1.5 w-1.5 rounded-full bg-primary" />
          ))}
        </div>
        <span className="text-xs italic text-muted-foreground">Thinking...</span>
      </div>
    </motion.div>
  );
}

export default function SuperAgentChat() {
  const { user } = useUser();
  const { normalizedAccount, activeAccount } = useAccount();
  const { skillTargets, updateSkillTarget } = useSkillTargets();
  const navigate = useNavigate();
  const accountId = activeAccount?.id;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [stage, setStage] = useState("welcome");
  const [loaded, setLoaded] = useState(false);
  const [showInlineAssessment, setShowInlineAssessment] = useState(false);
  const [assessmentCompleted, setAssessmentCompleted] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const userProfile = (normalizedAccount ? getProfileData(normalizedAccount, user.id) : null)
    ?? activeAccount?.data?.profileData?.[user.id]
    ?? (defaultProfileData as any)[user.id];

  // Determine if new joiner
  const employee = normalizedAccount?.employeesById?.[user.id];
  const tenure = (employee as any)?.tenure;
  const isNewJoiner = tenure !== undefined && tenure <= 6;
  const isSophie = user.id === "u14";

  const lockedTargets = skillTargets
    .filter((st) => st.locked && st.assignedTo?.includes(user.id))
    .map((st) => ({ title: st.title, category: st.category }));

  // Build skill target context for the AI
  const assignedTargets = skillTargets.filter((st) => st.assignedTo?.includes(user.id));
  const firstTarget = assignedTargets[0];
  const targetSteps = firstTarget?.steps?.map((s) => ({ id: s.id, title: s.title, type: s.type, status: s.status })) || [];

  const userContext = {
    name: user.name,
    role: user.role,
    title: user.title,
    tenure,
    skills: userProfile?.roleSkillsCurrent?.map((s: any) => s.skill_name) || [],
    reportsTo: (employee as any)?.reportsTo || null,
    accountName: normalizedAccount?.branding?.name || activeAccount?.name,
    lockedTargets,
    isFreshGraduate: isSophie,
    targetTitle: firstTarget?.title || null,
    targetId: firstTarget?.id || null,
    targetSteps,
  };

  // Load persisted conversation
  useEffect(() => {
    if (!accountId) return;
    loadConversation();
  }, [accountId, user.id]);

  const loadConversation = async () => {
    if (!accountId) return;
    const { data } = await supabase
      .from("super_agent_conversations" as any)
      .select("*")
      .eq("account_id", accountId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      const msgs = (data as any).messages || [];
      setMessages(msgs);
      setStage((data as any).onboarding_stage || "welcome");
      // Parse suggestions from last assistant message
      const lastAssistant = [...msgs].reverse().find((m: ChatMessage) => m.role === "assistant");
      if (lastAssistant) {
        const { suggestions: s } = parseSuggestions(lastAssistant.content);
        setSuggestions(s);
      }
    } else {
      // First visit — determine initial stage
      const initialStage = isNewJoiner ? "welcome" : "general";
      setStage(initialStage);
      setMessages([]);
    }
    setLoaded(true);
  };

  // Auto-send welcome for new joiners on first visit
  useEffect(() => {
    if (loaded && messages.length === 0 && isNewJoiner && stage === "welcome") {
      streamResponse([{ role: "user" as const, content: "Hi, I just joined!" }], true);
    } else if (loaded && messages.length === 0 && !isNewJoiner) {
      streamResponse([{ role: "user" as const, content: "Hello!" }], true);
    }
  }, [loaded]);

  const saveConversation = async (msgs: ChatMessage[], newStage?: string) => {
    if (!accountId) return;
    const stageToSave = newStage || stage;
    // Clean messages for storage — strip suggestions line
    const cleanMsgs = msgs.map((m) => m.role === "assistant" ? { ...m, content: parseSuggestions(m.content).clean } : m);

    const { data: existing } = await supabase
      .from("super_agent_conversations" as any)
      .select("id")
      .eq("account_id", accountId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("super_agent_conversations" as any)
        .update({ messages: cleanMsgs as any, onboarding_stage: stageToSave, updated_at: new Date().toISOString() } as any)
        .eq("id", (existing as any).id);
    } else {
      await supabase
        .from("super_agent_conversations" as any)
        .insert({ account_id: accountId, user_id: user.id, messages: cleanMsgs as any, onboarding_stage: stageToSave } as any);
    }
  };

  const streamResponse = async (allMessages: ChatMessage[], isAutoWelcome = false) => {
    setIsStreaming(true);
    setSuggestions([]);

    const resp = await fetch(SUPER_AGENT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages: allMessages.filter((m) => m.role !== "system"),
        stage,
        userContext,
      }),
    });

    if (!resp.ok || !resp.body) {
      const errMsg: ChatMessage = { role: "assistant", content: "Sorry, I'm having trouble connecting right now. Please try again in a moment." };
      const updatedMsgs = isAutoWelcome ? [errMsg] : [...allMessages, errMsg];
      setMessages(updatedMsgs);
      setIsStreaming(false);
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantSoFar = "";
    let streamDone = false;

    const addOrUpdateAssistant = (content: string) => {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && isAutoWelcome && prev.length <= 1) {
          return [{ role: "assistant", content }];
        }
        if (last?.role === "assistant") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content } : m);
        }
        return [...prev, { role: "assistant", content }];
      });
    };

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let nlIdx: number;
      while ((nlIdx = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, nlIdx);
        textBuffer = textBuffer.slice(nlIdx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || !line.trim() || !line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") { streamDone = true; break; }
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            assistantSoFar += content;
            addOrUpdateAssistant(assistantSoFar);
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Final flush
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw || !raw.startsWith("data: ")) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) { assistantSoFar += content; addOrUpdateAssistant(assistantSoFar); }
        } catch { /* ignore */ }
      }
    }

    // Extract suggestions from final text
    const { clean, suggestions: newSugs } = parseSuggestions(assistantSoFar);
    if (clean !== assistantSoFar) {
      addOrUpdateAssistant(clean);
    }
    setSuggestions(newSugs);

    // Detect stage transitions
    const lower = clean.toLowerCase();
    let nextStage = stage;
    if (stage === "welcome" && (lower.includes("look correct") || lower.includes("add anything"))) {
      nextStage = "profile-review";
    } else if (stage === "profile-review" && (lower.includes("onboarding") || lower.includes("how has"))) {
      nextStage = "feedback";
    } else if (stage === "feedback") {
      nextStage = "task-list";
    } else if (stage === "task-list" && (lower.includes("assessment") || lower.includes("ready"))) {
      if (isSophie) {
        // Sophie is a fresh graduate — skip assessment, auto-unlock full path
        const target = skillTargets.find((st) => st.id === "RAT-ST-001");
        if (target) {
          updateSkillTarget("RAT-ST-001", (st) => {
            const updatedSteps = st.steps.map((step) => {
              if (step.id === "RAT-ASM-001") return { ...step, status: "completed" as const };
              if (step.id === "RAT-LM-001") return { ...step, status: "available" as const };
              return step;
            });
            return { ...st, locked: false, steps: updatedSteps };
          });
        }
        nextStage = "post-assessment";
        // Send auto-message so the Super Agent responds with fresh-graduate encouragement
        const autoMsg: ChatMessage = { role: "user", content: "I'm ready to start my training — no assessment needed since I'm starting fresh!" };
        setMessages((currentMsgs) => {
          const autoMsgs = [...currentMsgs, autoMsg];
          setStage("post-assessment");
          setTimeout(() => streamResponse(autoMsgs), 50);
          return autoMsgs;
        });
        setIsStreaming(false);
        return;
      }
      nextStage = "pre-assessment";
    } else if (stage === "pre-assessment" && lower.includes("click below")) {
      nextStage = "pre-assessment"; // stay, but show CTA
    } else if (stage === "post-assessment") {
      // Immediately transition to post-completion to prevent loop
      nextStage = "post-completion";
    }

    if (nextStage !== stage) setStage(nextStage);

    // Save
    setMessages((prev) => {
      const final = [...prev];
      saveConversation(final, nextStage);
      return final;
    });

    setIsStreaming(false);
  };

  const handleSend = useCallback((text: string) => {
    if (!text.trim() || isStreaming) return;
    const userMsg: ChatMessage = { role: "user", content: text };
    const allMsgs = [...messages, userMsg];
    setMessages(allMsgs);
    setInput("");
    streamResponse(allMsgs);
  }, [messages, isStreaming, stage, userContext]);

  const handleInlineAssessmentComplete = (score: number, answers: number[]) => {
    setAssessmentCompleted(true);
    const passed = score >= 80;

    // Unlock skill target RAT-ST-001
    const target = skillTargets.find((st) => st.id === "RAT-ST-001");
    if (target) {
      updateSkillTarget("RAT-ST-001", (st) => {
        const updatedSteps = st.steps.map((step) => {
          // Mark baseline assessment as completed
          if (step.id === "RAT-ASM-001") return { ...step, status: "completed" as const };
          if (passed) {
            // Skip first 3 modules, make module 4 available
            if (["RAT-LM-001", "RAT-LM-002", "RAT-LM-003"].includes(step.id)) return { ...step, status: "skipped" as const };
            if (step.id === "RAT-LM-004") return { ...step, status: "available" as const };
          } else {
            // Normal sequential — unlock first module
            if (step.id === "RAT-LM-001") return { ...step, status: "available" as const };
          }
          return step;
        });
        return { ...st, locked: false, steps: updatedSteps };
      });
    }

    // Send result to Super Agent for conversational feedback
    const resultMsg: ChatMessage = {
      role: "user",
      content: `I just completed the Investment Management Foundations assessment. I scored ${score}% (${Math.round(score / 10)} out of 10 correct).${passed ? " I passed and can skip the introductory modules!" : " I'll go through all the modules for a solid foundation."}`,
    };
    const allMsgs = [...messages, resultMsg];
    setMessages(allMsgs);
    setStage("post-assessment");
    streamResponse(allMsgs);
  };

  const handleReset = async () => {
    if (!accountId) return;
    await supabase
      .from("super_agent_conversations")
      .delete()
      .eq("account_id", accountId)
      .eq("user_id", user.id);
    setMessages([]);
    setSuggestions([]);
    setShowInlineAssessment(false);
    setAssessmentCompleted(false);
    const initialStage = isNewJoiner ? "welcome" : "general";
    setStage(initialStage);
    setLoaded(false);
    setTimeout(() => setLoaded(true), 100);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  // Check for assessment CTA in last message
  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant");
  const showAssessmentCTA = stage === "pre-assessment" && lastAssistantMsg?.content?.toLowerCase().includes("assessment");

  // Remove unused firstTarget ref
  const showSkillTargetCTA = false; // CTA now in InlineAssessment result card

  return (
    <div className="flex flex-1 h-full min-h-0 overflow-hidden">
      <div className="flex flex-col min-h-0 flex-1">
        {/* Header */}
        <div className="shrink-0 px-6 py-3.5 flex items-center gap-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md">
          <button onClick={() => navigate("/chat")} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <motion.div
              className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center"
              animate={{ rotate: [0, 3, -3, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="h-5 w-5" />
            </motion.div>
            <div>
              <h2 className="text-sm font-bold leading-tight">Super Agent</h2>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-50" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                </span>
                <p className="text-[11px] text-primary-foreground/75">Online now</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleReset}
            disabled={isStreaming || messages.length === 0}
            className="text-primary-foreground/60 hover:text-primary-foreground disabled:opacity-30 transition-colors active:scale-[0.95]"
            title="Reset conversation"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="max-w-[680px] mx-auto px-6 py-6 space-y-4">
            <AnimatePresence>
              {messages.filter((m) => m.role !== "system").map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  {msg.role === "user" ? (
                    <div className="flex justify-end mb-1">
                      <div className="rounded-2xl bg-primary text-primary-foreground px-4 py-2.5 text-sm max-w-[85%] shadow-sm">
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="bg-card border border-border/50 rounded-2xl px-5 py-4 shadow-sm max-w-[85%]">
                        <div className="prose prose-sm max-w-none text-foreground text-sm leading-relaxed">
                          <ReactMarkdown>{parseSuggestions(msg.content).clean}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Assessment CTA with onboarding context */}
            {showAssessmentCTA && !isSophie && !isStreaming && !showInlineAssessment && !assessmentCompleted && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3 max-w-[85%] pl-10">
                <div className="bg-primary/5 border border-primary/15 rounded-2xl px-5 py-4">
                  <p className="text-sm font-medium text-foreground mb-2">📋 Why this assessment?</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Before we begin your training, this short assessment helps us understand what you already know. Based on your results, we'll <strong className="text-foreground">customise your learning path</strong> — skipping modules you've already mastered and focusing on the areas where you'll benefit most. This means you'll graduate faster and spend your time where it counts.
                  </p>
                </div>
                <button
                  onClick={() => setShowInlineAssessment(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 active:scale-[0.97] transition-all w-fit"
                >
                  <ClipboardList className="h-4 w-4" />
                  Start Assessment
                </button>
              </motion.div>
            )}

            {/* Inline Assessment */}
            {showInlineAssessment && !assessmentCompleted && (
              <InlineAssessment onComplete={handleInlineAssessmentComplete} />
            )}

            {/* Suggestion Pills */}
            {suggestions.length > 0 && !isStreaming && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-2 pt-1 pl-10">
                {suggestions.map((pill) => (
                  <button key={pill} onClick={() => handleSend(pill)} className="group/pill rounded-full border border-primary/20 bg-card px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-primary/5 hover:border-primary/40 transition-all active:scale-[0.97]">
                    {pill}
                  </button>
                ))}
              </motion.div>
            )}

            <AnimatePresence>{isStreaming && <ThinkingIndicator />}</AnimatePresence>
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="shrink-0 px-6 pb-6 pt-3 bg-background border-t border-border/50 shadow-[0_-2px_12px_-4px_hsl(var(--border)/0.3)]">
          <div className="max-w-[680px] mx-auto relative">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSend(input); }}
              placeholder="Ask anything..."
              className="pr-12 h-12 rounded-2xl border-border shadow-md text-sm focus-visible:ring-primary/30"
              disabled={isStreaming}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <Button
                size="icon"
                variant={input.trim() ? "default" : "ghost"}
                className={cn("h-8 w-8 rounded-xl transition-all", input.trim() && "bg-primary text-primary-foreground shadow-sm")}
                onClick={() => handleSend(input)}
                disabled={!input.trim() || isStreaming}
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, ThumbsUp, ThumbsDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useUser } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { buildFlowSteps, coachingResponse } from "@/data/aiManagerFlow";
import { AssessmentCard } from "@/components/ai-manager/AssessmentCard";
import { TrainingRecommendationCard } from "@/components/ai-manager/TrainingRecommendationCard";
import { RolePlayCard } from "@/components/ai-manager/RolePlayCard";
import { SkillTargetCard } from "@/components/ai-manager/SkillTargetCard";
import { ProgressCard } from "@/components/ai-manager/ProgressCard";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  card?: "assessment" | "training" | "roleplay" | "skillTarget" | "progress";
  replies?: { label: string; nextStep: number }[];
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

export default function AIManager() {
  const { user } = useUser();
  const firstName = user.name.split(" ")[0];
  const flowSteps = buildFlowSteps(firstName);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [flowDone, setFlowDone] = useState(false);
  const [assessmentScore, setAssessmentScore] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // Initialize with first message
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    pushStepMessage(0);
  }, []);

  const pushStepMessage = useCallback(
    (stepId: number) => {
      const step = flowSteps.find((s) => s.id === stepId);
      if (!step) {
        setFlowDone(true);
        return;
      }

      setIsThinking(true);
      setTimeout(() => {
        const content = step.aiMessage.replace("{score}", String(assessmentScore ?? 0));
        const msg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content,
          card: step.card,
          replies: step.replies,
        };
        setMessages((prev) => [...prev, msg]);
        setCurrentStep(stepId);
        setIsThinking(false);

        // Handle autoNext
        if (step.autoNext !== undefined) {
          setTimeout(() => pushStepMessage(step.autoNext!), 1500);
        }

        if (stepId === 11) setFlowDone(true);
      }, 1200);
    },
    [flowSteps, assessmentScore]
  );

  const handleReply = useCallback(
    (label: string, nextStep: number) => {
      // Add user message
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: label,
      };
      setMessages((prev) => {
        // Remove reply buttons from last assistant message
        const updated = [...prev];
        if (updated.length > 0) {
          const last = updated[updated.length - 1];
          if (last.role === "assistant") {
            updated[updated.length - 1] = { ...last, replies: undefined };
          }
        }
        return [...updated, userMsg];
      });

      pushStepMessage(nextStep);
    },
    [pushStepMessage]
  );

  const handleAssessmentComplete = useCallback(
    (score: number) => {
      setAssessmentScore(score);
      // Remove replies from current message
      setMessages((prev) => {
        const updated = [...prev];
        if (updated.length > 0) {
          const last = updated[updated.length - 1];
          if (last.role === "assistant") {
            updated[updated.length - 1] = { ...last, replies: undefined };
          }
        }
        return updated;
      });

      // Route based on score
      setTimeout(() => {
        const nextStep = score < 80 ? 5 : 6;
        // Need to update the flow step message with actual score
        const step = flowSteps.find((s) => s.id === nextStep)!;
        setIsThinking(true);
        setTimeout(() => {
          const content = step.aiMessage.replace("{score}", String(score));
          const msg: ChatMessage = {
            id: `ai-${Date.now()}`,
            role: "assistant",
            content,
            card: step.card,
            replies: step.replies,
          };
          setMessages((prev) => [...prev, msg]);
          setCurrentStep(nextStep);
          setIsThinking(false);

          if (step.autoNext !== undefined) {
            setTimeout(() => pushStepMessage(step.autoNext!), 1500);
          }
        }, 1200);
      }, 800);
    },
    [flowSteps, pushStepMessage]
  );

  const handleFreeText = useCallback(
    (text: string) => {
      if (!text.trim() || isThinking) return;
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsThinking(true);

      setTimeout(() => {
        const response = coachingResponse(text, firstName);
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now() + 1}`,
          role: "assistant",
          content: response,
        };
        setMessages((prev) => [...prev, aiMsg]);
        setIsThinking(false);
      }, 1500);
    },
    [isThinking, firstName]
  );

  const renderCard = (card: string) => {
    switch (card) {
      case "assessment":
        return <AssessmentCard onComplete={handleAssessmentComplete} />;
      case "training":
        return <TrainingRecommendationCard />;
      case "roleplay":
        return <RolePlayCard />;
      case "skillTarget":
        return <SkillTargetCard />;
      case "progress":
        return <ProgressCard />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-1 h-full min-h-0 overflow-hidden">
      <div className="flex flex-col min-h-0 flex-1">
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="max-w-[680px] mx-auto px-6 py-6 space-y-4">
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
                      <div className="prose prose-sm max-w-none text-foreground text-sm leading-relaxed">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>

                      {msg.card && renderCard(msg.card)}

                      {msg.replies && msg.replies.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {msg.replies.map((reply) => (
                            <button
                              key={reply.label}
                              onClick={() => handleReply(reply.label, reply.nextStep)}
                              className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-secondary hover:border-primary/30 transition-colors"
                            >
                              {reply.label}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-3 pt-1">
                        <button className="text-muted-foreground hover:text-foreground transition-colors">
                          <ThumbsUp className="h-3.5 w-3.5" />
                        </button>
                        <button className="text-muted-foreground hover:text-foreground transition-colors">
                          <ThumbsDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            <AnimatePresence>
              {isThinking && <ThinkingIndicator />}
            </AnimatePresence>

            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="shrink-0 px-6 pb-6 pt-3 bg-background">
          <div className="max-w-[680px] mx-auto">
            <div className="relative">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleFreeText(input);
                }}
                placeholder={flowDone ? "Ask me anything..." : "Reply..."}
                className="pr-20 h-12 rounded-2xl border-border shadow-sm focus-within:shadow-md transition-shadow text-sm"
                disabled={isThinking}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => handleFreeText(input)}
                  disabled={!input.trim() || isThinking}
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              AI Manager — your personal onboarding guide
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

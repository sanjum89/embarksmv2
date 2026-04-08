import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Eye, EyeOff, Bot, User, Mic, MicOff, Volume2, VolumeX, MessageSquare, Phone, Loader2, Square, RotateCcw, CheckCircle2, Lightbulb, SmilePlus, TrendingUp, Frown, Meh, Smile, Shield, Zap } from "lucide-react";

import { useRolePlays } from "@/contexts/RolePlayContext";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { streamRolePlayChat } from "@/lib/streamChat";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { Skeleton } from "@/components/ui/skeleton";

interface StructuredFeedback {
  overallScore: number;
  customerSentiment: "positive" | "neutral" | "frustrated";
  learnerSentiment: "confident" | "developing" | "needs-work";
  strengths: string[];
  improvements: string[];
  summary: string;
}

function parseStructuredFeedback(raw: string): StructuredFeedback | null {
  try {
    // Strip potential markdown code fences
    const cleaned = raw.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(cleaned);
    if (parsed.overallScore && parsed.strengths && parsed.improvements) return parsed;
    return null;
  } catch {
    return null;
  }
}

const sentimentConfig = {
  positive: { icon: Smile, label: "Positive", color: "text-success" },
  neutral: { icon: Meh, label: "Neutral", color: "text-warning" },
  frustrated: { icon: Frown, label: "Frustrated", color: "text-destructive" },
} as const;

const learnerSentimentConfig = {
  confident: { icon: Shield, label: "Confident", color: "text-success" },
  developing: { icon: TrendingUp, label: "Developing", color: "text-warning" },
  "needs-work": { icon: Zap, label: "Needs Work", color: "text-destructive" },
} as const;

function getScoreColor(score: number) {
  if (score >= 7) return "bg-success/15 text-success border-success/30";
  if (score >= 4) return "bg-warning/15 text-warning border-warning/30";
  return "bg-destructive/15 text-destructive border-destructive/30";
}

interface ChatMessage {
  role: "user" | "ai";
  content: string;
}

type SessionMode = "chat" | "voice";

const difficultyColors = {
  beginner: "bg-success/10 text-success",
  intermediate: "bg-warning/10 text-warning",
  advanced: "bg-destructive/10 text-destructive",
};

export default function RolePlaySession() {
  const { rid, id: skillTargetId } = useParams();
  const navigate = useNavigate();
  const { getRolePlay } = useRolePlays();
  const { skillTargets, updateSkillTarget } = useSkillTargets();
  const foundRolePlay = getRolePlay(rid || "");

  // Generate fallback role play from skill target step data when not in mock bank
  const rolePlay = foundRolePlay ?? (() => {
    // Try to derive context from skill target step data
    let fallbackTitle = "Practice Scenario";
    let fallbackScenario = "Engage naturally with the AI persona and apply the techniques you've learned.";
    let fallbackPersona = "A knowledgeable practice partner in your field";
    let fallbackContext = "General practice scenario for skill development";

    if (skillTargetId) {
      const st = skillTargets.find((t) => t.id === skillTargetId);
      if (st) {
        const step = st.steps.find((s) => s.referenceId === rid);
        if (step) {
          fallbackTitle = step.title || fallbackTitle;
          fallbackScenario = `Practice scenario for "${step.title}". ${step.description || "Apply the concepts from this module in a realistic conversation."}`;
          fallbackPersona = `A senior colleague helping you practice: ${step.title}`;
          fallbackContext = `This role play is part of the "${st.title}" skill target. The learner is working on: ${step.title}. ${step.description || ""}`;
        }
      }
    }

    return {
      id: rid || "",
      title: fallbackTitle,
      scenario: fallbackScenario,
      difficulty: "intermediate" as const,
      isPrivate: false,
      tags: ["practice", "skills"],
      aiCloneConfig: {
        persona: fallbackPersona,
        context: fallbackContext,
      },
    };
  })();

  const [isPrivate, setIsPrivate] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState<SessionMode>("chat");
  const [isLoading, setIsLoading] = useState(false);
  const [ended, setEnded] = useState(false);
  const [endSummary, setEndSummary] = useState("");
  // Voice mode state
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [activeSubtitle, setActiveSubtitle] = useState<{ role: "user" | "ai"; text: string } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!rolePlay) {
    return (
      <div>
        <div className="flex items-center justify-center p-20 text-muted-foreground">
          Role Play not found.
        </div>
      </div>
    );
  }

  const rolePlayContext = {
    persona: rolePlay.aiCloneConfig.persona,
    scenario: rolePlay.scenario,
    context: rolePlay.aiCloneConfig.context,
  };

  const handleStart = () => {
    setStarted(true);
    // Send an initial greeting via LLM
    setIsLoading(true);
    const introPrompt = `The role play session is starting. You are "${rolePlay.aiCloneConfig.persona}". Greet the user and set the scene based on the scenario. Keep it to 2-3 sentences.`;
    
    let aiContent = "";
    streamRolePlayChat({
      messages: [{ role: "user", content: introPrompt }],
      rolePlayContext,
      onDelta: (chunk) => {
        aiContent += chunk;
        setMessages([{ role: "ai", content: aiContent }]);
      },
      onDone: () => {
        setIsLoading(false);
        if (mode === "voice" && aiContent) {
          setAiSpeaking(true);
          setActiveSubtitle({ role: "ai", text: aiContent });
          setTimeout(() => {
            setAiSpeaking(false);
            setActiveSubtitle(null);
          }, 3000);
        }
      },
      onError: (error) => {
        setMessages([{ role: "ai", content: `*${rolePlay.aiCloneConfig.persona}*\n\nSorry, I couldn't connect. ${error}` }]);
        setIsLoading(false);
      },
    });
  };

  const sendToAI = (userText: string) => {
    const userMsg: ChatMessage = { role: "user", content: userText };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // Build message history for the AI (convert to assistant/user format)
    const history = [...messages, userMsg].map((m) => ({
      role: m.role === "ai" ? "assistant" as const : "user" as const,
      content: m.content,
    }));

    let aiContent = "";
    streamRolePlayChat({
      messages: history,
      rolePlayContext,
      onDelta: (chunk) => {
        aiContent += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "ai" && last.content === aiContent.slice(0, -chunk.length)) {
            return [...prev.slice(0, -1), { role: "ai", content: aiContent }];
          }
          if (last?.role === "user") {
            return [...prev, { role: "ai", content: aiContent }];
          }
          return [...prev.slice(0, -1), { role: "ai", content: aiContent }];
        });
      },
      onDone: () => {
        setIsLoading(false);
        if (mode === "voice" && aiContent) {
          setAiSpeaking(true);
          setActiveSubtitle({ role: "ai", text: aiContent });
          setTimeout(() => {
            setAiSpeaking(false);
            setActiveSubtitle(null);
          }, 3000);
        }
      },
      onError: (error) => {
        setMessages((prev) => [...prev, { role: "ai", content: `Error: ${error}` }]);
        setIsLoading(false);
      },
    });
  };

  const handleSend = () => {
    if (!chatInput.trim() || isLoading) return;
    const userText = chatInput.trim();
    setChatInput("");
    sendToAI(userText);
  };

  const handleMicToggle = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    setIsRecording(true);

    // Simulate recording for ~2s then use a placeholder transcript and send to AI
    setTimeout(() => {
      setIsRecording(false);
      const userText = "I'd like to discuss this further and understand your concerns better.";
      setActiveSubtitle({ role: "user", text: userText });
      
      setTimeout(() => {
        setActiveSubtitle(null);
        sendToAI(userText);
      }, 800);
    }, 2000);
  };

  const handleEndRolePlay = async () => {
    if (ended || isLoading) return;
    setEnded(true);
    setIsLoading(true);

    const history = messages.map((m) => ({
      role: m.role === "ai" ? "assistant" as const : "user" as const,
      content: m.content,
    }));

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/role-play-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [...history, { role: "user", content: "Please summarize and give me feedback on how I did." }],
            rolePlayContext,
            summarize: true,
          }),
        }
      );

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({ error: "Failed to generate feedback" }));
        setEndSummary(errData.error || "Failed to generate feedback");
      } else {
        const data = await resp.json();
        setEndSummary(data.summary || "No feedback received.");
      }
    } catch (err) {
      setEndSummary("Could not generate summary. Please try again.");
    } finally {
      setIsLoading(false);
      // If launched from skill target, mark step complete and unlock next
      if (skillTargetId && rid) {
        updateSkillTarget(skillTargetId, (st) => {
          const stepIndex = st.steps.findIndex((s) => s.referenceId === rid);
          if (stepIndex === -1) return st;
          const updatedSteps = st.steps.map((s, i) => {
            if (i === stepIndex) return { ...s, status: "completed" as const };
            if (i === stepIndex + 1 && s.status === "locked") return { ...s, status: "available" as const };
            return s;
          });
          const completedCount = updatedSteps.filter((s) => s.status === "completed" || s.status === "skipped").length;
          const progress = Math.round((completedCount / updatedSteps.length) * 100);
          return { ...st, steps: updatedSteps, progress };
        });
      }
    }
  };

  const handleRestart = () => {
    setEnded(false);
    setEndSummary("");
    setMessages([]);
    setStarted(false);
    setChatInput("");
  };

  return (
    <div>
      <div className="flex h-screen flex-col">
        {/* Top bar */}
        <div className="border-b border-border px-6 py-3 flex items-center justify-between">
          <Link
            to={skillTargetId ? `/skill-target/${skillTargetId}` : "/role-play-bank"}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="flex items-center gap-3">
            {started && (
              <span className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                mode === "voice" ? "bg-accent/10 text-accent" : "bg-secondary text-muted-foreground"
              )}>
                {mode === "voice" ? "🎙 Voice" : "💬 Chat"}
              </span>
            )}
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", difficultyColors[rolePlay.difficulty])}>
              {rolePlay.difficulty}
            </span>
            <button
              onClick={() => setIsPrivate(!isPrivate)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                isPrivate
                  ? "bg-warning/10 text-warning border border-warning/30"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {isPrivate ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {isPrivate ? "Private Mode" : "Visible"}
            </button>
          </div>
        </div>

        {!started ? (
          /* Pre-session briefing with mode selection */
          <div className="flex-1 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md w-full rounded-xl bg-card border border-border p-8 shadow-card text-center"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full gradient-accent">
                <Bot className="h-7 w-7 text-accent-foreground" />
              </div>
              <h2 className="font-display text-lg font-bold text-foreground mb-2">
                {rolePlay.title}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">{rolePlay.scenario}</p>
              <div className="rounded-lg bg-secondary/50 p-3 text-left mb-6">
                <p className="text-xs font-medium text-foreground mb-1">AI Persona</p>
                <p className="text-xs text-muted-foreground">{rolePlay.aiCloneConfig.persona}</p>
                <p className="text-xs text-muted-foreground mt-1">{rolePlay.aiCloneConfig.context}</p>
              </div>

              {/* Mode selection */}
              <div className="mb-6">
                <p className="text-xs font-medium text-foreground mb-3">Choose Interaction Mode</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setMode("chat")}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-lg border p-4 transition-all",
                      mode === "chat"
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground hover:border-accent/50"
                    )}
                  >
                    <MessageSquare className="h-6 w-6" />
                    <span className="text-xs font-medium">Chat Role Play</span>
                    <span className="text-[10px] text-muted-foreground">Text-based conversation</span>
                  </button>
                  <button
                    onClick={() => setMode("voice")}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-lg border p-4 transition-all",
                      mode === "voice"
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground hover:border-accent/50"
                    )}
                  >
                    <Phone className="h-6 w-6" />
                    <span className="text-xs font-medium">Voice Role Play</span>
                    <span className="text-[10px] text-muted-foreground">Speak with AI persona</span>
                  </button>
                </div>
              </div>

              {isPrivate && (
                <div className="rounded-lg bg-warning/10 border border-warning/20 p-3 text-left mb-6">
                  <p className="text-xs font-medium text-warning">🔒 Private Mode Active</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    This session won't appear in your People Graph analytics.
                  </p>
                </div>
              )}
              <button
                onClick={handleStart}
                className="w-full rounded-lg gradient-accent px-5 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity"
              >
                Start {mode === "voice" ? "Voice" : "Chat"} Role Play
              </button>
            </motion.div>
          </div>
        ) : (
          /* Active session */
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 relative">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex gap-3", msg.role === "user" && "flex-row-reverse")}
                >
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    msg.role === "ai" ? "gradient-accent" : "bg-primary"
                  )}>
                    {msg.role === "ai" ? (
                      <Bot className="h-4 w-4 text-accent-foreground" />
                    ) : (
                      <User className="h-4 w-4 text-primary-foreground" />
                    )}
                  </div>
                  <div className={cn(
                    "max-w-[70%] rounded-xl px-4 py-3 text-sm",
                    msg.role === "ai"
                      ? "bg-card border border-border text-foreground"
                      : "bg-primary text-primary-foreground"
                  )}>
                    <p className="whitespace-pre-line">{msg.content}</p>
                  </div>
                </motion.div>
              ))}
              {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === "user" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full gradient-accent">
                    <Bot className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <div className="rounded-xl px-4 py-3 bg-card border border-border">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} />

              {/* Subtitle overlay for voice mode */}
              {mode === "voice" && (
                <AnimatePresence>
                  {activeSubtitle && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="sticky bottom-0 left-0 right-0 flex justify-center pointer-events-none"
                    >
                      <div className={cn(
                        "max-w-lg rounded-lg px-5 py-3 text-sm font-medium shadow-lg backdrop-blur-sm",
                        activeSubtitle.role === "ai"
                          ? "bg-card/90 border border-border text-foreground"
                          : "bg-primary/90 text-primary-foreground"
                      )}>
                        <span className="text-[10px] uppercase tracking-wider opacity-70 block mb-1">
                          {activeSubtitle.role === "ai" ? "AI" : "You"}
                        </span>
                        <p className="whitespace-pre-line text-xs">{activeSubtitle.text}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>

            {/* Loading state while generating feedback */}
            {ended && !endSummary && isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-t border-border p-6"
              >
                <div className="mx-auto max-w-2xl">
                  <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex flex-col items-center gap-4 py-6">
                      <div className="relative">
                        <div className="h-12 w-12 rounded-full gradient-accent flex items-center justify-center">
                          <Loader2 className="h-6 w-6 text-accent-foreground animate-spin" />
                        </div>
                        <span className="absolute inset-0 rounded-full border-2 border-accent/30 animate-ping" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">Analysing your session…</p>
                        <p className="text-xs text-muted-foreground mt-1">Generating personalised feedback</p>
                      </div>
                      <div className="w-full max-w-sm space-y-3 mt-2">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-4/5" />
                        <Skeleton className="h-3 w-3/5" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* End summary card */}
            {ended && endSummary && (() => {
              const feedback = parseStructuredFeedback(endSummary);
              if (feedback) {
                const CustIcon = sentimentConfig[feedback.customerSentiment]?.icon || Meh;
                const custConf = sentimentConfig[feedback.customerSentiment] || sentimentConfig.neutral;
                const LearnIcon = learnerSentimentConfig[feedback.learnerSentiment]?.icon || TrendingUp;
                const learnConf = learnerSentimentConfig[feedback.learnerSentiment] || learnerSentimentConfig.developing;

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-t border-border p-6 overflow-y-auto"
                  >
                    <div className="mx-auto max-w-2xl space-y-4">
                      {/* Header with score */}
                      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-success" />
                            <h3 className="text-sm font-semibold text-foreground">Session Complete</h3>
                          </div>
                          <div className={cn("rounded-full border px-3 py-1 text-sm font-bold", getScoreColor(feedback.overallScore))}>
                            {feedback.overallScore}/10
                          </div>
                        </div>
                      </div>

                      {/* Sentiment row */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-border bg-card p-4">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Customer Sentiment</p>
                          <div className="flex items-center gap-2">
                            <CustIcon className={cn("h-5 w-5", custConf.color)} />
                            <span className={cn("text-sm font-medium", custConf.color)}>{custConf.label}</span>
                          </div>
                        </div>
                        <div className="rounded-xl border border-border bg-card p-4">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Your Performance</p>
                          <div className="flex items-center gap-2">
                            <LearnIcon className={cn("h-5 w-5", learnConf.color)} />
                            <span className={cn("text-sm font-medium", learnConf.color)}>{learnConf.label}</span>
                          </div>
                        </div>
                      </div>

                      {/* Strengths */}
                      {feedback.strengths.length > 0 && (
                        <div className="rounded-xl border border-success/20 bg-success/5 p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle2 className="h-4 w-4 text-success" />
                            <p className="text-xs font-semibold text-foreground">What You Did Well</p>
                          </div>
                          <ul className="space-y-2">
                            {feedback.strengths.map((s, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-success shrink-0" />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Improvements */}
                      {feedback.improvements.length > 0 && (
                        <div className="rounded-xl border border-warning/20 bg-warning/5 p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Lightbulb className="h-4 w-4 text-warning" />
                            <p className="text-xs font-semibold text-foreground">Areas to Improve</p>
                          </div>
                          <ul className="space-y-2">
                            {feedback.improvements.map((s, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-warning shrink-0" />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Summary narrative */}
                      <div className="rounded-xl border border-border bg-card p-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">{feedback.summary}</p>
                      </div>

                      {/* CTAs */}
                      <div className="flex items-center justify-between">
                        <button
                          onClick={handleRestart}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> Try Again
                        </button>
                        <button
                          onClick={() => navigate(skillTargetId ? `/skill-target/${skillTargetId}` : "/role-play-bank")}
                          className="rounded-lg gradient-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity"
                        >
                          {skillTargetId ? "Back to Skill Target" : "Back to Role Play Bank"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              }

              // Fallback: plain markdown for non-JSON responses
              return (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-t border-border p-6"
                >
                  <div className="mx-auto max-w-2xl">
                    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="h-5 w-5 text-success" />
                        <h3 className="text-sm font-semibold text-foreground">Session Complete</h3>
                      </div>
                      <div className="prose prose-sm text-sm text-muted-foreground max-w-none">
                        <ReactMarkdown>{endSummary}</ReactMarkdown>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <button
                        onClick={handleRestart}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Try Again
                      </button>
                      <button
                        onClick={() => navigate(skillTargetId ? `/skill-target/${skillTargetId}` : "/role-play-bank")}
                        className="rounded-lg gradient-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity"
                      >
                        {skillTargetId ? "Back to Skill Target" : "Back to Role Play Bank"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })()}

            {/* Input area */}
            {!ended && (
              <div className="border-t border-border p-4">
                {mode === "chat" ? (
                  <div className="mx-auto max-w-2xl flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSend()}
                      placeholder="Type your response..."
                      className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                      disabled={isLoading}
                    />
                    <button
                      onClick={handleEndRolePlay}
                      disabled={isLoading || messages.length < 2}
                      className="flex h-10 items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 text-xs font-medium text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-40"
                      title="End Role Play"
                    >
                      <Square className="h-3.5 w-3.5" /> End
                    </button>
                    <button
                      onClick={handleSend}
                      disabled={isLoading}
                      className="flex h-10 w-10 items-center justify-center rounded-lg gradient-accent text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                  </div>
                ) : (
                  /* Voice controls */
                  <div className="mx-auto max-w-2xl flex items-center justify-center gap-6">
                    {/* Speaker toggle */}
                    <button
                      onClick={() => setIsSpeakerMuted(!isSpeakerMuted)}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full transition-all",
                        isSpeakerMuted
                          ? "bg-destructive/10 text-destructive"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      )}
                      title={isSpeakerMuted ? "Unmute speaker" : "Mute speaker"}
                    >
                      {isSpeakerMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className={cn("h-5 w-5", aiSpeaking && "animate-pulse text-accent")} />}
                    </button>

                    {/* Mic button */}
                    <button
                      onClick={handleMicToggle}
                      disabled={aiSpeaking || isLoading}
                      className={cn(
                        "relative flex h-16 w-16 items-center justify-center rounded-full transition-all",
                        isRecording
                          ? "gradient-accent text-accent-foreground scale-110"
                          : aiSpeaking || isLoading
                          ? "bg-secondary text-muted-foreground opacity-50 cursor-not-allowed"
                          : "bg-secondary text-foreground hover:bg-accent/20 hover:text-accent"
                      )}
                    >
                      {isRecording ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
                      {isRecording && (
                        <span className="absolute inset-0 rounded-full border-2 border-accent animate-ping" />
                      )}
                    </button>

                    {/* End button for voice */}
                    <button
                      onClick={handleEndRolePlay}
                      disabled={isLoading || messages.length < 2}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full transition-all",
                        "bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-40"
                      )}
                      title="End Role Play"
                    >
                      <Square className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

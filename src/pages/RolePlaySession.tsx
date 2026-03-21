import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Eye, EyeOff, Bot, User, Mic, MicOff, Volume2, VolumeX, MessageSquare, Phone, Loader2, Square, RotateCcw, CheckCircle2 } from "lucide-react";

import { useRolePlays } from "@/contexts/RolePlayContext";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { streamRolePlayChat } from "@/lib/streamChat";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

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
    // Import dynamically would be complex, so create inline fallback
    return {
      id: rid || "",
      title: "Practice Scenario",
      scenario: "This is a practice role-play scenario designed to help you build and demonstrate your skills. Engage naturally with the AI persona and apply the techniques you've learned.",
      difficulty: "intermediate" as const,
      isPrivate: false,
      tags: ["practice", "skills"],
      aiCloneConfig: {
        persona: "A realistic practice partner",
        context: "General practice scenario for skill development",
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

  const handleEndRolePlay = () => {
    if (ended || isLoading) return;
    setEnded(true);
    setIsLoading(true);

    const history = messages.map((m) => ({
      role: m.role === "ai" ? "assistant" as const : "user" as const,
      content: m.content,
    }));

    let summary = "";
    streamRolePlayChat({
      messages: [...history, { role: "user", content: "Please summarize and give me feedback on how I did." }],
      rolePlayContext,
      summarize: true,
      onDelta: (chunk) => {
        summary += chunk;
        setEndSummary(summary);
      },
      onDone: () => {
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
      },
      onError: (error) => {
        setEndSummary(`Could not generate summary: ${error}`);
        setIsLoading(false);
      },
    });
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

            {/* Input area */}
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

                  {/* Status label */}
                  <div className="w-10 text-center">
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {isRecording ? "Listening…" : aiSpeaking ? "Speaking…" : isLoading ? "Thinking…" : "Ready"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

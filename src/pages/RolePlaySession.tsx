import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Eye, EyeOff, Bot, User, Mic, MicOff, Volume2, VolumeX, MessageSquare, Phone } from "lucide-react";

import { mockRolePlayBank } from "@/data/mock";
import { cn } from "@/lib/utils";

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

const aiResponses = [
  `"That's an interesting point. But I'm still not entirely convinced. Can you tell me more about the specific value we'd get from this?"`,
  `"I appreciate you saying that. However, my concern is really about the long-term commitment. What if our needs change in 6 months?"`,
  `"Look, I hear you, but we've been burned before by vendors who overpromise. What makes your solution different?"`,
  `"Hmm, that's fair. But I need to justify this to my leadership team. Can you help me build a business case?"`,
];

const mockUserTranscripts = [
  "I understand your concern. Let me walk you through some specific outcomes our clients have seen.",
  "That's a great question. We actually offer flexible terms precisely for that reason.",
  "I appreciate your transparency. Let me share a few case studies that address exactly that.",
  "Absolutely. I can help put together a clear ROI breakdown for your team.",
];

export default function RolePlaySession() {
  const { rid, id: skillTargetId } = useParams();
  const rolePlay = mockRolePlayBank.find((rp) => rp.id === rid);

  const [isPrivate, setIsPrivate] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState<SessionMode>("chat");

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

  const handleStart = () => {
    setStarted(true);
    const firstMsg: ChatMessage = {
      role: "ai",
      content: `*${rolePlay.aiCloneConfig.persona}*\n\n"Hi there. ${rolePlay.scenario.split(".")[0]}. I'd like to discuss this further with you."`,
    };
    setMessages([firstMsg]);
    if (mode === "voice") {
      setAiSpeaking(true);
      setActiveSubtitle({ role: "ai", text: firstMsg.content });
      setTimeout(() => {
        setAiSpeaking(false);
        setActiveSubtitle(null);
      }, 3000);
    }
  };

  const handleSend = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setChatInput("");

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: `*${rolePlay.aiCloneConfig.persona}*\n\n${aiResponses[prev.length % aiResponses.length]}`,
        },
      ]);
    }, 1000);
  };

  const handleMicToggle = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    setIsRecording(true);

    // Simulate recording for ~2s then produce transcript
    setTimeout(() => {
      setIsRecording(false);
      const userText = mockUserTranscripts[messages.length % mockUserTranscripts.length];
      const userMsg: ChatMessage = { role: "user", content: userText };
      setMessages((prev) => [...prev, userMsg]);
      setActiveSubtitle({ role: "user", text: userText });

      // After a brief pause, AI responds
      setTimeout(() => {
        setActiveSubtitle(null);
        setAiSpeaking(true);
        const aiText = `*${rolePlay.aiCloneConfig.persona}*\n\n${aiResponses[(messages.length + 1) % aiResponses.length]}`;
        const aiMsg: ChatMessage = { role: "ai", content: aiText };
        setMessages((prev) => [...prev, aiMsg]);
        setActiveSubtitle({ role: "ai", text: aiText });

        setTimeout(() => {
          setAiSpeaking(false);
          setActiveSubtitle(null);
        }, 3000);
      }, 800);
    }, 2000);
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
                  />
                  <button
                    onClick={handleSend}
                    className="flex h-10 w-10 items-center justify-center rounded-lg gradient-accent text-accent-foreground hover:opacity-90 transition-opacity"
                  >
                    <Send className="h-4 w-4" />
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
                    disabled={aiSpeaking}
                    className={cn(
                      "relative flex h-16 w-16 items-center justify-center rounded-full transition-all",
                      isRecording
                        ? "gradient-accent text-accent-foreground scale-110"
                        : aiSpeaking
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
                      {isRecording ? "Listening…" : aiSpeaking ? "Speaking…" : "Ready"}
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

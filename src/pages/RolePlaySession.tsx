import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Send, Eye, EyeOff, Bot, User } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { mockRolePlayBank } from "@/data/mock";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "ai";
  content: string;
}

const difficultyColors = {
  beginner: "bg-success/10 text-success",
  intermediate: "bg-warning/10 text-warning",
  advanced: "bg-destructive/10 text-destructive",
};

export default function RolePlaySession() {
  const { rid, id: skillTargetId } = useParams();
  const rolePlay = mockRolePlayBank.find((rp) => rp.id === rid);

  const [isPrivate, setIsPrivate] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [started, setStarted] = useState(false);

  if (!rolePlay) {
    return (
      <div>
        <AppHeader title="Role Play" />
        <div className="flex items-center justify-center p-20 text-muted-foreground">
          Role Play not found.
        </div>
      </div>
    );
  }

  const handleStart = () => {
    setStarted(true);
    setMessages([
      {
        role: "ai",
        content: `*${rolePlay.aiCloneConfig.persona}*\n\n"Hi there. ${rolePlay.scenario.split(".")[0]}. I'd like to discuss this further with you."`,
      },
    ]);
  };

  const handleSend = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setChatInput("");

    setTimeout(() => {
      const responses = [
        `"That's an interesting point. But I'm still not entirely convinced. Can you tell me more about the specific value we'd get from this?"`,
        `"I appreciate you saying that. However, my concern is really about the long-term commitment. What if our needs change in 6 months?"`,
        `"Look, I hear you, but we've been burned before by vendors who overpromise. What makes your solution different?"`,
        `"Hmm, that's fair. But I need to justify this to my leadership team. Can you help me build a business case?"`,
      ];
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: `*${rolePlay.aiCloneConfig.persona}*\n\n${responses[prev.length % responses.length]}`,
        },
      ]);
    }, 1000);
  };

  return (
    <div>
      <AppHeader title={rolePlay.title} />
      <div className="flex h-[calc(100vh-4rem)] flex-col">
        {/* Top bar */}
        <div className="border-b border-border px-6 py-3 flex items-center justify-between">
          <Link
            to={skillTargetId ? `/skill-target/${skillTargetId}` : "/role-play-bank"}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="flex items-center gap-3">
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
          /* Pre-session briefing */
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
                Start Role Play
              </button>
            </motion.div>
          </div>
        ) : (
          /* Chat session */
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
            </div>

            {/* Input */}
            <div className="border-t border-border p-4">
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}

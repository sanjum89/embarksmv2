import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Play, FileText, Bot, Send, X, CheckCircle2 } from "lucide-react";

import { mockLearningModules } from "@/data/mock";
import { cn } from "@/lib/utils";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";

interface ChatMessage {
  role: "user" | "ai";
  content: string;
}

export default function LearningModulePage() {
  const { mid, id: skillTargetId } = useParams();
  const module = mockLearningModules.find((m) => m.id === mid);
  const { updateSkillTarget } = useSkillTargets();

  const [completed, setCompleted] = useState(false);
  const [showCompanion, setShowCompanion] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "ai", content: "Hi! I'm your AI learning companion. Ask me anything about this module — I have access to the full transcript and can help explain concepts, quiz you, or give examples." },
  ]);

  if (!module) {
    return (
      <div>
        <div className="flex items-center justify-center p-20 text-muted-foreground">
          Module not found.
        </div>
      </div>
    );
  }

  const handleMarkComplete = () => {
    if (!skillTargetId || !mid) return;

    updateSkillTarget(skillTargetId, (target) => {
      const sorted = [...target.steps].sort((a, b) => a.order - b.order);
      const stepIndex = sorted.findIndex((s) => s.referenceId === mid);

      const updatedSteps = target.steps.map((step) => {
        if (step.referenceId === mid) {
          return { ...step, status: "completed" as const };
        }
        // Unlock the next locked step
        if (stepIndex >= 0) {
          const currentOrder = sorted[stepIndex].order;
          const nextLocked = sorted.find((s) => s.order > currentOrder && s.status === "locked");
          if (nextLocked && step.id === nextLocked.id) {
            return { ...step, status: "available" as const };
          }
        }
        return step;
      });

      const doneCount = updatedSteps.filter(
        (s) => s.status === "completed" || s.status === "skipped"
      ).length;
      const progress = Math.round((doneCount / updatedSteps.length) * 100);

      return { ...target, steps: updatedSteps, progress };
    });

    setCompleted(true);
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
          content: `Great question about "${userMsg.slice(0, 40)}..." Based on the module content, here's what I can share:\n\nThe key concept relates to the core framework covered in this training. In practice, this means applying the techniques step by step — starting with active listening, then acknowledging, and finally responding with tailored value propositions.\n\nWould you like me to elaborate or give a specific example?`,
        },
      ]);
    }, 800);
  };

  return (
    <div>
      <div className="flex h-screen">
        {/* Main content area */}
        <div className={cn("flex-1 overflow-y-auto p-6", showCompanion && "pr-0")}>
          <div className="mx-auto max-w-3xl">
            <Link
              to={`/skill-target/${skillTargetId}`}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Skill Target
            </Link>

            {completed ? (
              /* Success card — matches assessment results UI */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl bg-card border border-border p-8 shadow-card text-center"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-1">
                  Module Complete!
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  You've completed <span className="font-medium text-foreground">{module.title}</span>
                </p>
                <Link
                  to={`/skill-target/${skillTargetId}`}
                  className="inline-flex items-center gap-2 rounded-lg gradient-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity"
                >
                  Continue
                </Link>
              </motion.div>
            ) : (
              <>
                {/* Module header */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-card border border-border p-5 shadow-card mb-6"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {module.contentType === "video" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-info/10 px-2.5 py-0.5 text-xs font-medium text-info">
                        <Play className="h-3 w-3" /> Video
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                        <FileText className="h-3 w-3" /> Document
                      </span>
                    )}
                    {module.duration && (
                      <span className="text-xs text-muted-foreground">{module.duration}</span>
                    )}
                  </div>
                  <h1 className="font-display text-lg font-bold text-foreground">
                    {module.title}
                  </h1>
                </motion.div>

                {/* Content viewer */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-xl bg-card border border-border overflow-hidden shadow-card mb-6"
                >
                  {module.contentType === "video" ? (
                    <div className="aspect-video bg-primary/5 flex items-center justify-center">
                      <div className="text-center">
                        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-accent/15">
                          <Play className="h-8 w-8 text-accent" />
                        </div>
                        <p className="text-sm font-medium text-foreground">Video Player</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Video content would stream here
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-[3/4] max-h-[500px] bg-primary/5 flex items-center justify-center">
                      <div className="text-center">
                        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-accent/15">
                          <FileText className="h-8 w-8 text-accent" />
                        </div>
                        <p className="text-sm font-medium text-foreground">Document Viewer</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PDF/document would render here
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Transcript */}
                {module.transcript && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-xl bg-card border border-border p-5 shadow-card mb-6"
                  >
                    <h3 className="font-display text-sm font-semibold text-foreground mb-3">
                      Transcript
                    </h3>
                    <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {module.transcript}
                    </div>
                  </motion.div>
                )}

                {/* Mark as Complete button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex justify-center mb-6"
                >
                  <button
                    onClick={handleMarkComplete}
                    className="inline-flex items-center gap-2 rounded-lg gradient-accent px-6 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Mark as Complete
                  </button>
                </motion.div>
              </>
            )}
          </div>
        </div>

        {/* AI Companion toggle */}
        {!showCompanion && (
          <button
            onClick={() => setShowCompanion(true)}
            className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full gradient-accent shadow-lg hover:opacity-90 transition-opacity"
          >
            <Bot className="h-5 w-5 text-accent-foreground" />
          </button>
        )}

        {/* AI Companion panel */}
        {showCompanion && (
          <motion.div
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            className="w-80 border-l border-border bg-card flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full gradient-accent">
                  <Bot className="h-3.5 w-3.5 text-accent-foreground" />
                </div>
                <span className="text-sm font-semibold text-foreground">AI Companion</span>
              </div>
              <button
                onClick={() => setShowCompanion(false)}
                className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-sm",
                    msg.role === "ai"
                      ? "bg-secondary text-foreground"
                      : "bg-accent/10 text-foreground ml-4"
                  )}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-border p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask about this module..."
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <button
                  onClick={handleSend}
                  className="flex h-9 w-9 items-center justify-center rounded-lg gradient-accent text-accent-foreground hover:opacity-90 transition-opacity"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

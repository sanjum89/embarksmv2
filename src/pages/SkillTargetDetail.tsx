import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Target, CalendarDays } from "lucide-react";

import { AIChatWrapper } from "@/components/chat/AIChatWrapper";
import { StepTimeline } from "@/components/skill-target/StepTimeline";
import { TraditionalActivitiesPanel } from "@/components/skill-target/TraditionalActivitiesPanel";
import { TraditionalContentViewer } from "@/components/skill-target/TraditionalContentViewer";
import { Progress } from "@/components/ui/progress";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import type { StepItem } from "@/types/learning";

export default function SkillTargetDetail() {
  const { id } = useParams();
  const { skillTargets } = useSkillTargets();
  const { styleTheme } = useTheme();
  const target = skillTargets.find((st) => st.id === id);
  const [activeStep, setActiveStep] = useState<StepItem | null>(null);

  const isTraditional = styleTheme === "traditional";

  if (!target) {
    return (
      <div>
        <div className="flex items-center justify-center p-20 text-muted-foreground">
          Skill Target not found.
        </div>
      </div>
    );
  }

  const completedSteps = target.steps.filter(
    (s) => s.status === "completed" || s.status === "skipped"
  ).length;

  // ── Traditional UI layout ──
  if (isTraditional) {
    return (
      <div className="flex h-screen">
        {/* Left: Chat panel — full height */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-border">
          {/* Title bar */}
          <div className="px-6 py-3 border-b border-border">
            <p className="text-sm font-medium text-foreground truncate">
              {target.title}
            </p>
          </div>

          {/* Tabs — Chapters only visible when a module is active */}
          <div className="flex border-b border-border px-6">
            <button className="text-sm font-medium text-primary border-b-2 border-primary px-1 py-2.5 mr-6">
              Conversation
            </button>
            {activeStep && (
              <button className="text-sm font-medium text-muted-foreground hover:text-foreground px-1 py-2.5">
                Chapters
              </button>
            )}
          </div>

          {/* Chat area — grows to fill */}
          <div className="flex-1 flex flex-col min-h-0">
            <TraditionalChatArea target={target} />
          </div>
        </div>

        {/* Right: Activities panel / Content viewer */}
        <div className="w-[420px] shrink-0 flex flex-col bg-card border-l border-border h-screen">
          {activeStep ? (
            <TraditionalContentViewer
              step={activeStep}
              onClose={() => setActiveStep(null)}
            />
          ) : (
            <TraditionalActivitiesPanel
              steps={target.steps}
              skillTargetTitle={target.title}
              onActivityClick={(step) => setActiveStep(step)}
              activeStepId={activeStep?.id}
            />
          )}
        </div>
      </div>
    );
  }

  // ── New UI layout (unchanged) ──
  return (
    <div>
      <div className="flex">
        <div className="flex-1 mx-auto max-w-2xl p-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>

          {/* Header card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-xl bg-card border border-border p-6 shadow-card mb-6"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
                <Target className="h-3 w-3" />
                {target.category}
              </span>
              {target.dueDate && (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Due{" "}
                  {new Date(target.dueDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>

            <h1 className="font-display text-xl font-bold text-foreground mb-1.5">
              {target.title}
            </h1>
            <p className="text-sm text-muted-foreground mb-4">{target.description}</p>

            <div className="flex items-center gap-3">
              <Progress value={target.progress} className="h-2 flex-1" />
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                {completedSteps}/{target.steps.length} steps · {target.progress}%
              </span>
            </div>
          </motion.div>

          {/* Step timeline */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.35 }}
          >
            <h3 className="font-display text-sm font-semibold text-foreground mb-4">
              Learning Path
            </h3>
            <StepTimeline steps={target.steps} skillTargetId={target.id} />
          </motion.div>
        </div>

        <AIChatWrapper
          contextLabel={`Skill Target → ${target.title}`}
          suggestedActions={[
            { label: "Explain this skill" },
            { label: "What should I focus on?" },
            { label: "Show my progress" },
          ]}
        />
      </div>
    </div>
  );
}

// ── Inline Traditional chat area (simplified embedded chat) ──
import { useState as useStateChat, useRef, useEffect } from "react";
import { Sparkles, Mic, Send, Plus } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { SkillTarget } from "@/types/learning";

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: { label: string }[];
}

function TraditionalChatArea({ target }: { target: SkillTarget }) {
  const [messages, setMessages] = useStateChat<ChatMsg[]>([]);
  const [input, setInput] = useStateChat("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Generate initial welcome if no messages
  const welcomeHeading = `Let's unpack ${target.category}: ${target.title}. Ask me anything.`;

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: ChatMsg = { id: Date.now().toString(), role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    setTimeout(() => {
      const reply: ChatMsg = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Based on the conversation, you've been exploring key concepts and are now looking for relevant courses to deepen your understanding. I'd recommend focusing on the available learning modules in your activity list to build a strong foundation.",
        actions: [
          { label: "I'd rather explore a different activity" },
          { label: "Test my understanding" },
        ],
      };
      setMessages((prev) => [...prev, reply]);
    }, 800);
  };

  return (
    <>
      {/* Scrollable messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {messages.length === 0 && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4 leading-snug">
              {welcomeHeading}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {target.description}. I can help you navigate through the activities, explain concepts, or test your knowledge.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id}>
            <div
              className={cn(
                "rounded-xl px-4 py-3 text-sm leading-relaxed",
                msg.role === "user"
                  ? "ml-auto max-w-[80%] bg-secondary text-foreground"
                  : "text-foreground"
              )}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm max-w-none dark:prose-invert prose-p:text-muted-foreground">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
            {msg.role === "assistant" && msg.actions && msg.actions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {msg.actions.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => setInput(a.label)}
                    className="rounded-full border border-border px-3.5 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Default suggested actions */}
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {[
              "I'd rather explore a different activity",
              `I'd like to practice ${target.category.toLowerCase()}`,
              "Test my understanding",
            ].map((label) => (
              <button
                key={label}
                onClick={() => setInput(label)}
                className="rounded-full border border-border px-3.5 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="border-t border-border px-5 py-3">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="I want to learn about..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <div className="flex items-center gap-2 text-muted-foreground">
            <button className="hover:text-foreground transition-colors">
              <Plus className="h-5 w-5" />
            </button>
            <button className="hover:text-foreground transition-colors">
              <Mic className="h-5 w-5" />
            </button>
            <button
              onClick={handleSend}
              className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          AI can make mistakes. Check for accuracy.
        </p>
      </div>
    </>
  );
}

import { useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Target, CalendarDays, BookOpen, ClipboardCheck, Drama, Lock, Eye } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { proficiencyShort } from "@/types/learning";


import { StepTimeline } from "@/components/skill-target/StepTimeline";
import { TraditionalActivitiesPanel } from "@/components/skill-target/TraditionalActivitiesPanel";
import { TraditionalContentViewer } from "@/components/skill-target/TraditionalContentViewer";
import { Progress } from "@/components/ui/progress";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import type { StepItem } from "@/types/learning";
import { useContentSubstitution } from "@/lib/contentSubstitution";

export default function SkillTargetDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { skillTargets } = useSkillTargets();
  const { styleTheme } = useTheme();
  const target = skillTargets.find((st) => st.id === id);
  const [activeStep, setActiveStep] = useState<StepItem | null>(null);
  const [activeTab, setActiveTab] = useState<"conversation" | "chapters">("conversation");
  const { substitute } = useContentSubstitution();

  const isTraditional = styleTheme === "traditional";
  const isPreview = searchParams.get("preview") === "true" && target?.locked;

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
      <div className="flex h-[calc(100vh-3.5rem)] flex-col">
        {/* Preview banner */}
        {isPreview && (
          <div className="flex items-center gap-2 border-b border-primary/20 bg-primary/5 px-6 py-2.5">
            <Eye className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm text-foreground font-medium">Preview Mode</span>
            <span className="text-sm text-muted-foreground">— Complete the prerequisite to start this skill target</span>
          </div>
        )}
        <div className="flex flex-1 min-h-0">
        {/* Left: Chat panel — full height */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-border">
          {/* Title bar */}
          <div className="px-6 py-3 border-b border-border">
            <p className="text-sm font-medium text-foreground truncate">
              {substitute(target.title)}
            </p>
          </div>

          {/* Tabs — Chapters only visible when a module is active */}
          <div className="flex border-b border-border px-6">
            <button
              onClick={() => setActiveTab("conversation")}
              className={cn(
                "text-sm font-medium px-1 py-2.5 mr-6 border-b-2 transition-colors",
                activeTab === "conversation"
                  ? "text-primary border-primary"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              )}
            >
              Conversation
            </button>
            {activeStep && (
              <button
                onClick={() => setActiveTab("chapters")}
                className={cn(
                  "text-sm font-medium px-1 py-2.5 border-b-2 transition-colors",
                  activeTab === "chapters"
                    ? "text-primary border-primary"
                    : "text-muted-foreground border-transparent hover:text-foreground"
                )}
              >
                Chapters
              </button>
            )}
          </div>

          {/* Chat area or Chapters list */}
          <div className="flex-1 flex flex-col min-h-0">
            {activeTab === "chapters" && activeStep ? (
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Chapters</h3>
                <div className="space-y-1">
                  {target.steps.map((step, idx) => {
                    const isCurrent = step.id === activeStep.id;
                    const isCompleted = step.status === "completed";
                    const isSkipped = step.status === "skipped";
                    return (
                      <button
                        key={step.id}
                        onClick={() => {
                          setActiveStep(step);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                          isCurrent
                            ? "bg-primary/10 text-primary"
                            : step.status === "locked"
                            ? "text-muted-foreground/50 cursor-not-allowed"
                            : isCompleted || isSkipped
                            ? "text-muted-foreground hover:bg-secondary"
                            : "text-foreground hover:bg-secondary"
                        )}
                        disabled={step.status === "locked"}
                      >
                        <span className="text-xs font-medium text-muted-foreground w-5 shrink-0">
                          {isCompleted ? "✓" : isSkipped ? "—" : idx + 1}
                        </span>
                        <span className={cn("text-sm truncate", (isCompleted || isSkipped) && "line-through opacity-70")}>{substitute(step.title)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <TraditionalChatArea target={target} />
            )}
          </div>
        </div>

        {/* Right: Activities panel / Content viewer — expands when content is active */}
        <div className={cn(
          "shrink-0 flex flex-col bg-card border-l border-border h-[calc(100vh-3.5rem)] transition-all duration-300",
          activeStep ? "w-[60%]" : "w-[420px]"
        )}>
          {activeStep ? (
            <TraditionalContentViewer
              step={activeStep}
              onClose={() => { setActiveStep(null); setActiveTab("conversation"); }}
              skillTargetId={id!}
              allSteps={target.steps}
              onNavigateToStep={(step) => { setActiveStep(step); setActiveTab("chapters"); }}
            />
          ) : (
            <TraditionalActivitiesPanel
              steps={target.steps}
              skillTargetTitle={substitute(target.title)}
              onActivityClick={(step) => setActiveStep(step)}
              activeStepId={activeStep?.id}
            />
          )}
        </div>
        </div>
      </div>
    );
  }

  // ── New UI layout (unchanged) ──
  return (
    <div className="flex flex-1 min-h-0 h-full overflow-hidden flex-col">
      <PageHeader
        title={substitute(target.title)}
        subtitle={substitute(target.description)}
        breadcrumbs={[
          { label: "Skill Targets", to: "/manager/skill-targets" },
          { label: substitute(target.title) },
        ]}
      />
      <div className="flex flex-1 min-h-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {/* Preview banner */}
          {isPreview && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5">
              <Eye className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm text-foreground font-medium">Preview Mode</span>
              <span className="text-sm text-muted-foreground">— Complete the prerequisite to start this skill target</span>
            </div>
          )}

          {/* Header card — two-column */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-xl bg-card border border-border p-6 shadow-card mb-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
              {/* Left column */}
              <div>
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

                <div className="flex items-center gap-3">
                  <Progress value={target.progress} className="h-2 flex-1" />
                  <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                    {completedSteps}/{target.steps.length} steps · {target.progress}%
                  </span>
                </div>

                {/* Module breakdown cards */}
                {(() => {
                  const modulesCount = target.steps.filter(s => s.type === "module").length;
                  const assessmentsCount = target.steps.filter(s => s.type === "assessment").length;
                  const rolePlaysCount = target.steps.filter(s => s.type === "role_play").length;
                  const cards: { icon: React.ReactNode; count: number; label: string }[] = [
                    { icon: <BookOpen className="h-5 w-5 text-primary" />, count: modulesCount, label: "Modules" },
                    { icon: <ClipboardCheck className="h-5 w-5 text-primary" />, count: assessmentsCount, label: "Assessments" },
                    { icon: <Drama className="h-5 w-5 text-primary" />, count: rolePlaysCount, label: "Role Plays" },
                  ].filter(c => c.count > 0);
                  return (
                    <div className="grid grid-cols-3 gap-3 mt-5 flex-1">
                      {cards.map((card) => (
                        <div
                          key={card.label}
                          className="flex flex-col items-center justify-center rounded-xl border border-border bg-secondary/40 p-4 text-center"
                        >
                          <span className="mb-1.5">{card.icon}</span>
                          <span className="text-xl font-bold text-foreground leading-none">{card.count}</span>
                          <span className="text-[0.7rem] text-muted-foreground mt-1">{card.label}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Right column — Skills Being Developed */}
              <div className="border-t lg:border-t-0 lg:border-l border-border pt-4 lg:pt-0 lg:pl-6">
                <h3 className="font-display text-sm font-semibold text-foreground mb-3">
                  Skills Being Developed
                </h3>
                {target.skills && target.skills.length > 0 ? (
                  <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
                    {target.skills.map((skill) => (
                      <div key={skill.name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">{skill.name}</span>
                          <span className="text-xs font-medium text-primary">
                            {proficiencyShort[skill.current]} → {proficiencyShort[skill.target]}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full rounded-full bg-amber-500 transition-all"
                              style={{ width: `${target.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-8 text-right">{target.progress}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Skills data is not available for this course.
                  </p>
                )}
              </div>
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
    </div>
  );
}

// ── Inline Traditional chat area (simplified embedded chat) ──
import { useState as useStateChat, useRef, useEffect } from "react";
import { Sparkles, Mic, Send, Plus, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { SkillTarget } from "@/types/learning";
import { streamChat } from "@/lib/streamChat";

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: { label: string }[];
}

function TraditionalChatArea({ target }: { target: SkillTarget }) {
  const [messages, setMessages] = useStateChat<ChatMsg[]>([]);
  const [input, setInput] = useStateChat("");
  const [isLoading, setIsLoading] = useStateChat(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const welcomeHeading = `Let's unpack ${target.category}: ${target.title}. Ask me anything.`;

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userContent = input.trim();
    const userMsg: ChatMsg = { id: Date.now().toString(), role: "user", content: userContent };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
    // Add context about the skill target
    const contextMessages = [
      { role: "user" as const, content: `Context: I'm learning about "${target.title}" in the category "${target.category}". ${target.description}` },
      { role: "assistant" as const, content: "Got it! I'll help you with this learning topic. What would you like to know?" },
      ...history,
    ];

    let assistantSoFar = "";
    try {
      await streamChat({
        messages: contextMessages,
        onDelta: (chunk) => {
          assistantSoFar += chunk;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && last.id === "streaming") {
              return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
            }
            return [...prev, { id: "streaming", role: "assistant", content: assistantSoFar }];
          });
        },
        onDone: () => {
          setMessages((prev) => prev.map((m) => m.id === "streaming" ? { ...m, id: Date.now().toString() } : m));
          setIsLoading(false);
        },
        onError: (error) => {
          setMessages((prev) => [...prev, { id: Date.now().toString(), role: "assistant", content: `Sorry, an error occurred: ${error}` }]);
          setIsLoading(false);
        },
      });
    } catch {
      setMessages((prev) => [...prev, { id: Date.now().toString(), role: "assistant", content: "Sorry, I couldn't connect to the AI service." }]);
      setIsLoading(false);
    }
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
            disabled={isLoading}
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
              disabled={isLoading}
              className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <p className="text-[0.65rem] text-muted-foreground text-center mt-2">
          AI can make mistakes. Check for accuracy.
        </p>
      </div>
    </>
  );
}

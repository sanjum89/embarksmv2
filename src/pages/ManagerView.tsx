import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Users, BookOpen, TrendingUp, Layers, BarChart3, Briefcase, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useUser } from "@/contexts/UserContext";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { mockNewHires, mockProgramContexts, mockSkillTargets } from "@/data/mock";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import NewHiresPanel from "@/components/manager/NewHiresPanel";
import ProgramContextPanel from "@/components/manager/ProgramContextPanel";
import TrainingAssignPanel from "@/components/manager/TrainingAssignPanel";
import ProgressPanel from "@/components/manager/ProgressPanel";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  panel?: "new_hires" | "program_context" | "assign_training" | "progress";
  panelData?: any;
}

const suggestionCards = [
  { label: "New hires added", prompt: "Show me my new hires", icon: Users, color: "bg-accent/10 text-accent" },
  { label: "Program Context", prompt: "Show me program context", icon: Layers, color: "bg-primary/10 text-primary" },
  { label: "Assign training", prompt: "Assign training to my new hires", icon: BookOpen, color: "bg-success/20 text-success" },
  { label: "Track Maya's progress", prompt: "Show me Maya's progress", icon: TrendingUp, color: "bg-info/20 text-info" },
  { label: "View team progress", prompt: "Show me team training progress", icon: BarChart3, color: "bg-warning/20 text-warning" },
  { label: "Skill gaps", prompt: "Show me organizational skill gaps", icon: Briefcase, color: "bg-destructive/10 text-destructive" },
];

const pillSuggestions = [
  "Assign Maya to Apple L1",
  "Show me Maya's progress",
  "Show me program context",
];

function generateResponse(prompt: string, skillTargets: any[]): ChatMessage {
  const lower = prompt.toLowerCase();
  const id = Date.now().toString();

  if (lower.includes("new hire")) {
    return {
      id, role: "assistant",
      content: `You have **${mockNewHires.length} new hires** added to your team:\n\n${mockNewHires.map((h, i) => `${i + 1}. **${h.user.name}** — ${h.title}, ${h.location} (${h.yearsExperience} yrs exp)`).join("\n")}\n\nI've loaded their details in the panel on the right.`,
      panel: "new_hires",
    };
  }

  if (lower.includes("program context")) {
    const pc = mockProgramContexts[0];
    return {
      id, role: "assistant",
      content: `Here's the **${pc.name}** program configuration:\n\n- **Category:** ${pc.category}\n- **Assessment Pass %:** ${pc.assessmentPassPercentage}%\n- **Adaptive Skip:** >${pc.adaptiveSkipThresholds.skipOne}% skips Module 2, ≥${pc.adaptiveSkipThresholds.skipTwo}% skips Modules 2 & 3\n- **Assigned Learners:** ${pc.assignedLearners.length}\n\nYou can review and edit the configuration in the panel.`,
      panel: "program_context",
    };
  }

  if (lower.includes("assign") && (lower.includes("maya") || lower.includes("training") || lower.includes("apple l1"))) {
    return {
      id, role: "assistant",
      content: `I've prepared the **Apple L1 Customer Support Readiness** training for assignment.\n\nYou can review the chapters, adjust the pass percentage, and add or remove modules before assigning. The panel on the right shows the full configuration.`,
      panel: "assign_training",
    };
  }

  if (lower.includes("maya") && lower.includes("progress")) {
    const st4 = skillTargets.find((st) => st.id === "st4");
    if (st4) {
      const completed = st4.steps.filter((s: any) => s.status === "completed").length;
      const skipped = st4.steps.filter((s: any) => s.status === "skipped").length;
      const current = st4.steps.find((s: any) => s.status === "available" || s.status === "in_progress");
      return {
        id, role: "assistant",
        content: `**Maya Thompson's Progress — Apple L1 Customer Support Readiness**\n\n- **Overall:** ${st4.progress}% complete\n- **Steps completed:** ${completed}/${st4.steps.length}${skipped > 0 ? ` (${skipped} skipped)` : ""}\n- **Current step:** ${current ? current.title : "All complete"}\n\nDetailed progress is shown in the panel.`,
        panel: "progress",
      };
    }
  }

  return {
    id, role: "assistant",
    content: `I can help you with:\n- **New hires** — view your team additions\n- **Program context** — configure training programs\n- **Assign training** — set up and assign modules\n- **Progress tracking** — see how learners are doing\n\nTry clicking one of the suggestion cards or ask me directly!`,
  };
}

export default function ManagerView() {
  const { user } = useUser();
  const { skillTargets } = useSkillTargets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [activePanelData, setActivePanelData] = useState<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (prompt: string) => {
    if (!prompt.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: prompt };
    const response = generateResponse(prompt, skillTargets);
    setMessages((prev) => [...prev, userMsg, response]);
    if (response.panel) {
      setActivePanel(response.panel);
      setActivePanelData(response.panelData);
    }
    setInput("");
  };

  const firstName = user.name.split(" ")[0];
  const showHome = messages.length === 0;

  return (
    <div className="flex h-full">
      {/* Left: Chat */}
      <div className={cn("flex flex-col h-full", activePanel ? "w-[55%]" : "w-full")}>
        <div className="flex-1 overflow-y-auto p-6">
          {showHome ? (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto pt-12">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-accent" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">AgentOne</span>
              </div>
              <h1 className="font-display text-3xl font-bold text-foreground mb-1">
                Hi {firstName}, let's dive in
              </h1>
              <p className="text-muted-foreground text-sm mb-8">
                What would you like to explore today?
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                {suggestionCards.map((card) => (
                  <button
                    key={card.label}
                    onClick={() => handleSend(card.prompt)}
                    className="group flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-sm hover:shadow-md hover:border-accent/40 transition-all"
                  >
                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", card.color)}>
                      <card.icon className="h-4.5 w-4.5" />
                    </div>
                    <span className="text-sm font-medium text-foreground leading-snug">{card.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-muted-foreground mr-1 self-center">Quick:</span>
                {pillSuggestions.map((pill) => (
                  <button
                    key={pill}
                    onClick={() => handleSend(pill)}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                  >
                    {pill}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-4">
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "rounded-xl px-4 py-3 text-sm",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground ml-auto max-w-[80%]"
                        : "bg-card border border-border max-w-full"
                    )}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none text-foreground">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={chatEndRef} />

              {/* Post-response suggestion pills */}
              {messages.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {pillSuggestions.map((pill) => (
                    <button
                      key={pill}
                      onClick={() => handleSend(pill)}
                      className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                    >
                      {pill}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border p-4">
          <div className="max-w-2xl mx-auto flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
              placeholder="Ask about your team, training, or programs..."
              className="flex-1"
            />
            <Button size="icon" onClick={() => handleSend(input)} disabled={!input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Right: Context Panel */}
      <AnimatePresence>
        {activePanel && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-[45%] border-l border-border bg-card h-full overflow-y-auto"
          >
            {activePanel === "new_hires" && <NewHiresPanel />}
            {activePanel === "program_context" && <ProgramContextPanel />}
            {activePanel === "assign_training" && (
              <TrainingAssignPanel
                onAssigned={() => {
                  const msg: ChatMessage = {
                    id: Date.now().toString(),
                    role: "assistant",
                    content: "✅ Training has been assigned successfully! The learners will see the **Apple L1 Customer Support Readiness** skill target in their dashboard.",
                  };
                  setMessages((prev) => [...prev, msg]);
                }}
              />
            )}
            {activePanel === "progress" && <ProgressPanel />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Home, BarChart3, Target, Briefcase, Activity, UserCircle2, ClipboardList } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useAccount } from "@/contexts/AccountContext";
import { useDeepResearch } from "@/hooks/useDeepResearch";
import { DeepResearchWorkspace, type DeepResearchStarter } from "@/components/deep-research/DeepResearchWorkspace";
import { AgentOneNudgeStack } from "@/components/chat/AgentOneNudgeStack";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StaggerList, StaggerItem } from "@/components/motion/Motion";

/* ─── Suggestion Card Illustrations ─── */
const CardIllustration = ({ type }: { type: string }) => {
  const illustrations: Record<string, React.ReactNode> = {
    skills: (
      <svg viewBox="0 0 120 80" className="w-full h-full">
        <rect x="20" y="50" width="12" height="20" rx="2" fill="hsl(var(--primary))" opacity="0.2" />
        <rect x="38" y="35" width="12" height="35" rx="2" fill="hsl(var(--primary))" opacity="0.3" />
        <rect x="56" y="25" width="12" height="45" rx="2" fill="hsl(var(--primary))" opacity="0.4" />
        <rect x="74" y="40" width="12" height="30" rx="2" fill="hsl(var(--primary))" opacity="0.35" />
        <rect x="92" y="20" width="12" height="50" rx="2" fill="hsl(var(--primary))" opacity="0.5" />
      </svg>
    ),
    profile: (
      <svg viewBox="0 0 120 80" className="w-full h-full">
        <circle cx="60" cy="30" r="12" stroke="hsl(var(--primary))" strokeWidth="2" fill="hsl(var(--primary))" fillOpacity="0.1" />
        <line x1="30" y1="55" x2="90" y2="55" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.25" />
        <line x1="35" y1="63" x2="85" y2="63" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.2" />
        <line x1="40" y1="71" x2="80" y2="71" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.15" />
      </svg>
    ),
    career: (
      <svg viewBox="0 0 120 80" className="w-full h-full">
        <path d="M15 60 Q35 50 50 40 Q65 30 80 35 Q95 40 110 20" stroke="hsl(var(--primary))" strokeWidth="2" fill="none" opacity="0.4" />
        <path d="M15 65 Q35 55 50 50 Q65 45 80 42 Q95 39 110 30" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="none" opacity="0.25" strokeDasharray="4 3" />
      </svg>
    ),
    activities: (
      <svg viewBox="0 0 120 80" className="w-full h-full">
        <line x1="25" y1="30" x2="95" y2="30" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.3" />
        <line x1="25" y1="42" x2="85" y2="42" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.25" />
        <line x1="25" y1="54" x2="75" y2="54" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.2" />
        <rect x="25" y="24" width="6" height="6" rx="1" fill="hsl(var(--primary))" opacity="0.4" />
        <rect x="25" y="36" width="6" height="6" rx="1" fill="hsl(var(--primary))" opacity="0.3" />
        <rect x="25" y="48" width="6" height="6" rx="1" fill="hsl(var(--primary))" opacity="0.2" />
      </svg>
    ),
    reflection: (
      <svg viewBox="0 0 120 80" className="w-full h-full">
        <rect x="30" y="20" width="60" height="40" rx="6" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="hsl(var(--primary))" fillOpacity="0.08" />
        <line x1="40" y1="32" x2="80" y2="32" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.3" />
        <line x1="40" y1="40" x2="75" y2="40" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.25" />
        <line x1="40" y1="48" x2="65" y2="48" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.2" />
      </svg>
    ),
    required: (
      <svg viewBox="0 0 120 80" className="w-full h-full">
        {[0, 1, 2, 3].map((r) =>
          [0, 1, 2, 3].map((c) => (
            <rect
              key={`${r}-${c}`}
              x={25 + c * 20}
              y={15 + r * 16}
              width="14"
              height="10"
              rx="2"
              fill="hsl(var(--primary))"
              opacity={0.15 + ((r * 4 + c) % 5) * 0.08}
            />
          ))
        )}
      </svg>
    ),
  };
  return <div className="w-full h-16 sm:h-20">{illustrations[type]}</div>;
};

interface LearnerCard {
  label: string;
  description: string;
  prompt: string;
  illustration: string;
  icon: React.ElementType;
}

const suggestionCards: LearnerCard[] = [
  { label: "Grow My Skills", description: "Get recommendations for growing your skills.", prompt: "Show me recommendations for growing my skills", illustration: "skills", icon: BarChart3 },
  { label: "Required Skills", description: "Required skills for your job role.", prompt: "Show me the required skills for my role", illustration: "required", icon: Target },
  { label: "Explore Career Paths", description: "Discover potential career paths.", prompt: "Explore career paths based on my current skills", illustration: "career", icon: Briefcase },
  { label: "View My Activities", description: "Track your recent activities.", prompt: "Show me my recent learning activities", illustration: "activities", icon: Activity },
  { label: "Build Your Profile", description: "Upload resume to build your profile.", prompt: "Help me build my professional profile", illustration: "profile", icon: UserCircle2 },
  { label: "Create a Reflection", description: "Reflect on your learning journey.", prompt: "Help me create a reflection on my recent learning", illustration: "reflection", icon: ClipboardList },
];

export default function LearnerChat() {
  const { user } = useUser();
  const { activeAccount } = useAccount();
  const navigate = useNavigate();
  const accountId = activeAccount?.id ?? "default";
  const accountName = activeAccount?.name ?? null;

  const dr = useDeepResearch({ accountId, accountName, ownerId: user.id, scope: "personal" });

  const [chatActive, setChatActive] = useState(false);
  const [input, setInput] = useState("");

  const firstName = user.name.split(" ")[0];

  const starters: DeepResearchStarter[] = useMemo(
    () =>
      suggestionCards.map((c, i) => ({
        id: `learner-${i}`,
        label: c.label,
        prompt: c.prompt,
        description: c.description,
        icon: c.icon,
      })),
    []
  );

  // When chat opens, reset to a fresh thread state so home → starter goes straight to a new conversation
  useEffect(() => {
    if (!chatActive) {
      dr.setActiveThreadId(null);
    }
  }, [chatActive]);

  const startWith = async (prompt: string) => {
    setChatActive(true);
    const threadId = dr.newThread();
    await dr.ask(prompt, { threadId });
  };

  const handleHomeSend = () => {
    const v = input.trim();
    if (!v) return;
    setInput("");
    startWith(v);
  };

  return (
    <div className="flex flex-1 h-full min-h-0 overflow-hidden">
      <div className="flex flex-col min-h-0 flex-1">
        <AnimatePresence mode="wait">
          {!chatActive ? (
            /* ── Home State (image 1) — centered, narrow frame ── */
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 overflow-y-auto min-h-0 flex items-center justify-center"
            >
              <div className="mx-auto w-full max-w-[720px] px-4 py-8">
                <motion.h1
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-display text-[1.7rem] font-bold text-foreground mb-4"
                >
                  Hi {firstName}, let's grow together
                </motion.h1>

                <div className="mb-5">
                  <AgentOneNudgeStack
                    onAgentClick={() => setChatActive(true)}
                    onChatAction={(prompt) => {
                      if (typeof prompt === "string" && prompt && prompt !== "__ASSESSMENT__") {
                        startWith(prompt);
                      } else {
                        setChatActive(true);
                      }
                    }}
                  />
                </div>

                {/* 6-card grid (image 1) — squarer tiles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
                  {suggestionCards.map((card, i) => (
                    <motion.button
                      key={card.label}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.04 * i }}
                      onClick={() => startWith(card.prompt)}
                      className="text-left rounded-2xl border border-border/70 bg-card p-4 hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-sm transition-all group"
                    >
                      <div className="rounded-xl bg-muted/50 mb-3 flex items-center justify-center h-24">
                        <CardIllustration type={card.illustration} />
                      </div>
                      <div className="text-sm font-semibold text-foreground leading-tight">{card.label}</div>
                      <div className="text-[12px] text-muted-foreground mt-1 leading-snug">{card.description}</div>
                    </motion.button>
                  ))}
                </div>

                {/* Composer */}
                <div className="relative w-full">
                  <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary pointer-events-none" />
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && input.trim()) handleHomeSend();
                    }}
                    placeholder="Ask anything..."
                    className="h-12 rounded-xl border-border text-[0.85rem] focus-visible:ring-primary/30 pl-9 pr-12 shadow-sm"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn(
                      "absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-lg transition-all",
                      input.trim() && "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                    )}
                    onClick={handleHomeSend}
                    disabled={!input.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ── Inner chat: shared Deep Research workspace, personal scope ── */
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col min-h-0 flex-1"
            >
              <DeepResearchWorkspace
                dr={dr}
                authorId={user.id}
                starters={starters}
                startersHeading="Suggested topics"
                emptyState={{
                  title: `Hi ${firstName}, what would you like to explore?`,
                  subtitle: "Pick a topic on the left or ask your own question.",
                  icon: Sparkles,
                }}
                composerPlaceholder="Ask anything…"
                topBar={
                  <div className="shrink-0 border-b border-border bg-card/60 backdrop-blur-sm">
                    <div className="px-4 lg:px-6 h-11 flex items-center gap-2">
                      <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
                        <Sparkles className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-[12px] font-semibold text-foreground">Agent One</span>
                      <span className="rounded-full bg-primary/10 text-primary px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider">
                        Live
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-1">Personal scope · your data only</span>
                      <div className="ml-auto flex items-center gap-1">
                        <button
                          onClick={() => {
                            dr.setActiveThreadId(null);
                            setChatActive(false);
                          }}
                          className="h-7 px-2 rounded-md flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                        >
                          <Home className="h-3 w-3" />
                          Home
                        </button>
                      </div>
                    </div>
                  </div>
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

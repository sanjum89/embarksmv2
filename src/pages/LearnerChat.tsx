import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageSquare, ThumbsUp, ThumbsDown, Link2, Info } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useUser } from "@/contexts/UserContext";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { useAccount } from "@/contexts/AccountContext";
import { supabase } from "@/integrations/supabase/client";
import { profileDataByUser as defaultProfileData } from "@/data/mock";
import { getProfileData } from "@/lib/accountSelectors";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SuperAgentCard } from "@/components/chat/SuperAgentCard";

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
        {[0,1,2,3].map(r => [0,1,2,3].map(c => (
          <rect key={`${r}-${c}`} x={25 + c * 20} y={15 + r * 16} width="14" height="10" rx="2"
            fill="hsl(var(--primary))" opacity={0.1 + Math.random() * 0.3} />
        )))}
      </svg>
    ),
  };
  return <div className="w-full h-16 sm:h-20">{illustrations[type]}</div>;
};

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  topicLabel?: string;
  suggestions?: string[];
}

const suggestionCards = [
  { label: "Grow My Skills", description: "Get recommendations for growing your skills.", prompt: "Show me recommendations for growing my skills", illustration: "skills" },
  { label: "Required Skills", description: "Required skills for your job role - system-inferred.", prompt: "Show me the required skills for my role", illustration: "required" },
  { label: "Explore Career Paths", description: "Discover potential career paths based on your skills.", prompt: "Explore career paths based on my current skills", illustration: "career" },
  { label: "View My Activities", description: "Track your recent activities and interactions.", prompt: "Show me my recent learning activities", illustration: "activities" },
  { label: "Build Your Profile", description: "Upload resume to complete building your profile.", prompt: "Help me build my professional profile", illustration: "profile" },
  { label: "Create a Reflection", description: "Start a new reflection on your learning journey.", prompt: "Help me create a reflection on my recent learning", illustration: "reflection" },
];

function generateResponse(prompt: string, userProfile: any, skillTargets: any[]): Omit<ChatMessage, "id"> {
  const lower = prompt.toLowerCase();

  if (lower.includes("skill gap") || lower.includes("required skill") || lower.includes("role")) {
    const roleGaps = userProfile?.roleSkillsCurrent?.map((s: any) => {
      const req = userProfile?.roleSkillsRequired?.find((r: any) => r.skill_name === s.skill_name);
      return req ? { name: s.skill_name, current: s.proficiency, required: req.proficiency } : null;
    }).filter(Boolean) || [];

    const gapLines = roleGaps.map((g: any) => `- **${g.name}**: ${g.current} → ${g.required}${g.current === g.required ? " ✅" : " ⚠️"}`).join("\n");

    return {
      role: "assistant",
      topicLabel: "Skills Gap Analysis",
      content: `**Your Role Skills — Gap Analysis**\n\nHere's how your current skills compare to what's required for your role:\n\n${gapLines}\n\nSkills marked with ⚠️ have a gap that can be closed through targeted learning paths.`,
      suggestions: ["Recommend learning paths for my gaps", "Explore career paths", "Show my project skills"],
    };
  }

  if (lower.includes("grow") || lower.includes("recommendation") || lower.includes("recommend")) {
    return {
      role: "assistant",
      topicLabel: "Skill Growth Recommendations",
      content: `**Personalized Growth Recommendations**\n\nBased on your current profile and skill gaps, here are my top recommendations:\n\n1. 🎯 **Focus on high-gap skills first** — Skills where you're 2+ levels below the requirement should be prioritized.\n2. 📚 **Complete assigned learning paths** — You have ${skillTargets.length} active skill target(s) that directly address your gaps.\n3. 🎭 **Practice with role plays** — Simulated scenarios build confidence in customer-facing skills.\n4. 📝 **Regular reflections** — Document your learning to track progress and identify patterns.\n\nWould you like me to create a personalized learning plan?`,
      suggestions: ["Create a learning plan", "Show me my skill gaps", "View my learning paths"],
    };
  }

  if (lower.includes("career") || lower.includes("path")) {
    return {
      role: "assistant",
      topicLabel: "Career Paths",
      content: `**Potential Career Paths Based on Your Skills**\n\nBased on your current skill profile, here are career paths worth exploring:\n\n1. 🔹 **Senior Customer Support Specialist** — Build on your communication and troubleshooting strengths. Gap: 2-3 advanced skills needed.\n2. 🔹 **Technical Support Engineer (L2)** — Leverage your technical knowledge. Gap: Deep product expertise required.\n3. 🔹 **Customer Success Manager** — Your empathy and communication skills are a strong foundation. Gap: Account management and analytics skills.\n4. 🔹 **Training & Quality Analyst** — Use your domain expertise to coach others. Gap: Instructional design and data analysis.\n\nEach path shows the skills you already have and what you'd need to develop.`,
      suggestions: ["Show skills needed for L2 Support", "Show my current skill gaps", "Build my profile"],
    };
  }

  if (lower.includes("activit") || lower.includes("recent")) {
    return {
      role: "assistant",
      topicLabel: "Recent Activities",
      content: `**Your Recent Learning Activities**\n\n📅 **This Week:**\n- Completed Module: Apple Product Ecosystem Overview\n- Started Module: Apple ID and iCloud Fundamentals\n- Attempted Pre-Assessment (Score: 72%)\n\n📅 **Last Week:**\n- Completed onboarding orientation\n- Profile setup completed\n- First reflection submitted\n\n📊 **Stats:** 3 modules completed, 1 assessment taken, 1 reflection written.\n\nKeep up the great pace! You're on track to complete your learning path on time.`,
      suggestions: ["Show my skill gaps", "Create a reflection", "View my learning paths"],
    };
  }

  if (lower.includes("profile") || lower.includes("build") || lower.includes("resume")) {
    return {
      role: "assistant",
      topicLabel: "Profile Builder",
      content: `**Build Your Professional Profile**\n\nYour profile is the foundation for personalized skill recommendations and career path suggestions. Here's what you can do:\n\n1. 📄 **Upload your resume** — I'll extract your skills, experience, and certifications automatically.\n2. ✏️ **Confirm your required skills** — Review and validate the system-inferred skills for your role.\n3. 🎯 **Set your goals** — Tell me what you want to achieve in the next 6-12 months.\n4. ⏱️ **Allocate time** — Set your weekly learning time commitment.\n\nWould you like to start with any of these?`,
      suggestions: ["Confirm my required skills", "Set my learning goals", "Show my current profile"],
    };
  }

  if (lower.includes("reflection") || lower.includes("reflect")) {
    return {
      role: "assistant",
      topicLabel: "Reflections",
      content: `**Create a Learning Reflection**\n\nReflections help you internalize what you've learned and identify areas for improvement. Here's a guided format:\n\n📝 **What did you learn recently?**\nDescribe a key insight from your recent training or work.\n\n💡 **How will you apply it?**\nThink about specific situations where this knowledge is useful.\n\n🔄 **What would you do differently?**\nReflect on challenges and how you'd approach them next time.\n\nYou can also:\n- 📖 **Explore past reflections** — Review your learning journal\n- 🔍 **See skills from reflections** — View skills I've inferred from your entries\n\nReady to start writing?`,
      suggestions: ["View my past reflections", "See skills from my reflections", "Show my skill gaps"],
    };
  }

  if (lower.includes("project") || lower.includes("program")) {
    const projectGaps = userProfile?.projectSkillsCurrent?.map((s: any) => {
      const req = userProfile?.projectSkillsRequired?.find((r: any) => r.skill_name === s.skill_name);
      return req ? { name: s.skill_name, current: s.proficiency, required: req.proficiency } : null;
    }).filter(Boolean) || [];

    const gapLines = projectGaps.map((g: any) => `- **${g.name}**: ${g.current} → ${g.required}${g.current === g.required ? " ✅" : " ⚠️"}`).join("\n");

    return {
      role: "assistant",
      topicLabel: "Project Skills",
      content: `**Your Project Skills — ${userProfile?.program || "Current Program"}**\n\n${gapLines}\n\nThese are the skills specific to your current project assignment. Focus on the ⚠️ items to get project-ready faster.`,
      suggestions: ["Show my role skills", "Recommend learning for project gaps", "Explore career paths"],
    };
  }

  return {
    role: "assistant",
    content: `I can help you with your personal growth and learning journey:\n\n- 🎯 **Skill gaps** — See where you stand vs. what's required\n- 📚 **Learning recommendations** — Get personalized suggestions\n- 🛤️ **Career paths** — Explore growth opportunities\n- 📝 **Reflections** — Document and track your learning\n- 👤 **Profile** — Build and enhance your professional profile\n\nTry clicking a suggestion card or ask me anything!`,
    suggestions: ["Show me my skill gaps", "Grow my skills", "Explore career paths"],
  };
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

export default function LearnerChat() {
  const { user } = useUser();
  const { skillTargets } = useSkillTargets();
  const { normalizedAccount, activeAccount } = useAccount();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const userProfile = (normalizedAccount ? getProfileData(normalizedAccount, user.id) : null)
    ?? activeAccount?.data?.profileData?.[user.id]
    ?? (defaultProfileData as any)[user.id];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const handleSend = useCallback((prompt: string) => {
    if (!prompt.trim() || isThinking) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: prompt };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsThinking(true);

    setTimeout(() => {
      const responseData = generateResponse(prompt, userProfile, skillTargets);
      const response: ChatMessage = { id: (Date.now() + 1).toString(), ...responseData };
      setMessages((prev) => [...prev, response]);
      setIsThinking(false);
    }, 2000);
  }, [isThinking, userProfile, skillTargets]);

  const firstName = user.name.split(" ")[0];
  const showHome = messages.length === 0;

  return (
    <div className="flex flex-1 h-full min-h-0 overflow-hidden">
      <div className="flex flex-col min-h-0 flex-1">
        <div className="flex-1 overflow-y-auto min-h-0">
          {showHome ? (
            <div className="flex flex-col items-center justify-center min-h-full px-6">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[680px] pt-16 pb-8">
                <h1 className="font-display text-[28px] font-bold text-foreground mb-6">
                  Hi {firstName}, let's grow together
                </h1>

                {/* Super Agent Card */}
                <div className="mb-6">
                  <SuperAgentCard />
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  {suggestionCards.map((card, i) => (
                    <motion.button
                      key={card.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 + i * 0.04 }}
                      onClick={() => handleSend(card.prompt)}
                      className="flex flex-col rounded-xl border border-border bg-card p-3 text-left hover:shadow-md hover:border-primary/30 transition-all group"
                    >
                      <div className="bg-primary/5 rounded-lg p-2 mb-3">
                        <CardIllustration type={card.illustration} />
                      </div>
                      <span className="text-[13px] font-medium text-foreground leading-snug mb-1">{card.label}</span>
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[11px] text-muted-foreground leading-snug line-clamp-2 flex-1">{card.description}</span>
                        <Info className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 ml-2" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </div>
          ) : (
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
                        {msg.topicLabel && (
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-accent" />
                            <div className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-primary-foreground text-xs font-medium">
                              <MessageSquare className="h-3 w-3" />
                              {msg.topicLabel}
                            </div>
                          </div>
                        )}

                        <div className="prose prose-sm max-w-none text-foreground text-sm leading-relaxed">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>

                        {msg.suggestions && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {msg.suggestions.map((pill) => (
                              <button
                                key={pill}
                                onClick={() => handleSend(pill)}
                                className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-secondary hover:border-primary/30 transition-colors"
                              >
                                {pill}
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
                          <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-xs">
                            <Link2 className="h-3.5 w-3.5" />
                            Source
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
          )}
        </div>

        {/* Input area — sticky at bottom */}
        <div className="shrink-0 px-6 pb-6 pt-3 bg-background">
          <div className="max-w-[680px] mx-auto">
            {showHome && (
              <p className="text-xs font-medium text-primary mb-2">Or ask about your skills, learning, or career</p>
            )}
            <div className="relative">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend(input);
                }}
                placeholder={showHome ? "What skills do I need to improve?" : "Reply..."}
                className="pr-20 h-12 rounded-2xl border-border shadow-sm focus-within:shadow-md transition-shadow text-sm"
                disabled={isThinking}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => handleSend(input)}
                  disabled={!input.trim() || isThinking}
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              AI can make mistakes. Check for accuracy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, ChevronLeft, ChevronRight, ChevronUp, ArrowRight, X,
  Calendar, BookOpen, MessageSquare, Star, LucideIcon,
} from "lucide-react";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/contexts/AccountContext";
import { useUser } from "@/contexts/UserContext";
import { useAgentOne } from "@/contexts/AgentOneContext";
import { cn } from "@/lib/utils";

/* ─── Types ─── */
export interface NudgeCard {
  id: string;
  type: "kudos" | "meeting" | "learning_activity" | "reflection_request";
  title: string;
  subtitle: string;
  color_theme: "blue" | "emerald" | "amber" | "violet" | "rose";
  cta_label: string;
  cta_action: { type: "navigate" | "chat" | "navigate-and-chat"; path?: string; prompt?: string };
  priority: "high" | "medium" | "low";
  metadata: Record<string, unknown>;
  viewed: boolean;
  created_by: string;
}

/* ─── Deep saturated theme map for expanded cards ─── */
const themeMap: Record<NudgeCard["color_theme"], { bg: string; border: string; icon: string; text: string; sub: string; cta: string; ctaHover: string; depth: string }> = {
  blue:    { bg: "bg-blue-900",    border: "border-blue-700/50",    icon: "bg-blue-800 text-blue-300",    text: "text-blue-100",    sub: "text-blue-300",    cta: "bg-blue-500",    ctaHover: "hover:bg-blue-400",    depth: "bg-blue-800/60" },
  emerald: { bg: "bg-emerald-900", border: "border-emerald-700/50", icon: "bg-emerald-800 text-emerald-300", text: "text-emerald-100", sub: "text-emerald-300", cta: "bg-emerald-500", ctaHover: "hover:bg-emerald-400", depth: "bg-emerald-800/60" },
  amber:   { bg: "bg-amber-900",   border: "border-amber-700/50",   icon: "bg-amber-800 text-amber-300",   text: "text-amber-100",   sub: "text-amber-300",   cta: "bg-amber-500",   ctaHover: "hover:bg-amber-400",   depth: "bg-amber-800/60" },
  violet:  { bg: "bg-violet-900",  border: "border-violet-700/50",  icon: "bg-violet-800 text-violet-300",  text: "text-violet-100",  sub: "text-violet-300",  cta: "bg-violet-500",  ctaHover: "hover:bg-violet-400",  depth: "bg-violet-800/60" },
  rose:    { bg: "bg-rose-900",    border: "border-rose-700/50",    icon: "bg-rose-800 text-rose-300",    text: "text-rose-100",    sub: "text-rose-300",    cta: "bg-rose-500",    ctaHover: "hover:bg-rose-400",    depth: "bg-rose-800/60" },
};

const typeIcons: Record<NudgeCard["type"], LucideIcon> = {
  kudos: Star,
  meeting: Calendar,
  learning_activity: BookOpen,
  reflection_request: MessageSquare,
};

/* ─── Props ─── */
interface AgentOneNudgeStackProps {
  onAgentClick: () => void;
  onChatAction: (prompt: string) => void;
}

export function AgentOneNudgeStack({ onAgentClick, onChatAction }: AgentOneNudgeStackProps) {
  const navigate = useNavigate();
  const { activeAccount } = useAccount();
  const { user } = useUser();
  const { setIsOpen } = useAgentOne();

  const [nudges, setNudges] = useState<NudgeCard[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [confettiFired, setConfettiFired] = useState<Set<string>>(new Set());

  // Fetch nudge cards from DB
  useEffect(() => {
    if (!activeAccount?.id) return;
    const userId = user?.id || "RAT-E001";

    supabase
      .from("nudge_cards")
      .select("*")
      .eq("account_id", activeAccount.id)
      .eq("target_user_id", userId)
      .order("priority", { ascending: true })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) {
          setNudges(data.map((r: any) => ({
            id: r.id,
            type: r.type,
            title: r.title,
            subtitle: r.subtitle,
            color_theme: r.color_theme,
            cta_label: r.cta_label,
            cta_action: r.cta_action as NudgeCard["cta_action"],
            priority: r.priority,
            metadata: (r.metadata || {}) as Record<string, unknown>,
            viewed: r.viewed,
            created_by: r.created_by,
          })));
        }
      });
  }, [activeAccount?.id, user?.id]);

  const activeNudges = nudges.filter((n) => !dismissedIds.has(n.id));
  const hasNudges = activeNudges.length > 0;
  const currentNudge = hasNudges ? activeNudges[currentIndex % activeNudges.length] : null;

  // Keep index in bounds when nudges change
  useEffect(() => {
    if (activeNudges.length > 0 && currentIndex >= activeNudges.length) {
      setCurrentIndex(0);
    }
  }, [activeNudges.length, currentIndex]);

  const dismiss = (id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
  };

  // Fire confetti for kudos cards
  const fireKudosConfetti = (nudge: NudgeCard) => {
    if (nudge.type !== "kudos" || nudge.viewed || confettiFired.has(nudge.id)) return;
    setConfettiFired((prev) => new Set(prev).add(nudge.id));
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#f43f5e", "#ec4899", "#f97316", "#eab308", "#22c55e"],
    });
    supabase.from("nudge_cards").update({ viewed: true }).eq("id", nudge.id).then(() => {
      setNudges((prev) => prev.map((n) => n.id === nudge.id ? { ...n, viewed: true } : n));
    });
  };

  // Fire confetti when cycling to a kudos card or expanding
  useEffect(() => {
    if (currentNudge) fireKudosConfetti(currentNudge);
  }, [currentIndex]);

  useEffect(() => {
    if (expanded) {
      activeNudges.forEach((n) => fireKudosConfetti(n));
    }
  }, [expanded]);

  const cycleLeft = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + activeNudges.length) % activeNudges.length);
  };

  const cycleRight = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % activeNudges.length);
  };

  const handleCTA = (nudge: NudgeCard) => {
    const { cta_action: action } = nudge;
    if (action.type === "chat" && action.prompt) {
      onChatAction(action.prompt);
    } else if (action.type === "navigate" && action.path) {
      setIsOpen(false);
      navigate(action.path);
    } else if (action.type === "navigate-and-chat" && action.path) {
      navigate(action.path);
    }
  };

  // Get depth layer colors from next cards in stack
  const getDepthColor = (offset: number): string => {
    if (!hasNudges) return "bg-primary/50";
    const idx = (currentIndex + offset) % activeNudges.length;
    const nudge = activeNudges[idx];
    if (nudge) return themeMap[nudge.color_theme].depth;
    return "bg-primary/50";
  };

  const CurrentIcon = currentNudge ? typeIcons[currentNudge.type] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative pb-4"
    >
      {/* ── Depth layers (full-width, vertical offset only, tinted by next cards) ── */}
      {!expanded && hasNudges && (
        <>
          {activeNudges.length > 1 && (
            <div className={cn("absolute inset-x-0 top-[6px] bottom-0 -z-10 rounded-2xl shadow-md", getDepthColor(1))} />
          )}
          {activeNudges.length > 2 && (
            <div className={cn("absolute inset-x-0 top-[12px] bottom-0 -z-20 rounded-2xl shadow-sm", getDepthColor(2))} />
          )}
        </>
      )}

      {/* ── Main Agent One Card — click to toggle expand ── */}
      <button
        onClick={() => hasNudges ? setExpanded(!expanded) : onAgentClick()}
        className={cn(
          "group relative w-full rounded-2xl text-left overflow-hidden z-10",
          "bg-primary text-primary-foreground",
          "shadow-[0_4px_24px_-4px_hsl(var(--primary)/0.35)] hover:shadow-[0_8px_32px_-4px_hsl(var(--primary)/0.5)]",
          "active:scale-[0.98] transition-shadow duration-300"
        )}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.18] to-transparent -skew-x-12"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1.2, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -inset-[2px] rounded-2xl border-2 border-primary/40"
          animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.01, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative px-5 py-4 flex items-center gap-3">
          {/* Left cycling arrow */}
          {!expanded && hasNudges && activeNudges.length > 1 && (
            <button
              onClick={cycleLeft}
              className="shrink-0 p-1 rounded-lg hover:bg-white/15 transition-colors text-primary-foreground/60 hover:text-primary-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}

          {/* Icon */}
          <div className="shrink-0 relative">
            <motion.div
              className="h-12 w-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center"
              animate={{ rotate: [0, 3, -3, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="h-5 w-5" />
            </motion.div>
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-50" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-400 border-2 border-primary" />
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-[15px] font-bold leading-tight">Agent One</h3>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">Live</span>
              {hasNudges && (
                <span className="rounded-full bg-white/25 px-1.5 py-0.5 text-[10px] font-semibold">
                  {activeNudges.length} action{activeNudges.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            {/* Show current nudge info when collapsed, or generic text */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentNudge?.id || "default"}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-1.5"
              >
                {currentNudge && CurrentIcon && !expanded ? (
                  <>
                    <CurrentIcon className="h-3.5 w-3.5 text-primary-foreground/60 shrink-0" />
                    <span className="text-[13px] text-primary-foreground/75 leading-snug truncate">
                      {currentNudge.title}
                    </span>
                  </>
                ) : (
                  <span className="text-[13px] text-primary-foreground/75 leading-snug truncate">
                    {expanded ? "Tap to collapse" : "Hey! I'm here to help you get started →"}
                  </span>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right cycling arrow or collapse indicator */}
          <div className="shrink-0 flex items-center gap-1">
            {!expanded && hasNudges && activeNudges.length > 1 && (
              <button
                onClick={cycleRight}
                className="p-1 rounded-lg hover:bg-white/15 transition-colors text-primary-foreground/60 hover:text-primary-foreground"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
            {expanded && (
              <ChevronUp className="h-4 w-4 text-primary-foreground/60" />
            )}
          </div>
        </div>
      </button>

      {/* ── Expanded nudge cards list ── */}
      <AnimatePresence>
        {expanded && hasNudges && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden mt-2 space-y-2 relative z-10"
          >
            <AnimatePresence mode="popLayout">
              {activeNudges.map((nudge, i) => {
                const theme = themeMap[nudge.color_theme];
                const Icon = typeIcons[nudge.type];
                return (
                  <motion.div
                    key={nudge.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -40, height: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.05 }}
                    layout
                    className={cn(
                      "rounded-xl border px-3.5 py-3 transition-all",
                      theme.border, theme.bg
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("shrink-0 h-8 w-8 rounded-lg flex items-center justify-center", theme.icon)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={cn("text-[13px] font-semibold truncate block", theme.text)}>{nudge.title}</span>
                        <span className={cn("text-[11px] truncate block", theme.sub)}>{nudge.subtitle}</span>
                      </div>
                      <button
                        onClick={() => handleCTA(nudge)}
                        className={cn(
                          "shrink-0 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-semibold text-white transition-colors",
                          theme.cta, theme.ctaHover
                        )}
                      >
                        {nudge.cta_label}
                        <ArrowRight className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => dismiss(nudge.id)}
                        className="shrink-0 text-white/30 hover:text-white/70 transition-colors"
                        title="Dismiss"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

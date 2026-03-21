import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, ChevronRight, ChevronDown, ChevronUp, ArrowRight, X,
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

/* ─── Theme map ─── */
const themeMap: Record<NudgeCard["color_theme"], { bg: string; border: string; icon: string; text: string; cta: string; ctaHover: string }> = {
  blue:    { bg: "bg-blue-50/80 dark:bg-blue-950/30",    border: "border-blue-200/60 dark:border-blue-800/40",    icon: "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400",      text: "text-blue-900 dark:text-blue-100",    cta: "bg-blue-600",    ctaHover: "hover:bg-blue-700" },
  emerald: { bg: "bg-emerald-50/80 dark:bg-emerald-950/30", border: "border-emerald-200/60 dark:border-emerald-800/40", icon: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400", text: "text-emerald-900 dark:text-emerald-100", cta: "bg-emerald-600", ctaHover: "hover:bg-emerald-700" },
  amber:   { bg: "bg-amber-50/80 dark:bg-amber-950/30",   border: "border-amber-200/60 dark:border-amber-800/40",   icon: "bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400",    text: "text-amber-900 dark:text-amber-100",   cta: "bg-amber-600",   ctaHover: "hover:bg-amber-700" },
  violet:  { bg: "bg-violet-50/80 dark:bg-violet-950/30",  border: "border-violet-200/60 dark:border-violet-800/40",  icon: "bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400",  text: "text-violet-900 dark:text-violet-100",  cta: "bg-violet-600",  ctaHover: "hover:bg-violet-700" },
  rose:    { bg: "bg-rose-50/80 dark:bg-rose-950/30",     border: "border-rose-200/60 dark:border-rose-800/40",     icon: "bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400",       text: "text-rose-900 dark:text-rose-100",     cta: "bg-rose-600",    ctaHover: "hover:bg-rose-700" },
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
  const { setShowInlineAssessment, setIsExpanded, setIsOpen } = useAgentOne();

  const [nudges, setNudges] = useState<NudgeCard[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState(false);
  const [confettiFired, setConfettiFired] = useState<Set<string>>(new Set());
  const expandRef = useRef<HTMLDivElement>(null);

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
  }, [activeAccount?.id, user?.employeeId]);

  const activeNudges = nudges.filter((n) => !dismissedIds.has(n.id));
  const hasNudges = activeNudges.length > 0;

  const dismiss = (id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
  };

  // Fire confetti for kudos cards on first view
  const fireKudosConfetti = (nudge: NudgeCard) => {
    if (nudge.type !== "kudos" || nudge.viewed || confettiFired.has(nudge.id)) return;
    setConfettiFired((prev) => new Set(prev).add(nudge.id));
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#f43f5e", "#ec4899", "#f97316", "#eab308", "#22c55e"],
    });
    // Mark as viewed in DB
    supabase.from("nudge_cards").update({ viewed: true }).eq("id", nudge.id).then(() => {
      setNudges((prev) => prev.map((n) => n.id === nudge.id ? { ...n, viewed: true } : n));
    });
  };

  // Fire confetti when expanded reveals kudos
  useEffect(() => {
    if (expanded) {
      activeNudges.forEach((n) => fireKudosConfetti(n));
    }
  }, [expanded, activeNudges.length]);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative pb-4"
    >
      {/* ── Stacked depth layers behind main card ── */}
      {!expanded && hasNudges && (
        <>
          {activeNudges.length > 1 && (
            <div className="absolute inset-x-[6px] top-[6px] bottom-0 -z-10 rounded-2xl bg-primary/65 shadow-md" />
          )}
          {activeNudges.length > 2 && (
            <div className="absolute inset-x-[12px] top-[12px] bottom-0 -z-20 rounded-2xl bg-primary/40 shadow-sm" />
          )}
        </>
      )}

      {/* ── Main Agent One Card ── */}
      <button
        onClick={onAgentClick}
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
        <div className="relative px-5 py-4 flex items-center gap-4">
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
            <motion.p
              className="text-[13px] text-primary-foreground/75 leading-snug truncate"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Hey! I'm here to help you get started →
            </motion.p>
          </div>
          <div className="shrink-0 flex items-center gap-1">
            {hasNudges && (
              <button
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                className="p-1.5 rounded-lg hover:bg-white/15 transition-colors text-primary-foreground/60 hover:text-primary-foreground"
                title={expanded ? "Collapse" : "Show actions"}
              >
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            )}
            <motion.div
              className="text-primary-foreground/50 group-hover:text-primary-foreground/90 transition-colors"
              animate={{ x: [0, 3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronRight className="h-5 w-5" />
            </motion.div>
          </div>
        </div>
      </button>

      {/* ── Expanded nudge cards list ── */}
      <AnimatePresence>
        {expanded && hasNudges && (
          <motion.div
            ref={expandRef}
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
                        <span className="text-[11px] text-muted-foreground truncate block">{nudge.subtitle}</span>
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
                        className="shrink-0 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
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

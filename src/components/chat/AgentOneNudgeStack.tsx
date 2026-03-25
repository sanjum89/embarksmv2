import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  ChevronUp,
  ChevronDown,
  GraduationCap,
  Award,
  MessageSquare,
  Users,
  Handshake,
  TrendingUp,
  Bell,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/contexts/AccountContext";
import { useUser } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";
import {
  groupByCategory,
  buildPersonalizedSummary,
  resolveCtaTarget,
  type CategoryCard,
} from "@/lib/agentOneActions";
import type { AgentOneNotification } from "@/types/agentOneActions";
import { PASTEL_TAILWIND_MAP } from "@/types/agentOneActions";

/* ─── Icon Map ─── */
const ICON_MAP: Record<string, React.ElementType> = {
  GraduationCap,
  Award,
  MessageSquare,
  Users,
  Handshake,
  TrendingUp,
  Bell,
};

/* ─── Props ─── */
interface AgentOneNudgeStackProps {
  onAgentClick: () => void;
  onChatAction: (prompt: string) => void;
}

export function AgentOneNudgeStack({ onAgentClick, onChatAction }: AgentOneNudgeStackProps) {
  const { activeAccount } = useAccount();
  const { user } = useUser();
  const navigate = useNavigate();

  const [categoryCards, setCategoryCards] = useState<CategoryCard[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);

  const audienceType = user?.role === "admin" ? "admin" : user?.role === "manager" ? "manager" : "learner";
  const userName = user?.name?.split(" ")[0] || "there";

  // Fetch nudge cards and group by category
  useEffect(() => {
    if (!activeAccount?.id) return;
    const userId = user?.id || "RAT-E001";

    supabase
      .from("nudge_cards")
      .select("*")
      .eq("account_id", activeAccount.id)
      .eq("target_user_id", userId)
      .eq("audience_type", audienceType)
      .order("priority", { ascending: true })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!data || data.length === 0) {
          setCategoryCards([]);
          return;
        }

        const notifications: AgentOneNotification[] = data.map((r: any) => ({
          id: r.id,
          account_id: r.account_id,
          target_user_id: r.target_user_id,
          recipient_employee_id: r.recipient_employee_id,
          audience_type: r.audience_type,
          category: r.category,
          grouping_key: r.grouping_key,
          source_event_id: r.source_event_id,
          type: r.type,
          title: r.title,
          subtitle: r.subtitle,
          color_theme: r.color_theme,
          cta_label: r.cta_label,
          cta_action: r.cta_action as AgentOneNotification["cta_action"],
          priority: r.priority,
          metadata: (r.metadata || {}) as Record<string, unknown>,
          viewed: r.viewed,
          created_by: r.created_by,
        }));

        const grouped = groupByCategory(notifications, audienceType);
        setCategoryCards(grouped);
        setHighlightIndex(0);
      });
  }, [activeAccount?.id, user?.id, audienceType]);

  const totalCount = categoryCards.reduce((s, c) => s + c.count, 0);
  const summaryLine = buildPersonalizedSummary(userName, categoryCards, audienceType);
  const hasCards = categoryCards.length > 0;

  const cycleHighlight = useCallback(
    (dir: 1 | -1) => {
      if (categoryCards.length < 2) return;
      if (!expanded) setExpanded(true);
      setHighlightIndex((prev) => (prev + dir + categoryCards.length) % categoryCards.length);
    },
    [categoryCards.length, expanded]
  );

  const handleCategoryClick = useCallback(
    (card: CategoryCard) => {
      const cta = card.primaryCta;
      // Use explicit prompt/path from the category card first
      if (cta.prompt) {
        onChatAction(cta.prompt);
      } else if (cta.path) {
        navigate(cta.path);
      } else {
        // Fallback to resolveCtaTarget
        const target = resolveCtaTarget(cta.type);
        if (target.prompt) onChatAction(target.prompt);
        else if (target.path) navigate(target.path);
      }
    },
    [navigate, onChatAction]
  );

  return (
    <div className="relative flex gap-2 pb-4">
      {/* Main card column */}
      <div className="flex-1 min-w-0">
        {/* Summary card */}
        <motion.div
          initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            role="button"
            tabIndex={0}
            onClick={() => (hasCards ? setExpanded((e) => !e) : onAgentClick())}
            className={cn(
              "group relative w-full rounded-2xl text-left overflow-hidden cursor-pointer",
              "bg-primary text-primary-foreground",
              "shadow-[0_4px_24px_-4px_hsl(var(--primary)/0.35)] hover:shadow-[0_8px_32px_-4px_hsl(var(--primary)/0.5)]",
              "active:scale-[0.98] transition-shadow duration-300"
            )}
          >
            {/* Shimmer */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.18] to-transparent -skew-x-12"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1.2, ease: "easeInOut" }}
            />
            {/* Glow border */}
            <motion.div
              className="absolute -inset-[2px] rounded-2xl border-2 border-primary/40"
              animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.01, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />

            <div className="relative px-5 py-4 flex items-center gap-3">
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
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                    Live
                  </span>
                  {hasCards && (
                    <span className="rounded-full bg-white/25 px-1.5 py-0.5 text-[10px] font-semibold">
                      {totalCount} update{totalCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <span className="text-[13px] text-primary-foreground/75 leading-snug line-clamp-2">
                  {hasCards ? summaryLine : "Hey! I'm here to help you get started →"}
                </span>
              </div>

              {/* Expand indicator */}
              {hasCards && (
                <motion.div
                  animate={{ rotate: expanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0"
                >
                  <ChevronDown className="h-4 w-4 text-primary-foreground/60" />
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Expanded category cards */}
        <AnimatePresence>
          {expanded && categoryCards.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-2 space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {categoryCards.map((card, idx) => {
                  const IconComp = ICON_MAP[card.icon] || Bell;
                  const pastel = PASTEL_TAILWIND_MAP[card.colorToken] || PASTEL_TAILWIND_MAP.sky;
                  const isHighlighted = idx === highlightIndex;

                  return (
                    <motion.div
                      key={card.category}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: idx * 0.05 }}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleCategoryClick(card)}
                      className={cn(
                        "relative rounded-xl border bg-card text-card-foreground cursor-pointer",
                        "transition-all duration-200 hover:shadow-md",
                        "border-l-[3px]",
                        pastel.border,
                        isHighlighted && pastel.bg
                      )}
                    >
                      <div className="px-4 py-3 flex items-start gap-3">
                        <div
                          className={cn(
                            "shrink-0 h-8 w-8 rounded-lg flex items-center justify-center mt-0.5",
                            pastel.bg
                          )}
                        >
                          <IconComp className={cn("h-4 w-4", pastel.text)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold leading-tight text-foreground">
                              {card.title}
                            </h4>
                            {card.count > 1 && (
                              <span
                                className={cn(
                                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                                  pastel.bg,
                                  pastel.text
                                )}
                              >
                                {card.count}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                            {card.subtitle}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Up/down navigation control — outside the card */}
      {categoryCards.length >= 2 && (
        <div className="shrink-0 flex flex-col items-center justify-center self-start mt-3">
          <div className="flex flex-col rounded-full border bg-card shadow-sm overflow-hidden">
            <button
              onClick={(e) => {
                e.stopPropagation();
                cycleHighlight(-1);
              }}
              className="p-1.5 hover:bg-accent transition-colors"
              aria-label="Previous category"
            >
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <div className="h-px bg-border" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                cycleHighlight(1);
              }}
              className="p-1.5 hover:bg-accent transition-colors"
              aria-label="Next category"
            >
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/contexts/AccountContext";
import { useUser } from "@/contexts/UserContext";
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

/* ─── Props ─── */
interface AgentOneNudgeStackProps {
  onAgentClick: () => void;
  onChatAction: (prompt: string) => void;
}

export function AgentOneNudgeStack({ onAgentClick }: AgentOneNudgeStackProps) {
  const { activeAccount } = useAccount();
  const { user } = useUser();

  const [nudges, setNudges] = useState<NudgeCard[]>([]);
  const [dismissedIds] = useState<Set<string>>(new Set());

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative pb-4"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onAgentClick}
        className={cn(
          "group relative w-full rounded-2xl text-left overflow-hidden cursor-pointer",
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
            <span className="text-[13px] text-primary-foreground/75 leading-snug truncate">
              Hey! I'm here to help you get started →
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

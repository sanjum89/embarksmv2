import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X, ChevronDown, Sparkles } from "lucide-react";
import { managerNudges, ManagerNudge } from "@/data/managerNudges";
import { useAgentOne } from "@/contexts/AgentOneContext";
import { cn } from "@/lib/utils";

const MAX_VISIBLE = 3;

const themeMap: Record<ManagerNudge["colorTheme"], { bg: string; border: string; icon: string; text: string; cta: string; ctaHover: string }> = {
  blue:    { bg: "bg-blue-50/80 dark:bg-blue-950/30",   border: "border-blue-200/60 dark:border-blue-800/40",   icon: "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400",     text: "text-blue-900 dark:text-blue-100",   cta: "bg-blue-600",   ctaHover: "hover:bg-blue-700" },
  emerald: { bg: "bg-emerald-50/80 dark:bg-emerald-950/30", border: "border-emerald-200/60 dark:border-emerald-800/40", icon: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400", text: "text-emerald-900 dark:text-emerald-100", cta: "bg-emerald-600", ctaHover: "hover:bg-emerald-700" },
  amber:   { bg: "bg-amber-50/80 dark:bg-amber-950/30",  border: "border-amber-200/60 dark:border-amber-800/40",  icon: "bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400",   text: "text-amber-900 dark:text-amber-100",  cta: "bg-amber-600",  ctaHover: "hover:bg-amber-700" },
  violet:  { bg: "bg-violet-50/80 dark:bg-violet-950/30", border: "border-violet-200/60 dark:border-violet-800/40", icon: "bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400", text: "text-violet-900 dark:text-violet-100", cta: "bg-violet-600", ctaHover: "hover:bg-violet-700" },
  rose:    { bg: "bg-rose-50/80 dark:bg-rose-950/30",    border: "border-rose-200/60 dark:border-rose-800/40",    icon: "bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400",      text: "text-rose-900 dark:text-rose-100",   cta: "bg-rose-600",   ctaHover: "hover:bg-rose-700" },
};

export { themeMap as nudgeThemeMap };

export function OnboardingNudge() {
  const location = useLocation();

  // On chat page, nudges render inline in the home state — skip here
  if (location.pathname === "/chat") return null;

  return <NudgeStack />;
}

export function NudgeStack({ onChatAction }: { onChatAction?: (prompt: string) => void }) {
  const navigate = useNavigate();
  const { setShowInlineAssessment, setIsExpanded, setIsOpen, handleSend } = useAgentOne();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState(false);

  const activeNudges = managerNudges.filter((n) => !dismissedIds.has(n.id));

  if (activeNudges.length === 0) return null;

  const dismiss = (id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
  };

  const handleCTA = (nudge: ManagerNudge) => {
    const { ctaAction } = nudge;
    if (ctaAction.type === "chat") {
      if (ctaAction.prompt === "__ASSESSMENT__") {
        setShowInlineAssessment(true);
        setIsExpanded(true);
        onChatAction?.("__ASSESSMENT__");
      } else {
        if (onChatAction) {
          onChatAction(ctaAction.prompt);
        } else {
          handleSend(ctaAction.prompt);
        }
      }
    } else if (ctaAction.type === "navigate") {
      setIsOpen(false);
      navigate(ctaAction.path);
    } else if (ctaAction.type === "navigate-and-chat") {
      navigate(ctaAction.path);
    }
  };

  if (collapsed) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <button
          onClick={() => setCollapsed(false)}
          className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-medium text-primary hover:bg-primary/10 transition-colors"
        >
          <Sparkles className="h-3 w-3" />
          {activeNudges.length} action{activeNudges.length !== 1 ? "s" : ""}
          <ChevronDown className="h-3 w-3" />
        </button>
      </motion.div>
    );
  }

  const visibleNudges = activeNudges.slice(0, MAX_VISIBLE);
  const hiddenCount = activeNudges.length - visibleNudges.length;

  return (
    <div className="space-y-0 rounded-xl border border-border overflow-hidden shadow-sm">
      <AnimatePresence mode="popLayout">
        {visibleNudges.map((nudge, i) => {
          const theme = themeMap[nudge.colorTheme];
          const Icon = nudge.icon;
          return (
            <motion.div
              key={nudge.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -40, height: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              layout
              className={cn(i > 0 && "border-t", theme.border, theme.bg)}
            >
              <div className="flex items-center gap-3 px-3 py-2.5 min-h-[44px]">
                <div className={cn("shrink-0 h-7 w-7 rounded-md flex items-center justify-center", theme.icon)}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className={cn("text-[12px] font-medium truncate block", theme.text)}>{nudge.title}</span>
                  <span className="text-[10px] text-muted-foreground truncate block">{nudge.subtitle}</span>
                </div>
                <button
                  onClick={() => handleCTA(nudge)}
                  className={cn("shrink-0 inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium text-white transition-colors", theme.cta, theme.ctaHover)}
                >
                  {nudge.ctaLabel}
                  <ArrowRight className="h-3 w-3" />
                </button>
                <button onClick={() => dismiss(nudge.id)} className="shrink-0 text-muted-foreground/40 hover:text-muted-foreground transition-colors" title="Dismiss">
                  <X className="h-3 w-3" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Footer */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 border-t border-border/50">
        {hiddenCount > 0 && <span className="text-[10px] text-muted-foreground">+{hiddenCount} more</span>}
        <button onClick={() => setCollapsed(true)} className="ml-auto text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors">
          Minimize
        </button>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronRight, ChevronDown, ChevronUp, ArrowRight, X } from "lucide-react";
import { managerNudges, ManagerNudge } from "@/data/managerNudges";
import { useAgentOne } from "@/contexts/AgentOneContext";
import { cn } from "@/lib/utils";

const themeMap: Record<ManagerNudge["colorTheme"], { bg: string; border: string; icon: string; text: string; cta: string; ctaHover: string }> = {
  blue:    { bg: "bg-blue-50/80 dark:bg-blue-950/30",   border: "border-blue-200/60 dark:border-blue-800/40",   icon: "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400",     text: "text-blue-900 dark:text-blue-100",   cta: "bg-blue-600",   ctaHover: "hover:bg-blue-700" },
  emerald: { bg: "bg-emerald-50/80 dark:bg-emerald-950/30", border: "border-emerald-200/60 dark:border-emerald-800/40", icon: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400", text: "text-emerald-900 dark:text-emerald-100", cta: "bg-emerald-600", ctaHover: "hover:bg-emerald-700" },
  amber:   { bg: "bg-amber-50/80 dark:bg-amber-950/30",  border: "border-amber-200/60 dark:border-amber-800/40",  icon: "bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400",   text: "text-amber-900 dark:text-amber-100",  cta: "bg-amber-600",  ctaHover: "hover:bg-amber-700" },
  violet:  { bg: "bg-violet-50/80 dark:bg-violet-950/30", border: "border-violet-200/60 dark:border-violet-800/40", icon: "bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400", text: "text-violet-900 dark:text-violet-100", cta: "bg-violet-600", ctaHover: "hover:bg-violet-700" },
  rose:    { bg: "bg-rose-50/80 dark:bg-rose-950/30",    border: "border-rose-200/60 dark:border-rose-800/40",    icon: "bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400",      text: "text-rose-900 dark:text-rose-100",   cta: "bg-rose-600",   ctaHover: "hover:bg-rose-700" },
};

interface AgentOneNudgeStackProps {
  onAgentClick: () => void;
  onChatAction: (prompt: string) => void;
}

export function AgentOneNudgeStack({ onAgentClick, onChatAction }: AgentOneNudgeStackProps) {
  const navigate = useNavigate();
  const { setShowInlineAssessment, setIsExpanded, setIsOpen, handleSend } = useAgentOne();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeNudges = managerNudges.filter((n) => !dismissedIds.has(n.id));
  const hasNudges = activeNudges.length > 0;

  const dismiss = (id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
    // Adjust index if needed
    if (currentIndex >= activeNudges.length - 1) {
      setCurrentIndex(Math.max(0, activeNudges.length - 2));
    }
  };

  const handleCTA = (nudge: ManagerNudge) => {
    const { ctaAction } = nudge;
    if (ctaAction.type === "chat") {
      if (ctaAction.prompt === "__ASSESSMENT__") {
        setShowInlineAssessment(true);
        setIsExpanded(true);
        onChatAction("__ASSESSMENT__");
      } else {
        onChatAction(ctaAction.prompt);
      }
    } else if (ctaAction.type === "navigate") {
      setIsOpen(false);
      navigate(ctaAction.path);
    } else if (ctaAction.type === "navigate-and-chat") {
      navigate(ctaAction.path);
    }
  };

  const cycleNext = () => {
    setCurrentIndex((i) => (i + 1) % activeNudges.length);
  };

  const cyclePrev = () => {
    setCurrentIndex((i) => (i - 1 + activeNudges.length) % activeNudges.length);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      {/* Stacked depth cards behind the main card */}
      {!expanded && hasNudges && (
        <>
          {activeNudges.length > 1 && (
            <div className="absolute left-2 right-2 -bottom-2 h-3 rounded-2xl bg-primary/60 shadow-md" />
          )}
          {activeNudges.length > 2 && (
            <div className="absolute left-4 right-4 -bottom-4 h-3 rounded-2xl bg-primary/40 shadow-sm" />
          )}
        </>
      )}

      {/* Main Agent One card */}
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

      {/* Expanded: show all nudge cards */}
      <AnimatePresence>
        {expanded && hasNudges && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden mt-1 rounded-xl border border-border shadow-sm"
          >
            <AnimatePresence mode="popLayout">
              {activeNudges.map((nudge, i) => {
                const theme = themeMap[nudge.colorTheme];
                const Icon = nudge.icon;
                return (
                  <motion.div
                    key={nudge.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -30, height: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    layout
                    className={cn(i > 0 && "border-t", theme.border, theme.bg)}
                  >
                    <div className="flex items-center gap-3 px-3 py-2.5">
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed: peek strip showing current nudge with cycle controls */}
      <AnimatePresence>
        {!expanded && hasNudges && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, delay: 0.1 }}
            className="relative z-10 mt-1.5"
          >
            {(() => {
              const nudge = activeNudges[currentIndex];
              if (!nudge) return null;
              const theme = themeMap[nudge.colorTheme];
              const Icon = nudge.icon;
              return (
                <div className={cn("flex items-center gap-2.5 rounded-xl border px-3 py-2 transition-all", theme.border, theme.bg)}>
                  <div className={cn("shrink-0 h-6 w-6 rounded-md flex items-center justify-center", theme.icon)}>
                    <Icon className="h-3 w-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={cn("text-[11px] font-medium truncate block", theme.text)}>{nudge.title}</span>
                  </div>
                  <button
                    onClick={() => handleCTA(nudge)}
                    className={cn("shrink-0 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium text-white transition-colors", theme.cta, theme.ctaHover)}
                  >
                    {nudge.ctaLabel}
                    <ArrowRight className="h-2.5 w-2.5" />
                  </button>
                  {activeNudges.length > 1 && (
                    <div className="shrink-0 flex items-center gap-0.5">
                      <button onClick={cyclePrev} className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground transition-colors">
                        <ChevronUp className="h-3 w-3" />
                      </button>
                      <span className="text-[9px] text-muted-foreground tabular-nums w-6 text-center">
                        {currentIndex + 1}/{activeNudges.length}
                      </span>
                      <button onClick={cycleNext} className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground transition-colors">
                        <ChevronDown className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  <button onClick={() => dismiss(nudge.id)} className="shrink-0 text-muted-foreground/30 hover:text-muted-foreground transition-colors" title="Dismiss">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

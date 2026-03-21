import { motion } from "framer-motion";
import { Sparkles, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SuperAgentCardProps {
  hasUnread?: boolean;
  unreadCount?: number;
  lastMessage?: string;
}

export function SuperAgentCard({ hasUnread = true, unreadCount = 0, lastMessage }: SuperAgentCardProps) {
  const navigate = useNavigate();

  return (
    <motion.button
      initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => navigate("/chat/super-agent")}
      className={cn(
        "group relative w-full rounded-2xl text-left overflow-hidden",
        "bg-primary text-primary-foreground",
        "shadow-[0_4px_24px_-4px_hsl(var(--primary)/0.35)] hover:shadow-[0_8px_32px_-4px_hsl(var(--primary)/0.5)]",
        "active:scale-[0.98] transition-shadow duration-300"
      )}
    >
      {/* Animated shimmer */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.18] to-transparent -skew-x-12"
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1.2, ease: "easeInOut" }}
      />

      {/* Subtle pulse ring behind card */}
      {hasUnread && (
        <motion.div
          className="absolute -inset-[2px] rounded-2xl border-2 border-primary/40"
          animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.01, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <div className="relative px-5 py-4 flex items-center gap-4">
        {/* Animated icon */}
        <div className="shrink-0 relative">
          <motion.div
            className="h-12 w-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center"
            animate={{ rotate: [0, 3, -3, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="h-5.5 w-5.5" />
          </motion.div>
          {/* Unread count badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-green-500 text-white text-[11px] font-bold shadow-md border-2 border-primary">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          {/* Live dot (show when no unread count) */}
          {unreadCount === 0 && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-50" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-400 border-2 border-primary" />
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-[15px] font-bold leading-tight">
              Agent One
            </h3>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
              Live
            </span>
          </div>
          <motion.p
            className="text-[13px] text-primary-foreground/75 leading-snug truncate"
            animate={hasUnread ? { opacity: [0.7, 1, 0.7] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {lastMessage || "Hey! I'm here to help you get started →"}
          </motion.p>
        </div>

        <motion.div
          className="shrink-0 text-primary-foreground/50 group-hover:text-primary-foreground/90 transition-colors"
          animate={{ x: [0, 3, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronRight className="h-5 w-5" />
        </motion.div>
      </div>
    </motion.button>
  );
}
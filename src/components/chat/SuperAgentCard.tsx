import { motion } from "framer-motion";
import { Sparkles, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SuperAgentCardProps {
  hasUnread?: boolean;
  lastMessage?: string;
}

export function SuperAgentCard({ hasUnread, lastMessage }: SuperAgentCardProps) {
  const navigate = useNavigate();

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => navigate("/chat/super-agent")}
      className={cn(
        "relative w-full rounded-2xl p-5 text-left transition-all duration-200",
        "bg-gradient-to-br from-primary/[0.06] via-primary/[0.03] to-transparent",
        "border-2 border-primary/20 hover:border-primary/40",
        "shadow-[0_2px_12px_-2px_hsl(var(--primary)/0.1)] hover:shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.18)]",
        "active:scale-[0.98]"
      )}
    >
      {/* Unread indicator */}
      {hasUnread && (
        <span className="absolute top-3 right-3 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
        </span>
      )}

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="shrink-0 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-[15px] font-semibold text-foreground leading-tight">
              Super Agent
            </h3>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary uppercase tracking-wider">
              AI
            </span>
          </div>
          <p className="text-[13px] text-muted-foreground leading-snug">
            {lastMessage || "Your personal AI assistant — onboarding, skills, career guidance & more"}
          </p>
        </div>

        <div className="shrink-0 self-center text-muted-foreground/40">
          <MessageCircle className="h-4 w-4" />
        </div>
      </div>
    </motion.button>
  );
}

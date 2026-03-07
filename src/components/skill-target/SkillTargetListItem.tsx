import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { SkillTarget } from "@/types/learning";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

interface SkillTargetListItemProps {
  target: SkillTarget;
  index: number;
}

export function SkillTargetListItem({ target, index }: SkillTargetListItemProps) {
  const totalSteps = target.steps.length;
  const { styleTheme } = useTheme();
  const isTraditional = styleTheme === "traditional";

  const dueLabel = target.dueDate
    ? new Date(target.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  const timeAgo = target.dueDate ? `Due ${dueLabel}` : "No due date";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link
        to={`/skill-target/${target.id}`}
        className={cn(
          "group block transition-all duration-200",
          isTraditional
            ? "rounded-2xl bg-white border border-black/[0.08] px-7 py-5 hover:border-black/[0.15] hover:shadow-sm"
            : "rounded-xl bg-card border border-border/60 p-5 hover:shadow-card-hover hover:border-border"
        )}
      >
        <h4 className={cn(
          "font-display font-semibold text-foreground group-hover:text-primary transition-colors",
          isTraditional ? "text-[15px] mb-1" : "text-base mb-1.5"
        )}>
          {target.title}
        </h4>
        <p className={cn(
          "line-clamp-1 mb-2",
          isTraditional ? "text-[13px] text-black/40" : "text-sm text-muted-foreground"
        )}>
          {target.description}
        </p>
        <div className={cn(
          "flex items-center gap-1.5",
          isTraditional ? "text-[12px] text-black/35" : "text-xs text-muted-foreground"
        )}>
          <span>{isTraditional ? "1 day ago" : timeAgo}</span>
          <span>•</span>
          <span>
            Activities: <strong className={isTraditional ? "text-foreground font-semibold" : "text-foreground"}>{totalSteps}</strong>
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

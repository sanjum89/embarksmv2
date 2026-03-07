import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { SkillTarget } from "@/types/learning";

interface SkillTargetListItemProps {
  target: SkillTarget;
  index: number;
}

export function SkillTargetListItem({ target, index }: SkillTargetListItemProps) {
  const totalSteps = target.steps.length;

  const dueLabel = target.dueDate
    ? new Date(target.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  // Approximate "time ago" from dueDate for display
  const timeAgo = target.dueDate
    ? `Due ${dueLabel}`
    : "No due date";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link
        to={`/skill-target/${target.id}`}
        className="group block rounded-xl bg-card border border-border/60 p-5 transition-all duration-200 hover:shadow-card-hover hover:border-border"
      >
        <h4 className="font-display text-base font-semibold text-foreground group-hover:text-primary transition-colors mb-1.5">
          {target.title}
        </h4>
        <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
          {target.description}
        </p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{timeAgo}</span>
          <span>•</span>
          <span>
            Activities: <strong className="text-foreground">{totalSteps}</strong>
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

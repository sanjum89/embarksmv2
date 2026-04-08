import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Eye } from "lucide-react";
import type { SkillTarget } from "@/types/learning";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { useContentSubstitution } from "@/lib/contentSubstitution";

interface SkillTargetListItemProps {
  target: SkillTarget;
  index: number;
}

export function SkillTargetListItem({ target, index }: SkillTargetListItemProps) {
  const totalSteps = target.steps.length;
  const { styleTheme } = useTheme();
  const { skillTargets } = useSkillTargets();
  const { substitute } = useContentSubstitution();
  const isTraditional = styleTheme === "traditional";
  const isLocked = target.locked === true;
  const prerequisite = target.prerequisiteId ? skillTargets.find(st => st.id === target.prerequisiteId) : null;

  const dueLabel = target.dueDate
    ? new Date(target.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  const timeAgo = target.dueDate ? `Due ${dueLabel}` : "No due date";

  const linkTo = isLocked ? `/skill-target/${target.id}?preview=true` : `/skill-target/${target.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link
        to={linkTo}
        className={cn(
          "group block transition-all duration-200",
          isTraditional
            ? "rounded-2xl bg-card border border-border/30 px-7 py-5 hover:border-border/60 hover:shadow-sm"
            : "rounded-xl bg-card border border-border/60 p-5 hover:shadow-card-hover hover:border-border",
          isLocked && "opacity-70"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h4 className={cn(
              "font-display font-semibold text-foreground group-hover:text-primary transition-colors",
              isTraditional ? "text-[15px] mb-1" : "text-base mb-1.5"
            )}>
              {substitute(target.title)}
            </h4>
            <p className={cn(
              "line-clamp-1 mb-2",
              isTraditional ? "text-[13px] text-muted-foreground/70" : "text-sm text-muted-foreground"
            )}>
              {substitute(target.description)}
            </p>
            <div className={cn(
              "flex items-center gap-1.5",
              isTraditional ? "text-[12px] text-muted-foreground/60" : "text-xs text-muted-foreground"
            )}>
              <span>{isTraditional ? "1 day ago" : timeAgo}</span>
              <span>•</span>
              <span>
                Activities: <strong className={isTraditional ? "text-foreground font-semibold" : "text-foreground"}>{totalSteps}</strong>
              </span>
              {isLocked && prerequisite && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Complete <strong className="text-foreground">{substitute(prerequisite.title)}</strong> to unlock
                  </span>
                </>
              )}
            </div>
          </div>
          {isLocked && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground shrink-0 mt-1">
              <Eye className="h-3.5 w-3.5" />
              Preview
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

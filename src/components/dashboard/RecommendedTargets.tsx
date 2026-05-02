import { useRef } from "react";
import { ChevronLeft, ChevronRight, Plus, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { managerSkillTargets, type ManagerSkillTarget } from "@/data/managerSkillTargets";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { useUser } from "@/contexts/UserContext";
import { convertManagerTarget } from "@/lib/convertManagerTarget";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Props {
  traditional?: boolean;
}

export function RecommendedTargets({ traditional }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const { skillTargets, addSkillTargets } = useSkillTargets();

  const existingTitles = new Set(skillTargets.map((st) => st.title));

  // Get categories of user's current targets for relevance sorting
  const userCategories = new Set(
    skillTargets
      .filter((st) => st.assignedTo?.includes(user.id))
      .map((st) => st.category)
  );

  const recommended = managerSkillTargets
    .filter((t) => !existingTitles.has(t.title))
    .sort((a, b) => {
      const aMatch = userCategories.has(a.category) ? 1 : 0;
      const bMatch = userCategories.has(b.category) ? 1 : 0;
      return bMatch - aMatch;
    })
    .slice(0, 8);

  if (recommended.length === 0) return null;

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: dir === "left" ? -300 : 300,
      behavior: "smooth",
    });
  };

  const handleAdd = (target: ManagerSkillTarget) => {
    const converted = convertManagerTarget(target, user.id);
    addSkillTargets([converted]);
    toast({
      title: "Added to your learning",
      description: `"${target.title}" has been added to your skill targets.`,
    });
  };

  const difficultyColor: Record<string, string> = {
    Beginner: "bg-success/15 text-success",
    Intermediate: "bg-info/15 text-info",
    Advanced: "bg-warning/15 text-warning",
    Expert: "bg-destructive/15 text-destructive",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, duration: 0.35 }}
      className="mb-6"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <h3 className="font-display text-sm font-semibold text-foreground">
            Recommended for You
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => scroll("left")}
            className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
        style={{ scrollbarWidth: "none" }}
      >
        {recommended.map((target) => (
          <div
            key={target.id}
            className={cn(
              "shrink-0 w-[260px] rounded-xl border border-border bg-card p-4 flex flex-col gap-3",
              traditional ? "" : "shadow-card"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-display text-sm font-semibold text-foreground leading-tight line-clamp-2">
                {target.title}
              </h4>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {target.description}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-[0.65rem] px-2 py-0">
                {target.category}
              </Badge>
              <span
                className={cn(
                  "text-[0.65rem] px-2 py-0.5 rounded-full font-medium",
                  difficultyColor[target.difficulty] || "bg-secondary text-secondary-foreground"
                )}
              >
                {target.difficulty}
              </span>
              <span className="text-[0.65rem] text-muted-foreground">
                {target.steps.length} steps
              </span>
            </div>
            <button
              onClick={() => handleAdd(target)}
              className={cn(
                "mt-auto inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-90",
                traditional
                  ? "bg-primary text-primary-foreground"
                  : "gradient-accent text-accent-foreground"
              )}
            >
              <Plus className="h-3 w-3" />
              Add to My Learning
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

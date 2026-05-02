import { useState, useMemo } from "react";
import { Search, Plus, X, BookOpen, CheckCircle2 } from "lucide-react";
import { managerSkillTargets } from "@/data/managerSkillTargets";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { useUser } from "@/contexts/UserContext";
import { convertManagerTarget } from "@/lib/convertManagerTarget";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BrowseSkillTargetsDialog({ open, onOpenChange }: Props) {
  const { user } = useUser();
  const { skillTargets, addSkillTargets } = useSkillTargets();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const existingTitles = new Set(skillTargets.map((st) => st.title));

  const categories = useMemo(
    () => [...new Set(managerSkillTargets.map((t) => t.category))].sort(),
    []
  );

  const results = useMemo(() => {
    const q = query.toLowerCase();
    return managerSkillTargets.filter((t) => {
      if (categoryFilter && t.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.skills.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [query, categoryFilter]);

  const handleAdd = (target: (typeof managerSkillTargets)[0]) => {
    const converted = convertManagerTarget(target, user.id);
    addSkillTargets([converted]);
    setAddedIds((prev) => new Set(prev).add(target.id));
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="font-display flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Browse Skill Targets
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="px-5 pb-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Search by title, category, or skill..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category pills */}
        <div className="px-5 pb-3 flex gap-1.5 flex-wrap">
          <button
            onClick={() => setCategoryFilter(null)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              !categoryFilter
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                categoryFilter === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results */}
        <ScrollArea className="flex-1 min-h-0 px-5 pb-5">
          <div className="flex flex-col gap-2">
            {results.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No skill targets match your search.
              </div>
            ) : (
              results.map((target) => {
                const alreadyAdded =
                  existingTitles.has(target.title) || addedIds.has(target.id);
                return (
                  <div
                    key={target.id}
                    className="flex items-start gap-3 rounded-lg border border-border bg-card p-3.5 hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-display text-sm font-semibold text-foreground leading-tight">
                        {target.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {target.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
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
                        {target.skills.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="text-[0.65rem] text-muted-foreground bg-muted px-1.5 py-0.5 rounded"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => !alreadyAdded && handleAdd(target)}
                      disabled={alreadyAdded}
                      className={cn(
                        "shrink-0 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity",
                        alreadyAdded
                          ? "bg-success/15 text-success cursor-default"
                          : "bg-primary text-primary-foreground hover:opacity-90"
                      )}
                    >
                      {alreadyAdded ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          Added
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 w-3" />
                          Add
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

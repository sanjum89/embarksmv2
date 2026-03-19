import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Target, Users, Search, Filter } from "lucide-react";
import { managerSkillTargets as defaultManagerSkillTargets, getAssigneeProgress } from "@/data/managerSkillTargets";
import { useAccount } from "@/contexts/AccountContext";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const defaultCategories = [...new Set(defaultManagerSkillTargets.map((t) => t.category))];

const difficultyColor: Record<string, string> = {
  Beginner: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  Intermediate: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Advanced: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Expert: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

export default function ManagerSkillTargets() {
  const navigate = useNavigate();
  const { normalizedAccount } = useAccount();
  // Use account skill targets if available, otherwise fall back to default
  const managerSkillTargets = (normalizedAccount?.skillTargets?.length ? normalizedAccount.skillTargets.map(st => ({
    ...st,
    difficulty: "Intermediate" as string,
    skills: [] as string[],
    steps: st.steps || [],
  })) : null) ?? defaultManagerSkillTargets;

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const categories = useMemo(() => [...new Set(managerSkillTargets.map((t: any) => t.category as string))], [managerSkillTargets]);

  const filtered = useMemo(() => {
    return managerSkillTargets.filter((t) => {
      if (selectedCategory && t.category !== selectedCategory) return false;
      if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, selectedCategory]);

  const grouped = useMemo(() => {
    const map: Record<string, typeof filtered> = {};
    for (const t of filtered) {
      (map[t.category] ??= []).push(t);
    }
    return map;
  }, [filtered]);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Learning Paths</h1>
          <p className="text-sm text-muted-foreground mt-1">50 skill targets available for team assignment</p>
        </div>

        {/* Search + filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search learning paths..." className="pl-9 h-9" />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn("rounded-full px-3 py-1 text-xs font-medium border transition-colors", !selectedCategory ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground")}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                className={cn("rounded-full px-3 py-1 text-xs font-medium border transition-colors", selectedCategory === cat ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground")}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grouped list */}
        {Object.entries(grouped).map(([category, targets]) => (
          <div key={category} className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{category}</h2>
            <div className="grid gap-2">
              {targets.map((target, i) => {
                const assignees = progress[target.id] || [];
                const avgProgress = assignees.length ? Math.round(assignees.reduce((s, a) => s + a.progress, 0) / assignees.length) : 0;
                return (
                  <motion.button
                    key={target.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => navigate(`/manager/skill-target/${target.id}`)}
                    className="flex items-center gap-4 w-full text-left rounded-xl border border-border bg-card p-4 hover:shadow-md hover:border-primary/30 transition-all group"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30 shrink-0">
                      <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground group-hover:text-blue-600 transition-colors truncate">{target.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{target.description}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant="outline" className={cn("text-[10px]", difficultyColor[target.difficulty])}>{target.difficulty}</Badge>
                      <span className="text-xs text-muted-foreground">{target.steps.length} steps</span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        {target.assignedTo.length}
                      </div>
                      <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${avgProgress}%` }} />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground w-8 text-right">{avgProgress}%</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

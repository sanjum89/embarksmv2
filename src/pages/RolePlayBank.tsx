import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageSquare, Search, Bot, Plus } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { mockRolePlayBank, mockSkillTargets } from "@/data/mock";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";

type DifficultyFilter = "all" | "beginner" | "intermediate" | "advanced";

const difficultyColors = {
  beginner: "bg-success/10 text-success",
  intermediate: "bg-warning/10 text-warning",
  advanced: "bg-destructive/10 text-destructive",
};

export default function RolePlayBank() {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const { toast } = useToast();

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    mockRolePlayBank.forEach((rp) => rp.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, []);

  const filtered = useMemo(() => {
    return mockRolePlayBank.filter((rp) => {
      if (difficulty !== "all" && rp.difficulty !== difficulty) return false;
      if (selectedTag && !rp.tags.includes(selectedTag)) return false;
      if (search && !rp.title.toLowerCase().includes(search.toLowerCase()) && !rp.scenario.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, difficulty, selectedTag]);

  const handleAddToSkillTarget = (rpTitle: string, stTitle: string) => {
    toast({
      title: "Added to Skill Target",
      description: `"${rpTitle}" added to "${stTitle}"`,
    });
  };

  return (
    <div>
      <AppHeader title="Role Play Bank" />
      <div className="p-6 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h3 className="font-display text-2xl font-bold text-foreground">Role Play Bank</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse and practice AI-powered role play scenarios to sharpen your skills.
          </p>
        </motion.div>

        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search scenarios..."
              className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
            {(["all", "beginner", "intermediate", "advanced"] as DifficultyFilter[]).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-all",
                  difficulty === d
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {d === "all" ? "All Levels" : d}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium transition-all",
                selectedTag === tag
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((rp, i) => (
            <motion.div
              key={rp.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
              className="group relative rounded-xl bg-card border border-border p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300"
            >
              <Link
                to={`/role-play-bank/${rp.id}`}
                className="block"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
                    <MessageSquare className="h-4.5 w-4.5 text-accent" />
                  </div>
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", difficultyColors[rp.difficulty])}>
                    {rp.difficulty}
                  </span>
                </div>
                <h4 className="font-display text-sm font-semibold text-foreground mb-1.5 group-hover:text-accent transition-colors">
                  {rp.title}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{rp.scenario}</p>
                <div className="flex items-center gap-2">
                  <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground truncate">
                    {rp.aiCloneConfig.persona}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {rp.tags.map((tag) => (
                    <span key={tag} className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>

              {/* Add to Skill Target */}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-4 right-14 z-10 flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all opacity-0 group-hover:opacity-100"
                    title="Add to Skill Target"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="end">
                  <p className="text-xs font-medium text-foreground mb-2 px-2">Add to Skill Target</p>
                  {mockSkillTargets.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => handleAddToSkillTarget(rp.title, st.title)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-foreground hover:bg-accent/10 transition-colors text-left"
                    >
                      <span className="truncate">{st.title}</span>
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
            No role plays match your filters.
          </div>
        )}
      </div>
    </div>
  );
}

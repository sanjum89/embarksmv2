import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Info, LayoutGrid, List, ChevronDown, Search } from "lucide-react";

import { SkillTargetCard } from "@/components/skill-target/SkillTargetCard";
import { SkillTargetListItem } from "@/components/skill-target/SkillTargetListItem";
import { RecommendedTargets } from "@/components/dashboard/RecommendedTargets";
import { BrowseSkillTargetsDialog } from "@/components/dashboard/BrowseSkillTargetsDialog";
import { useUser } from "@/contexts/UserContext";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

type Filter = "all" | "in_progress" | "completed" | "not_started";
type ViewMode = "cards" | "list";

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "not_started", label: "Not Started" },
];

// Prerequisite chain ordering — earlier in the chain = lower index
const TARGET_ORDER: Record<string, number> = {
  "RAT-ST-INTRO-001": 0,
  "RAT-ST-BRIDGE-001": 1,
  "RAT-ST-001": 2,
  "RAT-ST-002": 3,
  "RAT-ST-003": 4,
};

export default function Dashboard() {
  const { user } = useUser();
  const { skillTargets: mockSkillTargets } = useSkillTargets();
  const { styleTheme } = useTheme();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<Filter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [browseOpen, setBrowseOpen] = useState(false);

  const isTraditional = styleTheme === "traditional";

  const targets = useMemo(() => {
    const assigned = mockSkillTargets.filter((st) => st.assignedTo?.includes(user.id));
    // Sort by prerequisite chain order
    assigned.sort((a, b) => {
      const orderA = TARGET_ORDER[a.id] ?? 99;
      const orderB = TARGET_ORDER[b.id] ?? 99;
      return orderA - orderB;
    });
    switch (activeFilter) {
      case "in_progress":
        return assigned.filter((st) => st.progress > 0 && st.progress < 100);
      case "completed":
        return assigned.filter((st) => st.progress === 100);
      case "not_started":
        return assigned.filter((st) => st.progress === 0);
      default:
        return assigned;
    }
  }, [user.id, activeFilter, mockSkillTargets]);

  const allTargets = mockSkillTargets.filter((st) => st.assignedTo?.includes(user.id));
  const hasAnyTargets = allTargets.length > 0;
  const stats = {
    total: allTargets.length,
    inProgress: allTargets.filter((st) => st.progress > 0 && st.progress < 100).length,
    completed: allTargets.filter((st) => st.progress === 100).length,
  };

  /* ── Traditional UI layout ── */
  if (isTraditional) {
    return (
      <div>
        <div className="flex-1 px-10 py-8 max-w-5xl mx-auto">
          {/* Header bar */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-display text-2xl font-bold text-foreground">
              Your Skill Targets
            </h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status</span>
                <div className="relative">
                  <select
                    value={activeFilter}
                    onChange={(e) => setActiveFilter(e.target.value as Filter)}
                    className="appearance-none rounded-lg border border-border bg-card pl-3 pr-8 py-1.5 text-sm text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {filters.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <button
                onClick={() => navigate('/create-skill-target')}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Plus className="h-4 w-4" />
                Create Skill Target
              </button>
              <button
                onClick={() => setBrowseOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card text-foreground px-4 py-2 text-sm font-medium hover:bg-accent/10 transition-colors"
              >
                <Search className="h-4 w-4" />
                Browse
              </button>
            </div>
          </div>

          {hasAnyTargets && targets.length > 0 ? (
            <div className="flex flex-col gap-4">
              {targets.map((target, i) => (
                <SkillTargetListItem key={target.id} target={target} index={i} />
              ))}
            </div>
          ) : !hasAnyTargets ? (
            <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-border bg-card p-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-info/10 mb-4">
                <Info className="h-6 w-6 text-info" />
              </div>
              <h4 className="font-display text-lg font-semibold text-foreground mb-1">
                No Skill Targets
              </h4>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                Create a skill target to get started.
              </p>
              <button
                onClick={() => navigate('/create-skill-target')}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Plus className="h-4 w-4" />
                Create Skill Target
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
              No skill targets match this filter.
            </div>
          )}

          <div className="mt-8">
            <RecommendedTargets traditional />
          </div>
        </div>
        <BrowseSkillTargetsDialog open={browseOpen} onOpenChange={setBrowseOpen} />
      </div>
    );
  }

  /* ── New UI layout ── */
  return (
    <>
      <div className="flex-1 overflow-y-auto p-6">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-8"
        >
          <h3 className="font-display text-2xl font-bold text-foreground">
            Welcome back, {user.name.split(" ")[0]} 👋
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {stats.inProgress > 0
              ? `You have ${stats.inProgress} skill target${stats.inProgress > 1 ? "s" : ""} in progress and ${stats.total - stats.inProgress - stats.completed} awaiting.`
              : `You have ${stats.total} skill targets assigned. Let's get started!`}
          </p>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.35 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          {[
            { label: "Assigned", value: stats.total, color: "text-foreground" },
            { label: "In Progress", value: stats.inProgress, color: "text-info" },
            { label: "Completed", value: stats.completed, color: "text-success" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl bg-card border border-border p-4 shadow-card text-center"
            >
              <p className={cn("font-display text-2xl font-bold", stat.color)}>
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Filters + View Toggle + Create + Browse */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-lg bg-secondary p-1 w-fit">
              {filters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setActiveFilter(f.value)}
                  className={cn(
                    "rounded-md px-3.5 py-1.5 text-xs font-medium transition-all duration-200",
                    activeFilter === f.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-0.5 rounded-lg bg-secondary p-1">
              <button
                onClick={() => setViewMode("cards")}
                className={cn(
                  "flex items-center justify-center h-7 w-7 rounded-md transition-all duration-200",
                  viewMode === "cards"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "flex items-center justify-center h-7 w-7 rounded-md transition-all duration-200",
                  viewMode === "list"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setBrowseOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card text-foreground px-3.5 py-2 text-xs font-medium hover:bg-accent/10 transition-colors"
            >
              <Search className="h-3.5 w-3.5" />
              Browse
            </button>
            <button
              onClick={() => navigate('/create-skill-target')}
              className="inline-flex items-center gap-1.5 rounded-lg gradient-accent text-accent-foreground px-3.5 py-2 text-xs font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Skill Target
            </button>
          </div>
        </div>

        {/* Content */}
        {!hasAnyTargets ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35 }}
            className="flex flex-col items-center rounded-xl border-2 border-dashed border-border bg-card p-10 text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-info/10 mb-4">
              <Info className="h-6 w-6 text-info" />
            </div>
            <h4 className="font-display text-lg font-semibold text-foreground mb-1">
              No Skill Targets Assigned
            </h4>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Your manager will assign skill targets to you, or you can create your own to get started.
            </p>
            <button
              onClick={() => navigate('/create-skill-target')}
              className="inline-flex items-center gap-1.5 rounded-lg gradient-accent text-accent-foreground px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" />
              Create Skill Target
            </button>
          </motion.div>
        ) : targets.length > 0 ? (
          viewMode === "cards" ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {targets.map((target, i) => (
                <SkillTargetCard key={target.id} target={target} index={i} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {targets.map((target, i) => (
                <SkillTargetListItem key={target.id} target={target} index={i} />
              ))}
            </div>
          )
        ) : (
          <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
            No skill targets match this filter.
          </div>
        )}

        {/* Recommended for You */}
        <div className="mt-8">
          <RecommendedTargets />
        </div>
      </div>

      <BrowseSkillTargetsDialog open={browseOpen} onOpenChange={setBrowseOpen} />
    </>
  );
}

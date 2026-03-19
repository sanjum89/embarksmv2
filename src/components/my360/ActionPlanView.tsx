import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Target, ArrowRight, CheckCircle2, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { useAccount } from "@/contexts/AccountContext";
import { getProfileData } from "@/lib/accountSelectors";
import { getRecommendationsForUser, type SkillRecommendation, type RecommendationGroup } from "@/lib/skillRecommendations";
import type { SkillTarget } from "@/types/learning";
import { useToast } from "@/hooks/use-toast";

const levelColors: Record<string, string> = {
  B: "bg-warning/15 text-warning",
  I: "bg-info/15 text-info",
  A: "bg-accent/15 text-accent",
  E: "bg-success/15 text-success",
  M: "bg-primary/15 text-primary",
};

export function ActionPlanView() {
  const { user } = useUser();
  const { addSkillTargets, skillTargets } = useSkillTargets();
  const { activeAccount, normalizedAccount } = useAccount();
  const { toast } = useToast();
  const [createdGroups, setCreatedGroups] = useState<Set<string>>(new Set());
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);

  const profile = (normalizedAccount ? getProfileData(normalizedAccount, user.id) : null)
    ?? activeAccount?.data?.profileData?.[user.id];
  const { groups, hasRoleGaps } = useMemo(() => getRecommendationsForUser(profile), [profile]);

  const handleCreateGroup = (group: RecommendationGroup) => {
    // Check if already exists
    if (createdGroups.has(group.id) || skillTargets.some((st) => st.title === group.title)) return;

    const newTarget: SkillTarget = {
      id: `st-${Date.now()}-${group.id}`,
      title: group.title,
      description: group.subtitle,
      category: group.id.includes("role") ? "Role Skills" : "Project Skills",
      assignedTo: [user.id],
      progress: 0,
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      steps: group.recommendations.flatMap((rec, ri) =>
        rec.modules.map((mod, mi) => ({
          id: `step-${Date.now()}-${ri}-${mi}`,
          type: "module" as const,
          title: mod.title,
          description: `Part of ${rec.skill} learning path.`,
          order: ri * 10 + mi + 1,
          skippable: mi > 0,
          status: ri === 0 && mi === 0 ? ("available" as const) : ("locked" as const),
          duration: mod.duration,
          referenceId: `ref-${Date.now()}-${ri}-${mi}`,
        }))
      ),
    };

    addSkillTargets([newTarget]);
    setCreatedGroups((prev) => new Set(prev).add(group.id));
    toast({
      title: "Skill Target Created",
      description: `"${newTarget.title}" has been added to your Skill Targets.`,
    });
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        No profile data available to generate recommendations.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* AI recommendation banner */}
      <div className="flex items-center gap-2 rounded-lg bg-accent/10 border border-accent/20 px-4 py-3">
        <Sparkles className="h-4 w-4 text-accent shrink-0" />
        <p className="text-sm text-foreground">
          <span className="font-semibold">AI-powered recommendations</span> based on your skills gap analysis
        </p>
      </div>

      {/* No role gaps */}
      {!hasRoleGaps && (
        <div className="flex items-center gap-2 rounded-lg bg-success/10 border border-success/20 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">No role skill gaps</p>
            <p className="text-xs text-muted-foreground">You're fully aligned with your role requirements</p>
          </div>
        </div>
      )}

      {/* Dynamic groups */}
      {groups.map((group) => {
        const groupExists = createdGroups.has(group.id) || skillTargets.some((st) => st.title === group.title);

        return (
          <div key={group.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", group.iconBg)}>
                  <Target className={cn("h-4 w-4", group.iconColor)} />
                </div>
                <div>
                  <h5 className="font-display text-sm font-semibold text-foreground">{group.title}</h5>
                  <p className="text-xs text-muted-foreground">{group.subtitle}</p>
                </div>
              </div>
              <button
                onClick={() => handleCreateGroup(group)}
                disabled={groupExists}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                  groupExists
                    ? "bg-success/10 text-success cursor-default"
                    : "gradient-accent text-accent-foreground hover:opacity-90"
                )}
              >
                {groupExists ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Created
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    Create Skill Target
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2">
              {group.recommendations.map((rec) => (
                <RecommendationRow
                  key={rec.skill}
                  rec={rec}
                  expanded={expandedSkill === rec.skill}
                  onToggle={() => setExpandedSkill(expandedSkill === rec.skill ? null : rec.skill)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {groups.length === 0 && (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          No skill gaps detected — you're meeting all requirements!
        </div>
      )}
    </div>
  );
}

function RecommendationRow({
  rec,
  expanded,
  onToggle,
}: {
  rec: SkillRecommendation;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/50 transition-colors text-left"
      >
        {/* Skill name + levels */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm font-medium text-foreground truncate">{rec.skill}</span>
          {rec.isNew && (
            <span className="rounded-full bg-accent/10 border border-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent shrink-0">
              NEW
            </span>
          )}
        </div>

        {/* Level transition */}
        <div className="flex items-center gap-1.5 shrink-0">
          {rec.currentLevel ? (
            <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold", levelColors[rec.currentLevel])}>
              {rec.currentLevel}
            </span>
          ) : (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
              —
            </span>
          )}
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold", levelColors[rec.targetLevel])}>
            {rec.targetLevel}
          </span>
        </div>

        {/* Module count */}
        <span className="text-xs text-muted-foreground shrink-0">
          {rec.modules.length} modules
        </span>
      </button>

      {/* Expanded modules list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border bg-secondary/30 px-3 py-2 space-y-1.5">
              {rec.modules.map((mod, i) => (
                <div key={i} className="flex items-center gap-2.5 py-1">
                  <BookOpen className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    mod.type === "video" ? "text-info" : "text-muted-foreground"
                  )} />
                  <span className="text-xs font-medium text-foreground flex-1 truncate">{mod.title}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{mod.duration}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

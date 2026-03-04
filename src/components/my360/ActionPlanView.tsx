import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Target, ArrowRight, CheckCircle2, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import type { SkillTarget } from "@/types/learning";
import { useToast } from "@/hooks/use-toast";

interface SkillRecommendation {
  skill: string;
  currentLevel: string | null;
  targetLevel: string;
  isNew: boolean;
  modules: { title: string; type: "video" | "document" | "assessment"; duration: string }[];
}

const GROUP_1_NAME = "Product & Prioritization Mastery";
const GROUP_2_NAME = "Design & Prototyping Toolkit";

const recommendations: SkillRecommendation[] = [
  {
    skill: "Product Ops & Scaling",
    currentLevel: "A",
    targetLevel: "E",
    isNew: false,
    modules: [
      { title: "Scaling Product Operations", type: "video", duration: "30 min" },
      { title: "Advanced Product Ops Frameworks", type: "document", duration: "20 min" },
      { title: "Product Ops Case Studies", type: "video", duration: "25 min" },
    ],
  },
  {
    skill: "Prioritization Rigor",
    currentLevel: "A",
    targetLevel: "E",
    isNew: false,
    modules: [
      { title: "RICE & ICE Scoring Deep Dive", type: "video", duration: "25 min" },
      { title: "Stakeholder Alignment Workshop", type: "document", duration: "15 min" },
      { title: "Prioritization Under Uncertainty", type: "video", duration: "20 min" },
    ],
  },
  {
    skill: "Figma Wireframing",
    currentLevel: "I",
    targetLevel: "A",
    isNew: false,
    modules: [
      { title: "Wireframing Best Practices", type: "video", duration: "30 min" },
      { title: "Component-based Wireframes", type: "document", duration: "20 min" },
    ],
  },
  {
    skill: "Figma Make",
    currentLevel: null,
    targetLevel: "B",
    isNew: true,
    modules: [
      { title: "Intro to Figma Make", type: "video", duration: "20 min" },
      { title: "Building Your First Prototype", type: "video", duration: "25 min" },
    ],
  },
  {
    skill: "FigJam",
    currentLevel: null,
    targetLevel: "B",
    isNew: true,
    modules: [
      { title: "FigJam Essentials", type: "video", duration: "15 min" },
      { title: "Collaborative Whiteboarding", type: "document", duration: "10 min" },
    ],
  },
  {
    skill: "Lovable AI",
    currentLevel: null,
    targetLevel: "B",
    isNew: true,
    modules: [
      { title: "Getting Started with Lovable AI", type: "video", duration: "20 min" },
      { title: "Building Full-stack Apps with AI", type: "video", duration: "30 min" },
    ],
  },
];

const group1Skills = ["Product Ops & Scaling", "Prioritization Rigor"];
const group2Skills = ["Figma Wireframing", "Figma Make", "FigJam", "Lovable AI"];

const levelColors: Record<string, string> = {
  B: "bg-warning/15 text-warning",
  I: "bg-info/15 text-info",
  A: "bg-accent/15 text-accent",
  E: "bg-success/15 text-success",
  M: "bg-primary/15 text-primary",
};

export function ActionPlanView() {
  const { addSkillTargets, skillTargets } = useSkillTargets();
  const { toast } = useToast();
  const [createdGroups, setCreatedGroups] = useState<Set<string>>(new Set());
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);

  const group1Exists = createdGroups.has("group1") || skillTargets.some((st) => st.title === GROUP_1_NAME);
  const group2Exists = createdGroups.has("group2") || skillTargets.some((st) => st.title === GROUP_2_NAME);

  const handleCreateGroup = (group: "group1" | "group2") => {
    const isGroup1 = group === "group1";
    const skills = isGroup1 ? group1Skills : group2Skills;
    const recs = recommendations.filter((r) => skills.includes(r.skill));

    const newTarget: SkillTarget = {
      id: `st-${Date.now()}-${group}`,
      title: isGroup1 ? GROUP_1_NAME : GROUP_2_NAME,
      description: isGroup1
        ? "Advance your product operations and prioritization skills from Advanced to Expert level."
        : "Build foundational skills in Figma Wireframing, Figma Make, FigJam, and Lovable AI.",
      category: isGroup1 ? "Product Skills" : "Design Tools",
      assignedTo: ["u1"],
      progress: 0,
      dueDate: isGroup1 ? "2026-04-15" : "2026-04-30",
      steps: recs.flatMap((rec, ri) =>
        rec.modules.map((mod, mi) => ({
          id: `step-${Date.now()}-${ri}-${mi}`,
          type: mod.type === "assessment" ? ("assessment" as const) : ("module" as const),
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
    setCreatedGroups((prev) => new Set(prev).add(group));
    toast({
      title: "Skill Target Created",
      description: `"${newTarget.title}" has been added to your Skill Targets.`,
    });
  };

  return (
    <div className="space-y-4">
      {/* AI recommendation banner */}
      <div className="flex items-center gap-2 rounded-lg bg-accent/10 border border-accent/20 px-4 py-3">
        <Sparkles className="h-4 w-4 text-accent shrink-0" />
        <p className="text-sm text-foreground">
          <span className="font-semibold">AI-powered recommendations</span> based on your skills gap analysis
        </p>
      </div>

      {/* Group 1: Product & Prioritization */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
              <Target className="h-4 w-4 text-success" />
            </div>
            <div>
              <h5 className="font-display text-sm font-semibold text-foreground">{GROUP_1_NAME}</h5>
              <p className="text-xs text-muted-foreground">Upgrade existing skills to Expert level</p>
            </div>
          </div>
          <button
            onClick={() => handleCreateGroup("group1")}
            disabled={group1Exists}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              group1Exists
                ? "bg-success/10 text-success cursor-default"
                : "gradient-accent text-accent-foreground hover:opacity-90"
            )}
          >
            {group1Exists ? (
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
          {recommendations
            .filter((r) => group1Skills.includes(r.skill))
            .map((rec) => (
              <RecommendationRow
                key={rec.skill}
                rec={rec}
                expanded={expandedSkill === rec.skill}
                onToggle={() => setExpandedSkill(expandedSkill === rec.skill ? null : rec.skill)}
              />
            ))}
        </div>
      </div>

      {/* Group 2: Design & Prototyping */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-info/10">
              <Target className="h-4 w-4 text-info" />
            </div>
            <div>
              <h5 className="font-display text-sm font-semibold text-foreground">{GROUP_2_NAME}</h5>
              <p className="text-xs text-muted-foreground">Acquire new design and prototyping skills</p>
            </div>
          </div>
          <button
            onClick={() => handleCreateGroup("group2")}
            disabled={group2Exists}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              group2Exists
                ? "bg-success/10 text-success cursor-default"
                : "gradient-accent text-accent-foreground hover:opacity-90"
            )}
          >
            {group2Exists ? (
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
          {recommendations
            .filter((r) => group2Skills.includes(r.skill))
            .map((rec) => (
              <RecommendationRow
                key={rec.skill}
                rec={rec}
                expanded={expandedSkill === rec.skill}
                onToggle={() => setExpandedSkill(expandedSkill === rec.skill ? null : rec.skill)}
              />
            ))}
        </div>
      </div>
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
                    mod.type === "video" ? "text-info" : mod.type === "assessment" ? "text-accent" : "text-muted-foreground"
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

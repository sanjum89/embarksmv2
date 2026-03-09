import type { ProfileData } from "@/data/mock";
import { proficiencyShort, type Proficiency } from "@/types/learning";

export interface SkillGap {
  skill: string;
  currentLevel: string | null;
  targetLevel: string;
  isNew: boolean;
}

export interface SkillRecommendation extends SkillGap {
  modules: { title: string; type: "video" | "document"; duration: string }[];
}

export interface RecommendationGroup {
  id: string;
  title: string;
  subtitle: string;
  iconColor: string;
  iconBg: string;
  skills: string[];
  recommendations: SkillRecommendation[];
}

const proficiencyOrder: Proficiency[] = ["Beginner", "Intermediate", "Advanced", "Expert", "Master"];

function profIdx(p: Proficiency): number {
  return proficiencyOrder.indexOf(p);
}

/* Generate mock modules for a skill gap */
function generateModules(skillName: string, gapSize: number): { title: string; type: "video" | "document"; duration: string }[] {
  const modules: { title: string; type: "video" | "document"; duration: string }[] = [
    { title: `${skillName} — Core Concepts`, type: "video", duration: "25 min" },
    { title: `${skillName} — Practical Guide`, type: "document", duration: "20 min" },
  ];
  if (gapSize >= 2) {
    modules.push({ title: `${skillName} — Advanced Workshop`, type: "video", duration: "30 min" });
  }
  return modules;
}

/* Derive all skill gaps from profile data */
function deriveGaps(
  current: { skill_name: string; proficiency: Proficiency }[],
  required: { skill_name: string; proficiency: Proficiency }[]
): SkillRecommendation[] {
  return required
    .map((req) => {
      const cur = current.find((s) => s.skill_name === req.skill_name);
      const curIdx = cur ? profIdx(cur.proficiency) : -1;
      const reqIdx = profIdx(req.proficiency);
      const diff = reqIdx - curIdx;
      if (diff <= 0) return null;

      const currentLevel = cur ? proficiencyShort[cur.proficiency] : null;
      const targetLevel = proficiencyShort[req.proficiency];

      return {
        skill: req.skill_name,
        currentLevel,
        targetLevel,
        isNew: !cur,
        modules: generateModules(req.skill_name, diff),
      };
    })
    .filter(Boolean) as SkillRecommendation[];
}

/* Build recommendation groups for a user's profile */
export function getRecommendationsForUser(profile: ProfileData | undefined): {
  roleGaps: SkillRecommendation[];
  projectGaps: SkillRecommendation[];
  groups: RecommendationGroup[];
  hasRoleGaps: boolean;
} {
  if (!profile) {
    return { roleGaps: [], projectGaps: [], groups: [], hasRoleGaps: false };
  }

  const roleGaps = deriveGaps(profile.roleSkillsCurrent, profile.roleSkillsRequired);
  const projectGaps = deriveGaps(profile.projectSkillsCurrent, profile.projectSkillsRequired);

  const groups: RecommendationGroup[] = [];

  if (roleGaps.length > 0) {
    groups.push({
      id: "role",
      title: "Role Skills Advancement",
      subtitle: "Close gaps in your core role requirements",
      iconColor: "text-success",
      iconBg: "bg-success/10",
      skills: roleGaps.map((g) => g.skill),
      recommendations: roleGaps,
    });
  }

  if (projectGaps.length > 0) {
    // Split project gaps into "upgrade existing" and "acquire new"
    const existing = projectGaps.filter((g) => !g.isNew);
    const newSkills = projectGaps.filter((g) => g.isNew);

    if (existing.length > 0) {
      groups.push({
        id: "project-upgrade",
        title: "Project Skills Upgrade",
        subtitle: "Upgrade existing skills to meet project needs",
        iconColor: "text-accent",
        iconBg: "bg-accent/10",
        skills: existing.map((g) => g.skill),
        recommendations: existing,
      });
    }

    if (newSkills.length > 0) {
      groups.push({
        id: "project-new",
        title: "New Project Skills",
        subtitle: "Acquire new skills for your current project",
        iconColor: "text-info",
        iconBg: "bg-info/10",
        skills: newSkills.map((g) => g.skill),
        recommendations: newSkills,
      });
    }
  }

  return { roleGaps, projectGaps, groups, hasRoleGaps: roleGaps.length > 0 };
}

import type { SkillEntry, SkillRequirement, Proficiency } from "@/types/learning";
import { proficiencyNumeric, proficiencyShort } from "@/types/learning";

export type GapLevel = "No gap" | "Medium gap" | "High gap";

export interface GapResult {
  skill_name: string;
  currentLevel: Proficiency | null;
  requiredLevel: Proficiency;
  gapLevel: GapLevel;
}

const proficiencyOrder: Proficiency[] = ["Beginner", "Intermediate", "Advanced", "Expert", "Master"];

function proficiencyIndex(p: Proficiency): number {
  return proficiencyOrder.indexOf(p);
}

export function deriveSkillGaps(
  current: SkillEntry[],
  required: SkillRequirement[]
): GapResult[] {
  return required.map((req) => {
    const cur = current.find((s) => s.skill_name === req.skill_name);
    const curIdx = cur ? proficiencyIndex(cur.proficiency) : -1;
    const reqIdx = proficiencyIndex(req.proficiency);
    const diff = reqIdx - curIdx;

    let gapLevel: GapLevel = "No gap";
    if (diff >= 2) gapLevel = "High gap";
    else if (diff === 1) gapLevel = "Medium gap";

    return {
      skill_name: req.skill_name,
      currentLevel: cur?.proficiency ?? null,
      requiredLevel: req.proficiency,
      gapLevel,
    };
  });
}

export interface RadarEntry {
  skill: string;
  score: number;
  target: number;
}

export function deriveRadarSkills(
  skillsCurrent?: SkillEntry[],
  skillsRequired?: SkillRequirement[]
): RadarEntry[] {
  if (!skillsRequired?.length) return [];
  const current = skillsCurrent || [];
  return skillsRequired.map((req) => {
    const name = req.skill_name || "Unknown";
    const cur = current.find((s) => s.skill_name === req.skill_name);
    return {
      skill: name.length > 16 ? name.slice(0, 14) + "…" : name,
      score: cur ? proficiencyNumeric[cur.proficiency] : 0,
      target: proficiencyNumeric[req.proficiency],
    };
  });
}

export interface SkillGapRow {
  skill: string;
  level: string;
  target: string;
  hasGap: boolean;
  gapLevel: GapLevel;
}

export function deriveSkillGapRows(gaps: GapResult[]): SkillGapRow[] {
  return gaps.map((g) => ({
    skill: g.skill_name,
    level: g.currentLevel ? proficiencyShort[g.currentLevel] : "—",
    target: proficiencyShort[g.requiredLevel],
    hasGap: g.gapLevel !== "No gap",
    gapLevel: g.gapLevel,
  }));
}

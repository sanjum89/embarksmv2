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

/**
 * Employee-driven gap derivation: iterates over the employee's current skills
 * and looks up matching requirements to compute gaps.
 */
export function deriveGapsFromEmployee(
  current: SkillEntry[],
  required: SkillRequirement[]
): GapResult[] {
  return current.map((cur) => {
    const req = required.find((r) => r.skill_name === cur.skill_name);
    if (!req) {
      return {
        skill_name: cur.skill_name,
        currentLevel: cur.proficiency,
        requiredLevel: cur.proficiency,
        gapLevel: "No gap" as GapLevel,
      };
    }
    const curIdx = proficiencyIndex(cur.proficiency);
    const reqIdx = proficiencyIndex(req.proficiency);
    const diff = reqIdx - curIdx;
    let gapLevel: GapLevel = "No gap";
    if (diff >= 2) gapLevel = "High gap";
    else if (diff === 1) gapLevel = "Medium gap";
    return {
      skill_name: cur.skill_name,
      currentLevel: cur.proficiency,
      requiredLevel: req.proficiency,
      gapLevel,
    };
  });
}

/**
 * Employee-driven radar derivation: iterates over the employee's current skills
 * and looks up matching requirements for the target value.
 */
export function deriveRadarFromEmployee(
  skillsCurrent?: SkillEntry[],
  skillsRequired?: SkillRequirement[]
): RadarEntry[] {
  if (!skillsCurrent?.length) return [];
  const required = skillsRequired || [];
  return skillsCurrent.map((cur) => {
    const name = cur.skill_name || "Unknown";
    const req = required.find((r) => r.skill_name === cur.skill_name);
    return {
      skill: name.length > 16 ? name.slice(0, 14) + "…" : name,
      score: proficiencyNumeric[cur.proficiency],
      target: req ? proficiencyNumeric[req.proficiency] : proficiencyNumeric[cur.proficiency],
    };
  });
}

/**
 * Role-driven gap derivation: iterates over the role's required skills as the baseline.
 * If an employee lacks a required skill, currentLevel is null and gap is computed from index -1.
 */
export function deriveFullRoleGaps(
  current: SkillEntry[],
  roleRequired: SkillRequirement[]
): GapResult[] {
  return roleRequired.map((req) => {
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

/**
 * Role-driven radar derivation: iterates over the role's required skills.
 * Missing employee skills get score = 0.
 */
export function deriveFullRoleRadar(
  skillsCurrent?: SkillEntry[],
  roleRequired?: SkillRequirement[]
): RadarEntry[] {
  if (!roleRequired?.length) return [];
  const current = skillsCurrent || [];
  return roleRequired.map((req) => {
    const name = req.skill_name || "Unknown";
    const cur = current.find((s) => s.skill_name === req.skill_name);
    return {
      skill: name.length > 16 ? name.slice(0, 14) + "…" : name,
      score: cur ? proficiencyNumeric[cur.proficiency] : 0,
      target: proficiencyNumeric[req.proficiency],
    };
  });
}

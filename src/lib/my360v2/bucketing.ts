// Pure helpers for My 360 v2 capability bucketing & gap math.

export interface CapabilityRow {
  capability_code: string;
  current_level: number;
  source?: string;
  confidence?: string;
  validation_needed?: boolean;
  short_rationale?: string | null;
}

export interface RoleRequirementRow {
  capability_code: string;
  required_level: number;
  criticality: "standard" | "high" | "risk_critical" | string;
  source_module_codes?: string[] | null;
}

export interface BucketedCapability {
  code: string;
  label: string;
  current: number;
  required: number;
  gap: number; // current - required
  criticality: string;
  sourceModuleCodes: string[];
  validationNeeded: boolean;
  rationale?: string | null;
}

export type BucketKey = "strengths" | "atLevel" | "gaps" | "stretch";

export interface Buckets {
  strengths: BucketedCapability[];
  atLevel: BucketedCapability[];
  gaps: BucketedCapability[];
  stretch: BucketedCapability[];
}

const CRIT_RANK: Record<string, number> = { risk_critical: 0, high: 1, standard: 2 };

export function humanizeCode(code: string): string {
  return code
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function bucketCapabilities(
  proficiency: CapabilityRow[],
  requirements: RoleRequirementRow[],
): Buckets {
  const reqByCode = new Map(requirements.map((r) => [r.capability_code, r]));
  const rows: BucketedCapability[] = proficiency
    .map((p) => {
      const req = reqByCode.get(p.capability_code);
      if (!req) return null;
      return {
        code: p.capability_code,
        label: humanizeCode(p.capability_code),
        current: p.current_level,
        required: req.required_level,
        gap: p.current_level - req.required_level,
        criticality: req.criticality,
        sourceModuleCodes: req.source_module_codes ?? [],
        validationNeeded: !!p.validation_needed,
        rationale: p.short_rationale,
      } as BucketedCapability;
    })
    .filter(Boolean) as BucketedCapability[];

  const strengths = rows.filter((r) => r.gap >= 1);
  const atLevel = rows.filter((r) => r.gap === 0);
  const gaps = rows
    .filter((r) => r.gap < 0)
    .sort((a, b) => (CRIT_RANK[a.criticality] ?? 9) - (CRIT_RANK[b.criticality] ?? 9) || a.gap - b.gap);
  const stretch = rows.filter(
    (r) => r.gap >= 0 && r.criticality === "standard" && r.required >= 4,
  );

  return { strengths, atLevel, gaps, stretch };
}

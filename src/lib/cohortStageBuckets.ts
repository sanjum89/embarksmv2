/**
 * Derive meaningful stage groups for a cohort's module spine using the
 * `display_order` decade buckets baked into the catalog.
 *
 * The DB column `progression_stage` is currently just the role slug echoed back
 * for every module, so it carries no signal. Display order ranges, however,
 * follow a consistent convention:
 *
 *    10–99   → Foundations
 *   100–199  → Technical
 *   200–299  → Behavioural Skills
 *   300–399  → Compliance & Standards
 *   400–499  → Onboarding
 *   500+     → Stretch
 *
 * Returns one entry per contiguous run of modules in the same bucket. If the
 * caller doesn't pass display orders (legacy spine), we fall back to a single
 * implicit bucket so consumers can choose to render nothing.
 */

export interface StageBucket {
  label: string;
  startIdx: number;
  span: number;
}

interface ModuleLike {
  display_order?: number | null;
  /** Some callers don't carry display_order and rely on prefix-based heuristics. */
  module_code?: string;
}

const RANGES: { label: string; min: number; max: number }[] = [
  { label: "Foundations", min: 0, max: 99 },
  { label: "Technical", min: 100, max: 199 },
  { label: "Behavioural Skills", min: 200, max: 299 },
  { label: "Compliance & Standards", min: 300, max: 399 },
  { label: "Onboarding", min: 400, max: 499 },
  { label: "Stretch", min: 500, max: Number.POSITIVE_INFINITY },
];

const PREFIX_LABELS: Record<string, string> = {
  bk: "Foundations",
  tk: "Technical",
  bs: "Behavioural Skills",
  cps: "Compliance & Standards",
  oe: "Onboarding",
  str: "Stretch",
};

function bucketFor(m: ModuleLike, fallbackIdx: number): string {
  if (typeof m.display_order === "number") {
    const r = RANGES.find((r) => m.display_order! >= r.min && m.display_order! <= r.max);
    if (r) return r.label;
  }
  if (m.module_code) {
    const prefix = m.module_code.split(/[._]/, 1)[0]?.replace(/\d+$/, "");
    if (prefix && PREFIX_LABELS[prefix]) return PREFIX_LABELS[prefix];
  }
  return `Group ${Math.floor(fallbackIdx / 6) + 1}`;
}

export function deriveStageBuckets(modules: ModuleLike[]): StageBucket[] {
  const out: StageBucket[] = [];
  modules.forEach((m, i) => {
    const label = bucketFor(m, i);
    const last = out[out.length - 1];
    if (last && last.label === label) last.span += 1;
    else out.push({ label, startIdx: i, span: 1 });
  });
  return out;
}

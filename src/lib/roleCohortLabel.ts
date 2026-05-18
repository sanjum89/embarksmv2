// Maps role-cohort slugs (e.g. "assoc_im") to human-readable labels.
// Falls back to a title-cased version of the slug.
const MAP: Record<string, string> = {
  assoc_im: "Associate Investment Manager",
  senior_im: "Senior Investment Manager",
  inv_dir: "Investment Director",
  in_im: "Investment Manager",
};

export function roleCohortLabel(code?: string | null): string {
  if (!code) return "";
  if (MAP[code]) return MAP[code];
  return code
    .replace(/[._]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

## Cohorts Page Redesign — Vibrant Rathbones Identity

Refresh `src/pages/ManagerCohortPicker.tsx` so the listing feels energetic and on-brand (deep navy primary + peach accent), without changing data sources or routing.

### Header
- Larger display headline ("Cohorts") with subtitle preserved.
- Right-aligned subtle utility (kept minimal — no new actions).

### KPI tiles (3)
- Move from cramped 3-up at `sm:max-w-2xl` to full-width responsive grid (`md:grid-cols-3 gap-6`).
- Make the **middle tile (Active learners) a navy "hero" tile**: `bg-primary text-primary-foreground`, peach accent ring/glow, larger numeric.
- Outer two tiles: white card, peach left-border accent, larger number, supporting micro-label (e.g. "of N total" / "needs follow-up").
- Use semantic tokens (`bg-primary`, `text-accent`, `border-accent`, `bg-card`) — no hardcoded hex.

### Cohort cards
- Switch to a richer card: rounded-2xl, soft shadow, hover lift (`hover:-translate-y-0.5 hover:shadow-lg`), top accent strip that fades in on hover.
- Header row: peach-tinted role pill (uppercase, tracked) + chevron in a rounded square that flips to navy bg on hover.
- Title: larger, bold, navy; hover color shifts to accent.
- Meta row: learners (Users icon) + completion label.
- **Progress bar**: replace plain text % with a 2px gradient bar (`from-primary to-accent`) plus % label above. Gradient width = `m.pct`.
- Empty/zero cohorts: progress bar shows neutral muted track; label "Not started".

### Tokens & theming
- All colours via existing semantic tokens so the redesign automatically respects active branding mode (calm/vibrant) and dark mode.
- No new design tokens introduced.
- Animations only via Tailwind transitions (no new deps).

### Out of scope
- No data, routing, or hook changes.
- No changes to manager hub detail page.
- No new files.

### File touched
- `src/pages/ManagerCohortPicker.tsx`

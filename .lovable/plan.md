## Achievements card cleanup

Scope: `src/pages/CohortHub.tsx` — Achievements card only. Keep colour palette (bronze/silver/gold tiers, amber star). No data/hook changes.

### Changes

**Header (points display)**
- Drop the "/ 925 pts" denominator and the progress bar underneath.
- Keep a single compact pill: `★ 225 pts` (star icon + total accumulated, no denominator, no bar).
- Keep "Milestones earned" eyebrow + "Achievements" title + "4 of 8 unlocked" line as the count indicator.

**Pills (badge tiles)**
- Revert to the previous compact pill style: smaller, single-row label, no per-pill `+N pts` line.
- Earned: tier-coloured rounded pill with small icon + label (1 line, truncate if needed).
- Locked: muted pill, dashed border, lock icon + label (no points, no strikethrough block).
- Grid stays 4 across on desktop, 2 on mobile, but with reduced padding so it reads as a tight badge row rather than tall cards.

**Footer (Next)**
- Keep "Next: <label>" line.
- Remove the `+N pts` chip on the right (since per-badge points are no longer surfaced).

### Out of scope
- No changes to `useCohortHub.ts` (points data stays in the model, just not rendered per pill).
- No changes to other cards, tabs, or routes.

### Result
A calmer card: one star-points number, count of unlocked, a tidy row of coloured badge pills, and a simple "Next" hint.

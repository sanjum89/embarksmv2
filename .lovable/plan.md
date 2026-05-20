## Why

The Achievements card on Cohort Hub uses a single accent colour for every badge and shows no running points total — it reads as a list of pills, not a recognition surface. The user wants more visual variety per badge and a clear "points accumulated" number.

## Changes

**1. Data — `src/hooks/useCohortHub.ts`**
- Extend `HubAchievement` with `points: number` and `tier: "bronze" | "silver" | "gold"` (drives colour).
- Assign points + tier per badge:
  - `first_quiz` 25 · bronze
  - `5_day_streak` 50 · bronze
  - `module_1` 75 · silver
  - `peer_mentor` 75 · silver
  - `mock_ace` 100 · silver
  - `top_10` 150 · gold
  - `cisi_l4` 200 · gold
  - `fca_notified` 250 · gold
- Add derived fields on `CohortHubData`: `pointsEarned`, `pointsTotal`.

**2. UI — `src/pages/CohortHub.tsx` Achievements card**
- Header row: keep "Achievements" title; add a points pill on the right (`★ 225 pts` style) with a thin progress bar to `pointsTotal`. Move the "earned/total" count under the title as a small subline.
- Replace the flat pill row with a 4-col grid of small badge tiles (2-col on mobile). Each tile:
  - Icon glyph chosen per badge code (Trophy, Flame, BookOpen, Users, Target, Award, GraduationCap, ShieldCheck).
  - Tier gradient background — bronze `from-amber-500/15 to-orange-500/10`, silver `from-sky-500/15 to-indigo-500/10`, gold `from-amber-400/25 to-rose-400/15` — with matching border + icon colour.
  - Label + `+N pts` line under it.
  - Locked tiles: greyscale, dashed border, lock icon, `+N pts` shown muted as the carrot.
- Keep the "Next: …" footer line, but show its `+N pts` from the badge data instead of the hardcoded `+50 points`.

**3. Out of scope**
- No backend/DB changes — points live in the hook seed.
- No changes to other Cohort Hub cards.
- No new achievement codes.

## Files

- edit: `src/hooks/useCohortHub.ts`
- edit: `src/pages/CohortHub.tsx`

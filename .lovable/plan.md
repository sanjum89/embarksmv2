## Issues to fix on `src/pages/CohortHub.tsx` and friends

### 1. Achievements card still looks like a basic chip list
The redesign was planned (msg #751) but never shipped — the request was interrupted by the "Take a tour" pivot, and the chip list at lines 259–272 is still the old version. Rebuild it now with the previously-approved "tactile glass depth" treatment.

**Apply to lines 259–272 of `CohortHub.tsx`:**
- Card shell: `relative overflow-hidden p-6 flex flex-col`.
- Two decorative blurred glows: `bg-accent/30` top-right and `bg-primary/10` bottom-left (`blur-3xl`, pointer-events-none).
- Header row: title "Achievements" + eyebrow "Milestones earned"; right side shows live `{earned}/{total}` in accent + 48px accent progress bar with `shadow-[0_0_8px_hsl(var(--accent)/0.5)]`.
- Badges grid (`flex flex-wrap gap-2`):
  - Earned: `rounded-xl border-accent/40 bg-accent/15`, soft accent drop-shadow + inset top-highlight, pulsing accent dot, bold foreground text, lift-on-hover.
  - Locked: dashed muted border, `bg-muted/40`, opacity-60, static muted dot, no strikethrough.
- Footer (only if any locked): `Next: {first locked label}` chip + `+50 points` accent badge above a thin top divider.
- Semantic tokens only (no `amber-*`, hex, or raw colors).

### 2. KPI strip duplicates learning info — swap one tile for the mentor
"Currently learning" and "Up next" both restate the journey. Keep "Currently learning"; **replace the "Up next" tile (lines 233–237) with a Mentor tile** so the user sees their mentor up top instead of buried in a card halfway down.

Tile layout (fits the same `bg-card p-4` slot, no grid changes):
- Eyebrow: `Your mentor` (small uppercase, with a `Users` icon, emerald accent matching the existing mentor card eyebrow).
- Body: mentor avatar (h-9 w-9, initials fallback) + name (`font-display text-base font-bold`, one line) + title (`text-xs text-muted-foreground`, one line).
- Two side-by-side CTAs: `Message` (outline, `flex-1`) and `Book` (default, `flex-1`), both `size="sm" h-7 text-xs`, calling the existing `mentorMessage` / `mentorBook` handlers already in scope.
- Fallback (no mentor): single muted line "No mentor assigned yet."

### 3. Move Cohort leaderboard out of the main column into the right rail
- **Remove** the standalone leaderboard `<Card>` from `CohortHub.tsx` lines 319–333 (the first card in the "Leaderboard · Mentor · Evidence" 3-up).
- Rework the surrounding 3-column row (`lg:grid-cols-3`, lines 318–374) into a 2-column row (`lg:grid-cols-2`) containing just Mentor + Evidence.
- In `src/components/cohort/CohortRightRail.tsx`, add a **third Card directly below the announcements card** (between announcements and "Recent activity") titled `Cohort leaderboard` with the same compact rows: rank, avatar, name (or "You"), `pct%`. Wire it via a new `leaderboard` prop on `CohortRightRail` (type `HubLeaderRow[]` from `useCohortHub`). Pass it from `CohortHub.tsx`.

### 4. Blank pill in Co-learning timeline ("CLASSROOM" invisible)
In `src/components/cohort/CoLearningTimeline.tsx` line 142, the classroom badge uses `text-accent-foreground` on a transparent background. With the Rathbones palette, `accent-foreground` is near-white, so the text vanishes on the white card. Fix the colour token only:
- Live → keep `border-primary/30 text-primary`.
- Classroom → change to `border-accent/40 text-accent` (peach text on white card, readable).
- Study group → keep `border-border text-muted-foreground`.

### 5. Blank pill in People to connect + similar/match indistinguishable
In `src/components/cohort/PeopleToConnect.tsx` line 57:
- "Suggested match" pill uses the same broken `text-accent-foreground` → invisible.
- Both pill types look weakly differentiated.

Fix and add a clear visual split:
- **Similar topic**: keep outline pill `border-primary/30 text-primary bg-primary/5` with a 2-letter prefix dot — e.g., `<Sparkles className="h-2.5 w-2.5"/>` before the label is overkill; keep current dotless treatment but with `bg-primary/5` for fill so it reads as a chip.
- **Suggested match**: solid filled pill `bg-accent/20 text-accent border-accent/40` plus a `Users` icon (h-2.5 w-2.5) inside the pill so it's visually distinct from "Similar topic".
- Make the pill larger (`text-[10px]`) and replace `p.reason` with a clearer secondary line:
  - similar → "Same topic · {p.reason}" prefix.
  - match → "Match · {p.reason}" prefix.
- Where `p.reason` is empty, render nothing instead of an empty span (current code already handles via truncate but verify the label still reads).

## Files touched
- `src/pages/CohortHub.tsx` — Achievements rebuild (259–272), KPI tile swap (233–237), remove leaderboard card + restructure 3-up → 2-up (318–374), pass `leaderboard` to `CohortRightRail`.
- `src/components/cohort/CohortRightRail.tsx` — Add `leaderboard` prop + new leaderboard card under Announcements.
- `src/components/cohort/CoLearningTimeline.tsx` — Fix classroom badge colour (line 142).
- `src/components/cohort/PeopleToConnect.tsx` — Fix match badge colour + restyle for stronger differentiation (lines 53–63).

## Out of scope
- No data-shape changes to `useCohortHub`.
- Mentor card lower down stays (Mentor tile up top is a quick-access summary; the full card keeps notes + "Next 1:1" + booking flow).
- No changes to the Adapted path tab.

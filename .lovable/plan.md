# Embark Journey header — declutter & deduplicate

## What's wrong now (top-to-bottom in the screenshot)

1. **Two stacked bars do the same job.** The cohort progress bar AND the "TRACKS" segmented strip both encode track progress — the segmented strip is unlabelled, hard to read, and its data is already in the track pills below it.
2. **"Tracks" label + segmented strip = visual noise.** Users navigate by clicking pills (their own preferred behaviour), so the strip adds nothing.
3. **"Business Knowledge" appears twice in a row.** Once as the active track pill, immediately again on the meta line ("Business Knowledge · 0 of 5 modules · 0%"). The % is also already on the active pill.
4. **Three separate horizontal rows** under the header (track pills row, meta-text row, filter-chips row) make the area feel crowded.

## The redesign — one tidy header, one tidy toolbar

```text
┌─────────────────────────────────────────────────────────────┐
│ Your cohort                                            0%   │
│ Investment Management Readiness — Jan 2026                  │
│ 0 / 29 modules · 0 / 56 chapters · Due 9 Jul 2027           │
│ ▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭ (single thin bar) │
└─────────────────────────────────────────────────────────────┘

[ Business Knowledge · 0/5 ] [ Technical · 0/8 ] [ Behavioural · 0/9 ] [ Certification · 0/7 ]   ← scrollable pills
        ↑ active pill has slim progress fill inside

                                          All · In progress · Completed · Locked   ← compact filter row
```

### 1. JourneyHeaderCard — strip the second bar
- **Delete** the entire "TRACKS" segmented strip block (lines 67–116 of `JourneyHeaderCard.tsx`).
- Keep cohort label, title, meta line, the single overall progress bar, and the right-aligned %.
- Slightly tighten internal spacing (`space-y-3` → `space-y-2.5`) since the card is now shorter.

### 2. JourneyTrackTabs — pills carry all the per-track signal
Pills already exist; upgrade them so they're the single source of per-track info:
- **Inside each pill**, render a slim 2px progress fill across the bottom of the pill background (so the pill itself is a tiny progress bar). Active pill uses accent fill; inactive uses `foreground/30`.
- Replace the standalone `% Badge` with a more useful chip: `0/5` (completed/total chapters) — clearer than just a percent that's already shown visually.
- On the active pill, reverse colours stay as today; the inner progress fill uses `bg-accent-foreground/30` so it's visible on the dark pill.
- Keep horizontal scroll for overflow.

### 3. Toolbar under pills — one row, no duplication
Replace the current "Business Knowledge · 0 of 5 modules · 0%" + filter-chips two-row block with a single right-aligned filter row:
- **Drop** the redundant track name and percent (already in the active pill).
- **Drop** the modules count from prose; the active pill already shows `0/5`.
- Keep the four filter chips (`All`, `In progress`, `Completed`, `Locked`) but render them as smaller ghost pills with a left-side faint label "Show:" so the row reads cleanly.
- If a filter narrows results to zero, show a tiny muted "No modules in this view" line below.

### 4. Spacing
- Page-level vertical rhythm: `space-y-4` between header card → pills → toolbar → accordion. Reduce pills bottom margin (currently `pb-2` inside ScrollArea) so the toolbar sits closer.

## Files to touch

- `src/components/learnpath/JourneyHeaderCard.tsx` — remove "Tracks" segmented strip section; keep the rest.
- `src/components/learnpath/JourneyTrackTabs.tsx` — add inner progress fill, swap `%` badge for `completed/total` chips.
- `src/components/learnpath/EmbarkJourneyView.tsx` — collapse the meta-line + filter-chips block into a single compact filter row; remove the duplicated track-name/modules/% prose.

No data changes, no route changes, no prop additions beyond what's already on `JourneyTrack` (`pct`, `completedChapters`, `totalChapters`).

## QA after build

1. Header card now has exactly one progress bar; no "TRACKS" label.
2. Active pill visually communicates progress (fill) + chapter ratio (`0/5`); name is not repeated below.
3. Filter row sits in one tidy line; switching filters doesn't reflow vertically.
4. Horizontal pill scroll still works at narrow widths; nothing wraps awkwardly.
5. Verify in both Rathbones and Pinnacle Capital (white-label) — substituted titles still render.

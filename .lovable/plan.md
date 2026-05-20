## Embark Journey — finish the two pending changes

Both items previously requested never actually landed in `src/components/learnpath/EmbarkJourneyView.tsx`. The current file still renders `<JourneyTrackTabs>` and still shows the `Show · All · In progress · Completed · Locked` chip row. This plan finishes both in one pass.

### 1. New `src/components/learnpath/JourneyTrackCards.tsx`

Replaces `JourneyTrackTabs` for the cohort journey view only. A 4-up responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3`) of track cards with three visual states:

- **Completed** (`pct === 100`): `bg-card border-border`, small green check pill, muted percent.
- **Active** (selected track): `bg-primary text-primary-foreground scale-[1.02] shadow-lg`, peach `bg-accent text-accent-foreground` "CURRENT TRACK" badge floated at `-top-2`, inline mini progress bar with `bg-accent` fill on `bg-primary-foreground/15` track.
- **Other** (in_progress / up_next / locked, not selected): `bg-accent/10 border-accent/30 hover:bg-card transition-colors`, accent-colored eyebrow.

Each card shows: state eyebrow (`text-[10px] uppercase tracking-wider`), track name (`font-display text-base font-semibold`), and `{completedChapters}/{totalChapters} chapters · {pct}%`. Click → `onSelect(track.code)`. All colors via semantic tokens (`primary`, `accent`, `card`, `border`, `muted-foreground`, `foreground`) — no hex.

### 2. Edit `src/components/learnpath/EmbarkJourneyView.tsx`

- Swap `<JourneyTrackTabs>` (line 120) for `<JourneyTrackCards>` with the same `tracks` / `activeCode` / `onSelect` props.
- Delete the filter chip row (lines 128–145) entirely.
- Remove `filter` / `setFilter` state (line 88), the `filteredTrack` `useMemo` (lines 93–105), the `filterChips` array (lines 107–112), and the `FilterKey` type (line 14).
- Pass `selected` (renamed back from `filteredTrack`) directly to `<JourneyModuleAccordion>`.
- Drop the `Button` import if no longer used in this file.

### 3. Leave alone

- `JourneyTrackTabs.tsx` stays in place (other consumers may use it).
- `JourneyHeaderCard`, `JourneyModuleAccordion`, page header, data hooks, routing, sequencing logic — untouched.

### Verification

After the edit, confirm the Embark Journey page renders elevated track cards instead of pill tabs, and that no `Show / All / In progress / Completed / Locked` row appears above the module accordion.

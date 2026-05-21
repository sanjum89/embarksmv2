## Goal

The left "Recommended actions" card (50% column) only has 3 items and leaves a tall empty stripe beneath them now that it sits next to the equally-tall Achievements card. Fill that whitespace with a "Pinned answers" section mirroring the visual pattern from Deep Research (the screenshot's pin icon + collapsed row with trash icon).

## Changes — `src/pages/CohortHub.tsx`

Inside the left `<Card>` (currently containing only the Recommended actions header + list), append a second block beneath the actions list:

```
<div className="mt-6 pt-5 border-t border-border/60 space-y-2">
  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
    <Pin className="h-3 w-3" /> Pinned answers
  </div>
  {pinned.map((p) => (
    <PinnedRow key={p.id} title={p.title} onOpen={...} onRemove={...} />
  ))}
  {pinned.length === 0 && (
    <div className="rounded-lg border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
      Pin Agent One answers here to jump back to them later.
    </div>
  )}
</div>
```

### Pinned data source
- Local mock array of 3 short answers (e.g. "Your fastest growth areas right now are…", "Top peer matches for IM…", "What to prep for next 1:1…"). Cohort hub already uses local mock state for the surrounding cards, so this matches the existing pattern. No hook/data wiring beyond a `useState` for removal.
- Each pin stores `{ id, title }`. Trash icon removes it from local state. Chevron acts as expand/collapse showing a short preview snippet.

### Row visuals (matches uploaded screenshot)
- `flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2`
- `ChevronRight` (rotates to `ChevronDown` when open), title with `truncate text-sm font-medium`, trailing `Trash2` ghost button.
- Expanded state shows a 2–3 line preview paragraph beneath the row.

### Imports
Add `Pin, Trash2, ChevronDown` to the existing `lucide-react` import (ChevronRight already imported).

## Out of scope
- Right Achievements card, KPI strip, mentor card, tabs.
- Wiring to real Agent One / Deep Research pin store — purely local mock here, consistent with the rest of Cohort Hub mock content.
- Persisting pins across reloads.

## Technical notes
- Implemented inline in `CohortHub.tsx`; small `PinnedRow` helper component co-located in the file (similar to other inline pieces).
- No business-logic or hook changes.

# Track row → 3-card paged carousel

You asked back in the earlier message to make this row a "3-card section with a next button" so it stays clean as more tracks are added. Today `JourneyTrackCards` is a 4-up grid, so 5 tracks wrap and leave one orphaned card (the "Other Enablers" card in your screenshot). Defaulting the choices we never closed on so I can ship this in one pass — call out anything you'd rather flip.

## Defaults I'm assuming

- **Layout:** Paged carousel — 3 cards per page on desktop, with prev/next chevrons and a tiny `1 / 2` page indicator. Clean and predictable, no horizontal scrollbar.
- **Behaviour:** The carousel **always pages so the active track is visible** (e.g. selecting Behavioural Skills auto-pages to it). Manual prev/next still works.
- **Mobile:** **1.2 cards visible** (current card + peek of next) with snap-scroll, so small screens hint there's more without needing tiny arrows.

If any of these defaults are wrong, tell me and I'll flip them — otherwise I'll ship as below.

## Implementation

### `src/components/learnpath/JourneyTrackCards.tsx` — rewrite the wrapper, keep the card

The per-card visual (states, eyebrow, progress bar, active-card elevation) stays exactly as it is today. Only the **container** changes from a grid to a paged row.

- Add `useState` for `page` and a `useMemo` slicing `tracks` into pages of 3.
- Compute `activePage = Math.floor(activeIndex / 3)` and a `useEffect` that calls `setPage(activePage)` whenever `activeCode` changes — so picking a track elsewhere auto-pages.
- Structure:

```text
┌──────────────────────────────────────────────────────────────┐
│  [card 1]   [card 2]   [card 3]                ‹  1/2  ›    │
└──────────────────────────────────────────────────────────────┘
```

- Desktop: `grid grid-cols-3 gap-3` for the visible slice. Prev/Next are small `h-8 w-8` icon buttons (`ChevronLeft`/`ChevronRight` from `lucide-react`), disabled when at first/last page. Centered dot or `1 / 2` text indicator between them.
- Mobile (`sm:` and below): replace the paged grid with a `flex overflow-x-auto snap-x snap-mandatory` row, each card `basis-[82%] shrink-0 snap-start` so 1.2 cards show. Hide the chevrons under `sm:flex`.
- Wrap the visible page in the existing `StaggerList`/`StaggerItem` primitives so cards animate in on page change (keyed by `page` so re-mount triggers stagger). Respects the global `reduceMotion` toggle automatically.
- Keep the existing `onSelect(code)` click handler on each card untouched.

### No other files change

- `EmbarkJourneyView.tsx` still renders `<JourneyTrackCards tracks={…} activeCode={…} onSelect={…} />` — same interface.
- Data hooks, sequencing, module accordion, page header — all untouched.

## Out of scope

- No changes to per-card visual treatment, eyebrow labels, status colors, or selection logic.
- No changes to module accordion below.
- No alternative layouts (focus rail / snap-scroll on desktop) unless you flip the default.

## Files touched

- `src/components/learnpath/JourneyTrackCards.tsx` (only)

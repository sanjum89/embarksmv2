## Context — what each screenshot maps to

- **Image 1** → `src/components/learnpath/JourneyTrackCards.tsx` (rendered at `/` inside `EmbarkJourneyView`).
- **Image 2** → `src/pages/CohortHub.tsx` — "Pinned answers" block was wrongly added under "Recommended actions". Correct home is `src/components/deep-research/DeepResearchWorkspace.tsx`, where a prior request asked me to move pinned to the **left** column.
- **Image 3** → Achievements card in `src/pages/CohortHub.tsx` (16 items, 6 per page → 3 pages, huge empty area below the grid).
- **Image 4** → "Same topic" vs "Peer match" pills in `src/components/cohort/PeopleToConnect.tsx`.

---

## 1. Journey track cards — side rails as page-nav (horizontal paging preserved)

File: `src/components/learnpath/JourneyTrackCards.tsx`

Paging stays **horizontal** (left ↔ right between pages). What changes is *where* the controls live: instead of a bottom-right pager strip, surface them as thin vertical rails attached to the cards row.

Layout: a single flex row `[leftRail?] [3-up grid] [rightRail?]`, items stretched to equal height.

- **Right rail** = a narrow vertical card (~`w-9`, `h-full`, rounded, same border/bg as today's pager button) containing a centered `ChevronRight` button. Rendered only when `safePage < totalPages - 1` (i.e. there are pages to the right). Click → `setPage(p+1)`.
- **Left rail** = mirror, with `ChevronLeft`. Rendered only when `safePage > 0` (pages to the left).
- On page 1 of N: only right rail visible. On a middle page: both rails visible. On last page: only left rail. On a single-page journey: no rails, grid spans the full row as today.
- The grid itself stays `grid grid-cols-3 gap-3` so each card keeps its current width; the rails sit outside the grid in the flex parent. Total cards visible per page stays 3.

Remove the existing bottom pager row (the `mt-3 flex … justify-end` block with prev/next + `n/total`). The `n / total` indicator is dropped — the asymmetric presence of the rails communicates position.

Equal-height cards (so 2-line titles like "Certification and Professional Standards" don't make the row jagged):
- Add `items-stretch` to the grid, `h-full` to each `StaggerItem`.
- On `TrackCard` `<h3>`, add `min-h-[2.6em]` so single-line titles reserve a second line's worth of space.

Active-card eyebrow visibility (the dark navy card hiding "In focus" / "Completed"):
- Change the eyebrow text on active state to `text-primary-foreground/80` (currently `text-accent`, which can wash out on the navy fill).
- For the completed check chip on an active card, swap to `bg-primary-foreground/15 text-primary-foreground`.

Mobile (snap-scroll row) is unchanged.

## 2. Remove pinned from CohortHub, move to left side of Deep Research

File: `src/pages/CohortHub.tsx`
- Delete the "Pinned answers" block inside the Recommended-actions card (the `mt-6 … border-t … pt-5` section), the `pinned` `useState`, and the `PinnedRow` reference. Also resolves the lingering `PinnedRow` TS error.

File: `src/components/deep-research/DeepResearchWorkspace.tsx`
- Change grid from `grid-cols-[280px_1fr_320px]` to `grid-cols-[300px_1fr]` (drop the right aside).
- In the left aside, add a third section below "Recent threads": "Pinned answers", reusing the existing `PinnedAnswerCard` component and the current `dr.pins / unpin / renamePin / setActiveThreadId` wiring.
- Order: Suggested research → Recent threads → Pinned answers.
- This single edit moves the pin panel everywhere `DeepResearchWorkspace` is used (learner chat, manager chat, dedicated Deep Research route), matching the prior decision to use the deep-research UI as the canonical chat surface.

## 3. Achievements — fit all in one card, only paginate when overflow

File: `src/pages/CohortHub.tsx`

- Render `data.achievements` in full (16 items as 6 rows of 3) — removes the wasted whitespace and the `1 / 3` pager.
- Keep the page-state code but gate it: when `data.achievements.length <= 18`, skip slicing and skip rendering the pager. Above that threshold, fall back to current paging behaviour.
- Keep the "Next: …" footer line, the hover-expand pill effect, and tier colours unchanged.

## 4. Peer-match vs Same-topic pill colours

File: `src/components/cohort/PeopleToConnect.tsx`

Existing pill conventions in the app:
- **Primary tint** → official / canonical content signals (used in `OnboardingNudge`, AI suggestion chips).
- **Accent (peach on Rathbones)** → AI-suggested / opportunity items; reused heavily across the page (status banner CTA, Pts pill).
- **Emerald** → people / human-connection signals (mentor eyebrow in CohortHub, online-presence dot).
- **Sky/Indigo (silver tier)** → cohort-grouping signals (Achievements `silver`).

Proposed mapping:
- **Same topic** → keep **primary** (`border-primary/30 bg-primary/10 text-primary`, `Sparkles` icon). "Same topic" is a content/curriculum signal, so the canonical primary tint fits.
- **Peer match** → switch from accent (peach) to **emerald** (`border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300`, `UserPlus` icon). Why:
  1. Emerald is already the app's "people / human connection" colour (mentor eyebrow, online dot). A peer match is the same semantic family — reusing emerald keeps the people-signal language consistent across the page.
  2. It separates strongly from the primary navy chip and from the warm accent peach used elsewhere on the page, removing the current visual clash where both pills read as "warm tint".
  3. Emerald is theme-safe — fixed Tailwind hue, not derived from brand accent, so it stays differentiated on any white-labelled palette (Rathbones, Pinnacle, etc.).

No other pill instances need touching.

---

## Out of scope

- No changes to data hooks, cohort routing, or backend.
- No changes to the chat composer or thread persistence — only column layout in `DeepResearchWorkspace`.
- `ManagerCohortHub` doesn't render any of these blocks, no edits needed there.

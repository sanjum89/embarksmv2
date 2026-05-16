# Tour highlight & visibility fixes

## Problem

1. **Lens steps (Condensed, Quick Diagnostic, Evidence Task) blur the entire screen.** Their targets (`[data-tour="lens-condensed"]` etc.) live on chapter-row badges inside a Module accordion that is **collapsed** when the tour starts. The selector misses → the popover falls back to a centered modal with a full backdrop blur, so users see nothing of what's being described.
2. **Even when a target is found, the highlight is too subtle** — just a thin ring. New users can't tell what's being pointed at.
3. **No directional cue** linking the popover to its target.

## Fix

### 1. Guarantee the target is visible before each step

Extend `TourStep` with an optional `prepare?: () => void | Promise<void>` hook. In `EmbarkTour`, await `prepare()` before searching for the target. For the three lens steps, `prepare` will:

- Expand the first Module accordion in the active Track (dispatch a custom event, e.g. `embark:tour-open-first-module`, that `JourneyModuleAccordion` listens for and opens its first item).
- After the DOM updates, `scrollIntoView({ block: "center", behavior: "smooth" })` on the matched lens pill.

Also raise `useTargetRect`'s retry budget from ~500ms to ~1.5s so the row has time to mount, and re-poll the rect for a few frames after match (the row animates in).

### 2. Stronger, more elegant spotlight

Replace the current ring with a layered treatment in `EmbarkTour`:

- Soft animated **glow halo** around the cutout: `box-shadow: 0 0 0 6px hsl(var(--accent)/.35), 0 0 32px 8px hsl(var(--accent)/.45)` with a gentle pulse (`@keyframes` 1.6s ease-in-out, respecting `prefers-reduced-motion`).
- Crisp 2px accent ring on the inner edge.
- Slightly increased `SPOTLIGHT_PAD` (8 → 10) and a 12px border-radius for friendlier framing.
- Backdrop opacity bumped from `bg-background/70` to `/82` for stronger contrast outside the spotlight.

### 3. Connector pointing from popover → target

Render a small **caret/arrow** on the popover edge facing the target (computed from the chosen placement) — a 12px rotated square with the same border/background as the card. When there's no target (intro/wrap steps), suppress the caret and keep the centered modal as today, but reduce the full-screen blur (`/60` instead of `/80`) so the page is still recognizable behind the card.

### 4. Centered-modal fallback fix for missing targets

If after `prepare()` + retries the selector still isn't found, **don't** fall back to a fully blurred screen. Instead:

- Dim only with a translucent vignette (no blur), and
- Show a banner-style card anchored to the top-center with text "Look for the **Condensed** badge on chapters in any Module" so the user has a visual cue to scan for.

This makes the lens steps still useful if a learner's Module legitimately has no Condensed pill.

## Files to touch

- `src/components/tour/tourSteps.ts` — add `prepare` field; wire it for `adapt-condensed`, `adapt-diagnostic`, `adapt-evidence`.
- `src/components/tour/EmbarkTour.tsx` — await `prepare`, longer retry, scroll-into-view, glow + caret rendering, vignette fallback.
- `src/components/learnpath/JourneyModuleAccordion.tsx` — listen for `embark:tour-open-first-module` and open its first accordion item.
- `src/index.css` — add `@keyframes tour-pulse` (reduced-motion safe).

## Out of scope

Tour content/wording, step order, login/auth flow (already fixed), other pages' targets (which already have valid selectors).

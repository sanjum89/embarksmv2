# Deep Research — Premium AI feel

Goal: make Deep Research feel like a real research engine working in the background, not a pre-baked lookup. Two layers: (1) a richer "thinking" experience while the answer is being built, and (2) progressive reveal of the answer instead of an instant pop-in.

## 1. Multi-stage "thinking" status

Replace the single `isStreaming` boolean with a `thinkingStage` state in `useDeepResearch.ts`:

```text
planning  → "Planning research approach…"
retrieving → "Pulling cohort, learner & evidence signals…"
analysing → "Cross-referencing modules, proficiency & risk…"
drafting  → "Drafting executive summary…"
finalising → "Composing visuals & recommended actions…"
```

Stages cycle on a timer (≈900–1400 ms each, slightly randomised) for showcase responses (total ~4–5 s) and run in parallel with the live edge-function call for non-showcase. The hook exposes `{ isStreaming, thinkingStage, thinkingTrace[] }`.

In `DeepResearch.tsx` the existing `Loader2` row becomes a richer "ThinkingPanel":
- Animated pulsing dot + Microscope icon
- Current stage label (fades/slides in as it changes)
- Small grey "trace" lines accumulating above (each prior stage shown as a checked step)
- A subtle indeterminate progress bar across the top of the conversation area

Component: `src/components/deep-research/ThinkingPanel.tsx` (new). Uses existing tokens + tailwind `animate-fade-in`, `animate-pulse`, plus a small custom shimmer keyframe added to `tailwind.config.ts`.

## 2. Progressive answer reveal

Today `ResponseEnvelopeView` renders the whole envelope at once. Change it to reveal sections in order with a short stagger:

1. Executive summary (fades + slides in, 0 ms)
2. Visuals one-by-one (150 ms apart, scale-in 0.98→1)
3. Evidence table (fade-in)
4. Recommended actions (chips fade-in 60 ms each)
5. Follow-ups (fade-in)

Implementation: a small `useStagedReveal(count, stepMs)` hook returning an array of booleans, used to gate `opacity-0 translate-y-1` → `opacity-100 translate-y-0 transition-all duration-300`. Skipped entirely when `readOnly` (pinned dashboard renders instantly).

Add a 250–400 ms "settling" delay between thinking finishing and the assistant message appearing, so the transition from spinner → answer feels intentional.

## 3. Composer & input micro-interactions

- Submit button: while streaming, swap to a small animated "thinking" pill ("Researching…") instead of just a spinner.
- Disable starter cards while streaming; on hover add a subtle lift (`hover:-translate-y-0.5 transition-transform`).
- User message bubble: animate-fade-in on mount.
- Pin button in answer header: subtle scale on click; toast already exists.

## 4. Scope guardrails

- Frontend / presentation only. No envelope schema changes, no edge-function changes, no DB.
- All timings tunable via constants at the top of `useDeepResearch.ts` and `ResponseEnvelopeView.tsx` so we can dial it back if it feels slow.
- Respect `prefers-reduced-motion`: if set, skip stagger and just fade once.

## Files

- edit `src/hooks/useDeepResearch.ts` — add `thinkingStage`, staged timing, settling delay
- new  `src/components/deep-research/ThinkingPanel.tsx`
- new  `src/hooks/useStagedReveal.ts`
- edit `src/components/deep-research/ResponseEnvelopeView.tsx` — staged reveal wrapper
- edit `src/components/deep-research/StarterCards.tsx` — hover lift, disabled state during streaming
- edit `src/pages/DeepResearch.tsx` — render `ThinkingPanel`, pass `isStreaming` into starters, animate user bubbles
- edit `tailwind.config.ts` — add `shimmer` keyframe + animation utility

## Acceptance

- Asking a starter shows 4–5 distinct stage labels over ~4 s with a visible progress shimmer.
- Answer sections appear in sequence, not all at once.
- Reduced-motion users see a single clean fade with no stagger.
- Pinned dashboard renders pinned answers instantly (no re-stagger).

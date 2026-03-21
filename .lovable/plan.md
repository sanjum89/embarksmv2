

## Plan: Declutter Agent One Bottom Area

### Problem
The nudge strip, suggestion pills, and input bar are stacked vertically taking up too much space — the bottom half of the chat feels cramped, especially on smaller panels.

### Changes

**1. Make OnboardingNudge ultra-compact — single horizontal row**

Redesign `src/components/chat/OnboardingNudge.tsx`:
- Default (not dismissed): Single row layout — icon + title + inline mini progress bar + CTA button, all on one line. No stacked layout, no separate CTA row. Think: `[📚 Introduction to Rathbones ████░░ 1/3  Continue →]`
- Height: ~32px instead of current ~80px
- Remove the large padded card wrapper, use a slim divider-style strip with a subtle top border only
- Dismissed: stays as the small pill (already compact)
- Assessment variant: same single row `[📋 Skills Assessment — Helps customise path  Take Assessment]`

**2. Tighten suggestion pills spacing**

In `src/components/chat/AIChatWrapper.tsx`:
- Reduce padding: `px-4 pt-2` → `px-3 pt-1.5`
- Reduce pill gap: `gap-1.5` → `gap-1`
- Limit to max 3 visible pills (truncate with "+N" if more) to prevent wrapping to multiple rows
- Remove the gradient overlay div (saves 24px of visual space)

**3. Reduce input bar padding**

In `src/components/chat/AIChatWrapper.tsx`:
- Input wrapper: `px-4 pb-4 pt-2` → `px-3 pb-3 pt-1.5`
- Remove border-t (the nudge/pills already visually separate); or keep as very subtle `border-border/30`

**4. Combine nudge + pills into one visual zone**

- Remove margin between nudge and pills — they share a single compact footer zone
- Nudge sits directly above pills with no gap, both above input

### Files changed

| File | Change |
|------|--------|
| `src/components/chat/OnboardingNudge.tsx` | Redesign to single-row compact strip (~32px) |
| `src/components/chat/AIChatWrapper.tsx` | Tighten pills spacing, limit to 3 pills, reduce input padding, remove gradient overlay |


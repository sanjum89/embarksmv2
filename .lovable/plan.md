

## Subtle Correct-Answer Hints in Assessment UI

### Approach

Add very subtle visual cues to the correct answer option — things a user would notice subconsciously but wouldn't feel like cheating. Techniques:

1. **Slightly longer option text** — already naturally the case for most correct answers (they tend to be more detailed/nuanced)
2. **Subtle font-weight or letter-spacing difference** — too obvious if overdone
3. **A tiny "recommended" or contextual micro-hint** — breaks immersion

**Best approach**: Make the correct answer option very slightly visually distinct through a combination of:
- A barely-perceptible warmer/softer border tint on hover (e.g., `hover:border-accent/50` vs `hover:border-accent/40` for others)
- The correct option gets a subtle `shadow-sm` on hover while others don't
- Correct answer option text uses `text-foreground` while wrong answers use a very slightly muted tone like `text-foreground/90`

This keeps it genuinely subtle — users who pay attention will gravitate toward the right answer without it being obvious.

### Changes in `src/pages/AssessmentPage.tsx`

In the question options rendering (lines 357-378), add a subtle visual distinction for the correct answer:

- Correct answer gets slightly enhanced hover: `hover:border-accent/50 hover:shadow-sm` and full `text-foreground`
- Wrong answers get: `hover:border-accent/30` and `text-foreground/85` (very slightly muted)
- The letter badge for the correct answer gets a slightly warmer secondary bg: `bg-secondary/80` vs `bg-secondary/60` for others

These differences are small enough that users won't consciously notice a pattern, but the correct answer will "feel" slightly more inviting.

### Files Modified

| File | Change |
|---|---|
| `src/pages/AssessmentPage.tsx` | Add subtle visual distinction to correct answer options via hover styles and micro text opacity differences |




## Make Correct Answer Label Slightly Darker

Subtle change across all 3 assessment components: the A/B/C/D letter badge for the correct answer gets a slightly darker text color compared to wrong answers (before selection/submission).

### Changes

**1. `src/pages/AssessmentPage.tsx` (line 376)**
- Correct answer badge: change `text-muted-foreground` → `text-foreground/70` (slightly darker)
- Wrong answer badge: keep `text-muted-foreground` (unchanged at `bg-secondary/60`)

**2. `src/components/ai-manager/AssessmentCard.tsx`**
- This component doesn't use letter badges (A/B/C/D) — no change needed.

**3. `src/components/chat/InlineAssessment.tsx` (line 318)**
- Before feedback, correct answer badge: change `text-muted-foreground` → `text-foreground/70`
- Wrong answer badges remain `text-muted-foreground`

### Files Modified

| File | Change |
|---|---|
| `src/pages/AssessmentPage.tsx` | Correct answer letter badge text slightly darker |
| `src/components/chat/InlineAssessment.tsx` | Correct answer letter badge text slightly darker |


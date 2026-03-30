

## Subtly Highlight Correct Answers in All Assessments

Make the correct answer option text slightly bolder (`font-medium`, ~500 weight) compared to other options (which use default `font-normal`, ~400 weight) across all 5 assessment components. This is a subtle visual hint for demo purposes only --- visible before submission, not after.

### Files to modify

| File | Change |
|---|---|
| `src/pages/AssessmentPage.tsx` (~line 375) | Add `font-medium` to option text when `i === question.correctIndex`, keep others at normal weight |
| `src/components/skill-target/TraditionalContentViewer.tsx` (~line 316) | Same: conditionally apply `font-medium` to correct option text |
| `src/components/chat/AssessmentModal.tsx` (~line 175) | Same pattern on option text span |
| `src/components/chat/InlineAssessment.tsx` (~line 324) | Add `font-medium` to the `<span>` wrapping `{opt}` when `isCorrect` |
| `src/components/ai-manager/AssessmentCard.tsx` (~line 71) | Add `font-medium` to correct option text via `oi === q.correct` check |

### Implementation detail

In each option rendering, wrap or conditionally class the option text:
```tsx
<span className={cn("leading-snug", i === question.correctIndex && "font-medium")}>
  {option}
</span>
```

Other options remain at default weight. The difference between `font-normal` (400) and `font-medium` (500) is subtle enough for a demo hint without being obvious.


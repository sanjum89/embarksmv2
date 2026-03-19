

## Problem

The `railPalette` function currently colors each segment based on the entry *below* it. This means:
- The segment from **Mar → Feb** gets Feb's color (Yellow) — should be Orange
- The segment from **Feb → Jan** gets Jan's color (Green) — should be Yellow
- The segment from **Jan → 2025** gets 2025's color (Green) — correct

The desired behavior: each rail segment should use the color of the entry *above* it (the current entry), since the segment visually connects downward from that entry.

## Fix

Change `railPalette` to return the color of the current entry (`careerEntries[i]`) instead of the next one (`careerEntries[i + 1]`):

```typescript
const railPalette = (i: number) => {
  return palette(careerEntries[i]);
};
```

This gives:
- **Mar segment** (Mar → Feb): Orange
- **Feb segment** (Feb → Jan): Yellow  
- **Jan segment and below**: Green

Single line change in `src/components/my360/CareerTimeline.tsx`.


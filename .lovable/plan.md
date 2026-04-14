

## Align Embark AI Header Border with Sidebar and Content Panel

### Problem
The "Embark AI" chat header border sits higher than the sidebar brand section border and the content panel title border. The sidebar brand area is taller because it contains the AccountSwitcher (logo + org name + chevron), while the chat header only has a small icon + text with the same `py-4` padding.

### Fix

**`src/components/learnpath/LearnPathChat.tsx`** (line 475)
- Change the chat header from `py-4` to `py-[18px]` (or use a fixed `min-h-[60px]` with flex centering) to match the actual rendered height of the sidebar brand section
- This ensures the `border-b` of the Embark AI header aligns horizontally with the sidebar's `border-b` and the content panel's top bar `border-b`

**`src/components/learnpath/LearnPathModeSelector.tsx`** (line 24)
- Apply the same padding adjustment to the content panel's top bar div so all three borders remain aligned

### Technical Detail
The sidebar brand section renders at ~60px tall (py-4 = 32px padding + h-8 logo + py-1.5 inner button). The chat and content headers with just `py-4` render at ~52px. Increasing vertical padding on the chat and content headers by ~4px each side will close the gap.


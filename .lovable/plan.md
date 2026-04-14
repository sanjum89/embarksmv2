

## Align Header Borders Across All Three Panels

### Problem
The sidebar's brand section border, the Embark AI chat header border, and the content panel's top bar border don't align horizontally. Additionally, the content panel needs a separate border between the title row and the "Viewing in:" mode selector row.

### Current Layout
- **Sidebar**: Brand section has `px-4 py-4` with `border-b`
- **Chat panel**: Header has `px-4 py-3` with `border-b`
- **Content panel**: Single `border-b` wraps both the title row (`py-3`) and the mode selector row — no dividing line between them

### Changes

**1. `src/components/learnpath/LearnPathChat.tsx`** (line 475)
- Change header padding from `py-3` to `py-4` to match sidebar height

**2. `src/components/learnpath/LearnPathModeSelector.tsx`** (lines 22-37)
- Add `border-b border-border` to the top bar div (title + "All Modules" button) so it becomes its own separated row
- Change that top bar's padding from `py-3` to `py-4` to match sidebar and chat header heights
- The outer wrapper div keeps its own `border-b` below the "Viewing in:" row

This creates three aligned horizontal borders:
```text
┌──────────┬──────────────┬─────────────────────┐
│ Org Icon │  Embark AI   │  Module Title        │
│──────────│──────────────│─────────────────────│  ← all three borders align
│          │              │  Viewing in: [pills] │
│          │              │─────────────────────│  ← new border below mode selector
```




# Fix Broken Scrolling on All Pages

## Problem
The recent `overflow-hidden` fix on `AppLayout` broke scrolling everywhere. The inner content wrapper uses `h-screen` instead of `h-full`, making it taller than its parent container. Combined with `overflow-hidden`, content gets clipped at the bottom with no way to scroll.

## Change

### `src/components/layout/AppLayout.tsx`
Change the inner div from `h-screen` / `h-[calc(100vh-3.5rem)]` to `h-full` with `overflow-auto`. This lets it fill the available space correctly and enables scrolling within it.

```tsx
// Before
<div className={cn("flex-1 flex flex-col", isTraditional ? "h-[calc(100vh-3.5rem)]" : "h-screen")}>

// After  
<div className="flex-1 flex flex-col min-h-0 overflow-auto">
```

The `min-h-0` is critical — it allows the flex child to shrink below its content size, enabling overflow to work. The `overflow-auto` lets pages that don't manage their own scroll (like Dashboard) scroll naturally, while pages that do (like SkillTargetDetail with `overflow-hidden`) will override it.

**1 file changed.**


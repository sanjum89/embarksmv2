

# Fix: Brand Theme Not Fully Applying to Buttons

## Problem
The `gradient-accent` CSS utility in `index.css` has a **hardcoded amber** gradient stop (`hsl(38 92% 60%)`), so buttons using this class always look yellowish regardless of the selected theme. Similarly, `gradient-primary` has a hardcoded navy stop.

## Root Cause
```css
/* index.css — hardcoded colors ignore theme overrides */
.gradient-accent {
  background: linear-gradient(135deg, hsl(var(--accent)), hsl(38 92% 60%));
}
.gradient-primary {
  background: linear-gradient(135deg, hsl(var(--primary)), hsl(222 60% 30%));
}
```

These are used across ~15+ files for buttons, avatars, progress bars, and send buttons.

## Fix

### File: `src/index.css`
Replace hardcoded gradient stops with CSS variable-derived lighter/darker variants:

```css
.gradient-accent {
  background: linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent) / 0.8));
}
.gradient-primary {
  background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8));
}
```

This ensures gradients always follow the active theme's accent/primary colors.

### File: `src/hooks/useBrandColors.ts`
Also override `--warning` to match the accent color so warning badges align with the brand:
```ts
"--warning": accent,
"--warning-foreground": `${pH} 60% 12%`,
```

| File | Change |
|------|--------|
| `src/index.css` | Replace hardcoded gradient stops with CSS variable references |
| `src/hooks/useBrandColors.ts` | Add `--warning` override to match brand accent |


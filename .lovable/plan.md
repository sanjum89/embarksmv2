

## Plan: Make Default & Rathbones Themes as Pervasive as Teal & Coral

### Root Cause

Two issues make Default (Navy & Amber) and Rathbones feel less "themed" than Teal & Coral:

1. **Rathbones accent is too light** — `22 75% 81%` (pale peach, 81% lightness). When used as `--accent` for buttons, tabs, hover states, it's nearly invisible on white backgrounds. Teal & Coral works because its accent is `12 80% 55%` — vibrant and visible.

2. **Theme doesn't touch enough CSS variables** — `deriveThemeVars` only sets ~15 vars. It doesn't brand `--secondary`, `--muted`, `--border`, `--input`, or surface tokens. So cards, backgrounds, and borders remain neutral gray regardless of theme. The "NON_SIDEBAR_VARS" filter also excludes `--warning` and `--warning-foreground` from being applied.

### Changes

**1. Adjust Rathbones preset accent** (`src/hooks/useBrandColors.ts`)

Change accent from `22 75% 81%` (barely visible peach) to `22 70% 55%` (warm terracotta — visible on white, still distinctly Rathbones). Update swatch accordingly.

**2. Expand `deriveThemeVars` to set more variables** (`src/hooks/useBrandColors.ts`)

Add these derived variables so the brand permeates the full page:
- `--secondary`: `{primaryHue} 15% 93%` (subtly tinted neutral)
- `--secondary-foreground`: `{primaryHue} 40% 11%`
- `--muted`: `{primaryHue} 15% 93%`
- `--muted-foreground`: `{primaryHue} 10% 46%`
- `--border`: `{primaryHue} 15% 88%`
- `--input`: `{primaryHue} 15% 88%`
- `--surface-raised`: keep as-is (white)
- `--surface-sunken`: `{primaryHue} 15% 95%`

This tints all neutral surfaces (card borders, muted backgrounds, input borders, secondary buttons) with the brand hue — same way Teal & Coral naturally does because its teal hue is visually distinct from the default navy.

**3. Add missing vars to NON_SIDEBAR_VARS filter** (`src/hooks/useBrandColors.ts`)

Add `--warning`, `--warning-foreground`, `--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`, `--border`, `--input`, `--surface-sunken` to the `NON_SIDEBAR_VARS` array so they're always applied regardless of super-light mode.

**4. Handle light accents with a "vibrant accent" fallback** (`src/hooks/useBrandColors.ts`)

In `deriveThemeVars`, if accent lightness > 65%, produce a darkened version (reduce lightness to ~50%) for `--accent` used on interactive elements. Store original light accent for decorative sidebar uses only. This ensures any theme with a pastel accent still produces visible buttons/tabs.

### Files changed

| File | Change |
|------|--------|
| `src/hooks/useBrandColors.ts` | Adjust Rathbones preset, expand `deriveThemeVars` with secondary/muted/border/input vars, fix NON_SIDEBAR_VARS filter, add light-accent darkening logic |


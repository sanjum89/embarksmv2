

## Fix Dark Mode Readability with Brand Themes

### Problem
When a brand theme (e.g. Rathbones) is applied, `useBrandColors` sets CSS variables like `--primary`, `--secondary`, `--muted`, `--border` to values designed for light mode (very dark primary, light tinted surfaces). In dark mode, these same values create dark-on-dark combinations — dark navy text on dark backgrounds, dark borders invisible against dark cards — making the UI unreadable.

### Root Cause
`deriveThemeVars()` produces a single set of values with no awareness of light vs dark mode. The `useEffect` in `useBrandColors` applies them unconditionally to non-sidebar vars regardless of `theme`.

### Solution
Add a `deriveDarkThemeVars()` function that inverts the logic for dark mode: light foregrounds, dark but distinguishable surface colors tinted with the brand hue, and properly contrasted interactive elements. Then in the `useEffect`, choose the correct derivation based on `theme`.

### Changes

**`src/hooks/useBrandColors.ts`**
1. Add a new `deriveDarkThemeVars(primary, accent, sidebar)` function that produces dark-mode-appropriate values:
   - `--primary` and `--accent`: Use lighter versions of the brand colors so interactive elements are visible against dark backgrounds
   - `--primary-foreground` / `--accent-foreground`: Dark text for contrast on light interactive elements
   - `--secondary`, `--muted`: Dark surfaces tinted with the brand hue (e.g. `${pH} 30% 14%`)
   - `--border`, `--input`: Slightly lighter dark surfaces (e.g. `${pH} 25% 18%`)
   - `--muted-foreground`: Light enough to read (e.g. `${pH} 15% 55%`)
   - Sidebar vars: Dark backgrounds with the brand hue, light foregrounds
2. In the `useEffect`, when `theme === "dark"`, call `deriveDarkThemeVars` instead of `deriveThemeVars`
3. Handle the "Primary-as-Interactive" path for dark mode as well (Rathbones uses this since accent lightness > 75%)

### Key dark-mode derivation logic (Rathbones example):
```
primary input: 230 75% 15%  →  dark-mode primary: 230 60% 55% (lighter, visible)
accent input:  12 55% 85%   →  dark-mode surfaces: 12 20% 12% (warm-tinted dark)
--background stays from CSS .dark block
--secondary: 230 25% 14%
--border: 230 20% 20%
--muted-foreground: 230 10% 55%
```

This ensures brand identity is maintained (hue tinting) while keeping proper contrast ratios for dark backgrounds.


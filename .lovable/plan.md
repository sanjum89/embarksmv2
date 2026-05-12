## Goal
Add a more vibrant Rathbones theme variant alongside the current calm one, switchable from the existing Branding dialog so the user can flip back, and so additional Rathbones variants can be added later without touching consuming components.

The current calm Rathbones (deep navy + soft peach) and the new vibrant Rathbones become **two named modes inside one "Rathbones modes" group** in the existing preset picker.

---

## What "vibrant" means here

Brand identity stays intact:
- **Primary** stays deep Rathbones navy `230 75% 15%`.
- **Sidebar** stays navy.
- **Logos** unchanged (existing white + dark navy already in storage).

Vibrancy is injected via the **accent** channel, which the theme system already propagates to badges, focus rings, the `bg-gradient-primary` hero gradient, chips, progress strokes and CTA highlights:
- Replace muted peach `12 55% 85%` with a saturated Rathbones peach/coral around `14 88% 58%` — below the 65% lightness threshold so `deriveThemeVars` takes the "standard" branch and produces a punchy `--accent` plus a warm `--secondary`/`--muted` family tinted toward the accent hue.

Hero gradients, toggle pills, AI Decisions chips, the Sankey legend, focus rings, etc. gain a coral pop while navigation and primary surfaces stay unmistakably Rathbones.

---

## Mode rules — must be respected

The existing `useBrandColors` hook already branches on `theme` (light/dark) and `superLight` (white-sidebar variant). The new preset must obey the same rules; no theme-mode logic is duplicated or bypassed.

**Light mode**
- Navy `--primary` on light surfaces; coral `--accent` derived via `deriveThemeVars`.
- Sidebar uses the dark navy variant — derived sidebar vars applied as today.

**Dark mode**
- `deriveDarkThemeVars` lightens both navy primary and coral accent for legibility on the dark canvas. Coral lifts to ~`14 88% 62%`-ish via the existing formula — no extra code, just hand it the same input and let the existing dark-mode derivation run.
- Sidebar background uses the existing `${pH} 35% 10%` formula → consistent dark sidebar.

**Super Light mode**
- Sidebar background stays white; per existing rule, only `--sidebar-primary` (and its foreground/active highlight) get coloured from the brand. The new preset routes through the same super-light branch — sidebar surface is **not** repainted with navy or coral.
- Active nav icons render in navy primary; hover/active row uses the existing `${pH} 40% 95%` light tint — keeping super-light's airy feel intact while the rest of the page picks up coral accents.

No new branches are added to the hook. The new preset is data-only; all mode handling reuses the current code paths so behaviour stays identical to the existing Rathbones preset across Light / Dark / Super Light.

---

## Implementation

**File: `src/hooks/useBrandColors.ts`**

1. Rename the existing `"rathbones"` entry to `"rathbones-calm"` (same values, label "Rathbones — Calm").
2. Add a new entry:
   ```ts
   "rathbones-vibrant": {
     label: "Rathbones — Vibrant",
     primary: "230 75% 15%",
     accent: "14 88% 58%",
     sidebar: "230 60% 13%",
     swatch: ["hsl(230, 75%, 15%)", "hsl(14, 88%, 58%)"],
     family: "rathbones",
   }
   ```
   Mark `rathbones-calm` with `family: "rathbones"` too. All other presets get `family: "generic"` (or omit).
3. Keep back-compat: if a row stores `preset: "rathbones"` it should resolve to `rathbones-calm` (alias map at lookup time).

**File: `src/components/account/BrandingPanel.tsx`**

1. Split the preset grid into two labelled sections:
   - **"Rathbones modes"** — presets with `family === "rathbones"` (Calm, Vibrant). Adding `rathbones-editorial`, `rathbones-mono`, etc. later is a one-line addition to the preset map.
   - **"Other palettes"** — the existing generic presets.
2. Active-preset detection already reads `config.preset`; only change is to treat `"rathbones"` as `"rathbones-calm"` for the checkmark state.
3. Toast copy uses each preset's `label`.

**Out of scope**
- No changes to logo storage, theme/super-light toggling logic, sidebar geometry, or any consuming component.
- No new DB columns — uses the existing `accounts.accent_color` JSON.
- No edits to Sankey, Roster, AI Decisions, or any feature surface.

---

## Files touched
- `src/hooks/useBrandColors.ts` — new preset + `family` field + back-compat alias
- `src/components/account/BrandingPanel.tsx` — group presets into "Rathbones modes" / "Other palettes"

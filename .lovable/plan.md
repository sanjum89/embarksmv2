## Remove "Rathbones — Vibrant" preset and lock Rathbones account to Calm

The vibrant preset only swapped the peach accent for a more saturated orange — visually noisy without a real benefit, and it created two near-identical "Rathbones modes" tiles in the Branding panel. The Rathbones account in the database is already on `rathbones-calm`; we'll make that the only Rathbones option and enforce it for the Rathbones account.

### 1. Drop the vibrant preset

`src/hooks/useBrandColors.ts`
- Remove the `"rathbones-vibrant"` entry from `COLOR_PRESETS`.
- Add a back-compat mapping in `PRESET_ALIASES`: `"rathbones-vibrant": "rathbones-calm"` so any legacy stored value still resolves.

### 2. Simplify the Branding panel UI

`src/components/account/BrandingPanel.tsx`
- The "Rathbones modes" section now has a single tile. Relabel it to **"Rathbones theme"** and render as a single full-width tile (instead of a 3-col grid) with the swatch + "Rathbones — Calm" name. Keeps it visually deliberate rather than looking like a lone orphan.

### 3. Always default the Rathbones account to the Rathbones theme

`src/hooks/useBrandColors.ts` (inside `useBrandColors` effect)
- Detect the Rathbones account by name (case-insensitive `activeAccount.name === "Rathbones"`). If it's the Rathbones account and either:
  - `accent_color` is null/empty, **or**
  - parsing fails / config is missing fields,
  then synthesize the config from `COLOR_PRESETS["rathbones-calm"]` and apply it (without writing to the DB — purely a runtime guarantee so the brand never falls back to the generic shadcn defaults).

This means even after a "Reset to Default" or any future data wipe, opening Rathbones still renders the navy/peach Rathbones look.

### Out of scope
- Pinnacle Capital (white-label) keeps its own current branding state — not touching it.
- No DB migration; the existing Rathbones row is already on `rathbones-calm`.
- No changes to the dark-mode derivation, custom-color flow, or logo upload.

### Files
- **Edited**: `src/hooks/useBrandColors.ts`, `src/components/account/BrandingPanel.tsx`

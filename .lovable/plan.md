

# Apply Rathbones Brand Colors as Custom Theme

## Extracted Colors
From the Rathbones website:
- **Primary**: Deep navy blue `#0B1F5C` (the dominant dark blue background)
- **Accent**: Soft peach/salmon `#F2C4A8` (the "Let's talk" button and highlight sections)

## Change

### File: `src/hooks/useBrandColors.ts`
Add a new "Rathbones" preset to `COLOR_PRESETS`:

| Key | Value |
|-----|-------|
| Label | Rathbones |
| Primary HSL | ~230 75% 20% |
| Accent HSL | ~22 75% 81% |
| Sidebar HSL | ~230 75% 14% |
| Swatches | Deep navy, Peach |

This will automatically appear in the BrandingPanel as a 7th preset option. No other files need changes -- the existing `BrandingPanel.tsx` iterates over `COLOR_PRESETS` dynamically.




## Plan: Match Rathbones Theme to Actual Brand Colors

### The Rathbones Brand Palette (from website reference)
- **Primary**: Deep navy blue — `230 75% 15%`
- **Accent**: Soft peach/salmon pink — `12 55% 85%` (used for background tints, "Let's talk" button)
- **Buttons**: Navy blue with white text (primary used as interactive color)

### What Changes

The key difference from other themes: Rathbones uses its **primary** (navy) as the interactive/button color, while the **accent** (peach) is a soft background tint. Currently our system uses accent for interactive elements (tabs, buttons, active states). For Rathbones, those should use the navy primary instead.

**File: `src/hooks/useBrandColors.ts`**

1. **Update Rathbones preset values**:
   - `primary`: `230 75% 15%` (deeper navy, closer to actual)
   - `accent`: `12 55% 85%` (soft peach matching website)
   - `sidebar`: `230 75% 10%`

2. **Update `deriveThemeVars` to handle "primary-as-interactive" themes**:
   - When accent lightness is very high (>75%), the theme is "primary-interactive" — meaning buttons, tabs, and active states should use `--primary` instead of accent
   - Set `--accent` to the primary color (for interactive elements like tabs, buttons)
   - Set `--accent-foreground` to white (since navy is dark)
   - Use the light peach accent for surface tints: `--secondary`, `--muted`, `--surface-sunken` derived from the **accent hue** (peach) instead of primary hue
   - `--secondary`: `{accentHue} 40% 93%` (peach-tinted neutral)
   - `--surface-sunken`: `{accentHue} 40% 95%`
   - `--border` and `--input`: `{accentHue} 25% 88%` (subtle peach-tinted borders)
   - Sidebar primary also uses the navy primary

3. **For non-Rathbones themes** (accent lightness <= 75%): behavior stays exactly as-is — no regressions.

### Result
- Tabs, buttons, active nav icons, hover states: deep navy
- Card backgrounds, surface tints, secondary areas: soft peach warmth
- Sidebar: deep navy with white/light text
- Matches the actual Rathbones website aesthetic

| File | Change |
|------|--------|
| `src/hooks/useBrandColors.ts` | Update Rathbones preset colors; add "primary-as-interactive" logic in `deriveThemeVars` for very light accents (>75% lightness) |


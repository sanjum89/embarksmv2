

# Account Branding Configuration Panel

## What
Add a branding panel accessible from the sidebar that lets users:
1. Pick from 6 preset color schemes
2. Enter custom client colors (primary + accent hex values) to auto-generate a full theme
3. Upload/change the account logo

## Changes

### 1. Database: Create `logos` storage bucket
- SQL migration to create a public `logos` bucket with open read/write policies

### 2. Add `updateAccount` to AccountContext
**File: `src/contexts/AccountContext.tsx`**
- New method `updateAccount(id, { logo?, accent_color? })` — updates the `accounts` row and refreshes local state

### 3. Create `useBrandColors` hook
**File: `src/hooks/useBrandColors.ts`** (new)
- On active account change, reads `accent_color` (JSON string with HSL values)
- Applies CSS custom properties (`--primary`, `--accent`, `--sidebar-background`, `--ring`, etc.) to `:root`
- Restores defaults when switching to an account with no custom colors

### 4. Create BrandingPanel component
**File: `src/components/account/BrandingPanel.tsx`** (new)
- Opens as a dialog from the sidebar
- **Logo section**: Upload PNG/SVG, preview current logo, clear button
- **Preset section**: 6 clickable color swatches:
  - Navy & Amber (default), Teal & Coral, Purple & Gold, Forest & Amber, Slate & Blue, Charcoal & Red
- **Custom section**: Two hex color inputs (Primary Color, Accent Color) with color picker inputs. On "Apply", the system derives a full HSL theme (sidebar, foreground, ring, borders) from those two colors and saves it as a custom preset
- Saves to `accounts.accent_color` as JSON: `{"preset":"custom","primary":"H S% L%","accent":"H S% L%","sidebar":"H S% L%"}`

### 5. Add Branding button to sidebar
**File: `src/components/layout/AppSidebar.tsx`**
- Add a `Paintbrush` icon button in the sidebar footer area (near Theme toggle)
- Opens BrandingPanel dialog

### 6. Wire up `useBrandColors` in AppLayout
**File: `src/components/layout/AppLayout.tsx`**
- Call `useBrandColors()` so colors apply on every account switch

## Custom Color Logic
When a user enters two hex colors:
- Convert hex → HSL
- Primary color → `--primary`, `--ring`
- Accent color → `--accent`, `--sidebar-primary`
- Derive sidebar background by taking primary hue at 60% saturation, 16% lightness
- Derive foreground colors automatically (light on dark, dark on light)

## Files Summary
| File | Action |
|------|--------|
| SQL migration | Create `logos` storage bucket |
| `src/contexts/AccountContext.tsx` | Add `updateAccount` |
| `src/hooks/useBrandColors.ts` | New — apply CSS vars from account |
| `src/components/account/BrandingPanel.tsx` | New — presets + custom color inputs + logo upload |
| `src/components/layout/AppSidebar.tsx` | Add Branding button |
| `src/components/layout/AppLayout.tsx` | Wire `useBrandColors` hook |


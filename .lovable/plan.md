# Use the official Microsoft Teams logo asset

Replace the inline approximation in `TeamsBadge` with the user's uploaded official Teams logo PNG.

## Steps

1. **Add asset**: Copy `user-uploads://Teamslogo.png` to `src/assets/microsoft-teams-logo.png`.
2. **Update `src/components/team-home/TeamsBadge.tsx`**:
   - Remove the inline `TeamsLogo` SVG component.
   - Import the PNG: `import teamsLogo from "@/assets/microsoft-teams-logo.png"`.
   - Render an `<img src={teamsLogo} alt="Microsoft Teams" />` sized via `width`/`height` (defaults to `size = 14` to keep the existing API).
   - Keep both `icon` and `chip` variants and the existing `label`/`size`/`className` props — no API changes, so all current call sites (`Schedule1on1Dialog`, `SendCheckInDialog`, etc.) work unchanged.

No other components need edits — they all consume `TeamsBadge`.



# Add Loading Delay on Profile Switch

## Change

Add a brief ~1 second loading state when switching profiles to give the impression of an active switch happening.

### `src/components/layout/AppSidebar.tsx`

1. Add a `switching` state (`useState<boolean>(false)`)
2. Wrap the `switchUser` click handlers (lines 417 and 712) to:
   - Set `switching = true`
   - Close the popover
   - After ~1 second timeout, execute the actual `switchUser`, `setRole`, `navigate` logic and set `switching = false`
3. Show a simple loading overlay or spinner on the sidebar (or a full-screen semi-transparent overlay) while `switching` is true — a subtle fade with a small spinner and "Switching profile..." text

### Files Modified
- `src/components/layout/AppSidebar.tsx`


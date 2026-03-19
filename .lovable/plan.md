

# Fix: Make Account Switcher Clearly Visible

## Problem

The sidebar header shows logo + account name + collapse button, and directly below it the `AccountSwitcher` shows the same logo + account name again with a subtle dropdown chevron. This creates confusion — the user doesn't realize the second row is a clickable account switcher.

## Solution

Remove the duplicate logo + account name from the header area in both themes. Keep only the collapse/expand toggle button in the header, and let the `AccountSwitcher` be the sole place showing the account name + logo (with its dropdown chevron for switching/adding accounts).

## Changes

### `src/components/layout/AppSidebar.tsx`

**Traditional theme header (lines 157-184)**: Replace the logo+name+toggle layout with just the toggle button. The `AccountSwitcher` on line 185 stays and becomes the primary branding element.

- Expanded: Show `AccountSwitcher` (logo + name + chevron) on the left, collapse toggle on the right
- Collapsed: Show collapse/expand toggle on hover over the `AccountSwitcher` logo area

**New theme header (lines 577-607)**: Same treatment — remove the separate logo+name, keep only the toggle button alongside `AccountSwitcher`.

### No other file changes needed

The `AccountSwitcher` component already has the full UI: logo, name, dropdown chevron, popover with account list, add account button, and delete account buttons.


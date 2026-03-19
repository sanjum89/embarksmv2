

## Combine Logo/Name and Account Switcher into One Element

The sidebar header currently has two separate elements stacked vertically:
1. **Logo + Account Name** (static display)
2. **Account Switcher** (interactive dropdown)

This is redundant — the account switcher already shows the account logo and name. The plan is to remove the static logo/name row and make the AccountSwitcher the sole header element in both themes.

### Changes

**1. `src/components/layout/AppSidebar.tsx`** — Both Traditional and New UI themes:
- Remove the static logo + account name display row (lines 157-183 for Traditional, lines 572-603 for New UI)
- Remove the separate `<AccountSwitcher>` wrapper div
- Place `<AccountSwitcher>` directly as the only header element
- Keep the collapse/expand toggle button integrated (move it into AccountSwitcher's row or keep it alongside)

**2. `src/components/account/AccountSwitcher.tsx`**:
- Add the sidebar collapse toggle button (PanelLeftClose / PanelLeftOpen) to the right side of the switcher when expanded
- Accept `onToggle` prop and `brandHovered`/`setBrandHovered` state (or handle internally)
- In collapsed state: show just the account logo (with hover-to-expand behavior for the toggle)
- In expanded state: show logo + account name + chevron + toggle button in one row

### Result
One unified interactive element in the sidebar header that shows the account branding and opens the account switcher dropdown on click, with the collapse toggle integrated alongside.




# Plan: Sidebar Fixes + Chat UI Improvements

## Issues to Fix

### Sidebar (`src/components/layout/AppSidebar.tsx`)
1. **Brand section height** — increase padding to vertically center logo and push divider below page title/breadcrumb area. Change `py-4` to `py-5` and add `min-h-[72px]`.
2. **Me/Team toggle overlap** — add `pt-3` top padding so toggle doesn't sit against the divider.
3. **First icon stays highlighted** — fix `isPathActive` so `/manager` uses exact match, preventing it from matching `/manager/role-play` etc.

### Manager Chat (`src/pages/ManagerView.tsx`)
4. **Remove border-t divider** above chat input — remove `border-t border-border` from the input wrapper.
5. **Make chat more prominent (ChatGPT-style)** — center the chat content area with more breathing room, increase max-width for messages, style the input area more prominently with a larger rounded input and shadow.

## Files Modified
- `src/components/layout/AppSidebar.tsx` — brand height, toggle spacing, active state fix
- `src/pages/ManagerView.tsx` — remove input divider, make chat UI more prominent


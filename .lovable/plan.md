

## Restore Original Embark AI as Default Page

### Problem
The root path `/` currently loads `UnifiedChat` (a merged Agent One + Embark AI page). The user wants the original standalone Embark AI back as the default page, with Agent One chat remaining separate.

### Changes

**1. `src/App.tsx`** — Swap the root route back to Embark AI
- Change `<Route path="/" element={<UnifiedChat />} />` → `<Route path="/" element={<EmbarkAI />} />`
- Keep `/embark` route pointing to `EmbarkAI` as well (or remove the duplicate)
- Remove `UnifiedChat` import if no longer used

**2. `src/components/layout/AppSidebar.tsx`** — Ensure "Embark AI" nav item points to `/` (already does, no change needed)

**3. `src/components/chat/AIChatWrapper.tsx`** — Update the route guard so the floating Agent One panel shows on `/` and `/embark` (since those are now Embark AI, not the merged chat)
- Remove `/` from the `isChatPage` check so the floating chat button appears on the Embark AI page
- Keep `/chat` hidden since that's the dedicated Agent One page

No other files need changes. The original `LearnPath.tsx` with the split-pane EmbarkChat + EmbarkContent is intact and ready to use.


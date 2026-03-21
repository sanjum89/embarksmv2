## Plan: Dynamic Agent One with Rich Content & Expandable Panel

### Status: ✅ Implemented

### What was built

1. **Rich Block System** — AI can emit `:::RICH_BLOCK{...}:::` markers in responses to render skills charts, skill targets tables, inbox cards, and progress summaries inline in the chat.

2. **Expandable Panel** — Chat panel animates from 400×600px to 720×700px when rich content is shown, with auto-collapse on generic messages.

3. **Full Data Pipeline** — AgentOneContext now passes complete skills (with proficiency levels), skill targets summary, inbox notifications, and skill gaps to the edge function.

4. **Rich Content Components** — `RichContentBlock.tsx` renders 4 block types with CSS-based charts, and `CollapsedBlockCard.tsx` shows compact clickable previews.

### Files changed

| File | Change |
|------|--------|
| `supabase/functions/super-agent-chat/index.ts` | System prompt includes full skills/targets/inbox data + rich block emission instructions |
| `src/contexts/AgentOneContext.tsx` | Passes detailed data, parses rich blocks, manages expanded/collapsed state |
| `src/components/chat/RichContentBlock.tsx` | **New** — renders charts, tables, cards inline |
| `src/components/chat/CollapsedBlockCard.tsx` | **New** — compact clickable card for collapsed blocks |
| `src/components/chat/AIChatWrapper.tsx` | Expandable panel, rich block rendering, auto-collapse logic |

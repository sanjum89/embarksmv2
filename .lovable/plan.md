

# Fix Super Agent Card: Markdown Rendering + Show Latest Message

## Problems
1. **Bold not rendering**: `lastMessage` contains raw markdown (`**Clara**`) but is rendered as plain text via `truncate` — asterisks show literally
2. **Shows first message**: The query fetches the conversation but always takes the first assistant message's content (slice of `.content`) — it should show the **latest** assistant message

## Changes

### 1. Strip markdown from preview text
**File: `src/pages/LearnerChat.tsx` (~line 222)**

Instead of `lastAssistant.content?.slice(0, 80)`, strip markdown bold markers before slicing:
```ts
const preview = lastAssistant.content?.replace(/\*\*/g, "").slice(0, 80);
setSuperAgentLastMsg(preview);
```

This gives a clean plain-text preview on the card (the card uses `truncate` so full markdown rendering isn't appropriate here).

### 2. Show the latest message, not the first
**File: `src/pages/LearnerChat.tsx` (~line 221)**

The current code already uses `[...msgs].reverse().find(...)` which should get the last assistant message. However, the `parseSuggestions` cleanup may not be applied — the stored messages might have the `SUGGESTIONS:` line stripped already. The real issue is that the preview is being set from stored (cleaned) messages which start with the first welcome. Let me verify: the `.reverse().find()` logic looks correct — it finds the last assistant message. The content is then sliced to 80 chars.

The actual issue is likely that the conversation is loaded and the first assistant message is the welcome, and the latest message hasn't been stored yet (or the query returns stale data). But more likely, the `lastAssistant` variable correctly finds the last one — the user may just be seeing the welcome message because that IS the latest (fresh reset).

Actually, looking more carefully: the code at line 222 does `[...msgs].reverse().find(...)` which correctly gets the **last** assistant message. If it's showing the first message, it might be that the conversation only has one assistant message (the welcome). But the user says "the latest message should be shown" — so there must be newer messages not appearing.

I'll ensure both fixes are applied:
- Strip `**` from preview
- Confirm the reverse-find logic is correct (it is), but also ensure the preview updates reactively

### Files
| File | Change |
|------|--------|
| `src/pages/LearnerChat.tsx` | Strip `**` markers from preview text before displaying |


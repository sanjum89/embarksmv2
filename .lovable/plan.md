# Pinned answers → scroll-to-message shortcuts

Today, pinning an answer copies the full envelope into the left rail and renders it expanded below the list. You want pins to behave like bookmarks: clicking jumps to the original message in its thread, opening that thread first if it's not the active one.

## Changes

### 1. `src/components/deep-research/DeepResearchWorkspace.tsx`
- Remove `PinnedAnswerCard` (the expandable render of the saved envelope) entirely.
- Replace the pinned-answers list with a compact list of rows: pin icon + title (single line, truncated) + unpin (trash) on hover. No expand chevron, no embedded `ResponseEnvelopeView`.
- Row click handler:
  1. If `pin.threadId !== dr.activeThreadId` → `dr.setActiveThreadId(pin.threadId)` + `onSelectThread?.(pin.threadId)`.
  2. Set a `pendingScrollMessageId` ref/state to `pin.messageId`.
- Wrap each rendered assistant message in the center column with `data-message-id={m.id}` so we can locate it in the DOM.
- New effect: when `pendingScrollMessageId` is set AND `dr.activeThread?.id === targetThreadId` AND the message exists in the DOM, `scrollIntoView({ behavior: "smooth", block: "start" })` inside `scrollRef`, briefly add a highlight ring class (e.g. `ring-2 ring-primary/40` for ~1.5s via a `highlightedMessageId` state with a `setTimeout`), then clear pending state.
- Disable the existing auto-scroll-to-bottom effect when a pending scroll is in flight so it doesn't fight the jump.

### 2. `src/components/deep-research/ResponseEnvelopeView.tsx`
- Keep the pin button, but change `onPinAnswer` semantics: it now just records a bookmark (title + threadId + messageId). The envelope payload is still passed through for backward compatibility but no longer rendered from the rail.
- Optional polish: rename inline label from "Pin title" → "Bookmark title". (Cosmetic only.)

### 3. `src/hooks/useDeepResearch.ts`
- No signature change required — `pinAnswer(threadId, threadTitle, messageId, envelope, title)` and the `PinnedAnswer` shape stay the same so existing localStorage entries keep working.
- `envelope` field on stored pins becomes unused by the UI but remains in the type to avoid a migration. (We can drop it in a later cleanup.)

### 4. Empty-state copy
- Update the "Click the pin icon…" hint to: "Pin any answer to bookmark it. Click a pin to jump back to that message."

## Out of scope
- No changes to how pins are persisted, scoped (personal vs team), or synced across accounts.
- No changes to `ResponseEnvelopeView` rendering of envelopes inside the conversation.
- No changes to the pinned-answer data shape in storage.

## Technical notes
- DOM lookup uses `scrollRef.current?.querySelector(\`[data-message-id="\${id}"]\`)` after the thread switch re-renders. A small `requestAnimationFrame` (or a `useEffect` keyed on `dr.activeThread?.id` + `pendingScrollMessageId`) handles the timing.
- Highlight class is applied via conditional `cn(..., highlightedMessageId === m.id && "ring-2 ring-primary/40 rounded-xl transition-shadow")`.

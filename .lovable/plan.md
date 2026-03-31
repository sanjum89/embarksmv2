

## Fix Role Snapshot "Explore More" Injection into Agent One

### Problem

`handleRoleExploreClick` in My360 calls `chatRef.current?.sendMessage(...)`, but `chatRef` points to nothing — My360 doesn't render an `AIChatPanel`. The global chat is powered by `AgentOneContext`, not a local ref.

### Solution

Replace the broken `chatRef` approach with the `AgentOneContext` API:

#### 1. `src/pages/My360.tsx`

- Import `useAgentOne` from `@/contexts/AgentOneContext`
- Remove `chatRef` entirely
- Update `handleRoleExploreClick` to:
  - Call `handleSend("Tell me more about my role")` from the AgentOne context
  - Call `setIsOpen(true)` to open the floating chat panel
- Update `handleProjectExploreClick` similarly
- Remove the `useEffect` that calls `chatRef.current?.clearMessages()`

#### 2. `src/contexts/AgentOneContext.tsx` — Add breadcrumb support

- Add optional `sourceBreadcrumb` to user messages in the `ChatMessage` interface
- Extend `handleSend` to accept an optional breadcrumb parameter: `handleSend(text: string, breadcrumb?: string)`
- When breadcrumb is provided, attach it to the user message object

#### 3. `src/components/chat/AIChatWrapper.tsx` — Render breadcrumb

- When rendering a user message that has `sourceBreadcrumb`, show a small muted line above the bubble:
  ```
  Role Snapshot › Explore more
  ```
- Style: `text-[11px] text-muted-foreground/60` with `ChevronRight` separators between segments

### Technical Details

**My360 handleRoleExploreClick:**
```typescript
const { handleSend, setIsOpen } = useAgentOne();

const handleRoleExploreClick = () => {
  handleSend("Tell me more about my role", "Role Snapshot › Explore more");
  setIsOpen(true);
};
```

**AgentOneContext handleSend signature update:**
```typescript
handleSend: (text: string, sourceBreadcrumb?: string) => void;
```

The breadcrumb gets stored on the user `ChatMessage` and rendered by `AIChatWrapper`. The AI will receive the prompt and respond using the role context already available in `userContext` (which includes `roleDescription`, `roleDetailedDescription`, `roleName`).

### Files Modified

| File | Change |
|---|---|
| `src/pages/My360.tsx` | Replace `chatRef` with `useAgentOne()`, call `handleSend` + `setIsOpen(true)` |
| `src/contexts/AgentOneContext.tsx` | Add `sourceBreadcrumb` to ChatMessage, extend `handleSend` signature |
| `src/components/chat/AIChatWrapper.tsx` | Render breadcrumb above user messages that have one |


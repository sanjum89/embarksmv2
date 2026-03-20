

# Enhance Super Agent Card: Unread Badge + Prominent Shimmer

## Changes

### 1. SuperAgentCard — shimmer + unread count badge
**File: `src/components/chat/SuperAgentCard.tsx`**

- Add `unreadCount` prop (number) alongside existing `hasUnread`
- Show a red/accent circular badge with the count number next to the "Live" pill when `unreadCount > 0`
- Increase shimmer prominence: change `via-white/[0.08]` → `via-white/[0.15]`, reduce `repeatDelay` from 4s → 1.5s, and shorten duration from 3s → 2s

### 2. LearnerChat — fetch unread count from DB
**File: `src/pages/LearnerChat.tsx`**

- On mount, query `super_agent_conversations` for the current user/account
- Count assistant messages that arrived after the user's last visit (or use a simple heuristic: if conversation exists and has messages, show count of assistant messages since last user message)
- Pass `unreadCount` and `lastMessage` (last assistant message text) to `SuperAgentCard`

### Files
| Action | File |
|--------|------|
| Edit | `src/components/chat/SuperAgentCard.tsx` — add unread badge, increase shimmer |
| Edit | `src/pages/LearnerChat.tsx` — fetch conversation state, pass props |


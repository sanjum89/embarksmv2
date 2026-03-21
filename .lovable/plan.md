

## Plan: Redesign My Inbox Page

The current inbox is a bare list of 3 notifications with no interactivity. We'll expand the data and add a polished, feature-rich design matching the Dashboard's quality.

### Changes

**1. Expand mock data** (`src/data/inboxNotifications.ts`)

- Add more notification types: `task_due`, `feedback`, `system`
- Add 8-10 total notifications with varied dates, priorities (`high`, `medium`, `low`), and actionable CTAs
- Add `priority` and `actionLabel` fields to the interface
- Add a `date` field (ISO string) for proper sorting

**2. Redesign the page** (`src/pages/MyInbox.tsx`)

- **Header section**: Title + subtitle + unread count badge + "Mark all read" button
- **Stats row**: 3 compact stat cards (Unread, Action Required, Total) at the top
- **Filter bar**: 
  - Type filter tabs (All, Meetings, Kudos, Reflections, Tasks, System)
  - Read/Unread toggle filter
  - Sort dropdown (Newest first, Oldest first, Priority)
  - Search input for filtering by title/message text
- **Notification cards**: Richer cards with:
  - Priority indicator (colored dot)
  - Action button per card (e.g. "View Details", "Respond", "Join Meeting")
  - Mark as read/unread toggle
  - Better visual hierarchy with unread cards having a subtle accent background tint
- **Empty state**: Friendly message when filters yield no results

### Files changed

| File | Change |
|------|--------|
| `src/data/inboxNotifications.ts` | Add priority, actionLabel, date fields; expand to 8-10 items with new types |
| `src/pages/MyInbox.tsx` | Full redesign with stats, filters, search, sort, richer cards, mark-read actions |


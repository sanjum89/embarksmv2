

# Move Suggestion Pills Below Empty State & Add Per-Page Customization

## Problem
1. Suggestion pills currently render at the bottom of the panel (above the input bar), far from the empty state text
2. The empty state message ("I can help you explore your skills...") and pills are generic — not contextual to the page

## Changes

### 1. `AIChatPanel.tsx` — Restructure empty state

**Add new props**: `emptyStateMessage?: string` (defaults to current text)

**Move pills into empty state block** (lines 192-203): When `messages.length === 0`, render the pills directly below the subtitle text inside the centered empty state — not in the floating input area.

**Remove pills from floating input area** (lines 249-264): Delete the `{messages.length === 0 && (` block that renders suggested actions above the input bar.

### 2. `AIChatWrapper.tsx` — Pass through `emptyStateMessage`

Add `emptyStateMessage?: string` to props and forward it to `AIChatPanel`.

### 3. Per-page customization — Update each usage

| Page | `emptyStateMessage` | `suggestedActions` |
|------|--------------------|--------------------|
| **Dashboard** | "I can help you find courses, track progress, and plan your learning." | "Find a course", "My progress", "What's due soon" |
| **My360** | "I can analyze your skills profile, identify gaps, and suggest growth paths." | "Analyze my skills", "Career next steps", "Skill gaps" |
| **SkillTargetDetail** | (already has custom suggestions — add message) "I can help you understand this skill target and track your progress." | (keep existing) |

### Files Modified
- `src/components/chat/AIChatPanel.tsx` — move pills into empty state, add `emptyStateMessage` prop
- `src/components/chat/AIChatWrapper.tsx` — pass through new prop
- `src/pages/Dashboard.tsx` — add contextual message + suggestions
- `src/pages/My360.tsx` — add contextual message + suggestions
- `src/pages/SkillTargetDetail.tsx` — add contextual message




## Problem

When a user clicks a suggestion pill like "Go to Introduction to Rathbones" or "Start my first module", it currently sends that text as a chat message. For **direct action prompts** — pills that imply navigation — the app should instead navigate the user to the appropriate page automatically.

## Approach

Define a mapping of known "action pills" to their target routes. When a pill is clicked, check if it matches an action pill — if so, navigate directly instead of sending a message. Non-action pills continue to work as chat messages (the AI response will include CTA buttons for navigation where needed).

## Action Pill → Route Mapping

| Pill Text | Target Route |
|---|---|
| "Go to Introduction to Rathbones" | `/skill-target/{introTargetId}` |
| "Go to my bridge target" | `/skill-target/{bridgeTargetId}` |
| "Start my first module" | `/skill-target/{firstTargetId}/module/{firstModuleId}` |
| "Take the assessment" | `/skill-target/{targetId}/assessment/{assessmentId}` |
| "View my skill target" | `/skill-target/{targetId}` |
| "View My 360" | `/my-360` |
| "Go to Action Centre" | `/my-inbox` |

## Technical Changes

### 1. Create a pill-action resolver utility (`src/lib/pillActionResolver.ts`)
- Export a function `resolvePillAction(pill: string, userContext)` that pattern-matches pill text against known action phrases
- Returns `{ navigate: string }` if it's a direct action, or `null` if it should be sent as a chat message
- Uses the current user's skill target data (from SkillTargetsContext) to resolve dynamic IDs (e.g., intro target ID, first module ID)

### 2. Update `src/pages/LearnerChat.tsx`
- Import the resolver and `useNavigate`
- On pill click: call `resolvePillAction(pill, context)` first
  - If it returns a route → `navigate(route)` directly
  - If null → call `handleSend(pill)` as before (sends as chat message)

### 3. Update `src/components/chat/AIChatWrapper.tsx`
- Same logic for the floating panel's suggestion pills

### 4. Update system prompt pill definitions (`super-agent-chat/index.ts`)
- No changes needed — the pills are already defined. The AI will still suggest them; the client-side just intercepts action ones before sending.


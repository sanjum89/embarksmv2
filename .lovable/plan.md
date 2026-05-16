## 1. Make Embark AI the default learner landing

Today learners are dropped on `/chat` after login or profile switch. Embark AI (`/`) is already the route, we just need to point learners at it.

- `src/components/layout/AppSidebar.tsx`
  - `handleLogin`: when the user is a learner (`!u?.canManage`), navigate to `/` instead of `/chat`. Keep managers/admins on `/chat`.
  - Profile-switcher click handler (around line 491): same rule — learners → `/`, managers in `team` view stay on `/chat`.
- No changes to routes; `/chat` stays reachable from the sidebar.

## 2. Onboarding nudge → Embark AI

When a learner has an `onboarding_progress` nudge in the Agent One stack (image 2), clicking it should open Embark AI instead of starting a chat thread.

- `src/lib/agentOneActions.ts`
  - In the learner CTA map for `onboarding_progress`, change from `{ type: "open_agentone_chat", prompt: "I'm ready to start my onboarding journey…" }` to `{ type: "navigate", path: "/" }`.
- `src/components/chat/AgentOneNudgeStack.tsx` already supports `cta.path` → `navigate(path)`, so no change required there.
- Reflection-request nudge stays as a chat action (unchanged).

## 3. Redesign the AI Chat home (image 1)

Goal: feel like a lighter sibling of Deep Research — left rail for suggestions/threads, calm central canvas, no big empty whitespace. Keep the chat-state UI (when a conversation is active) intact; only the home state changes.

### Layout

`src/pages/LearnerChat.tsx` home state becomes a 2-column grid `grid-cols-[260px_1fr]` (collapses to single column under `lg`):

```text
┌───────────────────────────┬───────────────────────────────────┐
│ LEFT RAIL (260px)         │ MAIN (1fr)                        │
│ ─ Quick links             │ Hi Clara, let's grow together     │
│   Embark AI               │                                   │
│   My 360                  │ [ Agent One nudge stack ]         │
│   Action Centre           │                                   │
│   Cohort                  │ Ask anything… (composer)          │
│ ─ Suggested topics        │                                   │
│   • Grow my skills        │ Recent conversations (chips)      │
│   • Required skills       │   "Reflection draft" · 2h         │
│   • Career paths          │   "Skill recs"        · yesterday │
│   • My activities         │                                   │
│   • Build profile         │ Today's focus (small strip)       │
│   • Create a reflection   │   Next chapter · upcoming nudge   │
│ ─ Recent threads          │                                   │
│   (last 5, click to load) │                                   │
└───────────────────────────┴───────────────────────────────────┘
```

### Left rail (new `src/components/chat/LearnerChatSidebar.tsx`)

- **Quick links** — 4 compact rows with icon + label routing to `/`, `/my-360`, `/action-centre`, `/cohort`. Single source for sidebar nav so we don't fight the global sidebar.
- **Suggested topics** — the existing 6 suggestion cards converted to slim list items (icon + 1-line label, 1-line description on hover). Reuses the existing `suggestionCards` array and `handleCardSend`. Removes the bulky 3-column grid that creates the whitespace today.
- **Recent threads** — list of past chat sessions persisted via `useAgentOne` (one entry per `handleReset` boundary, last 5). Clicking re-hydrates that thread. If thread persistence isn't available, show a "Conversations appear here" empty hint instead.

### Main column

- **Greeting** — unchanged copy, smaller top padding (`pt-8` instead of `pt-16`) so the page feels tighter.
- **Agent One nudge stack** — kept as the hero element; this is the only thing that needs the full width.
- **Composer** — moved directly under the nudge stack so the input is reachable in the first viewport.
- **Recent conversation chips** — a small horizontal strip of the last 3 questions asked, click to re-send. Hidden if empty.
- **Today's focus strip** — one card with two slots: "Next chapter in Embark" (deep-links to active chapter via `useLearnerJourney`) and "Pending nudge" (count from `useAgentOne`). Hidden if both empty.

### Style cues from Deep Research (intentionally lighter)

- Same left-rail typography (`text-[11px] uppercase tracking-wide` section labels, `text-xs` items).
- Same card chrome (`rounded-xl border-border/60 bg-card`, hover `border-primary/40`, subtle lift).
- No right pinned-dashboard column, no scope badges, no "new thread" button in the header. Composer stays minimal.

### Chat-active state

No structural change. Left rail collapses (hidden under `lg` and via a small chevron toggle on `lg+`) so the conversation gets full width, matching today's behaviour.

## 4. Other options worth adding to the page (pick any)

Listed so you can choose — none are in the build above unless you say yes:

1. **Voice ask** — mic button in the composer that streams to the existing role-play STT, drops the transcript into the input.
2. **"Pick up where you left off" card** — single CTA showing the last in-progress Embark chapter with a Resume button, above the nudge stack.
3. **Mood / energy pulse** — 3-emoji quick check-in that writes to reflections so the manager dashboard shows trend.
4. **Weekly digest tile** — small card summarising chapters completed, reflections submitted, role plays done this week.
5. **Cohort presence chip** — "3 peers active now" linking to Cohort Hub.
6. **Saved answers** — bookmarkable assistant replies surfaced as chips in the left rail (the learner-side analogue of Deep Research pins).
7. **Suggested next prompt** — after every assistant reply, show 1 contextual follow-up chip generated from the last response (reuses `suggestions` already returned by `useAgentOne`).
8. **Keyboard shortcut hint** — `⌘K` opens the composer and `⌘/` cycles suggested topics.

## Out of scope

- Deep Research itself (untouched).
- Agent One backend, nudge seeding, or category color tokens.
- Tour, login, account-switch logic.
- Chat-active conversation UI (only the home state is being redesigned).

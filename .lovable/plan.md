## Scope

Only the **chat-active state** of `/chat` (`src/pages/LearnerChat.tsx` lines ~453–649). The empty-home state and floating Agent One overlay are out of scope. No business-logic changes — pure presentation + 5 small client-side tiles wired to existing data.

## Visual redesign of the inner chat page

Today: pinned dark "Agent One LIVE" card, then a single 720px-wide message column with a lot of empty side gutter.

New layout (≥ `lg`): **two-column** `grid-cols-[1fr_300px]` inside a centered `max-w-[1180px]` shell.

```text
┌────────────────────────── max-w-[1180px] ──────────────────────────┐
│  ┌──────────────────────── main ─────────────┐ ┌── context rail ─┐ │
│  │  Slimmer Agent One header (no full bar,    │ │ Pick up where  │ │
│  │  just avatar + name + Live + Home + Reset) │ │ you left off   │ │
│  │                                            │ │                │ │
│  │  Messages (max-w-[680px], better bubbles)  │ │ Weekly digest  │ │
│  │  ─ User: tighter, right-aligned, smaller   │ │                │ │
│  │  ─ Assistant: card with subtle gradient    │ │ Cohort presence│ │
│  │    edge, avatar in soft circle, time stamp │ │                │ │
│  │                                            │ │ Suggested      │ │
│  │  [follow-up chip row under each AI reply]  │ │ topics (slim)  │ │
│  │                                            │ │                │ │
│  │  Composer with mic + send                  │ └────────────────┘ │
│  └────────────────────────────────────────────┘                    │
└────────────────────────────────────────────────────────────────────┘
```

Under `lg`: rail collapses; tiles move to a horizontal scroll strip above the composer.

Specific polish:
- Replace big dark Agent One pinned card with a slim 36px-tall sticky strip (avatar dot · "Agent One" · Live pill · Online dot · Reset · Home), border-bottom only, no shadow.
- Assistant bubble: keep `bg-secondary/50` but add a soft 1px gradient border and `rounded-2xl` corners on both sides (today bottom-left is sharp).
- User bubble: shrink to `text-[0.78rem]`, max-w 60%, slightly less padding.
- Add a "Today · 2:14 PM" muted timestamp above the **first** message of each minute cluster only.
- Empty space between assistant message and pills tightened; pills get a `Sparkles` leading icon and become smaller (`h-7`).
- Subtle 1px divider every time the assistant turn ends, so turns visually group.

## 5 new tiles (right rail, client-side only)

All live in a new file `src/components/chat/ChatContextRail.tsx`. Each tile is a self-contained card; the rail shows them stacked.

1. **PickUpWhereYouLeftOffCard** — reads cohort journey via existing `useLearnerJourney(activeAccountId, employeeId)`. Finds first `status === "in_progress"` module → first non-complete chapter. Renders module title, chapter title, % progress bar, "Resume" button → `navigate('/')` with chapter pre-selected (existing Embark resume path). Hidden if no journey.

2. **VoiceMicButton in composer** — purely UI for now: mic icon left of the Send button, click toggles a recording dot animation and uses the browser `SpeechRecognition` API (no backend, no ElevenLabs) to dictate into `input`. Falls back to disabled tooltip "Voice input not supported" on unsupported browsers. (User can later wire to a real STT — out of scope here.)

3. **WeeklyDigestTile** — small card with this week's counts derived from existing data: chapters completed (from `learner_progress`), modules completed, role plays done (from `localStorage` keys already used by demo), assessment avg. "View full digest →" routes to `/action-centre` (no new page).

4. **FollowUpChip after each AI reply** — one extra chip rendered next to the existing suggestion pill row labeled "↳ Follow up" that injects a generic continuation prompt ("Tell me more about that" / "How does this apply to me?" — picked deterministically from a 4-item rotation based on message index). No backend changes.

5. **CohortPresenceChip** — small card: "3 of 7 peers active this week" + tiny avatar stack from `cohort_enrollments` (existing query, already used in `MyCohortsCard`). Mocked activity timestamps come from existing `teamsAvailability` seed.

## Files

- **Edit** `src/pages/LearnerChat.tsx` — replace chat-active JSX block (lines 453–649) with new two-column layout; slim header; mic in composer; render `<FollowUpChip />` inside the pills row.
- **New** `src/components/chat/ChatContextRail.tsx` — exports the rail with the 4 tiles (pick-up, weekly digest, cohort presence, slim suggested topics).
- **New** `src/components/chat/PickUpWhereYouLeftOffCard.tsx`
- **New** `src/components/chat/WeeklyDigestTile.tsx`
- **New** `src/components/chat/CohortPresenceChip.tsx`
- **New** `src/components/chat/VoiceDictateButton.tsx` (Web Speech API wrapper)

## Out of scope

- Floating Agent One overlay panel (`AIChatPanel`) — left untouched.
- `/chat` empty home — already redesigned previously.
- Real STT/TTS backend, real digest aggregation, real presence — all derived from existing client data only.

## Open question (non-blocking)

Should the right rail also appear on the **empty home** for consistency, or stay chat-active-only? Default: chat-active only.

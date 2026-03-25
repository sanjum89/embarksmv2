

## Plan: Wire Onboarding Flow Logic (Refined)

### Files Changed

| File | Change |
|------|--------|
| `src/pages/AssessmentPage.tsx` | Assessment gate logic using explicit step IDs |
| `src/contexts/AgentOneContext.tsx` | Stage-based reflections, queued reinforcement, chapter context, onboarding pills |
| `supabase/functions/super-agent-chat/index.ts` | Chapter summary injection into system prompt |

---

### 1. Assessment Gate Logic — Explicit Step IDs (`src/pages/AssessmentPage.tsx`)

Replace all relative-order offset logic with explicit step ID maps:

**Baseline (`a-rb-st2-baseline`) — score > 80%:**
- Mark `RAT-ASM-001` completed
- Set `RAT-LM-001`, `RAT-LM-002`, `RAT-LM-003` to `skipped`
- Set `RAT-LM-004` to `available`

**Baseline ≤ 80%:**
- Mark `RAT-ASM-001` completed
- Set `RAT-LM-001` to `available`

**Mid (`a-rb-st2-mid`) — score < 80%:**
- Reset `RAT-LM-004`, `RAT-LM-005`, `RAT-LM-006`, `RAT-LM-007` to `available`/`locked` as appropriate
- Set `RAT-ASM-002` back to `available` (retry)

**Mid ≥ 80%:**
- Mark `RAT-ASM-002` completed
- Set `RAT-RP-001` to `available`

**Final (`a-rb-st2-final`) — score < 80%:**
- Reset `RAT-RP-001` to `available`, `RAT-ASM-003` to `available` (retry)

**Final ≥ 80%:**
- Mark `RAT-ASM-003` completed
- Mark skill target as fully passed

All logic uses a `const GATE_MAP` keyed by assessment reference ID mapping to the explicit step IDs to skip/reset/unlock. No `order + N` math.

---

### 2. Stage-Based Reflection Prompts (`src/contexts/AgentOneContext.tsx`)

Replace "after ~3 steps" heuristic with explicit stage triggers tied to seeded step IDs:

**Reflection trigger map per learner:**

```text
Day 2/3 reflection:
  Clara (u12): fires after step "s-rb-c3" (Suitability chapter) completed
  Elliot (u13): fires after step "s-rb-c3" completed
  Sophie (u14): fires after step "s-rb-c3" completed

Final onboarding reflection:
  Clara: fires after "RAT-ASM-003" (final assessment) completed
  Elliot: fires after "RAT-ASM-003" completed
  Sophie: fires after "RAT-ASM-003" completed
```

A `REFLECTION_TRIGGERS` constant maps `{ userId, stepId }` → reflection prompt index from `agentOneContent[userId].reflectionPrompts`. When a step status changes to `completed`, check the trigger map — if matched, queue the reflection prompt.

---

### 3. Queued Reinforcement When Chat Closed (`src/contexts/AgentOneContext.tsx`)

- Add a `pendingReinforcement` ref (array of queued messages)
- On step completion, check if Agent One panel is currently open (use existing `isOpen` / `chatActive` state from context)
- **If open**: inject reinforcement message into chat immediately
- **If closed**: push to `pendingReinforcement` queue
- On Agent One open (when `isOpen` transitions false→true), flush queued messages into chat as system-injected assistant messages, then clear the queue

---

### 4. Chapter Context for Agent One (`src/contexts/AgentOneContext.tsx` + Edge Function)

- When `currentPage` matches a module page (`/skill-target/:id/module/:mid`), look up the matching `chapterSummaries` entry by `stepId`
- Include `chapterContext: { title, summary, keyTakeaways }` in the `userContext` payload sent to the edge function
- **Edge function** (`super-agent-chat/index.ts`): If `userContext.chapterContext` exists, append to system prompt: `CURRENT CHAPTER: [title] — [summary]. Key takeaways: [list]. Use this to answer chapter summary questions.`

---

### 5. Onboarding Suggestion Pills (`src/contexts/AgentOneContext.tsx`)

Wire `onboardingSuggestionPills` from seeded data into contextual suggestions:
- Determine current onboarding stage from skill target progress (which steps are completed)
- Map to the correct pill set key (`welcome`, `pre-intro`, `pre-bridge`, `pre-assessment`, `post-assessment`, `post-completion`)
- Override default dashboard pills with stage-appropriate pills for Rathbones learners

No new pages, no UI redesign, no DB changes.




## Plan: Intro to Rathbones + Sequential Unlock + Collapsible Agent One Panel

This is a large change touching data, UI components, and the Agent One architecture. Here's the breakdown:

---

### 1. Create "Introduction to Rathbones" Skill Target (DB update)

Add a new skill target `RAT-ST-INTRO-001` to the Rathbones account data with:
- **Title**: "Introduction to Rathbones"
- **3 chapters** (learning modules only, no assessment/role play):
  1. "Our Heritage & Values" — history, culture, client philosophy
  2. "How We Invest" — investment approach, asset classes, team structure
  3. "Your First 90 Days" — onboarding expectations, key contacts, compliance essentials
- **Assigned to**: Clara (`RAT-E003`), Elliot (`RAT-E004`), Sophie (`RAT-E005`)
- **Locked**: `false` — this is the entry point, immediately available
- **No skipping** — all steps sequential, none skippable

Lock all other skill targets (`RAT-ST-001`, `RAT-ST-002`, `RAT-ST-003`, `RAT-ST-BRIDGE-001`) and keep them locked.

### 2. Add `prerequisiteId` to SkillTarget type

Update `src/types/learning.ts` to add `prerequisiteId?: string` to the `SkillTarget` interface.

Set prerequisite chain in the account data:
- `RAT-ST-INTRO-001` → no prerequisite (first target)
- `RAT-ST-001` (Investment Management Foundations) → prerequisite: `RAT-ST-INTRO-001`
- `RAT-ST-BRIDGE-001` (Elliot's bridge) → prerequisite: `RAT-ST-INTRO-001`
- `RAT-ST-002` → prerequisite: `RAT-ST-001`
- `RAT-ST-003` → prerequisite: `RAT-ST-002`

### 3. Remove "Unlock via Agent One" button from locked cards

Update `src/components/skill-target/SkillTargetCard.tsx`:
- Remove the "Unlock via Agent One" and "Preview" buttons from the locked state
- Instead, show a subtle prerequisite hint: "Complete **[prerequisite title]** to unlock" with a lock icon
- Read the prerequisite title from the skill targets context using `prerequisiteId`

### 4. Dashboard sort order

Update `src/pages/Dashboard.tsx` to sort targets by prerequisite chain: Intro → Bridge/Foundations → subsequent targets. Put `RAT-ST-INTRO-001` first.

### 5. Collapse the right-side Agent panel to a floating icon

**Rewrite `src/components/chat/AIChatWrapper.tsx`**:
- For both "new" and "traditional" UI: render as a **fixed bottom-right floating icon** (collapsed by default)
- Clicking the icon opens a floating panel (similar to current traditional behavior but larger: ~400px wide, ~600px tall)
- The panel contains the full `AIChatPanel`
- Remove the 400px sidebar mode entirely — Agent One is always the floating icon/panel

### 6. Move Agent One onboarding into the floating panel

**Major refactor**: The `SuperAgentChat.tsx` page currently holds all onboarding logic (stage management, assessment CTA, bridge CTA, etc.). This needs to move into the floating Agent One panel so it's accessible from every page.

- Create a new context `src/contexts/AgentOneContext.tsx` that holds all the Agent One state: messages, stage, streaming, suggestions, assessment state, bridge state
- Move the core logic from `SuperAgentChat.tsx` into this context
- Update `AIChatWrapper` to use `AgentOneContext` instead of its own local `AIChatPanel` — render the Agent One conversation with all CTAs (assessment, bridge, skill target links)
- Remove the `/chat/super-agent` route and `SuperAgentChat.tsx` page
- Update `SuperAgentCard` on the learner chat page to open the floating panel instead of navigating to a route
- Update all sidebar/nav references to remove the super-agent route

### 7. Contextual awareness in the floating panel

The Agent One panel should know the current page context:
- Pass current route info + skill target progress into `AgentOneContext`
- The edge function already receives `userContext` — extend it with `currentPage` and `currentSkillTargetProgress` so Agent One can say things like "You've completed 2 of 3 chapters in Introduction to Rathbones today"

### 8. Sequential unlock logic

Add auto-unlock logic in `SkillTargetsContext`:
- When a skill target reaches 100% progress, check if any other target has it as `prerequisiteId` and auto-unlock that target
- For `RAT-ST-001` specifically: after Intro is complete, unlock it but keep the assessment-first flow (first step is an assessment, modules skip based on score)

### 9. Update edge function prompts

Update `supabase/functions/super-agent-chat/index.ts`:
- Add awareness of the intro target and sequential unlock chain
- Update stage logic: after welcome/profile-review/feedback, the task-list stage should reference the intro target as the first thing to do
- After intro completion, guide to assessment for Foundations

---

### Technical summary of files changed

| File | Change |
|------|--------|
| `src/types/learning.ts` | Add `prerequisiteId?: string` to `SkillTarget` |
| DB (accounts data) | Add `RAT-ST-INTRO-001`, set prerequisites on all targets |
| `src/contexts/AgentOneContext.tsx` | **New** — all Agent One state & logic extracted from SuperAgentChat |
| `src/components/chat/AIChatWrapper.tsx` | Rewrite to floating icon + panel using AgentOneContext |
| `src/pages/SuperAgentChat.tsx` | **Delete** — logic moved to AgentOneContext |
| `src/components/chat/SuperAgentCard.tsx` | Open floating panel instead of navigating |
| `src/components/skill-target/SkillTargetCard.tsx` | Remove unlock button, show prerequisite hint |
| `src/pages/Dashboard.tsx` | Sort intro target first |
| `src/contexts/SkillTargetsContext.tsx` | Add auto-unlock on completion |
| `src/components/layout/AppSidebar.tsx` | Remove super-agent nav references |
| `src/App.tsx` | Remove `/chat/super-agent` route, wrap with AgentOneProvider |
| `supabase/functions/super-agent-chat/index.ts` | Update prompts for intro-first flow |


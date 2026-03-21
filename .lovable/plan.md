

## Plan: Intro to Rathbones Skill Target, Sequential Unlocking, Global Agent One Panel

This is a large scope change with 4 major workstreams. Here's the breakdown:

---

### 1. Create "Introduction to Rathbones" Skill Target

**Database update** (account JSON via insert tool):
- Add new skill target `RAT-ST-INTRO-001` with 3 module-only chapters:
  - Ch1: "Welcome to Rathbones — Our Heritage & Values" (document, 20min)
  - Ch2: "How Rathbones Serves Clients" (video, 25min) 
  - Ch3: "Your Role in the Rathbones Investment Process" (document, 20min)
- Assigned to Clara (`RAT-E003`), Sophie (`RAT-E005`), and Elliot (`RAT-E004`)
- `locked: false` — this is the first target, unlocked by default
- No assessment, no role play, no skipping
- All other targets (`RAT-ST-001`, `RAT-ST-002`, `RAT-ST-003`, `RAT-ST-BRIDGE-001`) stay `locked: true`

Also add corresponding learning module entries in the account data so the modules are playable.

### 2. Remove "Unlock via Agent One" Button — Sequential Unlock Logic

**`src/components/skill-target/SkillTargetCard.tsx`**:
- Remove the "Unlock via Agent One" button from locked cards
- Keep the "Preview" button and the locked visual state
- Add text like "Completes after [previous target]" or just show "Locked" without a CTA

**`src/pages/SkillTargetDetail.tsx`** and **`src/pages/SuperAgentChat.tsx`**:
- When "Introduction to Rathbones" is completed (all 3 steps done), auto-unlock the next target in sequence:
  - For Elliot: unlock `RAT-ST-BRIDGE-001`, then after bridge → assessment → `RAT-ST-001`
  - For Clara/Sophie: unlock `RAT-ST-001` directly (with assessment flow)
- Move unlock logic into `SkillTargetsContext` or a shared utility so it triggers on step completion, not just from Agent One

**`src/contexts/SkillTargetsContext.tsx`**:
- Add an effect that watches for completion of targets and auto-unlocks the next in the sequence

### 3. Collapse Agent Panel to Floating Icon (Global Agent One)

**`src/components/chat/AIChatWrapper.tsx`**:
- Replace the right-side 400px panel (non-traditional mode) with a floating bottom-right icon (like the traditional mode already does)
- Both themes now use the floating icon pattern
- The panel opens as a fixed overlay (bottom-right, ~380×540px)

**`src/components/layout/AppLayout.tsx`**:
- Add a global `<AgentOneFloatingChat />` component that renders on every page
- This component uses the super-agent-chat edge function (same as SuperAgentChat page) 
- It's context-aware: reads the current route + user's skill target progress to set contextual system prompts

### 4. Move Agent One Onboarding to Global Panel

**New: `src/components/chat/AgentOnePanel.tsx`**:
- Extract the core logic from `src/pages/SuperAgentChat.tsx` into a reusable panel component
- Same onboarding flow (welcome → profile-review → task-list → pre-bridge/pre-assessment → post-assessment → post-completion)
- Same assessment CTA, bridge CTA, skill target CTA inline
- Panel header with Agent One branding, reset button
- When not in onboarding mode, the AI is context-aware of current page/skill target

**`src/pages/SuperAgentChat.tsx`**:
- Keep the route but redirect to dashboard (or remove the route entirely) since Agent One now lives globally

**`src/pages/LearnerChat.tsx`**:
- Remove the `SuperAgentCard` since Agent One is now the floating icon on every page

**`src/components/chat/SuperAgentCard.tsx`**:
- Remove or deprecate

**`src/App.tsx`**:
- Remove `/chat/super-agent` route (or keep as redirect to `/`)

**`src/components/layout/AppSidebar.tsx`**:
- No changes needed — chat nav item still goes to `/chat`

**`supabase/functions/super-agent-chat/index.ts`**:
- Add a `general-contextual` mode that takes current page context and skill target progress info to generate helpful contextual messages (e.g., "You've completed 2/3 chapters in Intro to Rathbones today!")

### Summary of sequential unlock order
```text
All users:
  1. Introduction to Rathbones (unlocked by default)
  2. → On completion:
     - Elliot: unlock Bridge Target
     - Clara/Sophie: unlock Investment Management Foundations (with assessment)

Elliot only:
  3. Bridge Target completed → unlock Investment Management Foundations (with assessment)

All users (after Foundations):
  4. Business Development & Relationship Growth
  5. Mentoring & Team Contribution
```

### Technical scope
- 1 DB data update (new skill target + module entries in account JSON)
- ~5 files modified significantly
- 1 new component (`AgentOnePanel.tsx`)
- 1 edge function update
- Remove/deprecate `SuperAgentCard`, `SuperAgentChat` page


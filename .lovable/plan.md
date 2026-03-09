

# Plan: Profile Switcher, Role Play LLM, Manager Edit, Skill Target Skills

## 1. Profile Switcher Updates

### Manager icon badge
- Add a `Shield` icon next to manager-capable users' names in the profile popover (both themes).

### Reorder users
- Change `availableUsers` array in `mock.ts` to: `[currentUser (Alex), marcusWellington, mayaThompson, rajPatel]` — managers first, learners second.

### Remove As Learner / As Manager from popover
- Simplify profile switcher: clicking a user just switches to that user (no sub-buttons). Always sets role to `"learner"` and navigates to `/`.

### Add Me / Team mode toggle to New UI sidebar
- The Traditional UI already has a Me/Team toggle. Add the same toggle to the New UI sidebar (at the top, below brand).
- "Me" mode sets role to `"learner"`, "Team" mode sets role to `"manager"` and navigates to `/manager`. Only shown for `canManage` users.
- This replaces the role switching that was previously in the profile popover.

**Files:** `src/data/mock.ts`, `src/components/layout/AppSidebar.tsx`

---

## 2. Connect LLM to Role Play Chat & Voice

### Create a new edge function `supabase/functions/role-play-chat/index.ts`
- Accepts `messages` array + `rolePlayContext` (persona, scenario, context).
- System prompt instructs the AI to stay in character as the role play persona, using the scenario and context to guide responses.
- Streams response via SSE, same pattern as existing `chat` function.

### Update `RolePlaySession.tsx`
- **Chat mode:** Replace mock `aiResponses` with a call to `streamChat` pointed at the new `role-play-chat` edge function. Send conversation history + role play context.
- **Voice mode:** Same — replace mock transcript/response cycle with LLM call. Keep the simulated voice UX (mic toggle, subtitle overlay) but use real AI responses instead of canned ones.
- Add a `streamRolePlayChat` helper in `src/lib/streamChat.ts` (or reuse `streamChat` with a different URL parameter).

**Files:** `supabase/functions/role-play-chat/index.ts`, `src/pages/RolePlaySession.tsx`, `src/lib/streamChat.ts`

---

## 3. Manager Mode: Edit Role Plays

### Update `ManagerRolePlay.tsx`
- Add an **Edit** button (pencil icon) on each role play card.
- Clicking opens a dialog pre-filled with title, scenario, difficulty, and a new "AI Persona" and "Context" fields.
- On save, update the local `rolePlays` state. Since role plays are currently in-memory mock data, this updates the local state and shows a toast.

### Share edits across the app
- Move role play state into a new `RolePlayContext` provider so edits from the manager view propagate to `RolePlayBank`, `RolePlaySession`, and skill target step references.
- Context wraps the app in `App.tsx`, initialized from `mockRolePlayBank`.

**Files:** `src/contexts/RolePlayContext.tsx`, `src/pages/ManagerRolePlay.tsx`, `src/pages/RolePlayBank.tsx`, `src/pages/RolePlaySession.tsx`, `src/App.tsx`

---

## 4. Skill Target Cards: Show Skills & Proficiency

### Add `skills` field to `SkillTarget` type
- Add `skills?: { name: string; current: Proficiency; target: Proficiency }[]` to `SkillTarget` interface in `types/learning.ts`.

### Add skills data to mock skill targets
- e.g. st1 "Customer Objection Handling": `[{ name: "Objection Handling", current: "Beginner", target: "Advanced" }, { name: "Reframing", current: "Beginner", target: "Intermediate" }]`
- Similar for st2-st5.

### Update `SkillTargetCard.tsx`
- Below the description, show up to 3 skill pills: `"Objection Handling B→A"` format.
- If more than 3, show `"+N more"` button that opens a dialog/popover listing all skills with current and target proficiency.

### Update `SkillTargetDetail.tsx`
- Add a "Skills Being Developed" section in the New UI layout (between header card and timeline).
- Shows all skills with current vs target proficiency as a compact list/pills.

**Files:** `src/types/learning.ts`, `src/data/mock.ts`, `src/components/skill-target/SkillTargetCard.tsx`, `src/pages/SkillTargetDetail.tsx`

---

## Summary of all files changed
- `src/types/learning.ts` — add `skills` to `SkillTarget`
- `src/data/mock.ts` — reorder users, add skills to targets
- `src/components/layout/AppSidebar.tsx` — simplify switcher, add Me/Team to New UI
- `supabase/functions/role-play-chat/index.ts` — new edge function
- `src/lib/streamChat.ts` — add role-play URL option
- `src/pages/RolePlaySession.tsx` — replace mocks with LLM
- `src/contexts/RolePlayContext.tsx` — new context for shared role play state
- `src/pages/ManagerRolePlay.tsx` — add edit functionality
- `src/pages/RolePlayBank.tsx` — consume RolePlayContext
- `src/App.tsx` — wrap with RolePlayContext
- `src/components/skill-target/SkillTargetCard.tsx` — show skills pills
- `src/pages/SkillTargetDetail.tsx` — show skills section




## Plan: Program Context Configuration + Manager Chat Dashboard

This is a large feature that adds a "Program Context" configuration system and transforms the Manager View into a chat-driven interface where Daniel Brooks (manager) can configure programs, assign learners, and track progress — all connected to Maya's actual skill target state.

### 1. Add Manager User
**Files:** `src/data/mock.ts`, `src/contexts/UserContext.tsx`

- Add `danielBrooks` user (`id: "u7"`, role: `"manager"`, name: "Daniel Brooks")
- Add to `availableUsers` array so sidebar switcher shows him
- Add mock data: `mockProgramContexts` array with one entry for "Apple L1 Customer Support" program containing:
  - Program name, description, category
  - Linked training (reference to st4's steps)
  - Assessment config: pass percentage (70%), adaptive skip thresholds (80%, 90%)
  - Role play mapping (rp13 at end)
  - Assigned learners list (Maya first, plus 2 others)
- Add `mockNewHires` array with Maya + 2 others including experience, skills, start date

### 2. Rewrite Manager View as Chat-First Interface
**File:** `src/pages/ManagerView.tsx` (complete rewrite)

Layout: Two-panel — left is chat (60%), right is context panel (40%).

**Chat home screen:**
- Greeting: "Hi Daniel, let's dive in"
- Suggestion cards grid (2x3): "New hires added", "Program Context", "Assign training", "View team progress", "Track Maya's progress", "Skill gaps"
- Bottom suggestion pills and input field

**Chat mechanics:**
- Clicking a card posts a prompt as a user message (e.g., "Show me my new hires")
- Responses are rendered as mock markdown with structured data
- Right panel updates contextually based on the active conversation topic
- Suggestion pills appear after responses for follow-up actions

### 3. Program Context Feature
**New file:** `src/components/manager/ProgramContextPanel.tsx`

When "Program Context" card is clicked (posts "Show me program context"):
- **Right panel** shows the Apple L1 program config:
  - Program name, description, category
  - Chapter list (all 16 steps from st4) with checkboxes to include/exclude
  - Assessment pass percentage slider (maps to adaptive skipping thresholds)
  - Role play assignment at end
  - Assigned learners list
  - "Save Configuration" button

### 4. New Hires Flow
**New file:** `src/components/manager/NewHiresPanel.tsx`

Posts "Show me my new hires" → right panel shows:
- List of hires with Maya first
- Each hire card: name, role, start date, experience, skills with proficiency badges, training status

### 5. Assign Training Flow
**New file:** `src/components/manager/TrainingAssignPanel.tsx`

Posts "Assign training to Maya" or "Assign Maya to Apple L1":
- **Chat reply:** Confirms assignment recommendation
- **Right panel:** Shows Apple L1 chapters with add/remove toggles, pass % config
- "Assign" button confirms and updates context
- Suggestion pill: "Assign Maya to Apple L1" → same flow

### 6. Progress Tracking Flow
**New file:** `src/components/manager/ProgressPanel.tsx`

Posts "Show me Maya's progress":
- Reads Maya's st4 state from `SkillTargetsContext`
- **Chat reply:** Summary of current step, completion %, score
- **Right panel:** Visual step timeline showing completed/skipped/available/locked steps
- Live connection: changes Maya makes (assessments, module completions) reflect here

### 7. Wire Sidebar Navigation
**File:** `src/components/layout/AppSidebar.tsx`

- When Daniel is selected and user switches, navigate to `/manager`
- Manager role already has nav items configured

### Files to Create/Edit
- `src/data/mock.ts` — Daniel user, program contexts, new hires mock data
- `src/contexts/UserContext.tsx` — Add Daniel to availableUsers
- `src/pages/ManagerView.tsx` — Complete rewrite as chat dashboard
- `src/components/manager/ManagerChatHome.tsx` — Home screen with suggestion cards
- `src/components/manager/ProgramContextPanel.tsx` — Program config editor
- `src/components/manager/NewHiresPanel.tsx` — New hires detail view
- `src/components/manager/TrainingAssignPanel.tsx` — Training chapter editor
- `src/components/manager/ProgressPanel.tsx` — Live progress tracker


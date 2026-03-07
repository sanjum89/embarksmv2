

## Create Custom Skill Target Feature

### Overview
Add a "Create Skill Target" button on the Dashboard that opens a multi-step dialog where users can either describe what they want to learn (AI-generated path) or manually search/select existing courses. The dialog will show skill gaps from My 360 as recommended starting points.

### UI Flow

**1. Dashboard — Add Button**
- Add a "+" / "Create Skill Target" button next to the filters row on the Dashboard page.
- Clicking opens a Dialog/Sheet.

**2. Create Skill Target Dialog (multi-step)**

**Step 1: Choose Method**
- Two cards side by side:
  - **"Describe your goal"** — text input, AI generates a skill target with auto-assigned modules
  - **"Build manually"** — search and select existing courses/modules

- Below both cards: **"Recommended from your Skill Gaps"** section showing:
  - **Role Gaps**: A green checkmark banner — "No role skill gaps — you're fully aligned with your role requirements"
  - **Project Gaps**: Cards for each gap from `skillGapRows` data (Product Ops A→E, Prioritization A→E, Figma Wireframing I→A, Figma Make —→B, FigJam —→B, Lovable AI —→I). Each card is clickable to pre-fill the skill target.

**Step 2a: AI-Generated Path (if "Describe your goal")**
- Text input: "What skill do you want to develop?"
- On submit, show a mock AI-generated skill target preview:
  - Skill name & proficiency transition (e.g., "Product Ops: A → E")
  - Auto-suggested modules list
  - "Create" button to confirm

**Step 2b: Manual Build (if "Build manually")**
- Form fields: Title, Category, Description
- Searchable list of existing modules (from `mockLearningModules`) with checkboxes
- Selected modules appear as an ordered list
- Skill & proficiency selector showing what level is being added/upgraded

**Step 3: Confirmation**
- Shows the created skill target summary with skill + proficiency badge
- Adds to `SkillTargetsContext` and navigates to the new skill target detail page

### Technical Approach

**New files:**
- `src/components/skill-target/CreateSkillTargetDialog.tsx` — main dialog component with step logic

**Modified files:**
- `src/pages/Dashboard.tsx` — add "Create Skill Target" button that opens the dialog
- `src/contexts/SkillTargetsContext.tsx` — no changes needed, already has `addSkillTargets`

**Data:**
- Skill gap recommendations pulled from the same `skillGapRows` data used in My360 (will extract to a shared location or duplicate the relevant subset)
- Module search uses `mockLearningModules` from mock data
- AI-generated path is simulated with mock data (no real AI call since no backend)

**Key UI elements:**
- Dialog uses existing `Dialog` component from shadcn
- Proficiency badges use the same level color system (B/I/A/E/M) from ActionPlanView
- Arrow transitions (current → target) match existing pattern
- Role gap section shows a success state with green styling
- Project gap section shows clickable recommendation cards

### Component Structure

```text
CreateSkillTargetDialog
├── Step 1: MethodSelection
│   ├── "Describe your goal" card
│   ├── "Build manually" card
│   └── SkillGapRecommendations
│       ├── RoleGaps (green "No gaps" banner)
│       └── ProjectGaps (clickable gap cards)
├── Step 2a: AIGeneratedPreview
│   ├── Text input
│   └── Generated target preview with modules
├── Step 2b: ManualBuilder
│   ├── Title/Category/Description form
│   ├── Module search + selection
│   └── Skill proficiency picker
└── Step 3: Confirmation + Create
```


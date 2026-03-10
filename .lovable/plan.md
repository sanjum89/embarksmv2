

# Plan: Full-Page Skill Target Builder with Chat, Content Discovery, Assessments, and Role Plays

## Overview
Create a new full-page builder at `/create-skill-target` that replaces the dialog-based flow. Two-column layout: left is a chat/discovery panel, right is the live skill target editor with drag-to-reorder all step types.

## Layout

```text
┌──────────────────────────────────┬─────────────────────────────────┐
│  LEFT PANEL                      │  RIGHT PANEL                    │
│                                  │                                 │
│  States:                         │  Title (editable input)         │
│  1. Chat — auto-welcome msg      │  Description (editable textarea)│
│  2. Content List — scrollable    │                                 │
│     results (modules/role plays) │  Steps List (drag + reorder):   │
│  3. Content Detail — full view   │   ☰ [icon] Module 1        [x] │
│     (video player or PDF reader) │   ☰ [icon] Assessment 1    [x] │
│                                  │   ☰ [icon] Role Play 1     [x] │
│  Upload button in input bar      │   ☰ [icon] Module 2        [x] │
│                                  │                                 │
│                                  │  [Create Skill Target]          │
└──────────────────────────────────┴─────────────────────────────────┘
```

## New Files

### 1. `src/pages/SkillTargetBuilder.tsx` (~450 lines)

**Left Panel — Three view states:**

- **Chat view**: Welcome message: "Describe the skill target you want to create and I'll find the right courses for you from our repo. You can also add your own content by clicking the upload button below." Input bar with upload button (placeholder). User types queries like "Apple L1 Customer Support".

- **Content list view**: Filters `mockLearningModules`, `mockAssessments`, and `mockRolePlayBank` by keyword matching on title/description. Shows scrollable cards with type icon, title, duration, content type. Each card has "Add" button and is clickable to open detail view. Tabs or filter chips for "All", "Modules", "Assessments", "Role Plays".

- **Content detail view**: Takes full left panel space. Back button at top. For modules: video thumbnail (gradient + play icon) or PDF viewer (simulated). For assessments: shows questions list, passing score. For role plays: shows scenario, difficulty, tags. "Add to Skill Target" button.

**Right Panel — Builder:**

- Editable title and description fields
- Steps list with:
  - Drag handle (GripVertical icon) for reorder via simple index swap (move up/move down buttons as fallback)
  - Type icon (BookOpen/ClipboardCheck/Drama) + title + duration
  - Delete (X) button
- "Create Skill Target" button — builds a `SkillTarget` object, calls `addSkillTargets`, navigates to detail page

**Assessment Creation Flow (via chat):**
- User can ask AI to "create an assessment based on modules X and Y" — triggers a mock AI response that generates an assessment with questions (pulled from `mockAssessments` or templated)
- User can also manually create: a "Create Assessment" button in the chat input area opens an inline form to add questions (question text + 4 options + correct answer), set passing score, and set skip rules (e.g., ">80% skips the 2 related modules")
- When added, the assessment step includes metadata linking it to specific module steps and the skip threshold
- Assessment gets inserted into the right panel's step list at the user's chosen position

**Role Play Addition:**
- User can search role plays from `mockRolePlayBank` in the content list view
- Role plays appear alongside modules in search results with Drama icon
- Click to see scenario details, then "Add to Skill Target"

**Drag and Arrange:**
- All step types (modules, assessments, role plays) in the right panel can be reordered via drag handles
- Simple array reorder using move-up/move-down or drag-and-drop

### 2. `src/components/skill-target/AssessmentCreator.tsx` (~150 lines)
Inline form component for manually creating assessments:
- Title input
- Question builder: add questions with text, 4 options, correct answer selector
- Passing score slider
- "Link to modules" multi-select (from modules already in the builder)
- Skip threshold input (e.g., 80%)
- "Add Assessment" button — creates assessment object and adds to builder

## Modified Files

### 3. `src/App.tsx`
- Import `SkillTargetBuilder`
- Add route: `/create-skill-target` → `SkillTargetBuilder` (inside AppLayout)

### 4. `src/pages/Dashboard.tsx`
- Change "Create Skill Target" button to `navigate('/create-skill-target')` instead of `setCreateOpen(true)`
- Remove or keep `CreateSkillTargetDialog` import (keep for backward compat)

## Key Behaviors

1. **Search logic**: Simple keyword match on title fields across modules, assessments, and role plays
2. **Assessment skip rules**: When user creates assessment linked to modules with >80% threshold, the created `StepItem` gets `skippable: true` and `skipCondition` text on the linked modules
3. **Step ordering**: All steps get sequential `order` values based on their position in the list
4. **State management**: Local state in builder page; on "Create", constructs full `SkillTarget` and adds via context


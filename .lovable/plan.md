

# Plan: 50 Manager Skill Targets + Assignment UI with AgentOne Integration

## Overview

Create 50 assignable skill targets for managers (Alex and Marcus) in Team mode. Add a new route `/manager/skill-targets` with a list view, and a detail view `/manager/skill-target/:id` showing modules with blue accent styling (per reference image), assigned employees with progress, and an "Ask AgentOne" button per employee that pushes a query to the chat panel.

## Changes

### 1. New file: `src/data/managerSkillTargets.ts`
50 skill targets for CX team upskilling, each with:
- 3–8 steps referencing existing modules from `contentModules.ts` (m20–m119) and existing assessments/roleplays
- Skills from the skills inventory
- `assignedTo` array with team member IDs (u2, u3, u4, u6, u8, u9)
- Mock progress per assignee stored as a `Record<userId, { progress, lastActivity, status }>`

Categories spanning: Communication Foundations, De-escalation & Empathy, CRM & Tools, Product Knowledge, Quality Assurance, Customer Retention, Support Operations, Leadership & Coaching, Analytics, Advanced CX Strategy.

Example targets:
- "Communication Foundations" (m20, m22, m23, m33, m37) — Beginner
- "Advanced De-escalation Mastery" (m40, m45, m70, m71, rp3) — Advanced
- "CRM Power User" (m25, m53, m60) — Intermediate
- "Customer Retention Playbook" (m48, m58, m82, m83) — Advanced
- etc. (50 total)

Export: `managerSkillTargets: ManagerSkillTarget[]` and `mockAssigneeProgress: Record<skillTargetId, AssigneeProgress[]>`

### 2. New file: `src/pages/ManagerSkillTargets.tsx`
**List view** — Grid/list of 50 skill targets with:
- Title (clickable button → navigates to detail)
- Category badge, step count, skill pills
- "Assigned to" count badge

### 3. New file: `src/pages/ManagerSkillTargetDetail.tsx`
**Detail view** with two-column layout (left: content, right: AgentOne chat):

**Left panel:**
- Header with title, description, category, skill pills
- **Modules list** — Blue accent timeline (per reference image):
  - Blue circle icon with BookOpen, blue vertical connector line
  - Module title as a clickable button
  - Type badge ("Module", "Assessment", "Role Play")
  - Duration badge
  - Skip condition badge if present (amber, like the image)
- **"Assigned To" toggle section** — clicking reveals a panel beneath showing:
  - Each assigned employee: avatar, name, title, progress bar, completion %
  - **"Ask AgentOne"** button per employee
  - Clicking "Ask AgentOne" pushes `"How is [Name] doing on [SkillTarget]?"` to the AgentOne chat on the right
  - AgentOne responds with dummy data: current progress, skill gaps vs role/project requirements, what they might achieve through this training

**Right panel:** AgentOne chat (reuse `AIChatPanel`) with suggested actions like "Show all at-risk learners", "Compare team progress"

### 4. Modified: `src/App.tsx`
Add routes:
- `/manager/skill-targets` → `ManagerSkillTargets`
- `/manager/skill-target/:id` → `ManagerSkillTargetDetail`

### 5. Modified: `src/components/layout/AppSidebar.tsx`
Add "Skill Targets" nav item under manager section linking to `/manager/skill-targets`

### 6. Modified: `src/pages/ManagerView.tsx`
Add `generateResponse` handler for "how is [name] doing" queries — returns dummy analysis including:
- Progress on the specific skill target
- Skill gap summary (current vs required from `profileDataByUser`)
- Predicted outcome from completing the training
- Risk flags if behind schedule

## Blue Accent Module Timeline (per reference image)

```text
┌────────────────────────────────────────────────┐
│  ⊙  Objection Handling Framework     ⏱ 25 min │
│  │  Learn the LAER framework...                │
│  │  [📖 Module]  [⏭ Pre-assessment > 80%]     │
│  │                                             │
│  ⊙  Advanced Reframing Techniques    ⏱ 20 min │
│  │  Deep dive into reframing...                │
│  │  [📖 Module]                                │
└────────────────────────────────────────────────┘
```
- Circle icon: `bg-blue-100 text-blue-600 ring-2 ring-blue-200`
- Connector line: `bg-blue-400`
- Title: clickable button style (text-blue-600 hover:underline)
- Badges: outline style for type, amber for conditions

## AgentOne "Ask" Response Template

When "Ask AgentOne" is clicked for an employee:
```
**[Name]'s Progress on [Skill Target]**

📊 **Completion:** 45% (4/9 modules done)
⏰ **Last Active:** 2 days ago
🔴 **Status:** At Risk — behind by 3 modules

**Skill Gap Analysis:**
- Customer Communication: Intermediate → Advanced (1 level gap)
- De-escalation: Beginner → Intermediate (1 level gap)

**Projected Outcome:**
Completing this path will close 2 of 3 skill gaps and move [Name] 
from Beginner to Intermediate in De-escalation...

**Recommendation:** Schedule a 1:1 to discuss pacing.
```

## File Summary
| File | Action |
|------|--------|
| `src/data/managerSkillTargets.ts` | Create — 50 skill targets + assignee progress |
| `src/pages/ManagerSkillTargets.tsx` | Create — list view |
| `src/pages/ManagerSkillTargetDetail.tsx` | Create — detail view with blue timeline + assignees + AgentOne |
| `src/App.tsx` | Edit — add 2 routes |
| `src/components/layout/AppSidebar.tsx` | Edit — add nav item |
| `src/pages/ManagerView.tsx` | Edit — handle "how is X doing" prompts |


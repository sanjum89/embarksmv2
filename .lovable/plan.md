

## Rename Programs → Cohorts & Move Under Manage Learning

### What Changes
1. Rename "Programs" to "Cohorts" in the sidebar, route, and page content
2. Move it under the "Manage Learning" group below Skill Targets in the team mode sidebar

### Files Changed

| File | Change |
|---|---|
| `src/components/layout/AppSidebar.tsx` | Rename sidebar item label `"Programs"` → `"Cohorts"`, path `/manager/programs` → `/manager/cohorts`. Restructure team nav so Cohorts sits inside a "Manage Learning" group under: People Graph, Role Play, Skill Targets, **Cohorts** |
| `src/App.tsx` | Update route from `/manager/programs` → `/manager/cohorts`, rename import if desired |
| `src/pages/ProgramContextPage.tsx` | Rename heading "Program Context" → "Cohorts", "New Program" → "New Cohort", "No programs configured" → "No cohorts configured", "Back to Programs" → "Back to Cohorts", "Create your first program" → "Create your first cohort" |
| `src/components/manager/ProgramContextPanel.tsx` | Rename heading "Program Context" → "Cohorts" |

All internal data structures (`programContexts`, `ProgramContext` type) remain unchanged — only user-facing labels are renamed.


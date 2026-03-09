

# Plan: Add Module Summary Stats + Scrollable Skills Panel

## Changes to `src/pages/SkillTargetDetail.tsx`

### 1. Left column — Add module breakdown below progress bar
Compute counts from `target.steps` by type (`module`, `assessment`, `role_play`) and display them as a row of stat pills/badges below the progress bar. Example: "14 Modules · 1 Assessment · 1 Role Play". Also show estimated total duration if available.

### 2. Right column — Make skills section scrollable
Wrap the skills list in a `max-h-[200px] overflow-y-auto` container so that when there are many skills (e.g., 5+), the section scrolls while the header card stays compact.

### Implementation Detail

**Left column addition** (after the progress bar, line ~200):
```tsx
// Compute step type counts
const modulesCount = target.steps.filter(s => s.type === "module").length;
const assessmentsCount = target.steps.filter(s => s.type === "assessment").length;
const rolePlaysCount = target.steps.filter(s => s.type === "role_play").length;

// Render as a row of muted stat items
<div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground">
  <span>📘 {modulesCount} Modules</span>
  <span>📝 {assessmentsCount} Assessments</span>
  <span>🎭 {rolePlaysCount} Role Plays</span>
</div>
```

**Right column** (line ~209): Wrap `<div className="space-y-3">` with `max-h-[180px] overflow-y-auto` and use a custom scrollbar style.

Single file, ~15 lines added.


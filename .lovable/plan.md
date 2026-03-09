

# Plan: Two-Column Header with Skills Progress Panel

## Current State
The Skill Target detail page (New UI) has the header card and "Skills Being Developed" as two separate stacked cards.

## Changes

### `src/pages/SkillTargetDetail.tsx` (lines 162-225)
Merge the header card and skills section into a single two-column card:

- **Left column**: Category badge, due date, title, description, overall progress bar (existing content)
- **Right column**: "Skills Being Developed" section matching the reference image — each skill shows:
  - Skill name
  - Level transition badge (e.g., `B → A`)
  - Horizontal progress bar (amber/gold colored)
  - Percentage label

The progress bars will use `0%` as default since these are newly created targets with no step completions yet. The amber color matches the reference screenshot.

Single file change, ~40 lines modified.


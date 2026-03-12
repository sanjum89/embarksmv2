

# Fix Skill Target Creation: Auto-assign to User & Remove Skills Picker

## Changes

### 1. `src/pages/SkillTargetBuilder.tsx` — Two edits

**a) Auto-assign to current user on create (line ~238-253)**
- Import `useUser` from `@/contexts/UserContext`
- In `handleCreate`, set `assignedTo: [user.id]` instead of `[]`

**b) Remove any skills picker UI if present** (currently none exists — the previous plan was never implemented, so no removal needed)

### 2. `src/pages/SkillTargetDetail.tsx` — Show fallback when no skills data (line ~230)

Replace the conditional `{target.skills && target.skills.length > 0 && (` block so that when `skills` is empty/undefined, it shows a muted message like "Skills data is not available for this course" instead of hiding the section entirely.

### 3. `src/components/skill-target/SkillTargetCard.tsx` — No changes needed
The card already conditionally renders skills only when present — this is fine.

### Summary
- 2 files changed: `SkillTargetBuilder.tsx` (add user assignment), `SkillTargetDetail.tsx` (add empty-skills fallback)
- No skills picker to build or remove


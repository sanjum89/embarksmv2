

## Fix Hands-On Role Play Navigation and Agent One Skill Target Links

### Problem 1: Hands-On Role Play Shows Placeholder
The `HandsOnRolePlayCard` navigates to `/role-play-bank/${rolePlay.id}`, but when the `RolePlaySession` page loads, `getRolePlay(rid)` may fail to find the role play in state because the `RolePlayContext` re-initializes on account switches. The fallback generates a generic "Practice Scenario" placeholder instead of using the actual role play data with persona details.

**Root cause**: The `HandsOnRolePlayCard` navigates to `/role-play-bank/:rid` without a `skillTargetId` context, so when the role play isn't found in context state, the fallback path at line 82 (`if (skillTargetId)`) is skipped entirely, producing a bare-bones placeholder.

**Fix in `src/components/learnpath/HandsOnRolePlayCard.tsx`**: The card needs to know its parent skill target ID and navigate to `/skill-target/${skillTargetId}/role-play/${rolePlay.id}` instead of `/role-play-bank/${rolePlay.id}`. This provides the `skillTargetId` param to `RolePlaySession`, enabling a richer fallback if the role play isn't found in state.

Additionally, in `src/components/learnpath/LearnPathModuleContent.tsx`: Pass a `skillTargetId` prop to `HandsOnRolePlayCard`, derived from the current module's skill target context.

Also, ensure `RolePlaySession` checks `mockRolePlayBank` directly as a fallback if the role play isn't found in context state.

### Problem 2: "Skill Target not found" in Agent One Links
When Agent One shows the Skill Targets rich block, the AI backend generates target data from `skillTargetsSummary` which is passed in the system prompt. However, `skillTargetsSummary` (built at line 232-239 of `AgentOneContext.tsx`) does **not include the `id` field**. The AI backend instructions at line 89 tell the AI to include `"id":"target-id"` in the block data, but without actual IDs in the context, the AI either makes up IDs or omits them, causing navigation to `/skill-target/wrong-id`.

**Fix in `src/contexts/AgentOneContext.tsx`**: Add the `id` field to `skillTargetsSummary`:
```typescript
const skillTargetsSummary = useMemo(() =>
  assignedTargets.map(st => ({
    id: st.id,  // <-- ADD THIS
    title: st.title,
    progress: Math.round(st.progress || 0),
    status: st.locked ? "locked" : st.progress >= 100 ? "completed" : "in_progress",
    totalSteps: st.steps.length,
    completedSteps: st.steps.filter(s => s.status === "completed" || s.status === "skipped").length,
  })), [assignedTargets]);
```

This ensures the AI backend has real skill target IDs to include in `skill_targets_table` blocks, making the links work across all accounts including Pinnacle.

### Files Changed
| File | Change |
|---|---|
| `src/contexts/AgentOneContext.tsx` | Add `id: st.id` to `skillTargetsSummary` |
| `src/components/learnpath/HandsOnRolePlayCard.tsx` | Accept `skillTargetId` prop, navigate to skill-target-scoped route |
| `src/components/learnpath/LearnPathModuleContent.tsx` | Pass `skillTargetId` to `HandsOnRolePlayCard` |
| `src/pages/RolePlaySession.tsx` | Add fallback lookup to `mockRolePlayBank` when `getRolePlay` returns undefined |


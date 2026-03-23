

## Plan: Filter Nudge Cards by Audience Type in View Mode

### Problem
When Julian (manager) or Helena (admin) switches to "Me" (learner) mode, the DB query fetches ALL their nudge cards regardless of `audience_type`. Their manager/admin cards then get learner labels applied by `groupByCategory`, making them appear as learner onboarding/reflection/1:1 cards.

### Root Cause
`AgentOneNudgeStack.tsx` line 63-69 queries `nudge_cards` filtered only by `account_id` and `target_user_id` — it does NOT filter by `audience_type`. So Julian's 3 manager cards appear in "Me" mode with learner labels.

### Fix

**File: `src/components/chat/AgentOneNudgeStack.tsx`**

Add `.eq("audience_type", audienceType)` to the Supabase query (after line 67), so only cards matching the current view mode are returned.

Current line 55 already computes `audienceType` correctly from `user?.role`:
- "Me" mode → `setRole("learner")` → `audienceType = "learner"` → only learner cards shown
- "Team" mode → `setRole("manager")` or `setRole("admin")` → `audienceType = "manager"` → only manager cards shown

One adjustment needed: line 55 currently only checks for `"manager"`, but Helena's role in Team mode is `"admin"`. Update the audienceType derivation to handle all three roles:

```typescript
const audienceType = user?.role === "admin" ? "admin" 
  : user?.role === "manager" ? "manager" 
  : "learner";
```

This ensures:
- Julian in "Me" mode → queries `audience_type = 'learner'` → no results (he has no learner cards) → clean state
- Julian in "Team" mode → queries `audience_type = 'manager'` → his 3 manager cards
- Helena in "Me" mode → queries `audience_type = 'learner'` → no results → clean state  
- Helena in "Team" mode → queries `audience_type = 'admin'` → her 3 admin cards
- Clara/Elliot/Sophie → always `audience_type = 'learner'` → their 2 learner cards

### Files Changed

| File | Change |
|------|--------|
| `src/components/chat/AgentOneNudgeStack.tsx` | Add `audience_type` filter to query + handle "admin" role in audienceType derivation |

No DB changes needed. No seeding changes needed.


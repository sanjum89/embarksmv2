

# Fix My360 Manager Data & Remove u2-u5 Users

## Issues Found

1. **Maya (u6)** profile shows `manager: "Marcus Wellington"` but she reports to Alex Rivera
2. **Raj (u8)** profile shows `manager: "Marcus Wellington"` but he reports to Alex Rivera  
3. **Emma (u10)** profile shows `manager: "Marcus Wellington"` — this is correct
4. Users u2 (Jordan), u3 (Priya Sharma), u4 (Marcus Williams), u5 (Sofia) need to be fully removed

## Target Hierarchy After Changes

```text
Alex Rivera (u1) — manager
├── Maya Thompson (u6)
└── Raj Patel (u8)

Marcus Wellington (u7) — manager
└── Emma Sullivan (u10)
```

## Changes

### 1. `src/data/mock.ts`
- **Fix manager fields**: Change `manager` in u6 and u8 profile data from `"Marcus Wellington"` to `"Alex Rivera"`
- **Remove u2-u5 from `mockTeamMembers`** array (lines 165-168)
- **Remove u2-u5 from `mockSkillTargets` `assignedTo`** arrays (st1, st2, st3 reference them)
- **Remove u2-u5 from `mockPeopleGraphSignals`** (sig5-sig9)
- **Delete profile entries** for u2, u3, u4, u5 from `profileDataByUser` (~185 lines)

### 2. `src/data/managerSkillTargets.ts`
- Remove u2, u3, u4, u5 from `assignedTo` arrays in manager skill targets (mst3, mst4, mst5, etc.)

### 3. `src/lib/accountDefaults.ts`
- Remove the filter logic that maps u2-u5 into the employees array (line 28-30 — the `...mockTeamMembers.filter(...)` spread that adds Jordan, Priya, Marcus W, Sofia)

### 4. `src/components/my360/ActionPlanView.tsx`
- Replace static `profileDataByUser` import with account-aware data from `useAccount()`, consistent with the My360 page pattern

### Files modified
- `src/data/mock.ts` — fix manager fields, remove u2-u5 users/profiles/signals
- `src/data/managerSkillTargets.ts` — remove u2-u5 from assignedTo
- `src/lib/accountDefaults.ts` — remove u2-u5 from employee seeding
- `src/components/my360/ActionPlanView.tsx` — use account-aware profile data


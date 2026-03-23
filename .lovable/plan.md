

## Correction: Use Employee IDs in `demoScenarios`

### What changes

In `src/lib/accountDefaults.ts`, the `demoScenarios` map added to the default account data blob will use keys that explicitly reference **employee IDs**, not user IDs.

**Updated `demoScenarios` definition:**

```typescript
demoScenarios: {
  onboardingLearnerEmployeeId: "u12",        // Clara Whitfield
  risingStarEmployeeId: "u13",               // Elliot Hargreaves
  underperformerEmployeeId: "u14",            // Sophie Langford
  promotionCandidateEmployeeId: "u6",         // Maya Thompson
  managerEmployeeId: "u1",                    // Alex Rivera
  adminEmployeeId: "u11",                     // Sarah Chen
  reflectionTargetEmployeeIds: ["u6", "u8", "u10"]
}
```

Key naming uses `EmployeeId` suffix to make it unambiguous that these reference `employeesById` keys, not auth user IDs.

### Impact on other files from the approved plan

- **`src/data/agentOneSeeds.ts`** — reads `demoScenarios.onboardingLearnerEmployeeId` etc. to look up employees from `account.employeesById[id]`, then resolves the manager via `account.hierarchyMap`
- **`src/lib/agentOneTriggers.ts`** — event fields use `sourceEmployeeId` / `targetEmployeeId` (already correct in the plan)
- **`src/types/agentOneActions.ts`** — the `DemoScenarios` interface uses `...EmployeeId` field names

Everything else in the approved plan remains unchanged.




# Page Wiring Pass — Account-Aware Data Hookup

## Summary

Replace all direct `@/data/mock` imports and hardcoded data access in pages/components with account-aware reads from `useAccount()` + normalized selectors. No UI/layout changes.

## Files to Modify (14 files)

### Tier 1: High-impact pages

**1. `src/pages/LearnerChat.tsx`**
- Replace `import { profileDataByUser } from "@/data/mock"` with account-aware profile lookup
- Add `useAccount()`, use `getProfileData(normalizedAccount, user.id)` with fallback to legacy

**2. `src/pages/My360.tsx`**
- Already partially wired. Remove remaining `import { profileDataByUser as staticProfileData } from "@/data/mock"` — it's only used as a final fallback. Keep the fallback chain but source from normalized first.

**3. `src/components/my360/ActionPlanView.tsx`**
- Already uses `activeAccount?.data?.profileData` — add normalized account as primary source via `getProfileData(normalizedAccount, user.id)`

**4. `src/pages/ManagerView.tsx`**
- Already partially wired. The `generateResponse` function still references `mockNewHires` by name internally — ensure it uses the account-sourced data passed to it (already done via params, just naming clarity)

**5. `src/pages/TeamInsights.tsx`**
- Already wired via selectors. No changes needed.

### Tier 2: Manager tools

**6. `src/components/manager/NewHiresPanel.tsx`**
- Replace `import { mockNewHires } from "@/data/mock"` with props or account context
- Accept `newHires` as a prop from parent (ManagerView already has account-aware data)

**7. `src/components/manager/ProgramContextPanel.tsx`**
- Replace `import { mockProgramContexts, mockNewHires } from "@/data/mock"` with props or account context
- Accept `programContexts` and `newHires` as props

**8. `src/pages/ProgramContextPage.tsx`**
- Replace `import { mockProgramContexts, mockNewHires } from "@/data/mock"` with account-aware data via `useAccount()`

**9. `src/pages/ManagerSkillTargets.tsx`**
- Replace `import { managerSkillTargets } from "@/data/managerSkillTargets"` with account-aware fallback: use normalized `skillTargets` if present, fall back to `managerSkillTargets`

**10. `src/pages/ManagerSkillTargetDetail.tsx`**
- Same as above — source from normalized account with fallback

### Tier 3: Role Play & Learning

**11. `src/pages/RolePlayBank.tsx`**
- Replace `import { mockSkillTargets, mockNewHires } from "@/data/mock"` with account-aware data
- Use `useSkillTargets()` for skill targets (already available)
- Use `useAccount()` for newHires (for manager assignment list)

**12. `src/pages/ManagerRolePlay.tsx`**
- Replace `import { mockNewHires } from "@/data/mock"` with account-aware newHires from `useAccount()`

### Tier 4: Content pages (already context-driven)

**13. `src/pages/AIManager.tsx`**
- Add `useAccount()` to read `normalizedAccount?.aiContext` and `normalizedAccount?.branding`
- Pass account context (persona, tone) to `buildFlowSteps` if available
- Pass user's role/project info for account-specific messaging

**14. `src/pages/SkillTargetBuilder.tsx`**
- Replace `import { mockLearningModules, mockAssessments, mockRolePlayBank } from "@/data/mock"` with account-aware data: prefer normalized account content, fall back to mock

## Pattern for each file

```typescript
// Before
import { mockNewHires } from "@/data/mock";
// uses mockNewHires directly

// After
import { useAccount } from "@/contexts/AccountContext";
const { normalizedAccount, activeAccount } = useAccount();
const newHires = normalizedAccount?.newHires 
  ?? activeAccount?.data?.newHires 
  ?? defaultNewHires; // import default only as final fallback
```

## Files NOT changed
- `src/pages/Dashboard.tsx` — already uses `useSkillTargets()` context (account-aware)
- `src/pages/SkillTargetDetail.tsx` — already uses `useSkillTargets()` context
- `src/pages/RolePlaySession.tsx` — already uses `useRolePlays()` context
- `src/pages/AssessmentPage.tsx` — uses `mockAssessments` but these are content items, will wire via normalized `assessments` array
- `src/pages/LearningModulePage.tsx` — same pattern, wire via normalized `learningModules`
- `src/contexts/*` — already wired in previous pass
- All UI components, layouts, navigation — unchanged

## Data flow after wiring

```text
Account JSON → AccountContext (normalized) → Page hooks
                                           ↓
                              useAccount().normalizedAccount
                              useSkillTargets() 
                              useRolePlays()
                              useUser()
                                           ↓
                              Selectors: getProfileData, 
                              getDirectReports, etc.
                                           ↓
                              Existing page renders
```

## What does NOT change
- No page layouts, styling, or navigation changes
- No new pages or components
- No backend/DB changes
- No auth changes


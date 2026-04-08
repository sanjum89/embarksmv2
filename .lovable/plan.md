

## Duplicate Rathbones Account as "Pinnacle Capital"

### Approach

The Rathbones content is deeply embedded across ~15 source files (transcripts, scenarios, role descriptions, module titles, onboarding data). Rather than duplicating all those files, we'll use a **runtime name-substitution** system: clone the default account structure but store a `contentNameMap` in the account data that replaces "Rathbones" with "Pinnacle Capital" everywhere content is rendered.

### Implementation

**1. Add `contentNameMap` support to the account model**

Add an optional `contentNameMap: Record<string, string>` field to `NormalizedAccount` (in `types/account-v2.ts`). When set, all content rendering (transcripts, scenarios, module titles, role descriptions) will apply these substitutions before display.

**2. Create `buildPinnacleAccount()` in `accountDefaults.ts`**

A new function that calls `buildDefaultNormalized()` then:
- Sets `branding.name` to "Pinnacle Capital"
- Sets `isDefault` to false
- Adds `contentNameMap: { "Rathbones": "Pinnacle Capital", "rathbones": "pinnacle capital" }`
- Keeps all employees, skills, skill targets, role plays, assessments identical

**3. Seed the Pinnacle Capital account on startup**

In `AccountContext.tsx`, after loading/seeding the default account, check if a "Pinnacle Capital" account exists. If not, insert it into the `accounts` table using the Pinnacle builder. This mirrors the existing default-account seeding pattern.

**4. Add content substitution utility**

Create `src/lib/contentSubstitution.ts` with a `applyContentNames(text: string, nameMap: Record<string, string>): string` function that does a global case-preserving replacement.

**5. Wire substitution into content rendering**

Apply `applyContentNames()` in these rendering points (only when `contentNameMap` is set on the active account):
- `LearnPathModuleContent.tsx` — before rendering transcript/markdown content
- `VisualDiagram.tsx` — when parsing section titles and flow chart labels
- `HandsOnRolePlayCard.tsx` / `ScenarioQuestion.tsx` — scenario text
- `TraditionalContentViewer.tsx` — content display
- `LearningModulePage.tsx` — module title display

This is a lightweight hook: `useContentSubstitution()` that reads `contentNameMap` from the active normalized account and returns a `substitute(text)` function.

### Files to create/modify

| File | Change |
|---|---|
| `src/types/account-v2.ts` | Add optional `contentNameMap` field to `NormalizedAccount` |
| `src/lib/contentSubstitution.ts` | **NEW** — `applyContentNames()` utility + `useContentSubstitution()` hook |
| `src/lib/accountDefaults.ts` | Add `buildPinnacleNormalized()` function |
| `src/contexts/AccountContext.tsx` | Seed Pinnacle Capital account on first load if missing |
| `src/components/learnpath/LearnPathModuleContent.tsx` | Apply content substitution to rendered text |
| `src/components/learnpath/VisualDiagram.tsx` | Apply substitution to parsed labels |
| `src/components/learnpath/HandsOnRolePlayCard.tsx` | Apply substitution to scenario text |
| `src/components/learnpath/ScenarioQuestion.tsx` | Apply substitution to question text |
| `src/components/skill-target/TraditionalContentViewer.tsx` | Apply substitution |
| `src/pages/LearningModulePage.tsx` | Apply substitution to title |


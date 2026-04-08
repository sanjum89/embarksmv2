

## Pre-Create Role Plays for All Skill Target Chapters

### Problem
1. Many modules in hands-on mode share the same few role plays or have none (`RAT-LM-008` has `rolePlayIds: []`).
2. When a role play ID isn't found in `mockRolePlayBank`, `RolePlaySession.tsx` shows a generic "Practice Scenario" placeholder with "A realistic practice partner" — no meaningful content.
3. The user wants every skill target chapter to have a dedicated, contextual role play in the bank.

### Plan

#### 1. Add new role plays to `mockRolePlayBank` in `src/data/mock.ts`

Create unique role plays for modules that currently share or lack role plays. Each new entry will have a contextual persona and scenario derived from the module's topic. New IDs will follow the pattern `rp-rb-{topic}`. Approximate additions:

- **RAT-LM-001** → `rp-rb-value-articulation` (prospect challenging fee justification)
- **RAT-LM-002** → `rp-rb-risk-profiling` (client risk profile reassessment)
- **RAT-LM-003** → `rp-rb-portfolio-construction` (concentrated position discussion)
- **RAT-LM-005** → `rp-rb-internal-collab` (divorce case multi-team coordination)
- **RAT-LM-007** → `rp-rb-clear-communication` (explaining alternatives to non-financial client)
- **RAT-LM-008** → `rp-rb-documentation` (documenting under pressure)
- **RAT-LM-009** → `rp-rb-fee-discussion` (fee challenge at annual review)
- **RAT-BR-001** → `rp-rb-domain-vocab` (bridging banking terminology)
- **RAT-BR-002** → `rp-rb-bespoke-vs-product` (explaining bespoke vs product distribution)
- **RAT-BR-003** → `rp-rb-rate-impact` (explaining rate impact on bonds)
- **RAT-BR-LM-004** → `rp-rb-gap-recognition` (recognising knowledge gaps as domain-bridge joiner)

Each will have unique persona names, backgrounds, and detailed context (similar quality to existing Rathbones role plays).

#### 2. Update `moduleRolePlayMap` in `src/data/mock.ts`

Point each module to its new dedicated role play ID instead of sharing existing ones. All alias IDs (RAT-INTRO-LM-*, RAT-BR-LM-*) will also be updated.

#### 3. Update `handsOnScenarios` `rolePlayIds` in `src/data/handsOnScenarios.ts`

Update every entry's `rolePlayIds` array to reference the new dedicated role play for that module. Fix the empty `RAT-LM-008` entry.

#### 4. Improve fallback in `RolePlaySession.tsx`

Instead of the generic "Practice Scenario" placeholder, derive context from the skill target step data (title, description) when a role play isn't found in the bank. This ensures even edge cases show meaningful content.

### Files Changed

| File | Change |
|---|---|
| `src/data/mock.ts` | Add ~11 new role plays to `mockRolePlayBank`; update `moduleRolePlayMap` entries |
| `src/data/handsOnScenarios.ts` | Update `rolePlayIds` arrays to reference new dedicated role plays |
| `src/pages/RolePlaySession.tsx` | Improve fallback to derive persona/scenario from skill target step context |


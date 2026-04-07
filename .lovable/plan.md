

## Fix "Module not found" — DB steps have no matching catalog modules

### Root Cause

The Rathbones account data in the database has skill target steps with IDs like `RAT-INTRO-LM-001`, `RAT-INTRO-LM-002`, etc. These steps do NOT have a `referenceId` pointing to `m-rb*` mock modules. The account parser (line 606) falls back to `step.id` when `referenceId` is missing, so both `id` and `referenceId` end up as `RAT-INTRO-LM-001`.

The resolver then searches for `RAT-INTRO-LM-001` in the catalog — which contains mock modules like `m-rb1` and account modules like `RAT-LM-001` — but no module with ID `RAT-INTRO-LM-001` exists anywhere. Result: `undefined` → "Module not found."

The DB steps DO contain content metadata (title, description, contentType, minutes) but no corresponding `LearningModule` entry exists in any catalog.

### Fix

Update `resolveModule` in `src/lib/learnPathModuleResolver.ts` to synthesize a `LearningModule` from the step data when no catalog match is found. After the existing lookup attempts, scan skill target steps for a matching step ID and build a module from the step's own fields (title, description as transcript, contentType, duration).

### Changes

**`src/lib/learnPathModuleResolver.ts`** — Add a step 3 to `resolveModule`:
- After direct match and referenceId resolution both fail, find the matching step in `skillTargets`
- Build a synthetic `LearningModule` from the step's `title`, `description` (as transcript), `contentType` (default `"document"`), `duration`, and `contentUrl` (placeholder)
- Return the synthetic module so the content panel can render it

This is a single-file change of about 15 lines. No other files need modification — the rest of the pipeline (auto-resume, action protocol, content renderer) already works once the resolver returns a valid module.

### Files Modified

| File | Change |
|---|---|
| `src/lib/learnPathModuleResolver.ts` | Add synthetic module fallback from step data when no catalog match found |


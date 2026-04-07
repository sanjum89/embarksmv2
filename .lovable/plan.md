

## Fix LearnPath Module Resolution and Add Empty-State Skill Gap View

### Problem

1. **"Module not found"**: LearnPath imports `expandedModules` (IDs `m20`-`m119`) but Rathbones skill targets reference `m-rb1` through `m-rb7`, which live in `mockLearningModules` from `mock.ts`. The module lookup fails silently.

2. **No empty state for users without skill targets**: Users with no assigned skill targets see a generic welcome screen with no guidance.

3. **No auto-resume**: Users returning to LearnPath always start from the welcome screen instead of resuming where they left off.

### Changes

#### 1. Fix module lookup — use `mockLearningModules` instead of `expandedModules`

**Files**: `LearnPathContent.tsx`, `LearnPathModuleContent.tsx`, `LearnPathChat.tsx`

Replace `import { expandedModules } from "@/data/contentModules"` with `import { mockLearningModules } from "@/data/mock"` in all three files. The `mockLearningModules` array already includes both `expandedModules` (spread) and the `m-rb*` Rathbones modules.

#### 2. Add empty-state view with skill gaps and recommended skill targets

**File**: `LearnPathContent.tsx` — new branch in the welcome/modules view

When `skillTargets` has zero module-type steps:
- Left chat: AI Manager greets user, explains no learning path is assigned, and suggests skill targets based on their gaps
- Right panel: Show the user's skill gaps (from `skillRecommendations.ts`) and link to the Dashboard's "Browse" or "Create Skill Target" actions. Once a skill target is added, LearnPath auto-populates.

#### 3. Auto-resume: open the first incomplete module on load

**File**: `LearnPathChat.tsx` — modify the auto-greet system message

Include in the system message context which module the user should resume (first step with status `available` or `in_progress`). The AI will use an `open_module` action tag to auto-navigate to it. The edge function system prompt already supports this — it just needs the right hint in the context.

**File**: `LearnPathContent.tsx` — on initial mount, if there are module steps and user has progress, auto-set `contentView` to `module` with the resume module.

### Files Modified

| File | Change |
|---|---|
| `src/components/learnpath/LearnPathContent.tsx` | Use `mockLearningModules`, add empty-state skill gap view, add auto-resume logic |
| `src/components/learnpath/LearnPathModuleContent.tsx` | Use `mockLearningModules` instead of `expandedModules` |
| `src/components/learnpath/LearnPathChat.tsx` | Use `mockLearningModules`, add resume hint to context, add empty-state context hint |
| `supabase/functions/learnpath-chat/index.ts` | Add handling for "no modules assigned" scenario in system prompt (suggest skill targets) |


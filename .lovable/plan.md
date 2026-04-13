

## Fix Corrupted LearnPath Files — Restore Missing Code

### Problem
The previous edit used `...` (ellipsis) as a shorthand when rewriting both files, but those literal `...` characters ended up in the actual source code, deleting ~90 lines from `LearnPathChat.tsx` and ~40 lines from `LearnPathContent.tsx`. This removed:
- **LearnPathChat**: The `ChatMessage` interface, constants (`LEARNPATH_CHAT_URL`, `MAX_TRANSCRIPT_CONTEXT_CHARS`), helper functions (`createMessageId`, `stripMarkdownDecorators`, `parseActions`), component declaration, all state hooks, scroll effect, and the start of `buildContext`
- **LearnPathContent**: The `UnifiedStep` interface export, component declaration, all hook calls (`useLearnPath`, `useSkillTargets`, `useUser`, etc.), and `autoResumedRef`

### Solution
Restore the deleted code from git history (`a787c3e`), but keep the intended improvement: replace the old inline sorting logic with the centralized `getAssignedSkillTargetsForUser` + `orderSkillTargets` from `@/lib/skillTargetSequence`.

### Changes

**`src/components/learnpath/LearnPathContent.tsx`** — Replace the `...` on line 18 with the restored code:
- `UnifiedStep` interface export
- `LearnPathContent` function declaration with all hooks
- `autoResumedRef`
- `catalog` line
- Use `getAssignedSkillTargetsForUser` + `orderSkillTargets` (already imported) instead of old inline filter+sort
- Add `useMemo` to the react import (already there)

**`src/components/learnpath/LearnPathChat.tsx`** — Replace the `...` on line 15 with the restored code:
- `ChatMessage` interface
- `LEARNPATH_CHAT_URL` and `MAX_TRANSCRIPT_CONTEXT_CHARS` constants
- `createMessageId`, `stripMarkdownDecorators`, `parseActions` helper functions
- `LearnPathChat` component declaration with all state hooks and scroll effect
- `buildContext` callback opening, using `getAssignedSkillTargetsForUser` + `orderSkillTargets` instead of old inline sort

### Result
Both files compile again. Module ordering uses the centralized sequencing, ensuring Elliot sees Introduction → Domain Bridge → Foundations.

### Files Changed
| File | Change |
|---|---|
| `src/components/learnpath/LearnPathChat.tsx` | Restore ~85 deleted lines (interface, helpers, component declaration), use centralized ordering |
| `src/components/learnpath/LearnPathContent.tsx` | Restore ~35 deleted lines (interface, component declaration, hooks), use centralized ordering |


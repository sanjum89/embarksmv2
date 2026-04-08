

## Auto-Congratulate on Module Completion (System Message Hidden)

### Approach

Same plan as before, with explicit handling to ensure the `[SYSTEM]` completion message is never visible in the chat UI. The existing `visibleMessages` filter in `LearnPathChat.tsx` already strips messages starting with `[SYSTEM]` — the injected completion message will use that same prefix, so it will be automatically hidden.

### Changes

| File | Change |
|---|---|
| `src/contexts/LearnPathContext.tsx` | Add `lastCompletedModule` state (`{ moduleId, moduleTitle, nextModuleId?, nextModuleTitle?, skillTargetId? } | null`) and `notifyModuleCompleted()` function. Expose both in context. |
| `src/components/learnpath/LearnPathContent.tsx` | In the `onComplete` callback, call `notifyModuleCompleted()` with current module info and the next incomplete module from `moduleSteps`. |
| `src/components/learnpath/LearnPathChat.tsx` | Add `useEffect` on `lastCompletedModule`. When set, inject a `[SYSTEM]` prefixed message (hidden by existing filter on line ~250: `!message.content.startsWith("[SYSTEM]")`), then call `sendToAI`. Clear `lastCompletedModule` after sending. |

### Flow
```text
Mark as Complete → onComplete() → notifyModuleCompleted({...})
  → LearnPathChat useEffect fires
  → Adds hidden [SYSTEM] message: "Learner completed X. Congratulate briefly, suggest Y."
  → AI responds conversationally + <!--ACTION:open_module-->
  → User sees only the AI congratulation, not the system trigger
```

No edge function changes needed — existing prompt already handles `[SYSTEM]` messages and `open_module` actions.


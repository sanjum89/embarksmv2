
Goal

Fix LearnPath so Clara opens the actual first assigned chapter on the right, keep the “no learning path yet” experience for users without assigned content, and remove the redundant floating AI launcher on `/learnpath`.

What I found

- The right panel is failing because LearnPath currently resolves modules from a fixed mock catalog instead of the active account’s learning modules.
- The AI/chat side is sending an `open_module` action with ids like `RAT-INTRO-LM-001`, but the content panel is searching a different module source, so it falls through to “Module not found.”
- LearnPath is also using the raw step reference too directly; for custom account data, that needs a safer resolver.
- The floating AI icon comes from the global `AIChatWrapper`, which is hidden on `/chat` but not on `/learnpath`.
- No redesign is needed: once the correct module resolves, the existing right-side LearnPath UI can show the experience you want.

Implementation plan

1. Make LearnPath use the active account’s module library
- Switch LearnPath to read `normalizedAccount.learningModules` first, with fallback to the built-in mock modules only when needed.
- Add one shared LearnPath resolver so chat, auto-resume, cards, and assessment all use the same module lookup logic.

2. Fix module resolution for assigned skill-target steps
- Resolve each module step against the real module catalog by:
  - `referenceId` first
  - then step/module id
  - then title as a safe fallback
- Use the resolved module’s real id everywhere LearnPath opens content.

3. Fix chat + auto-resume to open the actual first chapter
- Update `LearnPathChat` so the AI action uses the resolved module id, not just the raw step identifier.
- Update `LearnPathContent` auto-resume so it opens the first available/in-progress chapter from the assigned skill target using that same resolved id.
- This will make “Introduction to Rathbones → Our Heritage & Values” open correctly on the right.

4. Keep the empty-state behavior, but base it on resolvable modules
- If a user truly has no assigned/resolvable module content, keep the current empty state:
  - left: explain no learning path exists yet
  - right: show skill gaps and suggested targets
- If the user does have valid module content, skip the empty state and open the first relevant chapter.

5. Remove the floating AI icon on this page
- Update the global floating chat wrapper so it does not render on `/learnpath`.
- Leave the rest of the app unchanged.

Files likely involved

- `src/components/learnpath/LearnPathChat.tsx`
- `src/components/learnpath/LearnPathContent.tsx`
- `src/components/learnpath/LearnPathAssessment.tsx`
- `src/components/chat/AIChatWrapper.tsx`
- likely one small shared LearnPath module-resolution helper

Technical detail

The main issue is a data wiring mismatch, not the page layout itself: the chat is opening a module id from the assigned skill-target data, while the content panel is searching the wrong catalog. Fixing the source-of-truth for module resolution will fix Clara’s case and make custom account data work reliably.

QA after implementation

- Clara: `/learnpath` opens “Our Heritage & Values” on the right, no “Module not found”
- User with no assigned path: left chat explains it, right panel shows gaps and suggested targets
- Custom account modules still resolve correctly
- Floating AI icon is absent on `/learnpath`

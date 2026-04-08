
No — we do not need to rebuild all the skill targets. The detailed Rathbones content already exists in the codebase. The bug is in how the live Clara data is being resolved.

What’s actually failing
- The live route is using IDs like `RAT-INTRO-LM-001`.
- The rich module catalog is keyed under IDs like `m-rb-intro-heritage` and `RAT-INTRO-001`.
- In `src/lib/accountParser.ts`, if a step has no `referenceId`, it gets replaced with `step.id`.
- In `src/lib/learnPathModuleResolver.ts`, that means the resolver only sees the live DB ID, fails to find a catalog match, and falls back to `step.description`.
- That fallback is exactly the one-line placeholder text you’re seeing.
- Also, `src/components/skill-target/TraditionalContentViewer.tsx` still shows a generic preview shell for document/PDF modules, so the right panel can still look blank/placeholder there.

Implementation plan
1. Fix the resolver, not the content
- Update `src/lib/learnPathModuleResolver.ts` so that when an exact catalog ID is missing, it tries smarter recovery before synthesizing:
  - matched step’s `id` and `referenceId`
  - normalized Rathbones aliases (for example `RAT-INTRO-LM-001` -> `RAT-INTRO-001`)
  - exact/normalized title match such as `Our Heritage & Values`
- Keep the current synthetic fallback only as the last resort.

2. Make both viewers use the same rich resolved module
- `src/pages/LearningModulePage.tsx`: keep rendering the resolved module content directly.
- `src/components/skill-target/TraditionalContentViewer.tsx`: switch to document-first rendering:
  - video = preview + full transcript
  - document/PDF = full markdown content inline, no placeholder preview

3. Keep progress updates working
- Preserve completion logic against the actual step `id` / `referenceId` so Clara, Elliot, and Sophie can still complete chapters normally even if the displayed content came from an alias/title match.

Why previous attempts failed
- They fixed the page rendering, but not the real live-data mismatch.
- The key missing piece is handling the DB IDs that do not match the authored module catalog IDs.

Files to update
- `src/lib/learnPathModuleResolver.ts`
- `src/components/skill-target/TraditionalContentViewer.tsx`
- `src/pages/LearningModulePage.tsx`

Expected result
- Clara’s chapters will show the full authored Rathbones content.
- Elliot and Sophie will inherit the same fix automatically.
- PDF/document chapters will render the full content inline instead of showing a blank placeholder.
- No need to recreate the skill targets from scratch.

QA
- Test `/skill-target/RAT-ST-INTRO-001/module/RAT-INTRO-LM-001`
- Test opening the same chapter from the skill target right panel
- Test one document module and one video module for Clara, then spot-check Elliot and Sophie

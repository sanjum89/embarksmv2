

## Fix LearningModulePage to Show Rich Content for All Chapters

### Root Cause

`LearningModulePage.tsx` does NOT use the shared `resolveModule()` function. Instead it has its own lookup logic (line 16-35) that:
1. Checks only account modules OR mock modules (not both merged)
2. Falls back to synthesizing a module from `step.description` — a one-liner — producing the placeholder text the user sees

The rich transcripts for `RAT-LM-001` etc. already exist in `mockLearningModules` (added in the previous change to `mock.ts`). The shared `resolveModule()` function in `learnPathModuleResolver.ts` correctly merges account + mock catalogs and would find them. This page just doesn't call it.

Additionally, document-type modules show a faux-PDF skeleton instead of rendering the actual content inline.

### Changes

**File: `src/pages/LearningModulePage.tsx`**

1. Replace the manual module lookup (lines 11-35) with a call to `resolveModule(mid, skillTargets, normalizedAccount?.learningModules)` from `learnPathModuleResolver.ts`
2. For `contentType === "document"` modules: remove the PDF skeleton placeholder (lines 172-192) and render the transcript/content directly using `ReactMarkdown` in a clean reading layout
3. For `contentType === "video"` modules: keep the video preview, render transcript below using `ReactMarkdown` instead of plain `whitespace-pre-line` text
4. Update the "Mark as Complete" handler to match steps by both `step.id === mid` and `step.referenceId === mid` (lines 52, 55) so progress works regardless of which ID format the URL uses
5. Add `react-markdown` import

No other files need changes — the resolver, transcripts, and mock catalog entries are already in place from previous work.

### Expected Result
- Clara's chapters show the full 800-1200 word realistic training content
- Document chapters render content inline (no blank PDF placeholder)
- Video chapters show preview + formatted transcript
- Mark-as-complete still works correctly


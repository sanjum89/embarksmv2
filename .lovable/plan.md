## Problem

When the learner asks Embark AI "how do I get started?", it offers the **first reading chapter** of a module that is actually configured as a **Quick diagnostic** ("3-question") delivery. The chapters under a diagnostic module are visually marked as "skipped" in the journey accordion (the synthetic *Quick diagnostic* row replaces them), but the AI is unaware of this and points learners straight at the chapters that have been bypassed.

Same problem applies to **microlearning** (condensed) and **evidence_required** (submit task) modules — the AI references generic first chapters instead of the persona-tailored entry point.

## Root cause

`src/components/learnpath/LearnPathChat.tsx` builds the cohort context for the AI (lines ~129–158). For every module it computes:

```
upNextChapterCode  = first in_progress / not_started real chapter
upNextChapterTitle = title of that chapter
```

It does this regardless of `adaptation.adaptationType`. The journey accordion, by contrast, prepends a synthetic chapter `__diag::<moduleCode>` (or `__evi::<moduleCode>`) for diagnostic / evidence modules and treats the real chapters as skipped. `LearnPathContent.tsx` (lines 141–151) already knows how to render those synthetic codes.

So the AI receives a wrong "up-next" pointer and happily surfaces it.

## Fix

Two small, focused changes.

### 1. `src/components/learnpath/LearnPathChat.tsx` — context build

Inside the cohort module mapping, after computing `upNextChapter`, override it based on the module's adaptation lens (only when module is not yet completed):

- `diagnostic_only` → `upNextChapterCode = "__diag::<moduleCode>"`, `upNextChapterTitle = "Quick diagnostic — 3 questions"`, `upNextChapterKind = "diagnostic"`.
- `evidence_required` → `upNextChapterCode = "__evi::<moduleCode>"`, `upNextChapterTitle = "Submit evidence — short written task"`, `upNextChapterKind = "evidence"`.
- `microlearning` → keep real chapter, add `upNextChapterKind = "condensed"`.
- `skip_after_validation` → keep real chapter (rare case where it's still visible) but mark `upNextChapterKind = "already_covered"`.
- `full_module` / undefined → unchanged, kind = `"reading"`.

Also adjust the `cohortResumeModule` picker so it deprioritizes `skip_after_validation` modules:

```
cohortModules.find(m => m.status === "in_progress" && m.adaptationType !== "skip_after_validation")
  ?? cohortModules.find(m => m.status === "up_next"   && m.adaptationType !== "skip_after_validation")
  ?? <existing fallbacks>
```

The `cohortJourney.resumeChapterCode/Title` will then automatically carry the synthetic `__diag::` / `__evi::` codes, which `EmbarkProvider.openModule` already routes correctly.

### 2. `supabase/functions/learnpath-chat/index.ts` — system prompt

Two additions:

a. In the **Cohort Journey Awareness** block, add:

> When the learner asks to start, use **resumeChapterCode** verbatim as the `moduleId` in the `open_module` action — even when it begins with `__diag::` or `__evi::`. Those are the persona's correct entry points (a 3-question diagnostic or an evidence task). Never replace them with a real reading chapter.

b. In the **Tone** block, extend the delivery-tag guidance:

> For **Quick diagnostic** modules the first step is the diagnostic itself, not the chapters — phrase it as "let's do the quick 3-question check first" and offer the diagnostic. For **Evidence task** modules, frame it as "submit a short piece of work that shows you've got this". For **Condensed module** (microlearning), say "I've trimmed it to the parts that are likely new for you". For **Already covered**, never surface as the next step.

c. In **Action Protocol**, add a one-line clarification:

> `moduleId` may be a real chapter code, a synthetic `__diag::<moduleCode>` (Quick diagnostic), or `__evi::<moduleCode>` (Evidence task). All three are valid — pass them through unchanged.

## Out of scope

- No DB / migration changes.
- No changes to the journey accordion, the diagnostic UI, or `LearnPathContent` routing — those already handle synthetic chapter codes correctly.
- No changes to legacy (non-cohort) module path.

## Files

- `src/components/learnpath/LearnPathChat.tsx` (cohort module mapping + resume picker, ~30 lines).
- `supabase/functions/learnpath-chat/index.ts` (3 prompt insertions, ~10 lines).

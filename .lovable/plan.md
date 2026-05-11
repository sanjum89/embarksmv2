## Part A — Audit & refresh persona memory

**Audit result (DB is source of truth, matches your spec):**

| ID | Name | Archetype | Career | Domain |
|---|---|---|---|---|
| rb-l1 | Sophie Linden | early__outside_fs | Early | Outside FS |
| rb-l2 | Maya Holloway | early__fs_non_im | Early | In FS, not IM |
| rb-l3 | **Theo Marchant** | **early__in_im** | **Early** | **In IM** ✅ |
| rb-l4 | Owen Castell | mid__outside_fs | Mid | Outside FS |
| rb-l5 | Priya Aldridge | mid__fs_non_im | Mid | In FS, not IM |
| rb-l6 | **Clara Wren** | **mid__in_im** | **Mid** | **In IM** ✅ (primary) |
| rb-l7 | Rosa Belmont | exp__outside_fs | Experienced | Outside FS |
| rb-l8 | Felix Arden | exp__fs_non_im | Experienced | In FS, not IM |
| rb-l9 | Elliot Hayes | exp__in_im | Experienced | In IM |

The data is correct. My earlier answers were drawn from a stale memory file that listed obsolete personas (Beatrice, Harriet, Louis, Amelia, Isla, Helena). Memory will be rewritten:

- Rewrite `mem://features/rathbones-workforce-mapping` with the 9-persona archetype matrix above + roster IDs.
- Rewrite `mem://features/felix-arden-persona` — he is **Experienced, in FS but not IM** (lateral hire needing IM domain bridge), not "early-career Assistant IM" as currently described.
- Quick-verify `mem://features/clara-wren-persona` says Mid-career, In IM, Associate IM.
- Add a Core memory line: "Rathbones personas live in DB `employee_persona_assignments`; never re-introduce Julian/Helena/Beatrice/Harriet/Louis/Amelia/Isla — they were removed."

## Part B — Make Embark fully cohort-aware

**Root cause of "no modules assigned":** `src/components/learnpath/LearnPathChat.tsx` builds chat context **only** from the legacy `useSkillTargets()` slice via `getAssignedSkillTargetsForUser`. Clara has zero legacy skill targets — her work lives in the new cohort tables (`cohort_enrollments`, `catalog_modules`, `catalog_chapters`, `learner_progress`). So `context.modules = []` is sent to `learnpath-chat`, which dutifully renders the "When No Modules Are Assigned" branch and tells her to go to the Dashboard.

The right panel works because `EmbarkJourneyView` already uses `useLearnerJourney`. Only the **chat side** plus a couple of resolution helpers still assume legacy skill targets.

### Changes

1. **`src/components/learnpath/LearnPathChat.tsx`**
   - Call `useLearnerJourney(activeAccountId, linkedEmployeeId)`.
   - Flatten cohort journey into a `cohortModules` array: `{ moduleCode, title, trackName, status, completedChapters, totalChapters, isCoreRequired, isStretch, upNextChapterCode, upNextChapterTitle }`.
   - Concatenate cohortModules + legacy moduleSteps into `modules` (cohort first when present), and add a new top-level `cohortJourney` block: `{ cohortTitle, dueDate, overallPct, completedModules, totalModules, completedChapters, totalChapters, activeTrackName, resumeModuleCode, resumeModuleTitle, resumeChapterCode, resumeChapterTitle }`.
   - Compute `resumeModuleId / resumeModuleTitle / resumeSkillTargetId` from the journey when available (first `in_progress` chapter, else first `up_next` module's first chapter), falling back to legacy logic.
   - Set `hasModules = cohortModules.length > 0 || moduleSteps.length > 0`.
   - Update the [SYSTEM] greeting at line ~475 to mention the cohort by name when `cohortJourney` is present (e.g. "They're enrolled in **{cohortTitle}**, currently {pct}% through. Resume with chapter **{resumeChapterTitle}** in **{resumeModuleTitle}**.").

2. **`supabase/functions/learnpath-chat/index.ts`**
   - Render a new `## Your Cohort Journey` block above `## Assigned Modules` when `context.cohortJourney` is set (cohort title, due date, overall %, current track, resume target).
   - In `## Assigned Modules`, if a module entry has `moduleCode`/`trackName`, format it as `- [{trackName}] {title} (code: {moduleCode}, {completedChapters}/{totalChapters} chapters, status: {status})`.
   - Tighten the "When No Modules Are Assigned" rule: only fires when **both** legacy modules and cohort journey are empty. When a cohort is present but the learner says "let's start" / "begin" / "what's next", emit an `open_module` action with the resume chapter and a one-sentence pointer ("Picking up at **{resumeChapterTitle}** — first chapter of **{resumeModuleTitle}**.").
   - Extend the Action Protocol: `open_module` may use a cohort `chapterCode` (`{"type":"open_module","moduleCode":"...","chapterCode":"..."}`); document both shapes.

3. **`src/contexts/LearnPathContext.tsx` `openModule()`**
   - Accept an optional `chapterCode` and treat module/chapter codes from the cohort as first-class IDs (no skill-target dependency). Currently `openModule(moduleId, skillTargetId?)` assumes legacy IDs; broaden so AI actions targeting cohort chapters work without throwing.

4. **`src/components/learnpath/LearnPathContent.tsx` (module render branch, line 134)**
   - When `activeModuleId` is a cohort chapter code (not found via `resolveModule(... skillTargets)`), look it up against the `useLearnerJourney` data and render `EmbarkModuleContent` with the cohort chapter metadata instead of falling through to the "Chapter unavailable" empty state.
   - Replace the legacy "skill targets" copy in the empty-state branch (line 235) with cohort-first language ("You're not enrolled in a cohort yet…") so any non-cohort, non-legacy learner sees consistent wording.

5. **Sanity sweep** — grep `getAssignedSkillTargetsForUser`, `useSkillTargets`, "skill target" copy across `src/components/learnpath/*` and `src/pages/LearnPath*.tsx`. Anywhere it gates *visibility* of Embark UI (not pure legacy-only views), add a `hasJourney` fallback. Document remaining legacy-only call sites (e.g. assessment view at line 116) with a `// LEGACY:` comment so it's clear the cohort path is canonical going forward.

### Out of scope
- No DB schema changes, no migrations.
- Legacy Cornerstone/Pinnacle accounts keep working through the existing skill-target path — cohort logic is purely additive.
- Voice agent / role-play surfaces unchanged.

### Verification
- Log in as Clara → Embark page → type "lets start" → AI should acknowledge the **Investment Management Readiness — Jan 2026** cohort and open the first chapter of **Introduction to Wealth Management and the Rathbones Approach**.
- Log in as a legacy demo user (Cornerstone) → Embark still resumes their skill target as before.
- Refresh the persona memory file and confirm it now lists exactly the 9 archetypes above.

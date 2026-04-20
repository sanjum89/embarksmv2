

## Plan: Redesign "All Modules" view as a hierarchical, status-aware journey

### Problem

Today the **All Modules** view (`EmbarkContent` → `contentView === "modules"`) is a flat 2-column grid of every step — chapters, assessments and role plays all mixed together, with the parent skill target shown only as a small badge inside each card. As a learner you can't tell:
- which **module (skill target)** a chapter belongs to
- which one you're **currently on**
- which **module + chapter** is **complete vs locked vs upcoming**
- and there's no quick **preview** affordance

### New design — Accordion grouped by Skill Target ("Module")

Replace the flat grid with one expandable section per skill target. Each section is the parent **Module**; its `steps` are the **Chapters** (chapter / assessment / role play) listed in order inside.

```text
┌──────────────────────────────────────────────────────────────┐
│ Your Embark Journey       ████████░░ 2 of 6 modules • 33%    │
│ [All]  [In progress]  [Completed]  [Locked]                  │
└──────────────────────────────────────────────────────────────┘

▼ ① Introduction to Rathbones                   IN PROGRESS
   ─────────────────────────────────────────────────────────
   3 of 4 chapters • ████████░░ 75%
   ─────────────────────────────────────────────────────────
   ✓ 1. Welcome & Orientation              Reading · 5 min
   ✓ 2. Our Heritage & Values              Reading · 8 min
   ► 3. Your First 90 Days   ← YOU ARE HERE  Visual · 10 min
   • 4. Baseline Assessment                Assessment · 6 q
                                                    [Preview ▸]

▶ ② Investment Management Foundations           UP NEXT
   0 of 5 chapters • ░░░░░░░░░░ 0%

▶ ③ Professional Standards & Ownership          🔒 LOCKED
   Complete "Investment Management Foundations" to unlock
```

### Behavior

**Header strip (always visible):**
- Title "Your Embark Journey"
- Overall progress: `X of Y modules complete` + thin bar
- Filter chips: **All / In progress / Completed / Locked** — filters which modules expand and dims the rest

**Module (skill target) row — collapsed:**
- Number badge, title, status pill (`IN PROGRESS` / `COMPLETED` / `UP NEXT` / `LOCKED`)
- One-line meta: `N of M chapters · progress bar · due date`
- Locked modules show prerequisite hint
- Click row → expand. The module containing the **active chapter** is **expanded by default**

**Module row — expanded:** vertical chapter list reusing the timeline pattern from `TraditionalActivitiesPanel` (icon circle + connector line):
- ✓ green filled = completed
- ► accent-filled with "YOU ARE HERE" pill = current `in_progress` chapter
- • outline = available / upcoming
- 🔒 muted = locked
- Chapter row shows: order number, title, type label (Chapter / Assessment / Role Play), duration
- **Hover/right side**: secondary `Preview ▸` button — opens that chapter without changing journey state (read-only viewer flag — see Tech section)
- **Click row**: opens chapter normally (`openModule` / `openAssessment`)

**"You are here" anchor:** on first render of the modules view, scroll the active chapter into view inside its expanded module so the learner immediately sees where they are.

### What you'll see

- Open All Modules → "Introduction to Rathbones" is expanded by default with chapter 3 highlighted as "YOU ARE HERE"; other modules are collapsed one-liners with their own status pills
- Filter to **Completed** → only finished modules expand; everything else dims
- Click `Preview ▸` on a future chapter → opens that chapter for read-only browsing without altering progress
- Click the chapter row itself → normal open (resumes / starts the chapter)
- Locked modules clearly show what unlocks them (existing `prerequisiteId` data)

### Files to touch

- **New** `src/components/learnpath/LearnPathJourneyAccordion.tsx` — the grouped accordion view (uses `@/components/ui/accordion` already in the project, plus `Progress`, `Badge`, `Button`).
- **Edit** `src/components/learnpath/LearnPathContent.tsx` — in the `contentView === "modules"` branch, replace the flat grid with `<LearnPathJourneyAccordion steps={allSteps} activeChapterId={activeModuleId} />`. Keep the existing header.
- **New** `src/components/learnpath/LearnPathChapterRow.tsx` — single chapter row (icon, status, title, type, duration, Preview button). Reuses status-icon pattern from `TraditionalActivitiesPanel`.
- **Edit** `src/contexts/LearnPathContext.tsx` — add an optional `previewMode: boolean` flag on state plus `openModulePreview(moduleId, skillTargetId)` / `openAssessmentPreview(stepId)` actions that set `previewMode = true` and open the content. Reset to `false` whenever a chapter is opened normally or completed.
- **Edit** `src/components/learnpath/LearnPathModuleContent.tsx` — when `previewMode` is true, hide the "Mark Complete / Continue" footer and show a small "Preview — progress not tracked" banner with a "Back to all chapters" button.

No data-model changes, no new edge-function work, no changes to chat or completion logic — purely a presentation redesign on top of the existing `allSteps` array already computed in `LearnPathContent`.




# Add AI-Generated Assessment Option to Skill Target Builder

## What
Add an "AI Generate" tab/mode to the existing `AssessmentCreator` component. When selected, the user configures parameters and clicks "Generate" — the system produces mock questions (simulating an AI call) and populates the same assessment structure that already flows into the builder.

## Changes

### 1. Update `AssessmentCreator.tsx` — Add tabbed UI (Manual | AI Generate)

Add a tab toggle at the top. The existing manual question builder becomes the "Manual" tab. The new "AI Generate" tab contains:

- **Assessment title** (text input, same as manual)
- **Number of questions** (slider: 3–20, default 5)
- **Difficulty level** (select: Foundational → Applied → Analytical → Expert)
- **Question format** (multi-select checkboxes: Multiple Choice, True/False, Scenario-based)
- **Source modules** (checkboxes of existing modules in the builder — these become the `linkedModuleIds` for skip logic)
- **Skip threshold** (slider: 50–100%, same as manual — shown when modules are selected)
- **Passing score** (slider: 10–100%, same as manual)
- **Generate button** — triggers a mock delay then populates questions based on config

The generated questions will be mock data (hardcoded pool filtered by difficulty/count). The output feeds into the same `onAdd` callback with the same shape, so no changes needed in `SkillTargetBuilder.tsx`.

### 2. Mock generation logic

A local function `generateMockQuestions(config)` that:
- Draws from an expanded pool of ~15 mock questions tagged by difficulty
- Returns the requested count at the requested difficulty
- Simulates a 1.5s "generating" state with a spinner

### 3. No other files change

The `AssessmentCreator` already receives `existingModules` and calls `onAdd` — the AI tab reuses all of this. No routing, sidebar, or page changes needed.


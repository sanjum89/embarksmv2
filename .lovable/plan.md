## Scope

Three connected changes to the Evidence Task + Listening Module flows.

---

### 1. Evidence Task Brief — generate the actual task content

**Problem:** The Evidence Task card describes *what* to do but never shows the synthetic client / scenario the learner is meant to draft against.

**Plan:**
- New edge function `generate-evidence-brief` calling Lovable AI (`google/gemini-2.5-flash`) with `{ moduleCode, moduleTitle, evidenceTitle, evidenceDescription, qualityIndicators, submissionFormat, accountId }`. Returns structured JSON: `{ scenarioTitle, contextParagraph, sections:[{heading, bullets|body}], keyFigures?:[{label,value}], promptToLearner }`.
- For suitability tasks → a synthetic Rathbones/Pinnacle client pack (name, age, occupation, family, assets, income, objectives, ATR, CFL, constraints, ethical preferences, wrapper context). For other formats → adapts shape (case file, meeting brief, etc.).
- New hook `useEvidenceBrief(accountId, employeeId, cohortId, moduleCode)` — checks `learner_progress.metadata.evidence_brief` for the module's first chapter; if absent, calls the edge function and persists the result there. Returns `{ brief, isLoading, regenerate }`.
- `EvidenceTaskCard`: insert a **"Your task"** section between "What to submit" and "What good looks like" rendering the brief (scenario title, context paragraph, sections, optional key-figures table). Loading skeleton while generating. Small "Regenerate" ghost button (confirms if `draft.length > 0`).
- Applies wherever `EvidenceTaskCard` is used (single component — covers all surfaces).

---

### 2. Simulated manager assessment on submission

**Problem:** Today, submitting evidence just shows a "submitted for review" confirmation. We want a deterministic-feeling demo: instant simulated manager assessment with a score, and a randomized adaptive outcome (skip remaining modules vs reopen for refresh).

**Plan:**
- On `handleSubmit` in `EvidenceTaskCard`, after persisting the chapter completion + `evidence_submission`, generate an **assessment result** locally (no extra AI round-trip needed for demo speed):
  - `score`: random integer 62–96 weighted toward 75–88.
  - `outcome`: weighted random — 50% `skip_remaining` (score ≥ 80), 35% `reopen_for_refresh` (score 65–79), 15% `pass_continue` (score ≥ 70 but no adaptive change). Outcome is influenced by score so it always reads coherent.
  - `feedback`: 3 short bullets generated from `task.qualityIndicators` (pick 2 strengths + 1 growth area, templated — no AI call).
  - Persist all of this on `learner_progress.metadata.evidence_assessment = { score, outcome, feedback, assessor: "Manager (simulated)", assessed_at }`.
- Apply the outcome:
  - `skip_remaining`: mark remaining not-started modules in the current cohort track as `skipped` with `metadata.skip_reason = "evidence_demonstrated"`.
  - `reopen_for_refresh`: pick 1 previously-completed module in the same track and set status back to `available` with `metadata.reopen_reason = "manager_refresher"` (safe — keeps history; learner re-enters via Embark AI).
  - `pass_continue`: no structural change.
- Replace the existing "Evidence submitted" success card with an **Assessment Result** view:
  - Header: "Assessed by Manager (simulated)" badge + score ring (e.g. 84 / 100).
  - Feedback bullets.
  - Outcome banner: "✓ You can skip the remaining modules in this track" / "↻ Refresher added: {module}" / "→ Continue with the next chapter".
  - Primary CTA changes per outcome (Continue / Go to next track / Open refresher).
- Add `useEvidenceAssessment` helper in `src/lib/` for the random generation + persistence so the logic is unit-testable and reusable.

---

### 3. Listening modules — proper two-persona podcast for "What is Discretionary Management" + universal play button

**Problem:** Listening mode currently doesn't have a real two-voice podcast for the discretionary management chapter, and not all listening modules have a guaranteed play button + transcript.

**Plan:**

**3a. Two-persona transcript**
- Add a new entry in `src/data/podcastTranscripts.ts` (or `rathbonesTranscripts.ts` if Rathbones-scoped — pick whichever is currently used by the listening renderer, verified during implementation) keyed by the module code for "What is Discretionary Management".
- Transcript format: array of `{ speaker: "Host" | "Expert", text: string }` ~ 8–12 turns, ~3–4 minutes spoken. Host = curious newcomer, Expert = senior IM. Covers: definition, IFA-vs-discretionary, suitability boundary, mandate scope, monitoring, regulatory framing.

**3b. Pre-generated audio via ElevenLabs**
- Reuse existing `generate-podcast` edge function pattern (already in repo per file list). Extend it to accept `{ moduleCode, transcript: [{speaker, text}] }` and:
  - Voice IDs: Host = `EXAVITQu4vr4xnSDxMaL` (Sarah), Expert = `JBFqnCBsd6RMkjVDRZzb` (George).
  - Synthesize each turn with `eleven_turbo_v2_5`, concatenate MP3 segments server-side, upload to existing public `podcast-audio` storage bucket as `podcasts/{moduleCode}.mp3`.
  - Idempotent: if the object already exists, return its public URL without re-synthesizing (token-safe).
- Run the function once for the discretionary management module via `supabase--curl_edge_functions` during implementation so the file is pre-generated and committed to storage.
- Store the resulting public URL alongside the transcript in the data file as `audioUrl` so the player loads it instantly.

**3c. Universal listening UI guarantee**
- `LearnPathPodcastPlayer` (existing) already renders play UI; audit `LearnPathModuleContent` so that for *any* module rendered in listening mode:
  - If a podcast transcript exists in the data file → render `LearnPathPodcastPlayer` with the pre-generated `audioUrl` + transcript.
  - If no transcript exists → synthesize a fallback two-persona transcript on the fly (small AI call via existing `generate-podcast` flow with `{ chapterTitle, chapterBody }`), persist URL on first generation so subsequent plays are free.
- Always show the play button + scrollable transcript panel in listening mode. No silent states.
- Add a project memory rule: *"Every listening-mode module must render a play button and a two-persona podcast transcript. Audio is pre-generated and stored in the `podcast-audio` bucket; never re-synthesize when the file exists."*

---

## Out of scope
- Real manager review workflow / notifications.
- Persisting demo skip/reopen outcomes into manager-side analytics dashboards.
- Multi-language podcasts.

## Verify
1. Open any evidence task → scenario brief renders above the textarea; reload → cached.
2. Submit evidence → instant "Assessed by Manager (simulated)" card with a score, feedback bullets, and one of the three outcomes; cohort view reflects the skipped/reopened modules.
3. Open the discretionary management chapter in listening mode → two-voice podcast plays from storage, transcript shows host/expert turns; second open does not re-call ElevenLabs (check edge function logs).
4. Spot-check another listening module → play button + transcript both present.

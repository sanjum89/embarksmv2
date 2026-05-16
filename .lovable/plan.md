## Goal

Make Clara's and Theo's adaptation feel realistic and proportionate. Today a single 3-question Quick Diagnostic visually skips an entire 9-chapter module, and Evidence Tasks cover whole modules — so the journey looks like "do one thing, skip everything". Cap savings at ~30% per persona and surface chapters inside locked modules so learners can see what's coming.

## What's wrong today

In `src/components/learnpath/JourneyModuleAccordion.tsx → buildLensChapters`:

- **`diagnostic_only`** prepends a synthetic Quick Diagnostic row and marks **every** chapter as `skipped`/`pendingSkip`. Screenshot shows bk1 (9 chapters) with all 9 skipped after a 3-question check — implausible.
- **`evidence_required`** prepends a synthetic Evidence row and marks **every** chapter as `covered_by_evidence`. Same problem.
- `evidenceAssessment.applyEvidenceOutcome` (with the `skip_remaining` outcome) goes further and marks all chapters in every *other* module in the same track as `skipped`. That's an even bigger cliff.
- **Locked modules** render only a "Complete X to unlock" banner with no chapter list. The user wants the chapter list visible underneath (still read-only, with the locked banner preserved).

## Fix

### 1. Cap per-module savings from a single signal

`buildLensChapters`:

- **`diagnostic_only`** — only the **first 3 chapters** are considered "diagnostic candidates". The synthetic Quick Diagnostic row stays at the top. Pre-submission: those 3 show `pendingSkip` (subtle, no SKIPPED badge); chapters 4..N render as normal `available`/`locked` rows with no SKIPPED treatment. Post-submission: of the first 3, correctly-answered = `skipped`; wrong-answered = `reopened_after_wrong` (in-progress). Chapters 4..N are untouched. Synthetic row gets a small "skips up to 3 chapters" hint.
- **`evidence_required`** — synthetic Evidence row plus the **first 3 chapters** as `covered_by_evidence` (pendingSkip pre-commit). Chapters 4..N render normally. The evidence card copy already mentions "the module's chapters are covered" — soften to "the foundation chapters are covered". 
- **`microlearning`** — unchanged (timing × 0.4 across the whole module).
- Helper constant `MAX_LENS_SKIPS = 3` centralises the cap.

### 2. Soften the cross-module evidence cascade

`src/lib/evidenceAssessment.ts → applyEvidenceOutcome` for `skip_remaining`:

- Instead of skipping all not-started chapters across every other module in the track, skip only the **first 3 not-started chapters of the next not-completed module** (the immediate follow-on), and leave the rest of the track intact. Same metadata reason.
- Update the result type so the caller still gets a `skippedModuleCodes` (now usually 1 module, partial). No UI changes required — the existing toast logic handles it.

### 3. Show chapters inside locked modules

`JourneyModuleAccordion.tsx`:

- Replace the early-return for `m.status === "locked"` with: render the existing "Complete X to unlock" banner **plus** the full chapter list below it.
- Pass a `displayLocked` flag down to the row build so chapter rows render as read-only/muted: lens pills still visible (so users see "Quick Diagnostic" / "Evidence Task" badges on locked modules too), but row click is disabled and the status icon is the lock variant.
- Adaptation badge on the module header continues to show (no change there).

### 4. Realism guard: cap total savings ~30% per persona

After `buildLensChapters` runs across the journey, the natural ratio with cap-3 + softer cascade lands around:

- **Clara (mid__in_im)** — diagnostic modules contribute ≤3 skip-eligible chapters each (currently 6 modules × full chapter counts → drops from ~45 to ≤18). Evidence modules drop from full to 3. Cross-module cascade drops from ~all-other-modules to one. Net savings move from ~60–70% to ~25–30%.
- **Theo (early__in_im)** — same cap rules; he has fewer diagnostic modules, mostly microlearning (which only shortens timing, doesn't skip chapters), so his savings land around ~15–20%.

No DB change needed; this is purely client-side reshaping. The `persona_module_adaptations` rows stay as-is.

### 5. Light copy updates

- `src/lib/embarkAdaptation.ts → adaptationExplanation("diagnostic_only" | "evidence_required")` — adjust strings to reflect "skips up to the first few chapters" rather than "skip those chapters" / "marks the module covered".
- Synthetic Quick Diagnostic row body hint: "Answer 3 questions to skip up to 3 chapters."
- Synthetic Evidence row body hint: "Submit a short task to cover the first few foundation chapters."

## Files to touch

- `src/components/learnpath/JourneyModuleAccordion.tsx` — cap lens reshapes to first 3 chapters; render chapters under locked modules.
- `src/lib/evidenceAssessment.ts` — limit `skip_remaining` cross-module cascade to one follow-on module's first 3 not-started chapters.
- `src/lib/embarkAdaptation.ts` — softened explanation strings.
- `src/components/learnpath/LearnPathChapterRow.tsx` — accept a `disabled`/`displayLocked` prop and render rows non-interactive when set (or wrap at the call site; pick whichever is less invasive after a read).

## Out of scope

- Tour, login, persona DB rows, catalog content, chapter counts.
- Reflection / mentor / role-play flows.
- New badges or visual redesign of the chapter row beyond a muted/locked variant.

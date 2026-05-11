## Goals

1. Fix the visible bug: chapters render real DB content, not a one-line placeholder.
2. Make Theo and Clara see meaningfully different journeys — not just different badges.
3. Make the badge tooltips actually explain what each delivery mode means.
4. Author the long-form lesson body for the highest-need persona (early career outside FS), pilot first.

---

## Step 1 — Render the real DB content (immediate fix)

In `src/components/learnpath/LearnPathContent.tsx` (~line 134), when the chapter ID matches a cohort chapter code (e.g. `bk1.c1`), fetch the row from `catalog_chapters` (new `useCatalogChapter(accountId, chapterCode)` hook) and replace the placeholder transcript with structured markdown:

```text
# {chapter_title}

## Learning objective
{learning_objective}

## Overview
{chapter_summary}

## In this chapter
{realistic_content_outline}

## Try it yourself
{practical_activity}

## Reflect
{reflection_prompt}
```

Result: chapters jump from ~50 words to ~400-500 words today. `EmbarkModuleContent` already parses headings + bullets, so layout, key takeaways, and Embark AI right-panel context start working immediately.

---

## Step 2 — Add a long-form lesson body

Add one column to `catalog_chapters`:

- `chapter_long_form_content TEXT` — canonical 800-1,200-word lesson written for early-career, outside-FS learners. Becomes the default body in **Full module** delivery.

Renderer prefers `chapter_long_form_content` when present; falls back to the structured-from-fields version (Step 1) when empty.

---

## Step 3 — Adaptation types act as real lenses on the body

Today the adaptation type only flips a badge. After this step it changes what the learner actually sees and how long it takes:

| Type | Chapter list shown | Body shown | Estimated time | Completion |
|---|---|---|---|---|
| **Full module** | All chapters, original durations | Full long-form body | Sum of chapter minutes | Complete every chapter |
| **Condensed module** | Same chapters, durations × 0.4 | First 2 sections + key points only (~250 words) | 40% of full | Complete every chapter (short version) |
| **Quick diagnostic** | **Replaced by a single 3-question MCQ entry** ("Diagnostic — 5 min") | MCQs generated from the body | 5 min | Pass diagnostic → module complete |
| **Evidence task** | **Replaced by a single submission entry** ("Submit evidence — 15 min") | The `practical_activity` only | 15 min | Submit evidence → module complete |
| **Already covered** | Module hidden entirely | n/a | 0 | Auto-complete on enrolment |

The chapter list rendered inside each module accordion is built from the adaptation type, not blindly from `catalog_chapters`. So Clara's Module 1 ("Quick diagnostic") shows **one 5-minute diagnostic entry**, not three 25-30-60-minute chapters. That's the difference Theo and Clara will actually see.

Implementation: in `JourneyModuleAccordion.tsx`, branch the chapter list on `m.adaptation?.adaptationType` and render the appropriate alternative entry. Module-level total time recomputes from this transformed list.

---

## Step 4 — Make the tooltips actually teach the model

Replace the current popover content with a clear two-line explanation per mode:

- **Full module** — "Read every chapter end-to-end. Recommended when this is new territory for you."
- **Condensed module** — "A shorter pass through the same material. We've trimmed sections your profile already evidences, so you only see what's likely new."
- **Quick diagnostic** — "Three questions to confirm you've got this. Pass and the module's done — no need to read it through."
- **Evidence task** — "Skip straight to the practice. Submit a short piece of work that shows you can apply this — no reading required."
- **Already covered** — "Your profile already evidences this. We're not adding it to your journey, but you can revisit it anytime from the catalog."

Tooltip layout: bold title (the friendly label), one-paragraph explanation, then the contextual line (competency name + current/target level + validation flag if present).

Add a one-time "What do these mean?" link at the top of the journey view that opens a small modal listing all five modes side by side, so a learner can self-serve the whole model in 30 seconds.

---

## Step 5 — Author the long-form body (Option A: pilot first)

A one-off edge function `expand-chapter-content`:

- Calls Lovable AI (`google/gemini-2.5-pro`).
- Prompt: target persona = early-career, outside-FS Associate IM joiner; depth = 800-1,200 words; structure = Learning Objective → Overview → 3-4 substantive sections → Try it yourself → Reflect; voice = match the existing Rathbones onboarding tone in `chapter_summary`; ground it in the existing `realistic_content_outline` so we don't drift off-topic.
- Writes back to `chapter_long_form_content`.

Pilot scope: the 3 chapters in module `bk1` (Introduction to Wealth Management and the Rathbones Approach). You review one. If voice/depth/length is right, I batch-generate the remaining 53 chapters in one pass.

---

## Verification after build

1. **Open Theo → Module 1, Chapter 1** — see ~500 words today (Step 1) or full ~1,000-word lesson (after Step 5 pilot).
2. **Open Clara → Module 1** — instead of three chapters, see **one "Diagnostic — 5 min" entry**. Click it, get 3 MCQs. Pass → module marked complete. This is the visible difference from Theo.
3. **Open Clara → Module 4 (Regulatory Landscape)** — see **one "Submit evidence — 15 min" entry**, not three chapters. Open it, see the practical activity prompt.
4. **Hover the "Quick diagnostic" badge as Clara** — tooltip explains in plain English what a diagnostic is and why she's getting one, plus the competency/level context.
5. **Click "What do these mean?" at top of journey** — modal shows all 5 modes with descriptions.
6. **Ask Embark AI "summarise this chapter"** — answer cites real content from the long-form body.

---

## Out of scope

- True per-persona variant text (separate body for "mid in-FS"). The lens model in Step 3 should cover the stated need; we can add variant text later if it doesn't.
- Authoring assessments, role plays, or microlearnings — separate pipelines.
- Touching the cohort/competency/adaptation tables themselves (only `catalog_chapters` gains one column).

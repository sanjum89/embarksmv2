

# Rathbones Investment Manager Foundations — Skill Target

## What
Create a single skill target assigned to Clara (u12), Elliot (u13), and Sophie (u14) with 7 chapters, 1 checkpoint assessment, and 1 role play. Per-user skip behavior pre-marks chapters 1-2 as completed for Clara and Elliot.

## Step Sequence (9 steps)

| Order | Type | Title | Duration |
|-------|------|-------|----------|
| 1 | module (PDF) | Rathbones Investment Manager Role and Good Client Outcomes | 20 min |
| 2 | module (video) | Leading Client Relationships with Confidence | 25 min |
| 3 | module (PDF) | Suitability, Documentation, and Client Fairness | 20 min |
| 4 | module (video) | Working with Financial Planning, Portfolio Management, and Client Support | 25 min |
| 5 | assessment | A1 — Client Outcomes and Suitability Checkpoint | 15 min |
| 6 | module (PDF) | Investment Process and Portfolio Alignment Basics | 20 min |
| 7 | module (video) | Communicating Clearly with Clients and Internal Partners | 25 min |
| 8 | module (PDF) | Professional Integrity, Attention to Detail, and Ownership | 15 min |
| 9 | role_play | RP1 — First Client Intro and Risk Appetite Conversation | 20 min |

Assessment A1 passing score: 80%. No skip rules on the assessment itself.

## Skills on the Card

| Skill | Current | Target |
|-------|---------|--------|
| Client Relationship Management | Beginner | Intermediate |
| Suitability and Documentation | Beginner | Intermediate |
| Investment Communication | Beginner | Intermediate |
| Active Listening | Intermediate | Advanced |

## Skip Behavior (per-user pre-completion)

Clara and Elliot: Steps 1 and 2 are marked `status: "completed"` and `skippable: true`. Step 3 starts as `"available"`.

Sophie: No skips. Step 1 is `"available"`, all others `"locked"`.

Since the current `SkillTarget` model has a single `steps` array (not per-user), we'll create **3 separate skill target instances** — one per user — so each has the correct initial step statuses.

## RP1 Reference

The role play `rp-rb1` already exists in `mockRolePlayBank`. The step will reference it via `referenceId: "rp-rb1"`.

## New Learning Modules + Assessment

Add 7 new `LearningModule` entries and 1 new `Assessment` to `mockLearningModules` and `mockAssessments` in `src/data/mock.ts`.

## Changes

| File | Action |
|------|--------|
| `src/data/mock.ts` | Add 7 learning modules (`m-rb1` to `m-rb7`), 1 assessment (`a-rb1`), and 3 skill target instances (`st-rb-clara`, `st-rb-elliot`, `st-rb-sophie`) |

Single file change — all data goes into `mock.ts` following existing patterns.


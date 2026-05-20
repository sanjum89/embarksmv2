# Redesign the cohort KPI strip

The current strip (`src/pages/CohortHub.tsx`, lines 122–146) shows 5 KPIs + a footer of badges. The problems you flagged:

- "Needs attention" doesn't say why.
- "Chapter · Business knowledge" and "Next · Module Gate 2…" are unlabelled — you can't tell if it's where you left off, what's next, or what to do.
- Duplicate dates (Projected Completion = Official Due Date right now).
- Cohort Code is operational noise, not learner-relevant.

Replace it with a **deterministic, status-first** bar that always answers the same three questions in the same order, regardless of cohort state.

## New structure

A single `Card` with two zones:

### Zone 1 — Status banner (full-width, top)

One sentence that resolves to exactly one of four states, computed from data we already have in `useCohortHub`:

| Priority | State            | Trigger                                                                 | Copy example                                                                 |
|----------|------------------|-------------------------------------------------------------------------|------------------------------------------------------------------------------|
| 1        | `attention`      | `daysLeft <= 14` **or** `yourPct < cohortAvg − 10` **or** assessment overdue | "Falling behind on Business Knowledge — you're 14% below cohort average."   |
| 2        | `action_due`     | Mentor 1:1 within 7 days **or** next session within 48h                  | "1:1 with Felix Arden in 2 days · prep your portfolio review."              |
| 3        | `milestone`      | Within 5% of next module gate                                           | "Almost at Module Gate 2 — 1 chapter left to unlock the assessment."        |
| 4        | `on_track`       | Default                                                                 | "On track — next milestone in 3 weeks."                                     |

State resolves top-down (first match wins), so it's deterministic. Coloured pill + one-line reason + a single right-aligned CTA (`View action →`, `Open 1:1`, `Continue learning`, etc.).

### Zone 2 — 4 KPI tiles (replacing the current 5)

Standardised, learner-relevant, no duplicates:

1. **Your progress** — `yourPct%` with a thin progress bar; sub: `Cohort avg X%` (gives the comparison the bar can't carry alone).
2. **Time remaining** — `N days` to due date; sub: `Due 09 Jul 2027`.
3. **Currently learning** — name of the chapter/module the learner last touched; sub: `Chapter · Business knowledge` (labelled so it's not orphaned). Clickable → jumps to that module.
4. **Up next** — the next gate/assessment title; sub: `Unlocks after 2 chapters` or `Assessment · due 14 Jun`.

Cohort rank and cohort code move into a small "Cohort info" popover triggered by an `(i)` icon on the cohort title in the page header — they're reference info, not daily-glance data.

## Why this is better than what's there

- Every cell has a **label that explains itself** (no more bare "Chapter · Business knowledge").
- The "needs attention" verdict is always paired with the **reason** and a **single next action** — the user no longer has to guess.
- KPIs become a fixed vocabulary the product can rely on across cohorts (today, tomorrow, mentor-driven, self-paced).
- "Currently learning" + "Up next" answers your multi-chapter question: it always shows the *most recently progressed* chapter and the *nearest unblocked* gate, even if several modules are technically active.

## Technical notes

- All data is already computed in `useCohortHub` (`yourPct`, `daysLeft`, `needsAttention`, `nextModuleGate`, `nextChapter`, `mentor.nextOneOnOneAt`, `sessions[]`, `moduleProgress[]`). Adding a small `deriveHubStatus(data)` helper to pick the banner state keeps the rule centralised and testable.
- No new tables, no new edge function. Pure presentation + one derived selector.
- Tokens only — `bg-amber-500/10` etc. get replaced with semantic `bg-destructive/10`, `bg-primary/10`, etc.

## Out of scope

- The "Cohort vs you", "Achievements", leaderboard, mentor card, sessions list below the strip — untouched.
- Any change to how progress / due dates are computed.

If you'd rather I include an **AI-generated one-line summary** ("Clara, you're 14% behind cohort avg on Business Knowledge but ahead on Compliance — focus on Chapter 3 this week.") instead of the rule-based status sentence, say so and I'll swap rule for `lovable-ai` call (cached per session). Otherwise I'll ship the deterministic version above.

Approve and I'll build it.
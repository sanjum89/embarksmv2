## Why

Today's Action Centre is manager-only, leads with four mostly-decorative KPI tiles, stacks Tabs + filters + KPIs in the header, and renders every item with the same card — so nothing stands out. It also can't surface learner-side signals (mentor messages, kudos, due dates, AI nudges) you described.

This rebuild turns it into a single triage inbox patterned on Linear / GitHub Notifications / Asana Inbox: one ordered list grouped by urgency, category pills per row, AI suggestions in a calm rail.

## New layout

```text
┌───────────────────────────────────────────────────────────────────────────┐
│ Action Centre                                                             │
│ 3 need you now · 7 today · 12 this week                                   │
│ [All] [Mentions] [Approvals] [AI suggestions]                             │
├──────────────────────────────────────┬────────────────────────────────────┤
│ NOW (3)                              │  AI suggestions                    │
│  ▌🔴 Overdue · Module 4 · Due 2d ago │   ✦ Likely skill gap in IM ethics  │
│  ▌🔴 Mentor message · Felix          │     → Build me a 15-min top-up     │
│  ▌🔴 Peer session request · Theo     │                                    │
│ TODAY (7)                            │   ✦ Last assessment 80%            │
│  ▌🟠 Reflection due · Module 5       │     → Open adapted micro-path      │
│  ▌🟠 Kudos from manager              │                                    │
│  …                                   │   ✦ 3 peers finished Chapter 6     │
│ THIS WEEK (12)                       │     → Resume your chapter          │
│ LATER (4)                            │                                    │
└──────────────────────────────────────┴────────────────────────────────────┘
```

- Header strip is one sentence of state + a tiny segmented control (All / Mentions / Approvals / AI). No KPI tiles.
- One ordered list grouped by **Now / Today / This week / Later** — bucket computed from `due_at` and severity, not from the user's role.
- Each row is one component (`<ActionRow>`) with: left severity rail, kind icon, title, one-line detail, time-ago, category pill, and inline CTAs (Open · Snooze · Done · Dismiss). Hover reveals secondary actions; no card chrome.
- AI suggestions live in a right rail as soft tiles, never mixed into the urgent list. Each tile has a primary CTA ("Build me a 15-min top-up", "Open adapted path", "Find me a peer").
- Empty state: full-bleed single line ("You're all clear. We'll ping you when something needs you."), no fake tiles.

## Unified item kinds (13)

`due_soon`, `overdue`, `mentor_message`, `peer_session_request`, `kudos`, `team_shoutout`, `assessment_result`, `ai_skill_gap`, `ai_microlearning_offer`, `ai_path_adapted`, `approval_request`, `raised_hand`, `reflection_review`.

Each rendered from one `<ActionRow>` driven by `{ kind, priority, when, actor, title, detail, cta[], category }`.

## Data

- Reuse `nudge_cards` as the canonical store; add the new `type` values above. No new tables.
- Manager-side items continue to flow from `managerDemoOverlay` via `useRathbonesPersonaOverlays` and get adapted into the same shape.
- New hook `useActionCentreFeed(userId, role)` merges both sources, computes urgency bucket from `due_at` / `created_at` + severity, returns `{ now, today, thisWeek, later, ai }`, and exposes `snooze(id, until)`, `markDone(id)`, `dismiss(id)`.
- Snooze + done state stored in `nudge_cards.metadata.action_centre_state` so it survives reload without schema changes.
- Seed coherent demo notifications for Clara, Sophie, Theo, and rb-mgr so each persona has a realistic Now/Today/Week mix (overdue module for Sophie, mentor message + kudos for Clara, peer session request for Theo, approvals + raised hands for rb-mgr).

## Role behaviour

- **Learner** (`role = learner`): personal nudges only — own due dates, own mentor messages, kudos to them, AI suggestions about their gaps.
- **Manager** (`role = manager`): everything above for themselves **plus** their reporting tree's approvals, raised hands, and reflection reviews. Same UI, same row component — `category` pill tells them apart.
- No team-level data leaks to learners (matches the data-scoping rule already used in Deep Research / Chat).

## Files

- rewrite: `src/pages/ActionCentre.tsx`
- create: `src/components/action-centre/ActionRow.tsx`
- create: `src/components/action-centre/TimeBucketGroup.tsx`
- create: `src/components/action-centre/AIRecommendationStream.tsx`
- create: `src/components/action-centre/EmptyState.tsx`
- create: `src/hooks/useActionCentreFeed.ts`
- create: `src/lib/actionCentre/itemKinds.ts`
- edit: `src/data/agentOneSeeds.ts` (add learner-side demo notifications for Clara/Sophie/Theo)

## Out of scope

- No new database tables, no realtime channel.
- No bulk-select / multi-action toolbar.
- No merge with the topbar bell — that stays a quick-peek; Action Centre stays the deep view.
- AI History / "Path changes" stays where it is for now (already moved to a separate surface).

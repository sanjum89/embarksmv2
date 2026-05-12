# Deep Research — Plan (v1)

## Goal
A premium BI-style conversational workspace for managers and cohort leaders. Ask complex questions about learners, cohorts, competencies, modules, progress, risk, readiness, and interventions; get answers as charts, tables, narrative, and one-click actions — with a visible reasoning trace.

## 1. Entry & navigation
- New top-level **Deep Research** link in the Team-mode sidebar (icon: `Microscope` or `Telescope`).
- Route: `/team/deep-research` and `/team/deep-research/:threadId`.
- Visible to anyone with `canManage` (managers + cohort leaders). Scope is auto-derived:
  - Reporting-tree subordinates (existing `accountHierarchy` selectors).
  - Cohorts they lead (`cohorts` + `cohort_enrollments` where they are a manager).
  - Union of both = the addressable population for that user.

## 2. Workspace layout
Three-zone shell with a **per-response output mode** the user picks:

```text
┌─────────────────────────────────────────────────────────────┐
│  Header: thread title · scope chip · model · "New thread"   │
├──────────────┬─────────────────────────────┬────────────────┤
│ Threads &    │  Conversation + Answers     │  Pinned        │
│ Suggested    │  (chat, canvas, or report   │  Dashboard     │
│ research     │   per query)                │  (tiles)       │
│              │                             │                │
│ - Pinned     │  Composer w/ scope picker,  │  Drag to       │
│ - Recent     │  output-mode selector,      │  reorder.      │
│ - Templates  │  prompt pills               │  Auto-refresh. │
└──────────────┴─────────────────────────────┴────────────────┘
```

Output modes (chosen per query, default = Conversational):
1. **Conversational + inline charts/tables** — chat thread with rich blocks.
2. **Split BI canvas** — answer renders as full-width tiles on the right pane; follow-ups update them.
3. **Notebook report** — long-form sections (Summary · Findings · Evidence · Risks · Recommended actions) with citations and an export-ready layout.

Every answer has: **Pin** (to dashboard), **Open trace**, **Action chips**, **Share** (copy link to thread).

## 3. AI engine — tool-calling agent with transparent trace
Single edge function `deep-research-chat` (streaming SSE, Lovable AI Gateway, default `google/gemini-3-flash-preview`, escalates to `openai/gpt-5` for `deep` mode).

Agent loop:
1. **Plan** — model emits a short plan (1–5 steps).
2. **Tool calls** — typed retrieval tools against the account context.
3. **Synthesize** — final answer in a structured envelope (narrative + blocks + actions + citations).
4. **Trace** — every tool call (name, args, row count, latency) is captured and streamed back; rendered in a collapsible "Reasoning" panel.

Retrieval tools (all auto-scoped to caller's addressable population):
- `list_learners(filters)` — by cohort, role_cohort, status, risk, readiness.
- `learner_profile(employee_id)` — persona, capability proficiency, progress, last activity.
- `cohort_overview(cohort_id)` — enrollment, module/chapter completion, gate results, risk distribution.
- `module_progress(module_code, scope)` — completion %, avg score, weak topic tags, retake counts.
- `assessments(filters)` — instances, scores, weak/strong topic tags, agent actions.
- `readiness(scope)` — gate results, AI recommendations, manager/assessor sign-off state.
- `interventions(scope)` — micro_learnings, mentor_assignments, reflections, nudges.
- `people_graph_signals(employee_id)` — direct + derived signals.
- `work_signals(scope)` — work-system indicators (Bloomberg, Charles River…).
- `action_centre_history(scope)` — past manager actions and outcomes.
- `compare(a, b)` — generic compare across learners or cohorts.
- `aggregate(metric, group_by, filters)` — counts/avgs/percentiles for charts.
- `propose_actions(context)` — returns candidate action chips with deep-link payloads.

Output envelope (model returns via tool-call `render_answer`):
```json
{
  "summary": "…1–3 sentence headline finding…",
  "blocks": [
    { "type": "kpi_strip", "items": [...] },
    { "type": "bar_chart", "title": "...", "data": [...] },
    { "type": "table", "columns": [...], "rows": [...] },
    { "type": "learner_list", "ids": [...] },
    { "type": "narrative", "markdown": "..." }
  ],
  "actions": [
    { "id": "assign_module", "label": "Assign 'Suitability fundamentals' to 4 learners", "payload": {...}, "confirm": true }
  ],
  "citations": [{ "tool": "cohort_overview", "callId": "c1" }]
}
```

## 4. Actions (Execute + auto-log to Action Centre)
Action chips are typed and run client-side via the existing stores:
- `assign_module` / `assign_skill_target` → `useSkillTargetsContext` + `useManagerActions`.
- `schedule_1on1` → `Schedule1on1Dialog`.
- `send_check_in` → `SendCheckInDialog`.
- `request_reflection` → `RequestReflectionDialog`.
- `assign_mentor` → `AssignMentorDialog`.
- `lock_unlock_chapter`, `nudge_learner`, `flag_for_review`.

Every executed action:
- Confirms in a small inline drawer (preview of who/what).
- Writes an `agent_one_events` row with `event_type='deep_research_action'`, plus the existing per-action side effects.
- Surfaces in **Action Centre** under a new "Deep Research" group with a back-link to the originating thread.

## 5. Demo determinism (Rathbones / Pinnacle)
- New file `src/data/deepResearchShowcase.ts` registers ~8 scripted prompts keyed by normalized prompt text. Examples:
  - "Who in my cohort is at risk of missing the readiness gate this week?"
  - "Show me Clara's progress vs the rest of the early-IM cohort."
  - "Which module is causing the most retakes across Investment Management?"
  - "Suggest interventions for the bottom 3 learners by readiness."
  - "Is Theo ready to be promoted to Investment Manager?"
  - "What's the impact of the last 2 weeks of micro-learnings?"
  - "Compare reflections sentiment between my two onboarding cohorts."
  - "Where should I focus my next 1:1s?"
- When the active account name matches Rathbones/Pinnacle and the prompt matches (loose normalize), the edge function returns the curated envelope verbatim (still streamed) and skips the live tool loop. Trace panel still renders, showing the scripted "tools that would have run".
- Everything else goes live. A "Suggested research" rail surfaces the showcase prompts plus dynamic ones derived from current data.

## 6. Persistence
New tables (migration):
- `deep_research_threads` — id, account_id, owner_user_id, title, scope_json, created_at, updated_at, last_message_at.
- `deep_research_messages` — id, thread_id, role (`user`|`assistant`|`tool`), content, blocks_json, actions_json, trace_json, created_at.
- `deep_research_pins` — id, account_id, owner_user_id, source_message_id, block_json, position, created_at.

RLS: anon-permissive (matches the rest of the project's demo posture); scoped client-side by `account_id` + `owner_user_id`.

## 7. Reusable components
- `RichBlockRenderer` (extends `RichContentBlock` with `kpi_strip`, `bar_chart`, `line_chart`, `table`, `learner_list`).
- `ReasoningTracePanel` — collapsible right-rail view of tool calls.
- `ActionChip` — confirm-then-execute, wired to existing stores.
- `PinnedDashboard` — grid of pinned blocks, drag-to-reorder.
- `ScopeChip` — shows current scope (cohort, team, custom filters); clickable to refine.
- `OutputModeSwitch` — Conversational / Canvas / Report.

## 8. Scope refinement UI
A small "Scope" popover above the composer lets the user narrow before asking:
- Cohorts (multi)
- Roles / role_cohorts
- Risk filter (at risk / on track / ahead)
- Date range
The selection is sent as `scope_json` and applied to all retrieval tools.

## 9. Files to create / touch (technical)
- New page: `src/pages/DeepResearch.tsx`
- New components: `src/components/deep-research/{ThreadList,Composer,AnswerRenderer,ReasoningTracePanel,PinnedDashboard,ScopeChip,OutputModeSwitch,ActionChip,SuggestedResearch}.tsx`
- New hook: `src/hooks/useDeepResearch.ts` (thread state, streaming, pins, actions)
- New lib: `src/lib/deepResearch/{toolSchemas.ts,actionDispatch.ts,scope.ts,showcase.ts}`
- New edge function: `supabase/functions/deep-research-chat/index.ts` (tool-calling loop against Lovable AI Gateway)
- New showcase data: `src/data/deepResearchShowcase.ts`
- Sidebar: add Deep Research link in `src/components/layout/AppSidebar.tsx` (Team set)
- Route: add to `src/App.tsx`
- Action Centre: add "Deep Research" grouping in `src/pages/ActionCentre.tsx`
- Migration: 3 tables above
- Memory: add `mem://features/deep-research` and update Core/index

## 10. Out of scope for v1
- Cross-account / multi-tenant queries.
- Saved scheduled reports / email digests.
- Custom SQL / BYO-query.
- Per-user OAuth to external BI tools.
- Voice input (can add later via existing ElevenLabs path).

## 11. Open follow-ups (your turn to share ideas)
- Default output mode preference (Conversational vs Canvas)?
- Should pinned tiles auto-refresh on a cadence, or only on-demand?
- Any specific showcase prompts you want guaranteed for Rathbones beyond the 8 above?
- Premium gating — do we want a "Premium" badge / paywall hint, or just ship it as part of Team mode?
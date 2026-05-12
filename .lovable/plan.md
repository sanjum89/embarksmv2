# Deep Research — Revised Plan (v2)

Incorporating the BI-canvas thinking, structured response format, and Clara/Theo-anchored Rathbones demo from your reference doc.

## What changes from v1

- **Default layout flips to a split BI canvas** (chat left, live insight canvas right) instead of conversational mode. Notebook + Conversational remain available as alternates.
- **Every meaningful answer is a visual research artifact** — short executive line + at least one chart/table/card. No long-text-only replies.
- **Response is a fixed 5-part envelope**: Executive answer → Visual insight → Evidence / reasoning → Recommended actions → Follow-up questions.
- **Conversation starters are categorized "manager jobs"**, not random prompts. Five categories ship in v1 (others stub out).
- **Demo spine = Clara vs Theo** in the Associate IM cohort, with five scripted prompts that flow as a guided wow story.
- **Five visual components ship first**, the rest stub for v1.

## 1. Entry & navigation
Unchanged: top-level "Deep Research" in Team sidebar, route `/team/deep-research/[:threadId]`, visible to anyone with `canManage`. Auto-scoped to reporting tree ∪ led cohorts.

## 2. Layout — BI research canvas

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Deep Research · scope chip · output mode · model · New thread        │
├───────────────────────────┬──────────────────────────────────────────┤
│  Left: chat & starters    │  Right: live research canvas             │
│                           │                                          │
│  ┌─ Ask anything… ─────┐  │  ┌─ Executive answer ───────────────┐    │
│  └─────────────────────┘  │  └──────────────────────────────────┘    │
│                           │  ┌─ Visual ─┐ ┌─ Visual ─┐               │
│  Starter categories:      │  │ radar    │ │ heatmap  │               │
│   • Cohort health         │  └──────────┘ └──────────┘               │
│   • Compare learners      │  ┌─ Evidence table ─────────────────┐    │
│   • Risk-critical         │  └──────────────────────────────────┘    │
│   • Manager actions       │  ┌─ Recommended actions (chips) ────┐    │
│   • Readiness summary     │  └──────────────────────────────────┘    │
│                           │  ┌─ Follow-up questions (pills) ────┐    │
│  Recent threads · Pinned  │  └──────────────────────────────────┘    │
└───────────────────────────┴──────────────────────────────────────────┘
```

Output modes (per-response, default = **Canvas**):
- **Canvas** (BI split, default)
- **Conversational** (inline blocks in chat)
- **Notebook report** (long-form, export-ready)

Top bar: pin to dashboard, open trace, share, switch mode.

## 3. Structured response envelope

Every answer the model returns:

```json
{
  "executive": "1–2 sentence headline finding",
  "visuals": [ { "type": "radar|heatmap|stacked_bar|risk_matrix|readiness_card|action_board|evidence_table|kpi_strip|learner_list|narrative", ... } ],
  "evidence": [ { "label": "...", "source": "tool:cohort_overview#c1", "value": "..." } ],
  "actions":  [ { "id": "assign_evidence_task", "label": "Assign suitability evidence task to Clara", "payload": {...} } ],
  "followups":[ "Why does Theo need full modules?", "Show stretch readiness for Clara" ],
  "trace":    [ { "tool": "...", "args": {...}, "rows": 12, "ms": 240 } ]
}
```

The renderer is strict: if `executive` is present but `visuals` is empty for a non-trivial query, the renderer auto-promotes the first table/list into a visual block. Long-text-only answers are explicitly disallowed for canvas mode.

## 4. Conversation starter categories (v1 ships 5)

Each starter card has: icon, title, short description, example question, expected output type.

1. **Cohort health** — "Show me the Associate IM cohort readiness picture." → readiness donut + competency heatmap + blocker list + actions.
2. **Compare learners** — "Why are Clara and Theo seeing different journeys?" → side-by-side radar + module adaptation stacked bar + plain-English reason.
3. **Risk-critical readiness** — "Are Clara and Theo safe to progress?" → red/amber/green risk matrix + evidence checklist + "do not progress until…" cards.
4. **Manager action plan** — "What should I do this week to move the cohort forward?" → prioritized action board + impact/effort matrix.
5. **Readiness summary** — "Create a readiness-board summary for Clara." → one-page evidence pack with radar, evidence checklist, recommendation.

Stubbed (visible but mark "coming soon"): Module adaptation audit, Competency gap analysis, Evidence gap view, Stretch readiness, Learning journey effectiveness.

## 5. Demo spine — Clara vs Theo guided flow

The five scripted prompts are wired as the "Suggested research" rail and as the showcase deterministic responses for Rathbones / Pinnacle:

1. "Show me the Associate IM cohort readiness picture."
2. "Why are Clara and Theo seeing different module formats?"
3. "Are either of them safe to progress?"
4. "What should I do this week?"
5. "Create a readiness-board summary for Clara."

When the active account is Rathbones or Pinnacle and the prompt loosely matches, `deep-research-chat` returns a curated envelope (still streamed, trace still shown). All other prompts run live through the tool-calling agent. Prompts 2 and 3 are the wow moments and get the most polished visuals.

## 6. Visual components shipped in v1

Built and used by the showcase:

1. **ReadinessCard** — name · status pill · top gap · next action.
2. **CompetencyRadar** — Clara vs Theo vs Associate IM requirement (uses existing `CompetencyRadarHero` patterns).
3. **ModuleAdaptationStackedBar** — Full / Condensed / Diagnostic / Evidence / Already covered, per learner.
4. **RiskCriticalMatrix** — competency × learner with R/A/G evidence status.
5. **ManagerActionBoard** — prioritized "do this next" cards with execute chips.

Lighter blocks reused from existing chat: `kpi_strip`, `evidence_table`, `learner_list`, `narrative`. Stubbed for later: evidence timeline, impact/effort scatter, stretch ladder.

## 7. AI engine — unchanged from v1
Single edge function `deep-research-chat`, streaming SSE via Lovable AI Gateway, default `google/gemini-3-flash-preview`, escalates to `openai/gpt-5` for `deep` mode. Tool-calling loop (Plan → Tools → Synthesize → Trace) with the 12 retrieval tools previously listed. Final answer returned through a `render_answer` tool whose schema is the structured envelope in §3.

Showcase mode short-circuits the tool loop but still emits a synthetic trace ("tools that would have run") so the reasoning panel remains honest-looking for the demo.

## 8. Actions — Execute + auto-log
Unchanged: typed action chips dispatched client-side via existing stores (`useSkillTargetsContext`, `useManagerActions`, `Schedule1on1Dialog`, `SendCheckInDialog`, `RequestReflectionDialog`, `AssignMentorDialog`). Every executed action writes an `agent_one_events` row tagged `deep_research_action` and surfaces in **Action Centre** under a "Deep Research" group with back-link.

New action types added for this surface: `assign_evidence_task`, `flag_risk_critical`, `generate_readiness_pack`.

## 9. Persistence
Unchanged: `deep_research_threads`, `deep_research_messages`, `deep_research_pins` with anon-permissive RLS (matches project posture), scoped client-side by `account_id` + `owner_user_id`.

## 10. Files to create / touch

- New page: `src/pages/DeepResearch.tsx`
- New components: `src/components/deep-research/{ResearchCanvas,Composer,StarterCards,SuggestedRail,ResponseEnvelope,ReasoningTracePanel,PinnedDashboard,ScopeChip,OutputModeSwitch,ActionChip}.tsx`
- New visual blocks: `src/components/deep-research/blocks/{ReadinessCard,CompetencyRadar,ModuleAdaptationStackedBar,RiskCriticalMatrix,ManagerActionBoard,EvidenceTable}.tsx`
- New hook: `src/hooks/useDeepResearch.ts`
- New lib: `src/lib/deepResearch/{toolSchemas.ts,actionDispatch.ts,scope.ts,showcase.ts,envelope.ts}`
- New edge function: `supabase/functions/deep-research-chat/index.ts`
- Showcase data: `src/data/deepResearchShowcase.ts` (the 5 Clara/Theo envelopes, fully populated with mock data drawn from existing Rathbones personas, cohort, modules)
- Sidebar: add link in `src/components/layout/AppSidebar.tsx` (Team set)
- Route: add to `src/App.tsx`
- Action Centre: new "Deep Research" grouping in `src/pages/ActionCentre.tsx`
- Migration: 3 tables
- Memory: add `mem://features/deep-research` and update Core/index

## 11. Out of scope for v1
Cross-account queries, scheduled reports/digests, custom SQL, per-user OAuth to BI tools, voice input, the 5 stubbed starter categories' live execution.

## 12. Open follow-ups for you
1. Confirm **Canvas as default mode** (was Conversational in v1).
2. Confirm the **5 v1 starter categories** above and that the other 5 stub out.
3. Any preferred copy for the **executive lines** in the Clara/Theo showcase, or should I draft them based on the doc's examples?
4. Should pinned tiles **auto-refresh** (e.g., on thread reload) or stay snapshot-only for v1?

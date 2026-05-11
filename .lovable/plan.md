## Goal

Replace the current dense, card-heavy My 360 with an **editorial profile-led page** for Clara that reads like a magazine spread about her — generous spacing, real hierarchy, branded accents, and color used meaningfully. Detail is buried one click deep; an "Ask Embark" affordance sits next to every meaningful block.

No data model changes — only frontend in `src/components/my360-v2/*` and `src/pages/NewMy360.tsx`.

## Visual direction

- **Editorial hero** — large name, role, manager, tenure pill; soft full-bleed gradient using the Rathbones primary; a portrait initial monogram; the persona narrative as a pull-quote with serifed display feel (via existing display weight, no font import).
- **Branded accents** — bucket colors keyed to semantic tokens (emerald / primary / rose / violet) used as 2px left rails and tinted backgrounds, not as flat fills. Cards use `bg-card`, soft shadow, larger radius (rounded-xl), generous padding (p-6).
- **Section rhythm** — alternating tight stat strips and breathing cards. Real H2s with subtle eyebrow labels ("THE NUMBERS", "WHERE SHE STANDS", "WHAT'S NEXT").
- **Tabs become a compact pill switcher** under the hero, not a heavy underlined bar.

## Page layout (tab 1 — "Profile")

```text
┌───────────────────────────────────────────────────────┐
│  HERO   monogram │ Clara Wren                          │
│         IM Associate · Mid-career · 4y 2m at Rathbones │
│         "Strong analyst growing into client-facing..." │
│         [Perf: Strong] [Engagement 8.2] [Ask Embark ›] │
└───────────────────────────────────────────────────────┘

┌─ THE NUMBERS ─────────────────────────────────────────┐
│  4y2m tenure │ 67 caps │ 12 gaps │ 5 stretch │ Strong │
└───────────────────────────────────────────────────────┘

┌─ WHERE SHE STANDS  (radar)        ┐  ┌─ Snapshot ────┐
│  Big radar, only 5 track averages │  │ Prior: Schroders│
│  Click a track → drawer w/ 16 sub │  │ CFA L2 in prog │
│  [Ask Embark about this profile]  │  │ Hybrid · London│
└───────────────────────────────────┘  └────────────────┘

┌─ STRENGTHS & GAPS (compact strip, 4 columns) ─────────┐
│  Top 3 per bucket, "View all 67 →" opens drawer       │
│  Each row: label · L3→L4 · arrow to module · Ask AI · │
└───────────────────────────────────────────────────────┘

┌─ COHORT JOURNEY (preview strip, link to tab) ─────────┐
│  IM Foundations · 60% · 3 modules adapted · Continue →│
└───────────────────────────────────────────────────────┘
```

Tab 2 (Cohort Journey) and tab 3 (Growth Path) keep their logic but get the same visual treatment: bigger headings, more whitespace, eyebrow labels, branded rail accents, Ask Embark buttons co-located with each meaningful block.

## Progressive disclosure

- **Track tile on radar** → existing `Sheet` drawer, restyled with hierarchy.
- **"View all 67 capabilities"** → new full-height drawer with the 4-bucket view (reuses `CapabilityBuckets` logic).
- **Capability row hover** → reveals "Open module" + "Ask Embark" icons.
- **Certifications chip** → drawer listing all + targets.

## Ask Embark pattern

Add a single `<AskEmbarkButton prompt context />` component that calls `useAgentOne().handleSend(prompt, context)`. Placed beside: hero, radar, each bucket header, top gap card, stretch card, talking points. Each instance ships a tailored preset prompt (e.g. "Why is my Counterparty risk gap risk-critical, and what's the fastest path to close it before the readiness gate?").

## Files

**New**
- `src/components/my360-v2/AskEmbarkButton.tsx` — shared pill button
- `src/components/my360-v2/ProfileHero.tsx` — replaces `IdentityHeader`
- `src/components/my360-v2/StatStrip.tsx` — at-a-glance numbers row
- `src/components/my360-v2/CompetencyRadarHero.tsx` — radar collapsed to 5 track means, drill via drawer
- `src/components/my360-v2/CapabilityStrip.tsx` — compact 4-col strengths/at/gaps/stretch with "view all" drawer
- `src/components/my360-v2/AllCapabilitiesDrawer.tsx` — re-uses existing `CapabilityBuckets`
- `src/components/my360-v2/CohortPreviewCard.tsx` — small cohort summary linking to the cohort tab

**Modified**
- `src/pages/NewMy360.tsx` — new layout, pill tab switcher, "Profile" replaces "Role & Strengths"
- `src/components/my360-v2/CohortJourneyTab.tsx` — heading/spacing/rail pass, Ask Embark buttons, no logic changes
- `src/components/my360-v2/GrowthPathTab.tsx` — heading/spacing/rail pass, Ask Embark buttons, no logic changes
- `src/components/my360-v2/HrisSnapshotCard.tsx` — used as a side card in tab 1, lighter density

**Untouched**
- `src/hooks/useMy360Data.ts`, `src/lib/my360v2/bucketing.ts`, legacy My 360, all DB tables, all routing besides the page internals

## Out of scope

- Theo / other personas (Clara only; eligibility fallback keeps legacy redirect)
- New tables, migrations, edge functions
- Visual changes to legacy My 360 or Pinnacle white-label
- Replacing the Embark floating panel mechanism

## Notes

- All colors via semantic tokens (`bg-primary/10`, `text-emerald-600 dark:text-emerald-400`, etc.) — no hardcoded hex.
- Honor the Rathbones palette (deep navy primary, peach accent) already in CSS.
- Honor `py-[18px]` header rule (we're below the app header, so this is local layout only).

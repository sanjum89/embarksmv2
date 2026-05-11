## Rename "AI Changes" and group integrations under one tab

Two scoped changes to the manager cohort hub tab bar (`src/pages/ManagerCohortHub.tsx`).

### 1. Rename `AI Changes` → `AI Decisions`

- Tab label, count badge, and any visible page heading inside the panel updated to **AI Decisions**.
- Tab `value` left as `ai-changes` (internal id) to avoid touching unrelated state/routing — only the label and visible copy change.
- Sweep the `AIChangesFeed` component for user-visible "AI Changes" / "Changes" copy and update where it refers to this tab/section. Internal symbols (file name, prop names) stay as-is.

### 2. Replace `CPD / CISI` with an `Integrations` tab

New tab labeled **Integrations** (small plug icon) that opens an inner secondary tab strip listing each connected system. For now, one entry:

- **CISI** — section heading inside reads "**CPD · via CISI**" so the credential body (CPD) and the source system (CISI) are both visible.

Structure inside the tab:

```text
Integrations  (outer tab)
└── [ CISI ]  ← inner tab strip
        ┌──────────────────────────────────────────┐
        │  CPD · via CISI                          │
        │  <existing CpdPanel content unchanged>   │
        └──────────────────────────────────────────┘
```

Designed so adding a second integration later (e.g. Workday, Bloomberg) is a one-line addition to an `INTEGRATIONS` array — no further layout work.

### Final tab order

`Roster · AI Decisions · Adaptive Paths · Integrations`

### Out of scope

- No changes to `CpdPanel` internals, `AIChangesFeed` logic, data hooks, or routing.
- No new integrations wired up — just the container that makes adding them trivial.
- No changes elsewhere in the app.

### Technical notes

- New small component `IntegrationsTab` (in `src/components/manager-hub/`) that renders an inner shadcn `Tabs` driven by a local `INTEGRATIONS = [{ id: 'cisi', label: 'CISI', heading: 'CPD · via CISI', Panel: CpdPanel }]`.
- Outer tab uses `Plug` icon from `lucide-react` for visual cue that the section is integration-backed.
- Count badge on AI Decisions tab keeps current behavior.

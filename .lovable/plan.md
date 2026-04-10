

## People Graph Intelligence Hub — Manager View

### Overview
A new manager page at `/manager/people-graph` that visualizes the data architecture feeding the People Graph, with investment management-specific systems of work for Rathbones/Pinnacle Capital accounts.

### Research: Investment Management Systems of Work

Based on research into Rathbones and similar wealth management firms, the systems of work for investment managers include:

| System | Category | Signals Produced |
|---|---|---|
| **Bloomberg Terminal** | Market Data & Research | Research queries/day, securities analyzed, news alerts actioned, time on terminal |
| **Charles River IMS** (State Street Alpha) | Order & Portfolio Management | Orders placed, trade accuracy, portfolio rebalances, compliance exceptions, execution speed |
| **InvestCloud CLM** | Client Lifecycle Management | Client interactions logged, proposals generated, onboarding completions, client retention |
| **Salesforce Financial Services Cloud** | CRM | Client meetings/week, pipeline value, relationship health scores, follow-up completion rate |
| **Advent/Geneva** | Portfolio Accounting & Reporting | Reports generated, reconciliation exceptions, NAV accuracy, reporting timeliness |
| **FactSet / Morningstar** | Analytics & Research | Models built, research reports consumed, peer comparisons run |
| **Microsoft Teams / Outlook** | Collaboration | Meeting frequency, response times, cross-team interactions |
| **Compliance Systems** (e.g. ComplianceAlpha) | Regulatory | Pre-trade checks passed/failed, personal account dealing declarations, training completions |

### Direct vs Derived Data

**Direct signals**: orders placed, client meetings, compliance checks, terminal time, tickets resolved
**Derived signals**: investment conviction score, client relationship health, ramp-up velocity, knowledge retention rate, flight risk, rising star, mentorship need, course effectiveness rating

### Page Sections

1. **Connected Systems Map** — Visual pipeline showing source categories (Pre-Onboarding, HRIS, Resume, Manager, Job Architecture, System of Engagement, System of Work) flowing into a central People Graph node. Each source has a card with signal count, last sync, and toggle switch (pending admin approval).

2. **Data Streams Detail** — Expandable cards per system. Each metric tagged as [Direct] or [Derived]. System of Work cards are context-aware (investment management systems for Rathbones/Pinnacle).

3. **Employee Signal Explorer** — Select a team member → see their signal pipeline (Source → Raw Signal → Derived → Label). Click any label (Flight Risk, Rising Star, Needs Mentoring) to see reasoning chain with formulas and contributing data.

4. **Skill Gaps** — Role gap vs Project gap side by side for selected employee.

5. **Reflections Analysis** — Reflection entries with extracted skills/proficiency, flagged concerns, sentiment timeline, and "Schedule 1-on-1" CTA.

6. **Computation Details** — Expandable formulas, weights, thresholds for each derived label.

### Files to Create/Edit

| File | Change |
|---|---|
| `src/pages/PeopleGraphIntelligence.tsx` | New page — hub with all sections |
| `src/components/people-graph/ConnectedSystemsMap.tsx` | Visual pipeline of connected systems with toggles |
| `src/components/people-graph/DataStreamCards.tsx` | Expandable cards with direct/derived tags per system |
| `src/components/people-graph/EmployeeSignalExplorer.tsx` | Employee selector + signal pipeline + label reasoning |
| `src/components/people-graph/SignalPipelineFlow.tsx` | Visual flow diagram (source → raw → derived → label) |
| `src/components/people-graph/ReflectionsAnalysis.tsx` | Reflection entries with skills extraction + CTAs |
| `src/components/people-graph/ComputationDetails.tsx` | Expandable formulas and thresholds |
| `src/data/peopleGraphSystems.ts` | Mock data for connected systems, signal definitions, and IM-specific work systems |
| `src/App.tsx` | Add route `/manager/people-graph` |
| `src/components/layout/AppSidebar.tsx` | Add "People Graph" nav item under manager children |

### Design Direction
- Dark-themed glassmorphism cards with gradient accent borders (teal/purple/amber) per system category
- Animated flow lines connecting source nodes to central People Graph
- Color-coded tags: green badges for [Direct], purple badges for [Derived]
- Interactive label chips that expand into reasoning chains with weighted signal breakdowns
- Subtle pulse animations on active data streams
- Investment management iconography (chart lines, portfolio, compliance shield)

### Data Source
All employee/signal data comes from existing `NormalizedAccount` — `architectureSources`, `signals`, `reflections`, `workSignals`, `explainability`, `employeesById`, `rolesById`, `projectsById`. The new `peopleGraphSystems.ts` file provides the system definitions and mock signal metadata specific to investment management workflows.


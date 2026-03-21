

## Plan: Fix Locked Cards + Add Chapter Descriptions

### Problem 1: Lock overlay not showing
The DB has `locked: true` but the cards render unlocked (as shown in screenshot). The parser at line 573 does `locked: st.locked ?? (st.status === "locked")` — this should work, but the raw JSON `locked` value may be coming through as a string `"true"` from the JSONB query. Fix: explicitly coerce to boolean in the parser.

### Problem 2: Missing chapter descriptions
The 14 steps in RAT-ST-001 have no `description` field, so the parser defaults to `""`.

### Changes

**`src/lib/accountParser.ts`** (1 line)
- Line 573: Change `locked: st.locked ?? (st.status === "locked")` to `locked: st.locked === true || st.locked === "true" || st.status === "locked"` — ensures boolean coercion regardless of JSON typing.

**Database migration** — Single SQL UPDATE to add realistic descriptions to all 14 steps of RAT-ST-001:

| # | Title | Description |
|---|-------|-------------|
| 1 | Investment Manager Baseline Assessment | Evaluate your current understanding of investment management principles, portfolio concepts, and client-facing responsibilities. |
| 2 | Rathbones Proposition & Client Outcomes | Explore the Rathbones value proposition, service tiers, and how investment managers deliver measurable client outcomes. |
| 3 | Understanding Client Risk Profiles and Objectives | Learn how to assess client risk tolerance, map financial goals, and align investment strategies to individual circumstances. |
| 4 | Portfolio Alignment & Suitability Framework | Understand Rathbones' suitability framework for matching portfolio composition to client mandates and regulatory requirements. |
| 5 | Asset Classes and Their Role in Client Portfolios | Review equities, fixed income, alternatives, and multi-asset strategies within the context of discretionary portfolio management. |
| 6 | Investment Process: Research to Recommendation | Trace the end-to-end investment process from research analysis through committee review to client recommendation. |
| 7 | Mid-Path Checkpoint: Portfolio & Suitability | Confirm your grasp of portfolio construction principles and suitability obligations before advancing to advanced topics. |
| 8 | Market Context and Economic Indicators for IMs | Interpret macroeconomic data, market cycles, and leading indicators that inform Rathbones investment positioning. |
| 9 | Regulatory Conduct & Consumer Duty Obligations | Cover FCA conduct rules, Consumer Duty requirements, and the compliance framework governing investment manager behaviour. |
| 10 | Documenting Investment Decisions and Rationale | Master the standards for recording investment rationale, client communications, and audit-ready decision logs. |
| 11 | Fee Structures, Costs, and Value Assessment | Understand Rathbones fee models, cost disclosure obligations, and how to demonstrate value to clients under Consumer Duty. |
| 12 | Client Portfolio Review Conversation | Practice conducting a structured portfolio review with a client, covering performance, risk, and forward-looking strategy. |
| 13 | Handling Market Volatility Conversations with Clients | Develop techniques for reassuring clients during market downturns while maintaining confidence in the investment approach. |
| 14 | Final Readiness Assessment | Comprehensive assessment covering all foundation topics to confirm readiness for live client portfolio responsibilities. |


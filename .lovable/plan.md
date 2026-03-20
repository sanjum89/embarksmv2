

# Rathbones Role Plays + Assigned Tab in Role Play Bank

## Overview
Create 5 Rathbones wealth management role plays, add Clara/Elliot/Sophie as users, and add an "Assigned to Me" tab to the Role Play Bank page.

## New Users (Clara, Elliot, Sophie)

Add three Investment Manager users to `src/data/mock.ts` and wire them into `src/lib/accountDefaults.ts`:

| ID | Name | Title |
|----|------|-------|
| u12 | Clara Whitfield | Investment Manager |
| u13 | Elliot Hargreaves | Investment Manager |
| u14 | Sophie Langford | Investment Manager |

All three are learners reporting to u1 (Alex Rivera).

## 5 New Role Plays (all beginner, Rathbones-branded)

Added to the **top** of `mockRolePlayBank` in `src/data/mock.ts`:

**RP1 — First Client Intro and Risk Appetite Conversation** (`rp-rb1`)
- Scenario: You're meeting a new Rathbones client for the first time. Understand their financial goals, family situation, and risk appetite. The client is a recently retired professional with £800k in savings, cautious but open to guidance.
- AI Persona: Margaret Ellsworth, 63, recently retired NHS consultant. Polite, well-informed, slightly anxious about market volatility. Wants to protect capital but generate modest income. Will mention her late husband managed finances previously. Asks thoughtful questions about fees and ESG options.
- Assigned to: Clara, Elliot, Sophie

**RP2 — Explaining a Portfolio Recommendation to a Cautious Client** (`rp-rb2`)
- Scenario: Present a balanced portfolio recommendation to a cautious client who is wary of equities after losing money in 2008. Explain asset allocation, risk-return trade-offs, and how Rathbones manages downside risk.
- AI Persona: David Ashworth, 58, semi-retired business owner, £1.2M portfolio. Still scarred by 2008 losses. Deeply skeptical of equities, prefers cash and property. Will challenge you on fees, past performance, and why bonds aren't enough. Polite but firm — needs data and reassurance, not sales talk.
- Assigned to: Clara, Elliot, Sophie

**RP3 — Internal Collaboration with Financial Planning / Portfolio Management** (`rp-rb3`)
- Scenario: You need to brief a senior Financial Planner and a Portfolio Manager on a complex client case involving inheritance tax planning, pension drawdown, and a property sale. Present a clear summary and seek their input on the investment strategy.
- AI Persona: Starts as James Cartwright, Senior Financial Planner — collaborative, detail-oriented, asks probing questions about the client's tax position and timelines. Mid-conversation, introduces Helen Park, Portfolio Manager — more direct, expects concise briefs, challenges your proposed allocation and asks for justification.
- Not assigned to anyone (reusable)

**RP4 — Handling a Cautious Client Question About Risk and Costs** (`rp-rb4`)
- Scenario: During a routine review meeting, your client asks pointed questions about why their portfolio underperformed a simple tracker fund and whether Rathbones' fees are justified. Handle the conversation with transparency and confidence.
- AI Persona: Richard Townsend, 52, successful solicitor, £650k portfolio. Analytically minded — has been reading investment articles and comparing Rathbones' performance to Vanguard trackers. Not angry, but wants a clear, honest answer. Will press on total cost of ownership and alpha generation.
- Not assigned to anyone (reusable)

**RP5 — Business Development Intro Conversation with a Prospective Client** (`rp-rb5`)
- Scenario: You've been introduced to a prospective client at a professional networking event. They currently use a large bank's wealth management arm but are dissatisfied with the impersonal service. Open the conversation, build rapport, and position Rathbones' value proposition without being pushy.
- AI Persona: Amara Osei, 45, tech company CFO, £2M+ investable assets. Confident, direct, time-poor. Currently with a high-street bank wealth team and finds them formulaic. Open to alternatives but won't tolerate a hard sell. Values personalised service and ESG credentials. Will test whether you understand her situation before engaging further.
- Not assigned to anyone (reusable)

## RolePlay Type Update
**File: `src/types/learning.ts`**
- Add optional `assignedTo?: string[]` field to the `RolePlay` interface

## Role Play Bank — "Assigned to Me" Tab
**File: `src/pages/RolePlayBank.tsx`**
- Add a tab bar above the search: **All Role Plays** | **Assigned to Me**
- "Assigned to Me" filters to role plays where `rp.assignedTo?.includes(user.id)`
- This tab is the default view shown first
- Existing filters (search, difficulty, tags) apply within each tab

## Files Summary
| File | Action |
|------|--------|
| `src/types/learning.ts` | Add `assignedTo?: string[]` to RolePlay |
| `src/data/mock.ts` | Add 3 users + 5 role plays at top of array |
| `src/lib/accountDefaults.ts` | Wire Clara/Elliot/Sophie into employees, users, hierarchy |
| `src/pages/RolePlayBank.tsx` | Add "All" / "Assigned to Me" tab bar |


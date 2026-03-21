

## Plan: Add 20 Role Plays to Rathbones + Fix Tab Display

### Summary
Add 20 new role plays to the Rathbones DB (keeping existing 2, making 22 total). The 5 original beginner RPs appear first, with RP1 and RP2 assigned to Clara (RAT-E003), Elliot (RAT-E004), and Sophie (RAT-E005). Add "Assigned to you" badge in the All Role Plays tab. Fix the Assigned tab filtering.

### Role Play Data (20 new entries)

**5 Original (Beginner, shown on top)**

| ID | Title | Assigned |
|---|---|---|
| RAT-RP-101 | First Client Intro and Risk Appetite Conversation | Clara, Elliot, Sophie |
| RAT-RP-102 | Explaining a Portfolio Recommendation to a Cautious Client | Clara, Elliot, Sophie |
| RAT-RP-103 | Internal Collaboration with Financial Planning / Portfolio Management | — |
| RAT-RP-104 | Handling a Cautious Client Question About Risk and Costs | — |
| RAT-RP-105 | Business Development Intro Conversation with a Prospective Client | — |

**3 More Beginner**
- RAT-RP-106: Introducing Rathbones' Investment Approach to a Referred Client
- RAT-RP-107: Responding to a Simple "How Is My Portfolio Doing?" Call
- RAT-RP-108: Walking a New Client Through Their First Quarterly Report

**7 Intermediate**
- RAT-RP-109: Rebalancing Discussion After a Major Life Event
- RAT-RP-110: Navigating a Client's Request to Overweight a Single Stock
- RAT-RP-111: Explaining ESG Integration to a Sceptical Client
- RAT-RP-112: Conducting a Mid-Year Portfolio Suitability Review
- RAT-RP-113: Discussing Fee Transparency Under Consumer Duty
- RAT-RP-114: Collaborating with Tax Advisers on CGT Planning
- RAT-RP-115: Managing Expectations During a Market Correction

**5 Advanced**
- RAT-RP-116: Complex Intergenerational Wealth Transfer Discussion
- RAT-RP-117: Defending an Underperforming Portfolio in a Client Meeting
- RAT-RP-118: Handling a Complaint Escalation with Regulatory Implications
- RAT-RP-119: Negotiating Bespoke Fee Arrangements for an UHNW Client
- RAT-RP-120: Crisis Communication During a Systemic Market Event

Each will have: realistic scenario text, AI persona, context, tags, and skills measured.

### Code Changes

**1. Database UPDATE** — Append 20 role plays to the Rathbones `data->'rolePlays'` JSONB array (keeping existing RAT-RP-001 and RAT-RP-002).

**2. `src/pages/RolePlayBank.tsx`** — Add "Assigned to you" badge on role play cards in the "All Role Plays" tab when `rp.assignedTo?.includes(user.id)`. Small addition near the difficulty badge (line ~313).

**3. Sorting** — Ensure the 5 original RPs appear at the top of the list. Add a sort that puts assigned RPs first, then by the array order from DB.


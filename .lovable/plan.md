

## Plan: Super Agent In-Chat Assessment (Generic Questions)

### Summary
Same plan as previously approved, with one change: **all 10 assessment questions are rewritten to be generic** — no mention of Rathbones. They still cover the same 3 topic areas mapped to the first 3 chapters of RAT-ST-001.

### Score Logic (unchanged)
- **≥80%**: Unlock skill target, skip first 3 modules, set module 4 as available
- **<80%**: Unlock skill target, all modules in normal sequential order
- Conversational feedback from Super Agent, summary card, CTA to skill target page, Retest button

### Revised Assessment Questions (10 total, no brand names)

**Investment Proposition & Client Outcomes (Q1-3)**
1. What is the primary service model used in discretionary wealth management? → A dedicated manager constructs and manages a bespoke portfolio on the client's behalf
2. How are client outcomes best measured in a discretionary mandate? → Against the individual client's stated objectives and agreed risk parameters
3. What distinguishes a discretionary service from a platform-based investment model? → Bespoke portfolio construction tailored to each client's circumstances

**Client Risk Profiles & Objectives (Q4-6)**
4. When assessing a new client's risk tolerance, the most important factor is: → Their capacity for loss relative to financial goals
5. A client says they want "high growth but no risk." The best response is: → Explore what risk means to them and align expectations with realistic outcomes
6. How often should a client's risk profile be formally reviewed? → At each scheduled review or after a significant life event

**Portfolio Alignment & Suitability (Q7-10)**
7. Under suitability rules, a portfolio recommendation must demonstrate: → Alignment between the client's objectives, risk capacity, and the recommended investments
8. What is the primary purpose of a suitability framework? → To ensure every portfolio decision can be justified against the client's mandate
9. If a client requests an investment outside their agreed mandate, you should: → Document the request, discuss the implications, and obtain informed consent before proceeding
10. Which document serves as the primary reference for a client's investment mandate? → The investment management agreement and latest suitability report

### Code Changes (unchanged from previous plan)

1. **New: `src/components/chat/InlineAssessment.tsx`** — 10-question step-through component with score summary, Retest button, and CTA to `/skill-target/RAT-ST-001`
2. **Update: `src/pages/SuperAgentChat.tsx`** — Render InlineAssessment inline, handle score-based unlock logic via `updateSkillTarget`
3. **Update: `supabase/functions/super-agent-chat/index.ts`** — Score-aware post-assessment prompt for conversational feedback


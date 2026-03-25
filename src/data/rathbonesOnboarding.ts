/**
 * Rathbones Investment Manager Onboarding — Deterministic Data Seed
 * 
 * Contains:
 * - Cohort definition (Investment Manager Cohort — March 2026)
 * - 5-day onboarding plan for Clara, Elliot, Sophie
 * - Assessment content (baseline, mid, final) for Skill Target 2
 * - Chapter summaries for Skill Target 1 and Skill Target 2
 * - Agent One onboarding conversation content
 * - Suggestion pills per stage
 */

import type { SkillTarget, Assessment, StepItem } from "@/types/learning";

/* ═══════════════════════════════════════════════════════════
 * COHORT
 * ═══════════════════════════════════════════════════════════ */

export interface OnboardingCohort {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  program: string;
  members: { employeeId: string; name: string; title: string }[];
}

export const investmentManagerCohort: OnboardingCohort = {
  id: "cohort-im-mar-2026",
  name: "Investment Manager Cohort — March 2026",
  startDate: "2026-03-17",
  endDate: "2026-05-30",
  program: "Rathbones Wealth Management",
  members: [
    { employeeId: "u12", name: "Clara Whitfield", title: "Investment Manager" },
    { employeeId: "u13", name: "Elliot Hargreaves", title: "Investment Manager" },
    { employeeId: "u14", name: "Sophie Langford", title: "Investment Manager" },
  ],
};

/* ═══════════════════════════════════════════════════════════
 * 5-DAY ONBOARDING PLAN
 * ═══════════════════════════════════════════════════════════ */

export interface OnboardingDay {
  day: number;
  title: string;
  description: string;
  activities: { type: string; title: string; duration: string; optional?: boolean }[];
}

export const fiveDayPlan: OnboardingDay[] = [
  {
    day: 1,
    title: "Welcome & Orientation",
    description: "Get set up, meet Agent One, and start the Introduction to Rathbones.",
    activities: [
      { type: "onboarding", title: "Welcome session with your manager", duration: "30 min" },
      { type: "platform", title: "Meet Agent One — your AI learning companion", duration: "10 min" },
      { type: "module", title: "Introduction to Rathbones — Chapter 1: Our Heritage & Values", duration: "20 min" },
      { type: "module", title: "Introduction to Rathbones — Chapter 2: How We Invest", duration: "20 min" },
      { type: "module", title: "Introduction to Rathbones — Chapter 3: Your First 90 Days", duration: "15 min" },
    ],
  },
  {
    day: 2,
    title: "Foundation Skills — Client Relationships",
    description: "Begin your Foundations skill target. Cover the IM role, client outcomes, and relationship management.",
    activities: [
      { type: "module", title: "Rathbones Investment Manager Role and Good Client Outcomes", duration: "20 min" },
      { type: "module", title: "Leading Client Relationships with Confidence", duration: "25 min" },
      { type: "module", title: "Suitability, Documentation, and Client Fairness", duration: "20 min" },
      { type: "reflection", title: "Day 2 reflection with Agent One", duration: "10 min" },
    ],
  },
  {
    day: 3,
    title: "Foundation Skills — Collaboration & Process",
    description: "Learn internal collaboration, the investment process, and take the Foundations checkpoint.",
    activities: [
      { type: "module", title: "Working with Financial Planning, Portfolio Management, and Client Support", duration: "25 min" },
      { type: "assessment", title: "Client Outcomes and Suitability Checkpoint", duration: "15 min" },
      { type: "module", title: "Investment Process and Portfolio Alignment Basics", duration: "20 min" },
      { type: "module", title: "Communicating Clearly with Clients and Internal Partners", duration: "25 min" },
    ],
  },
  {
    day: 4,
    title: "Foundation Skills — Integrity & First Role Play",
    description: "Complete Foundations with the integrity module and your first client role play.",
    activities: [
      { type: "module", title: "Professional Integrity, Attention to Detail, and Ownership", duration: "15 min" },
      { type: "role_play", title: "First Client Intro and Risk Appetite Conversation", duration: "20 min" },
      { type: "assessment", title: "Baseline Assessment — Investment Management Foundations (Clara & Elliot only)", duration: "15 min", optional: true },
      { type: "reflection", title: "Day 4 reflection with Agent One", duration: "10 min" },
    ],
  },
  {
    day: 5,
    title: "Start Your Investment Management Path",
    description: "Begin Skill Target 2 — your personalised investment management learning path.",
    activities: [
      { type: "module", title: "First module of Investment Management (adaptive based on assessment)", duration: "25 min" },
      { type: "module", title: "Second module (if applicable)", duration: "25 min" },
      { type: "reflection", title: "Week 1 reflection with Agent One", duration: "15 min" },
      { type: "planning", title: "Review your progress and plan Week 2 with Agent One", duration: "10 min" },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════
 * ASSESSMENTS FOR SKILL TARGET 2
 * ═══════════════════════════════════════════════════════════ */

export const st2BaselineAssessment: Assessment = {
  id: "a-rb-st2-baseline",
  title: "Baseline Assessment — Investment Management Foundations",
  type: "pre",
  passingScore: 80,
  questions: [
    {
      id: "q-rb-bl-1",
      question: "What is the core responsibility of an Investment Manager at Rathbones when managing a client's portfolio?",
      options: [
        "Generating the highest possible returns regardless of client circumstances",
        "Acting as the primary relationship owner and ensuring portfolio suitability for each client's goals and risk profile",
        "Following the house investment view exactly without client-specific adjustments",
        "Delegating all client interactions to the Financial Planning team",
      ],
      correctIndex: 1,
    },
    {
      id: "q-rb-bl-2",
      question: "A new client expresses a desire for 'aggressive growth' but also mentions they will need 40% of their portfolio within two years for a property purchase. How should you respond?",
      options: [
        "Invest the full portfolio in high-growth equities to maximise the chance of meeting the return target",
        "Acknowledge both needs, separate the short-term liquidity requirement from the growth mandate, and propose a blended strategy",
        "Tell the client that aggressive growth and short-term withdrawals are incompatible and decline the mandate",
        "Place all funds in a money market account until the property purchase is complete",
      ],
      correctIndex: 1,
    },
    {
      id: "q-rb-bl-3",
      question: "Under Consumer Duty and FCA suitability requirements, which of the following must be assessed and documented before making an investment recommendation?",
      options: [
        "The client's social media presence and public reputation",
        "The client's objectives, risk appetite, capacity for loss, and the rationale linking the recommendation to their circumstances",
        "Only the expected return of the recommended portfolio",
        "The internal performance rating of the Investment Manager",
      ],
      correctIndex: 1,
    },
    {
      id: "q-rb-bl-4",
      question: "What is the primary benefit of maintaining a regular engagement cadence with clients, beyond the annual review?",
      options: [
        "It creates opportunities to sell additional products",
        "It builds trust, keeps the portfolio aligned with any changes in circumstances, and demonstrates ongoing commitment to the client's outcomes",
        "It satisfies a regulatory requirement to contact clients quarterly",
        "It allows the Investment Manager to reduce time spent on documentation",
      ],
      correctIndex: 1,
    },
    {
      id: "q-rb-bl-5",
      question: "When preparing for a client meeting, what approach best reflects Rathbones' expectations of an Investment Manager?",
      options: [
        "Review the portfolio performance and prepare a standard template report",
        "Review the client's full financial picture — objectives, recent life changes, portfolio performance vs mandate — and prepare tailored talking points",
        "Wait for the client to raise topics and respond reactively",
        "Focus exclusively on market commentary and investment outlook",
      ],
      correctIndex: 1,
    },
  ],
};

export const st2MidAssessment: Assessment = {
  id: "a-rb-st2-mid",
  title: "Mid Assessment — Investment Management Practice",
  type: "post",
  passingScore: 70,
  questions: [
    {
      id: "q-rb-mid-1",
      question: "During a portfolio review, a client asks why their portfolio underperformed the FTSE 100. The best response is:",
      options: [
        "Acknowledge the concern and explain that their portfolio has a different risk mandate and benchmark",
        "Promise to switch to a pure equity strategy for the next quarter",
        "Blame market conditions and change the subject",
        "Suggest the client consider a passive index fund instead",
      ],
      correctIndex: 0,
    },
    {
      id: "q-rb-mid-2",
      question: "What is the purpose of portfolio rebalancing?",
      options: [
        "To increase the number of trades and generate commission",
        "To realign the portfolio to its target asset allocation after market movements",
        "To remove all underperforming assets immediately",
        "To respond to short-term market sentiment",
      ],
      correctIndex: 1,
    },
    {
      id: "q-rb-mid-3",
      question: "A client inherits £500,000 and wants to invest it immediately. What should you do first?",
      options: [
        "Invest it in the same strategy as their existing portfolio",
        "Review their updated financial position, objectives, and risk profile before making recommendations",
        "Place it in a money market fund while you prepare a pitch",
        "Ask the compliance team to approve the investment",
      ],
      correctIndex: 1,
    },
    {
      id: "q-rb-mid-4",
      question: "When communicating investment performance to a client, which approach demonstrates best practice?",
      options: [
        "Show only the periods where the portfolio outperformed",
        "Present performance against the agreed benchmark, explain attribution, and contextualise within market conditions",
        "Compare performance to the best-performing fund in the market",
        "Focus solely on absolute return without any benchmark reference",
      ],
      correctIndex: 1,
    },
    {
      id: "q-rb-mid-5",
      question: "What is the key risk of not conducting regular suitability reviews?",
      options: [
        "The client may receive too many communications",
        "The portfolio may drift away from the client's current circumstances, objectives, or risk tolerance",
        "The Investment Committee may change the house view",
        "Competitors may offer better fees",
      ],
      correctIndex: 1,
    },
  ],
};

export const st2FinalAssessment: Assessment = {
  id: "a-rb-st2-final",
  title: "Final Assessment — Investment Management Mastery",
  type: "post",
  passingScore: 80,
  questions: [
    {
      id: "q-rb-fin-1",
      question: "A long-standing client asks you to invest 80% of their retirement savings into a single high-growth tech stock. What is the correct course of action?",
      options: [
        "Execute the trade — the client has a right to direct their own portfolio",
        "Explain the concentration risk, document your advice against it, and propose a diversified alternative aligned with their goals",
        "Refuse the trade without further discussion",
        "Escalate immediately to the compliance team without speaking to the client first",
      ],
      correctIndex: 1,
    },
    {
      id: "q-rb-fin-2",
      question: "Which of the following demonstrates the strongest approach to client-centric portfolio management?",
      options: [
        "Applying the same model portfolio to all clients with similar risk ratings",
        "Constructing bespoke portfolios that reflect each client's unique circumstances, values, and financial plan",
        "Following the house view exactly without client-specific adjustments",
        "Maximising alpha regardless of client risk tolerance",
      ],
      correctIndex: 1,
    },
    {
      id: "q-rb-fin-3",
      question: "During a joint meeting with a Financial Planner, you disagree on the drawdown strategy for a client's pension. How should you handle this?",
      options: [
        "Defer entirely to the Financial Planner's recommendation",
        "Override the Financial Planner's view using your investment expertise",
        "Present your respective views to the client transparently and collaborate on an integrated recommendation",
        "Postpone the meeting and resolve the disagreement privately",
      ],
      correctIndex: 2,
    },
    {
      id: "q-rb-fin-4",
      question: "What is the most effective way to demonstrate value to a client during a year of negative absolute returns?",
      options: [
        "Apologise and offer a fee reduction",
        "Show that the portfolio met its risk mandate, preserved capital relative to the benchmark, and remains aligned with their long-term plan",
        "Switch the entire portfolio to cash to prevent further losses",
        "Avoid discussing performance and focus on new investment opportunities",
      ],
      correctIndex: 1,
    },
    {
      id: "q-rb-fin-5",
      question: "A prospective client asks why they should choose Rathbones over a robo-adviser. The strongest response focuses on:",
      options: [
        "Lower fees",
        "Access to a wider range of ETFs",
        "Bespoke portfolio construction, dedicated relationship management, and integrated financial planning",
        "Historical outperformance of all market indices",
      ],
      correctIndex: 2,
    },
  ],
};

/* ═══════════════════════════════════════════════════════════
 * SKILL TARGET 2 — Investment Management Foundations (RAT-ST-001)
 * Per-learner variants: Clara/Elliot get baseline assessment, Sophie does not
 * ═══════════════════════════════════════════════════════════ */

const ST2_MODULES: Omit<StepItem, "order" | "status">[] = [
  { id: "RAT-LM-001", type: "module", title: "Investment Proposition and Client Outcomes", description: "Understanding the discretionary wealth management model and what good client outcomes look like.", skippable: true, skipCondition: "Baseline assessment score > 80%", duration: "25 min", referenceId: "m-rb1" },
  { id: "RAT-LM-002", type: "module", title: "Suitability, Risk Profiling, and Documentation", description: "FCA suitability requirements, risk appetite assessment, and documentation best practice.", skippable: true, skipCondition: "Baseline assessment score > 80%", duration: "20 min", referenceId: "m-rb3" },
  { id: "RAT-LM-003", type: "module", title: "Portfolio Construction and Asset Allocation", description: "Strategic and tactical asset allocation, portfolio construction, and rebalancing principles.", skippable: true, skipCondition: "Baseline assessment score > 80%", duration: "25 min", referenceId: "m-rb5" },
  { id: "RAT-LM-004", type: "module", title: "Client Communication and Relationship Management", description: "Communicating complex investment concepts clearly, delivering portfolio reviews, and managing ongoing relationships.", skippable: false, duration: "25 min", referenceId: "m-rb2" },
  { id: "RAT-LM-005", type: "module", title: "Internal Collaboration — Financial Planning and Portfolio Management", description: "Working effectively with Financial Planners, Portfolio Managers, and Client Support teams.", skippable: false, duration: "25 min", referenceId: "m-rb4" },
  { id: "RAT-LM-006", type: "module", title: "Professional Standards, Integrity, and Ownership", description: "Ethical standards, attention to detail, and taking personal ownership of client outcomes.", skippable: false, duration: "15 min", referenceId: "m-rb7" },
  { id: "RAT-LM-007", type: "module", title: "Communicating Clearly with Clients and Internal Partners", description: "Advanced plain-language communication, professional correspondence, and constructive internal collaboration.", skippable: false, duration: "25 min", referenceId: "m-rb6" },
];

function buildST2ForLearner(
  userId: string,
  learnerId: "clara" | "elliot" | "sophie",
): SkillTarget {
  const hasBaseline = learnerId !== "sophie";

  const steps: StepItem[] = [];
  let order = 1;

  // Baseline assessment — Clara and Elliot only
  if (hasBaseline) {
    steps.push({
      id: "RAT-ASM-001",
      type: "assessment",
      title: "Baseline Assessment — Investment Management Foundations",
      description: "Gauge your existing investment management knowledge to personalise your learning path.",
      order: order++,
      skippable: false,
      status: "available",
      duration: "15 min",
      referenceId: "a-rb-st2-baseline",
    });
  }

  // Learning modules
  for (const mod of ST2_MODULES) {
    steps.push({
      ...mod,
      order: order++,
      status: hasBaseline ? "locked" : (order === 2 ? "available" : "locked"),
      // Sophie: no skip logic — all modules required
      skippable: hasBaseline ? mod.skippable : false,
      skipCondition: hasBaseline ? mod.skipCondition : undefined,
    });
  }

  // Mid assessment
  steps.push({
    id: "RAT-ASM-002",
    type: "assessment",
    title: "Mid Assessment — Investment Management Practice",
    description: "Check your progress halfway through the investment management path.",
    order: order++,
    skippable: false,
    status: "locked",
    duration: "15 min",
    referenceId: "a-rb-st2-mid",
  });

  // Final role play
  steps.push({
    id: "RAT-RP-001",
    type: "role_play",
    title: "Client Portfolio Review Conversation",
    description: "Conduct a portfolio review meeting with a client who has questions about performance and risk.",
    order: order++,
    skippable: false,
    status: "locked",
    duration: "20 min",
    referenceId: "rp-rb4",
  });

  // Final assessment
  steps.push({
    id: "RAT-ASM-003",
    type: "assessment",
    title: "Final Assessment — Investment Management Mastery",
    description: "Validate your investment management knowledge and readiness.",
    order: order++,
    skippable: false,
    status: "locked",
    duration: "15 min",
    referenceId: "a-rb-st2-final",
  });

  return {
    id: "RAT-ST-001",
    title: "Investment Management Foundations",
    description: "Master the core competencies of investment management — from client suitability and portfolio construction to communication and professional standards.",
    category: "Rathbones Wealth Management",
    assignedTo: [userId],
    progress: 0,
    dueDate: "2026-05-30",
    locked: true,
    prerequisiteId: learnerId === "elliot" ? "RAT-ST-BRIDGE-001" : `st-rb-${learnerId}`,
    skills: [
      { name: "Investment Management", current: "Beginner", target: "Advanced" },
      { name: "Portfolio Construction", current: "Beginner", target: "Intermediate" },
      { name: "Client Suitability", current: "Beginner", target: "Advanced" },
      { name: "Regulatory Knowledge", current: "Beginner", target: "Intermediate" },
      { name: "Financial Planning Collaboration", current: "Beginner", target: "Intermediate" },
    ],
    steps,
  };
}

export const claraSkillTarget2 = buildST2ForLearner("u12", "clara");
export const elliotSkillTarget2 = buildST2ForLearner("u13", "elliot");
export const sophieSkillTarget2 = buildST2ForLearner("u14", "sophie");

/* ═══════════════════════════════════════════════════════════
 * ELLIOT'S DOMAIN BRIDGE TARGET (RAT-ST-BRIDGE-001)
 * ═══════════════════════════════════════════════════════════ */

export const elliotDomainBridge: SkillTarget = {
  id: "RAT-ST-BRIDGE-001",
  title: "Domain Bridge — Financial Services to Wealth Management",
  description: "Map your existing financial services experience to the Rathbones wealth management context. This short path connects what you already know to how we work.",
  category: "Rathbones Wealth Management",
  assignedTo: ["u13"],
  progress: 0,
  dueDate: "2026-04-15",
  locked: true,
  prerequisiteId: "st-rb-elliot",
  skills: [
    { name: "Wealth Management Context", current: "Beginner", target: "Intermediate" },
    { name: "Rathbones Investment Process", current: "Beginner", target: "Intermediate" },
  ],
  steps: [
    { id: "RAT-BR-001", type: "module", title: "From Financial Services to Wealth Management", description: "Understand how your financial services background maps to the wealth management context at Rathbones.", order: 1, skippable: false, status: "locked", duration: "20 min", referenceId: "m-rb1" },
    { id: "RAT-BR-002", type: "module", title: "Rathbones Investment Approach and Portfolio Philosophy", description: "Deep dive into Rathbones' investment approach, portfolio construction philosophy, and how it differs from other firms.", order: 2, skippable: false, status: "locked", duration: "25 min", referenceId: "m-rb5" },
    { id: "RAT-BR-003", type: "role_play", title: "Translating Your Experience — Client Conversation", description: "Practice explaining your approach to a Rathbones client, demonstrating you understand the firm's investment philosophy.", order: 3, skippable: false, status: "locked", duration: "15 min", referenceId: "rp-rb2" },
  ],
};

/* ═══════════════════════════════════════════════════════════
 * INTRODUCTION TO RATHBONES TARGET (RAT-ST-INTRO-001)
 * ═══════════════════════════════════════════════════════════ */

export const introToRathbones: SkillTarget = {
  id: "RAT-ST-INTRO-001",
  title: "Introduction to Rathbones",
  description: "A short onboarding path covering Rathbones' heritage, investment approach, and what to expect in your first 90 days.",
  category: "Rathbones Wealth Management",
  assignedTo: ["u12", "u13", "u14"],
  progress: 0,
  dueDate: "2026-04-01",
  locked: false,
  skills: [
    { name: "Rathbones Heritage", current: "Beginner", target: "Intermediate" },
    { name: "Investment Approach", current: "Beginner", target: "Intermediate" },
  ],
  steps: [
    { id: "RAT-INTRO-001", type: "module", title: "Our Heritage & Values", description: "Learn about Rathbones' 280+ year heritage, core values, and commitment to responsible wealth management.", order: 1, skippable: false, status: "available", duration: "15 min", referenceId: "m-rb1" },
    { id: "RAT-INTRO-002", type: "module", title: "How We Invest", description: "An overview of Rathbones' investment philosophy, approach to portfolio management, and how we deliver client outcomes.", order: 2, skippable: false, status: "locked", duration: "15 min", referenceId: "m-rb5" },
    { id: "RAT-INTRO-003", type: "module", title: "Your First 90 Days", description: "What to expect during your first three months — key milestones, support available, and how to make the most of your onboarding.", order: 3, skippable: false, status: "locked", duration: "10 min", referenceId: "m-rb7" },
  ],
};

/* ═══════════════════════════════════════════════════════════
 * CHAPTER SUMMARIES — for Agent One in-context use
 * ═══════════════════════════════════════════════════════════ */

export interface ChapterSummary {
  targetId: string;
  targetTitle: string;
  chapters: { stepId: string; title: string; summary: string; keyTakeaways: string[] }[];
}

export const chapterSummaries: ChapterSummary[] = [
  {
    targetId: "st-rb-clara",
    targetTitle: "Rathbones Investment Manager Foundations (Skill Target 1)",
    chapters: [
      {
        stepId: "s-rb-c1",
        title: "Rathbones Investment Manager Role and Good Client Outcomes",
        summary: "This chapter covers the core responsibilities of an Investment Manager at Rathbones. It explains fiduciary duty, what constitutes a 'good client outcome' under Consumer Duty, and how the IM role fits within the broader wealth management team.",
        keyTakeaways: ["Fiduciary duty is the foundation of the IM role", "Good client outcomes = alignment with goals, risk appetite, and circumstances", "The IM is the primary relationship owner"],
      },
      {
        stepId: "s-rb-c2",
        title: "Leading Client Relationships with Confidence",
        summary: "How experienced Rathbones IMs build and maintain strong client relationships — from first meeting preparation to ongoing engagement rhythms.",
        keyTakeaways: ["Preparation and transparency build trust", "Set expectations early in the relationship", "Regular engagement cadence is key — annual reviews plus ad-hoc check-ins"],
      },
      {
        stepId: "s-rb-c3",
        title: "Suitability, Documentation, and Client Fairness",
        summary: "FCA suitability requirements and Rathbones' internal standards for assessing risk appetite, capacity for loss, and documenting the rationale for investment recommendations.",
        keyTakeaways: ["Always assess objectives, risk appetite, and capacity for loss", "Document everything — the rationale, not just the recommendation", "Fair treatment is an ongoing obligation, not a one-off check"],
      },
      {
        stepId: "s-rb-c4",
        title: "Working with Financial Planning, Portfolio Management, and Client Support",
        summary: "How IMs collaborate with Financial Planners on tax, pensions, and estate planning; with Portfolio Managers on investment strategy; and with Client Support on operational matters.",
        keyTakeaways: ["Financial Planners inform the investment strategy — don't work in isolation", "Clear handoffs and joint client meetings improve outcomes", "Present a unified approach to the client"],
      },
      {
        stepId: "s-rb-c5",
        title: "Client Outcomes and Suitability Checkpoint",
        summary: "A checkpoint assessment covering client outcomes, suitability assessment, relationship management, and internal collaboration.",
        keyTakeaways: ["Tests understanding of suitability obligations", "Covers practical scenarios on client interactions", "Validates readiness for more advanced investment topics"],
      },
      {
        stepId: "s-rb-c6",
        title: "Investment Process and Portfolio Alignment Basics",
        summary: "Rathbones' investment process from strategic asset allocation through portfolio construction to rebalancing. How client mandates translate into portfolio positions.",
        keyTakeaways: ["SAA sets the long-term direction; TAA makes short-term adjustments", "The Investment Committee provides the house view", "Portfolios must remain aligned with stated client objectives"],
      },
      {
        stepId: "s-rb-c7",
        title: "Communicating Clearly with Clients and Internal Partners",
        summary: "Explaining complex investment concepts in plain language, writing clear client correspondence, delivering portfolio reviews, and communicating constructively with internal teams.",
        keyTakeaways: ["Plain language > jargon — always", "Structure client communications: context, content, next steps", "Tailor your communication style to the audience"],
      },
      {
        stepId: "s-rb-c8",
        title: "Professional Integrity, Attention to Detail, and Ownership",
        summary: "Professional standards expected at Rathbones — personal ownership of client outcomes, meticulous documentation, ethical conduct, and maintaining the firm's reputation.",
        keyTakeaways: ["Take personal ownership of every client outcome", "Attention to detail in documentation prevents downstream issues", "Integrity is the foundation of Rathbones' reputation"],
      },
    ],
  },
  {
    targetId: "RAT-ST-001",
    targetTitle: "Investment Management Foundations (Skill Target 2)",
    chapters: [
      {
        stepId: "RAT-LM-001",
        title: "Investment Proposition and Client Outcomes",
        summary: "Deep dive into the discretionary wealth management model — how Rathbones constructs and manages bespoke portfolios, and what 'good client outcomes' means in practice under Consumer Duty.",
        keyTakeaways: ["Discretionary = bespoke portfolio on client's behalf", "Outcomes measured against individual objectives, not market indices", "Consumer Duty requires evidencing good outcomes"],
      },
      {
        stepId: "RAT-LM-002",
        title: "Suitability, Risk Profiling, and Documentation",
        summary: "Practical application of FCA suitability requirements — conducting risk profiling conversations, documenting rationale, and handling situations where risk appetite conflicts with return expectations.",
        keyTakeaways: ["Risk profiling is a conversation, not a questionnaire", "Document the 'why', not just the 'what'", "When risk and return conflict, educate and agree — never assume"],
      },
      {
        stepId: "RAT-LM-003",
        title: "Portfolio Construction and Asset Allocation",
        summary: "How Rathbones builds portfolios — strategic vs tactical allocation, diversification principles, rebalancing triggers, and how the Investment Committee view informs positioning.",
        keyTakeaways: ["SAA = long-term structure; TAA = short-term tilts", "Diversification across asset class, geography, and sector", "Rebalancing maintains alignment with the client mandate"],
      },
      {
        stepId: "RAT-LM-004",
        title: "Client Communication and Relationship Management",
        summary: "Advanced communication skills for investment managers — explaining performance attribution, handling difficult conversations about losses, and building long-term client trust.",
        keyTakeaways: ["Lead with context before presenting numbers", "Losses require proactive, honest communication", "Long-term trust comes from consistency, not perfection"],
      },
      {
        stepId: "RAT-LM-005",
        title: "Internal Collaboration — Financial Planning and Portfolio Management",
        summary: "Working as part of an integrated advisory team — effective handoffs, joint client meetings, and presenting a unified recommendation on complex cases.",
        keyTakeaways: ["The best outcomes come from collaborative advisory", "Disagree privately, present a unified view to the client", "Complex cases (IHT, pensions) require Financial Planning input"],
      },
      {
        stepId: "RAT-LM-006",
        title: "Professional Standards, Integrity, and Ownership",
        summary: "Ethical obligations, regulatory responsibilities, and the personal ownership mindset that defines excellent investment management at Rathbones.",
        keyTakeaways: ["Personal ownership = your client's outcome is your responsibility", "Regulatory compliance is the minimum — aspire to excellence", "Integrity cannot be compromised for commercial pressure"],
      },
      {
        stepId: "RAT-LM-007",
        title: "Communicating Clearly with Clients and Internal Partners",
        summary: "Advanced communication: writing suitability letters, delivering annual reviews, handling media coverage of market events, and constructive feedback to colleagues.",
        keyTakeaways: ["Suitability letters must be clear, complete, and client-appropriate", "Market events require proactive client outreach", "Internal feedback should be specific, constructive, and timely"],
      },
    ],
  },
  {
    targetId: "RAT-ST-BRIDGE-001",
    targetTitle: "Domain Bridge — Financial Services to Wealth Management (Elliot)",
    chapters: [
      {
        stepId: "RAT-BR-001",
        title: "From Financial Services to Wealth Management",
        summary: "How Elliot's financial services background maps to the wealth management context. Key differences in client relationship models, regulatory frameworks, and investment approaches.",
        keyTakeaways: ["Wealth management is relationship-led, not product-led", "Regulatory framework (MiFID II, Consumer Duty) shapes everything", "Your existing knowledge is valuable — context is what changes"],
      },
      {
        stepId: "RAT-BR-002",
        title: "Rathbones Investment Approach and Portfolio Philosophy",
        summary: "Deep dive into how Rathbones differs from other firms — the investment philosophy, portfolio construction approach, and what sets the firm apart.",
        keyTakeaways: ["Rathbones' approach is bespoke, not model-based", "The Investment Committee sets the house view", "Client mandates, not benchmarks, drive portfolio decisions"],
      },
      {
        stepId: "RAT-BR-003",
        title: "Translating Your Experience — Client Conversation",
        summary: "A role play exercise to practice explaining your investment approach in a way that reflects Rathbones' philosophy and values.",
        keyTakeaways: ["Lead with the client's goals, not your past experience", "Demonstrate understanding of Rathbones' approach", "Show how your experience adds value in this context"],
      },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════
 * AGENT ONE ONBOARDING CONTENT — deterministic prompts
 * ═══════════════════════════════════════════════════════════ */

export interface AgentOneOnboardingContent {
  welcome: string;
  whatsNext: string;
  cohortExplanation: string;
  skillProfileExplanation: string;
  onboardingStartGuidance: string;
  positiveReinforcement: string[];
  reflectionPrompts: string[];
}

export const agentOneContent: Record<string, AgentOneOnboardingContent> = {
  // Clara — adaptive path with baseline assessment
  u12: {
    welcome: `Welcome to Rathbones, Clara! 🎉 I'm Agent One, your AI learning companion. I'll guide you through your onboarding journey, help you navigate your training, and answer any questions along the way.\n\nLet me pull up your profile so we can get started.`,
    whatsNext: `Here's what's ahead for you:\n\n1. **Introduction to Rathbones** — a quick 3-chapter overview of our heritage, investment approach, and your first 90 days\n2. **Investment Manager Foundations** — your main learning path covering client relationships, suitability, and communication\n3. **Skills Assessment** — a short baseline to personalise your investment management training\n4. **Investment Management Foundations** — your personalised learning path based on your assessment results\n\nShall we start with the Introduction to Rathbones?`,
    cohortExplanation: `You're part of the **Investment Manager Cohort — March 2026**, alongside Elliot Hargreaves and Sophie Langford. You'll all be working through the same foundational training, but your paths will be personalised based on your experience and assessment results.`,
    skillProfileExplanation: `Based on your profile, here's where you stand:\n- **Client Relationship Management** — Beginner → target: Intermediate\n- **Suitability and Documentation** — Beginner → target: Intermediate\n- **Investment Communication** — Beginner → target: Intermediate\n- **Active Listening** — Intermediate → target: Advanced\n\nYour existing active listening skills give you a solid foundation. The training will build on this.`,
    onboardingStartGuidance: `Great! Your first step is the **Introduction to Rathbones** — three short chapters covering our heritage, how we invest, and what to expect in your first 90 days. It takes about 45 minutes total.\n\nOnce you've completed that, we'll move on to your Foundations skill target.`,
    positiveReinforcement: [
      "Great work completing that chapter, Clara! You're building a solid foundation.",
      "You're making excellent progress — keep it up!",
      "Well done on the checkpoint! Your understanding of client outcomes is strong.",
      "You're on track with your onboarding plan. Let me know if you need any help.",
      "Impressive score! Your existing skills are clearly helping you progress quickly.",
    ],
    reflectionPrompts: [
      "How are you finding the onboarding so far? Anything feeling unclear or overwhelming?",
      "What's been the most useful thing you've learned this week?",
      "Is there anything you'd like to spend more time on before moving ahead?",
      "How confident are you feeling about client conversations at this point?",
      "Is there anything about the Rathbones way of working that surprised you?",
    ],
  },

  // Elliot — experienced hire, adaptive path with domain bridge
  u13: {
    welcome: `Welcome onboard, Elliot — it's great to have you here. You already bring valuable experience, and I'll help you build the Rathbones-specific investment context you need to succeed here. I'll guide you through your onboarding journey, answer questions, and help you move through your assigned skill targets step by step. How has your experience been so far?`,
    whatsNext: `You've been added to the Investment Manager Cohort — March 2026. Over the next five days, I'll guide you through your onboarding plan. Since you already have strong experience, your path is tailored to help you quickly build Rathbones-specific investment knowledge before moving deeper into the core investment manager foundations.`,
    cohortExplanation: `You're part of the **Investment Manager Cohort — March 2026** with Clara Whitfield and Sophie Langford. You're all starting the same core programme, but your path includes a Domain Bridge that maps your existing financial services experience to the Rathbones context.`,
    skillProfileExplanation: `Based on your profile, the system already understands your current strengths. You bring strong transferable financial services experience, but you're still building depth in Rathbones-specific investment domain knowledge. The Domain Bridge and your adaptive learning path are designed to close that gap efficiently.\n\n:::RICH_BLOCK{"type":"skills_chart","data":{},"cta":{"label":"Open My360","path":"/my-360"}}:::`,
    onboardingStartGuidance: `Fantastic — let's begin. Because you already bring relevant experience, I'll first guide you through a short baseline assessment to understand what you already know. This helps tailor your learning path. If you perform strongly, some early modules in Investment Management Foundations can be skipped, although they'll still remain available if you want to review them.\n\nYour path after the assessment:\n1. **Introduction to Rathbones** — heritage, approach, and your first 90 days\n2. **Rathbones Investment Domain Bridge** — connecting your experience to the Rathbones context\n3. **Investment Management Foundations** — your personalised learning path`,
    positiveReinforcement: [
      "Nice progress — you're moving through this well.",
      "You're building the Rathbones-specific context quickly.",
      "That's a strong step forward.",
      "You're on track — let's keep going.",
      "Your existing experience is clearly helping you pick this up fast.",
    ],
    reflectionPrompts: [
      "I'd like to understand how your onboarding is going so far, especially as you connect your previous experience to the Rathbones investment context. What's feeling familiar, and what still feels new?",
      "What aspects of the Domain Bridge felt most familiar? What was new?",
      "Are there areas where you feel your past experience gives you an advantage?",
      "What's been the biggest adjustment so far?",
      "How confident are you feeling about translating your skills to the Rathbones context?",
    ],
  },

  // Sophie — full path, no baseline assessment
  u14: {
    welcome: `Welcome to Rathbones, Sophie! 🎉 I'm Agent One, your AI learning companion. I'll be with you throughout your entire onboarding journey — guiding you through your training, answering questions, and helping you build confidence.\n\nLet me pull up your profile.`,
    whatsNext: `Here's your onboarding path:\n\n1. **Introduction to Rathbones** — a quick overview of our heritage, investment approach, and your first 90 days\n2. **Investment Manager Foundations** — your main learning path covering client relationships, suitability, and communication\n3. **Investment Management Foundations** — the full learning path covering all investment management modules\n\nYou'll work through every module to build a comprehensive foundation — and I'll be here to help along the way.`,
    cohortExplanation: `You're part of the **Investment Manager Cohort — March 2026** alongside Clara Whitfield and Elliot Hargreaves. You'll all be working through the same foundational training. Your path is designed to build a thorough understanding from the ground up.`,
    skillProfileExplanation: `Here's where you're starting:\n- **Client Relationship Management** — Beginner → target: Intermediate\n- **Suitability and Documentation** — Beginner → target: Intermediate\n- **Investment Communication** — Beginner → target: Intermediate\n- **Active Listening** — Intermediate → target: Advanced\n\nYour active listening skills give you a great base. The training will build everything else step by step.`,
    onboardingStartGuidance: `Let's begin with the **Introduction to Rathbones** — three short chapters about our heritage, how we invest, and what to expect in your first 90 days. It takes about 45 minutes.\n\nTake your time — this is about building a strong foundation. There's no rush.`,
    positiveReinforcement: [
      "Well done, Sophie! Every chapter is building your confidence and knowledge.",
      "You're making steady progress — that's exactly what we want to see.",
      "Great work on that module! You're developing a solid understanding.",
      "Keep going — you're doing really well. This foundation will serve you brilliantly.",
      "Excellent work completing that section! You should feel proud of your progress.",
    ],
    reflectionPrompts: [
      "How are you feeling about the pace of your onboarding?",
      "What's been the most interesting thing you've learned so far?",
      "Is there anything you'd like to revisit or spend more time on?",
      "How confident do you feel about the concepts covered so far?",
      "What questions do you have about the role that we haven't covered yet?",
    ],
  },
};

/* ═══════════════════════════════════════════════════════════
 * SUGGESTION PILLS PER STAGE
 * ═══════════════════════════════════════════════════════════ */

export const onboardingSuggestionPills: Record<string, string[]> = {
  welcome: ["Let's get started", "Tell me about my cohort", "What's my onboarding plan?"],
  "profile-review": ["Show me my onboarding plan", "Tell me about my cohort", "What skills do I need?"],
  feedback: ["What's my 20-day plan?", "Who's in my cohort?", "What should I focus on first?"],
  "task-list": ["Start my first module", "Tell me about the Introduction to Rathbones", "How long will onboarding take?"],
  "pre-intro": ["Go to Introduction to Rathbones", "What will I learn?", "How long will it take?"],
  "pre-bridge": ["Go to my bridge target", "What's a domain bridge?", "How does it help me?"],
  "pre-assessment": ["Take the assessment", "How should I prepare?", "What if I don't score well?"],
  "post-assessment": ["View my skill target", "What modules do I have?", "How long will it take?"],
  "post-completion": ["Write a reflection", "What should I do next?", "Show my progress"],
};

/* ═══════════════════════════════════════════════════════════
 * DEMO LEARNER HELPERS — derived from cohort, not hardcoded
 * ═══════════════════════════════════════════════════════════ */

const PERSONA_MAP: Record<string, "clara" | "elliot" | "sophie"> = {};
for (const member of investmentManagerCohort.members) {
  const first = member.name.split(" ")[0].toLowerCase() as "clara" | "elliot" | "sophie";
  PERSONA_MAP[member.employeeId] = first;
}

const DEMO_LEARNER_ID_SET = new Set(investmentManagerCohort.members.map(m => m.employeeId));

export function isDemoLearner(userId: string): boolean {
  return DEMO_LEARNER_ID_SET.has(userId);
}

export function getDemoPersona(userId: string): "clara" | "elliot" | "sophie" | null {
  return PERSONA_MAP[userId] || null;
}

/* ═══════════════════════════════════════════════════════════
 * DEMO SCRIPT — deterministic input → response map
 * ═══════════════════════════════════════════════════════════ */

export interface DemoScriptEntry {
  patterns: string[];
  /** If true, only intercept when chapterContext is available */
  requiresChapter?: boolean;
  response: (persona: "clara" | "elliot" | "sophie", ctx?: { chapterTitle?: string; chapterSummary?: string; chapterTakeaways?: string[] }) => string;
  pills: (persona: "clara" | "elliot" | "sophie", stage: string) => string[];
  nextStage?: string;
  richBlockType?: string;
}

const personaName = (p: "clara" | "elliot" | "sophie") =>
  p === "clara" ? "Clara" : p === "elliot" ? "Elliot" : "Sophie";

export const DEMO_SCRIPT: DemoScriptEntry[] = [
  // ─── Opening / positive experience ───
  {
    patterns: ["positive experience", "really enjoying", "great so far", "loving it"],
    response: (p) => `That's wonderful to hear, ${personaName(p)}! It's great that you're settling in well. Let's make sure you have a clear view of what's coming up — would you like to see what's next, or take a look at your current skills?`,
    pills: () => ["What's next?", "Show me my current skills"],
  },

  // ─── What's next ───
  {
    patterns: ["what's next", "what is next", "what comes next", "what's ahead"],
    response: (p) => {
      if (p === "elliot") {
        return `You've been added to the Investment Manager Cohort — March 2026. Over the next five days, I'll guide you through your onboarding plan. Since you already have strong experience, your path is tailored to help you quickly build Rathbones-specific investment knowledge before moving deeper into the core investment manager foundations.`;
      }
      const content = agentOneContent[Object.keys(PERSONA_MAP).find(k => PERSONA_MAP[k] === p) || ""];
      return content?.whatsNext || `Let me outline your onboarding path, ${personaName(p)}.`;
    },
    pills: (p) => p === "elliot"
      ? ["Show my 5-day plan", "Show me my current skills", "Why is the domain bridge important?", "Let's start the onboarding plan"]
      : ["Let's start with the onboarding plan", "Show me my current skills", "Tell me about my cohort"],
    nextStage: "task-list",
  },

  // ─── Show my skills ───
  {
    patterns: ["show me my current skills", "show my skills", "my current skills", "view my skills", "what are my skills"],
    response: (p) => {
      const content = agentOneContent[Object.keys(PERSONA_MAP).find(k => PERSONA_MAP[k] === p) || ""];
      return (content?.skillProfileExplanation || `Here's your skill profile, ${personaName(p)}.`) +
        `\n\n:::RICH_BLOCK{"type":"skills_chart","data":{},"cta":{"label":"View My 360","path":"/my-360"}}:::`;
    },
    pills: () => ["Let's start with the onboarding plan", "What should I focus on?"],
    richBlockType: "skills_chart",
  },

  // ─── Let's start with the onboarding plan ───
  {
    patterns: ["let's start", "start with the onboarding", "begin my onboarding", "start onboarding"],
    response: (p) => {
      const content = agentOneContent[Object.keys(PERSONA_MAP).find(k => PERSONA_MAP[k] === p) || ""];
      return content?.onboardingStartGuidance || `Let's get your onboarding started, ${personaName(p)}!`;
    },
    pills: () => ["Go to Introduction to Rathbones", "What will I learn?", "How long will it take?"],
    nextStage: "pre-intro",
  },

  // ─── Summarise this chapter (requires chapter context) ───
  {
    patterns: ["summarize", "summarise", "summary of this", "recap this chapter", "what did this cover"],
    requiresChapter: true,
    response: (_p, ctx) => {
      if (!ctx?.chapterTitle) return "Let me summarise this chapter for you.";
      let resp = `Here's a summary of **${ctx.chapterTitle}**:\n\n${ctx.chapterSummary || ""}`;
      if (ctx.chapterTakeaways?.length) {
        resp += "\n\n**Key takeaways:**\n" + ctx.chapterTakeaways.map(t => `- ${t}`).join("\n");
      }
      return resp;
    },
    pills: () => ["What's next after this?", "Quiz me on this", "What should I focus on?"],
  },

  // ─── What should I focus on ───
  {
    patterns: ["what should i focus on", "where should i focus", "what do i prioritise"],
    response: (p) => `Great question, ${personaName(p)}. Based on your current progress, I'd recommend focusing on your active skill target — work through each chapter in order, and don't skip the reflections. They help consolidate your learning and give your manager visibility into how you're progressing.`,
    pills: () => ["Let's start with the onboarding plan", "Show me my current skills"],
  },

  // ─── What is a reflection ───
  {
    patterns: ["what is a reflection", "what's a reflection", "tell me about reflections", "how do reflections work"],
    response: (p) => `Reflections are short check-ins where you share how you're finding the training, ${personaName(p)}. They help you consolidate what you've learned and give your manager, Julian, insight into your progress and confidence. I'll prompt you at key points — you just respond naturally, and I'll log it for you.`,
    pills: () => ["Yes, add that as my reflection", "What's next?"],
  },

  // ─── Yes, add as reflection ───
  {
    patterns: ["yes, add that as my reflection", "add that as my reflection", "yes, log that", "submit my reflection"],
    response: (p) => `Done! I've logged your reflection, ${personaName(p)}. Your manager Julian will be able to see it in his team dashboard. Keep up the great work — reflections like these show real engagement with your learning.`,
    pills: () => ["What's next?", "Show my progress"],
    nextStage: "post-completion",
  },

  // ─── Tell me about my cohort ───
  {
    patterns: ["tell me about my cohort", "who's in my cohort", "who else is onboarding", "my cohort"],
    response: (p) => {
      const content = agentOneContent[Object.keys(PERSONA_MAP).find(k => PERSONA_MAP[k] === p) || ""];
      return content?.cohortExplanation || `You're part of the Investment Manager Cohort — March 2026.`;
    },
    pills: () => ["What's next?", "Let's start with the onboarding plan"],
  },

  // ─── Elliot-specific: domain bridge ───
  {
    patterns: ["domain bridge", "what's a domain bridge", "what is a domain bridge", "tell me about the bridge"],
    response: (p) => p === "elliot"
      ? `The Domain Bridge is a short learning path designed specifically for you, Elliot. It maps your existing financial services experience to the Rathbones wealth management context. There are two modules and a role play — it should feel quite natural given your background.`
      : `The Domain Bridge is a specialised path for learners transitioning from financial services. It maps existing experience to the Rathbones wealth management context.`,
    pills: (p) => p === "elliot"
      ? ["Go to my bridge target", "What's next?"]
      : ["What's next?", "Let's start with the onboarding plan"],
  },

  // ─── Go to my bridge (Elliot) ───
  {
    patterns: ["go to my bridge", "start the bridge", "open bridge target"],
    response: () => `Your Domain Bridge is ready. Head to your skill targets to begin — the first module will map your financial services experience to the Rathbones context.`,
    pills: () => ["What will I learn?", "How long will it take?"],
    nextStage: "pre-bridge",
  },
];

/**
 * Find a matching demo script entry for the given input.
 * Returns null if no match or if chapter context is required but missing.
 */
export function findDemoMatch(
  input: string,
  hasChapterContext: boolean
): DemoScriptEntry | null {
  const lower = input.toLowerCase().trim();
  for (const entry of DEMO_SCRIPT) {
    if (entry.requiresChapter && !hasChapterContext) continue;
    if (entry.patterns.some(p => lower.includes(p))) return entry;
  }
  return null;
}

/* ═══════════════════════════════════════════════════════════
 * MANAGER MILESTONES — step completion → manager event
 * ═══════════════════════════════════════════════════════════ */

export interface ManagerMilestone {
  stepId: string;
  eventType: string;
  category: string;
  titleTemplate: (name: string) => string;
  subtitleTemplate: (name: string) => string;
}

export const MANAGER_MILESTONES: ManagerMilestone[] = [
  {
    stepId: "RAT-INTRO-001",
    eventType: "onboarding_started",
    category: "onboarding_progress",
    titleTemplate: (n) => `${n} has started onboarding`,
    subtitleTemplate: (n) => `${n} began the Introduction to Rathbones — their onboarding journey is underway.`,
  },
  {
    stepId: "RAT-INTRO-003",
    eventType: "skill_target_completed",
    category: "onboarding_progress",
    titleTemplate: (n) => `${n} completed Introduction to Rathbones`,
    subtitleTemplate: (n) => `${n} finished all three introductory chapters and is ready for the next phase.`,
  },
  {
    stepId: "RAT-ASM-001",
    eventType: "assessment_completed",
    category: "onboarding_progress",
    titleTemplate: (n) => `${n} completed the baseline assessment`,
    subtitleTemplate: (n) => `${n} has taken the Investment Management Foundations baseline assessment.`,
  },
  {
    stepId: "s-rb-c3",
    eventType: "reflection_submitted",
    category: "reflection_request",
    titleTemplate: (n) => `${n} submitted a reflection`,
    subtitleTemplate: (n) => `${n} has shared their Day 2/3 onboarding reflection.`,
  },
  {
    stepId: "RAT-ASM-003",
    eventType: "onboarding_midpoint_reached",
    category: "onboarding_progress",
    titleTemplate: (n) => `${n} reached readiness milestone`,
    subtitleTemplate: (n) => `${n} completed the final assessment — a key onboarding readiness milestone.`,
  },
];

/* ═══════════════════════════════════════════════════════════
 * GET ALL RATHBONES SKILL TARGETS FOR A USER
 * ═══════════════════════════════════════════════════════════ */

export function getRathbonesTargetsForUser(userId: string): SkillTarget[] {
  const targets: SkillTarget[] = [introToRathbones];

  if (userId === "u12") {
    targets.push(claraSkillTarget2);
  } else if (userId === "u13") {
    targets.push(elliotDomainBridge, elliotSkillTarget2);
  } else if (userId === "u14") {
    targets.push(sophieSkillTarget2);
  }

  // Filter to only targets assigned to this user
  return targets.filter(t => t.assignedTo.includes(userId));
}

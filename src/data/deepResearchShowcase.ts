/**
 * Deep Research — Clara vs Theo showcase envelopes for Rathbones / Pinnacle Capital.
 * 5 scripted prompts that flow as a guided wow story.
 */
import type { ResponseEnvelope } from "@/lib/deepResearch/envelope";

export interface ShowcasePrompt {
  id: string;
  title: string;
  prompt: string;
  envelope: ResponseEnvelope;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const RATHBONES_SHOWCASE: ShowcasePrompt[] = [
  /* ─────────────── 1. Cohort health ─────────────── */
  {
    id: "cohort-health",
    title: "Associate IM cohort readiness",
    prompt: "Show me the Associate IM cohort readiness picture.",
    envelope: {
      executive:
        "The Associate IM cohort is broadly on track for Q2 sign-off, but two risk-critical evidence gaps (Suitability and Consumer Duty) are concentrated in the early-career half of the cohort.",
      visuals: [
        {
          type: "kpi_strip",
          items: [
            { label: "Cohort readiness", value: "62%", tone: "amber", sub: "9 learners · target 80%" },
            { label: "On track", value: "5", tone: "green", sub: "incl. Clara, Felix" },
            { label: "At risk", value: "3", tone: "red", sub: "incl. Theo" },
            { label: "Stretch-ready", value: "1", tone: "green", sub: "Clara" },
          ],
        },
        {
          type: "readiness_cards",
          learners: [
            {
              name: "Clara Whitfield",
              title: "Investment Manager · mid-career",
              status: "Ready with support",
              statusTone: "amber",
              topGap: "Rathbones-specific suitability evidence",
              nextAction: "Assign suitability evidence task",
            },
            {
              name: "Theo Marston",
              title: "Investment Manager · early-career",
              status: "At risk",
              statusTone: "red",
              topGap: "Suitability + Consumer Duty (knowledge & evidence)",
              nextAction: "Keep full modules + mentor check-in",
            },
            {
              name: "Felix Arden",
              title: "Assistant Investment Manager",
              status: "On track",
              statusTone: "green",
              topGap: "Portfolio construction depth",
              nextAction: "Schedule stretch role-play",
            },
          ],
        },
        {
          type: "narrative",
          markdown:
            "**Top blockers across the cohort**\n\n1. Suitability evidence (4 learners outstanding)\n2. Consumer Duty applied judgement (3 learners)\n3. Portfolio risk explanation in client conversation (2 learners)",
        },
      ],
      evidence: [
        { label: "Cohort enrollments", source: "tool:cohort_overview · 1 cohort", value: "9 learners" },
        { label: "Module completion avg", source: "tool:module_progress", value: "71%" },
        { label: "Risk-critical gaps open", source: "tool:readiness", value: "9 across 7 learners" },
      ],
      actions: [
        {
          id: "schedule_1on1",
          label: "Schedule 1:1 with Theo this week",
          payload: { learnerId: "rb-l2", topic: "Suitability + Consumer Duty pacing" },
        },
        {
          id: "assign_evidence_task",
          label: "Assign Rathbones suitability evidence task to 4 learners",
          payload: { learnerIds: ["rb-l1", "rb-l4", "rb-l5", "rb-l8"], moduleCode: "IM-SUIT-EV" },
          confirm: true,
        },
      ],
      followups: [
        "Why are Clara and Theo seeing different module formats?",
        "Are either of them safe to progress?",
        "What should I do this week?",
      ],
      trace: [
        { tool: "cohort_overview", args: { cohortId: "associate-im-2026" }, rows: 9, ms: 142 },
        { tool: "readiness", args: { scope: "cohort:associate-im-2026" }, rows: 7, ms: 96 },
        { tool: "aggregate", args: { metric: "completion_pct", group_by: "learner" }, rows: 9, ms: 64 },
        { tool: "propose_actions", args: { context: "cohort_health" }, rows: 2, ms: 38 },
      ],
    },
  },

  /* ─────────────── 2. Compare learners — THE WOW ─────────────── */
  {
    id: "clara-vs-theo",
    title: "Clara vs Theo — why their journeys differ",
    prompt: "Why are Clara and Theo seeing different module formats?",
    envelope: {
      executive:
        "Same Associate IM standard, different paths. Clara's prior IM evidence lets Embark condense or skip 6 modules; Theo gets full coverage on the same areas because his evidence depth is thinner — but neither shortcuts risk-critical Rathbones-specific topics.",
      visuals: [
        {
          type: "competency_radar",
          subjects: [
            "Suitability",
            "Consumer Duty",
            "Portfolio Construction",
            "Client Conversations",
            "Research & Analysis",
            "Regulatory Judgement",
          ],
          series: [
            { name: "Associate IM target", values: [70, 70, 70, 70, 70, 70], tone: "muted" },
            { name: "Clara", values: [78, 65, 82, 85, 88, 72], tone: "primary" },
            { name: "Theo", values: [42, 38, 55, 48, 60, 45], tone: "accent" },
          ],
        },
        {
          type: "module_adaptation",
          learners: [
            {
              name: "Clara",
              segments: [
                { label: "Full", count: 3 },
                { label: "Condensed", count: 5 },
                { label: "Diagnostic", count: 2 },
                { label: "Evidence-only", count: 4 },
                { label: "Already covered", count: 6 },
              ],
            },
            {
              name: "Theo",
              segments: [
                { label: "Full", count: 14 },
                { label: "Condensed", count: 3 },
                { label: "Diagnostic", count: 1 },
                { label: "Evidence-only", count: 1 },
                { label: "Already covered", count: 1 },
              ],
            },
          ],
        },
        {
          type: "narrative",
          markdown:
            "**Why the journeys differ**\n\n- **Clara** comes in with strong IM experience. Embark condensed Portfolio Construction, Research & Analysis, and Client Conversations because her diagnostic and prior-evidence signals already meet the Associate IM bar.\n- **Theo** is early-career. His diagnostics show working knowledge but thin applied evidence — so Embark keeps full modules across Suitability, Consumer Duty, KYC, and Regulatory Judgement.\n- **Risk-critical Rathbones-specific** topics (Suitability, Consumer Duty) remain evidence-required for both. Clara's prior experience condenses content, **not** validation.",
        },
      ],
      evidence: [
        { label: "Clara — adapted modules", source: "tool:module_progress · learner:rb-l1", value: "20 of 20 (6 already covered)" },
        { label: "Theo — adapted modules", source: "tool:module_progress · learner:rb-l2", value: "20 of 20 (1 already covered)" },
        { label: "Clara — open evidence tasks", source: "tool:readiness", value: "2 (Suitability, Consumer Duty)" },
        { label: "Theo — open evidence tasks", source: "tool:readiness", value: "5 across risk-critical areas" },
      ],
      actions: [
        {
          id: "generate_readiness_pack",
          label: "Open Clara's readiness pack",
          payload: { learnerId: "rb-l1" },
        },
        {
          id: "assign_mentor",
          label: "Assign mentor to Theo for Suitability",
          payload: { learnerId: "rb-l2", topic: "Suitability" },
          confirm: true,
        },
      ],
      followups: [
        "Are either of them safe to progress?",
        "Show stretch readiness for Clara",
        "Which of Theo's modules will move readiness most?",
      ],
      trace: [
        { tool: "learner_profile", args: { employee_id: "rb-l1" }, rows: 1, ms: 88 },
        { tool: "learner_profile", args: { employee_id: "rb-l2" }, rows: 1, ms: 81 },
        { tool: "compare", args: { a: "rb-l1", b: "rb-l2" }, rows: 6, ms: 134 },
        { tool: "module_progress", args: { scope: "cohort:associate-im-2026" }, rows: 40, ms: 112 },
      ],
    },
  },

  /* ─────────────── 3. Risk-critical readiness ─────────────── */
  {
    id: "safe-to-progress",
    title: "Are Clara and Theo safe to progress?",
    prompt: "Are Clara and Theo safe to progress?",
    envelope: {
      executive:
        "Clara is ready with support pending two evidence validations. Theo is not yet safe to progress — three risk-critical areas still need full coverage and applied evidence.",
      visuals: [
        {
          type: "risk_matrix",
          competencies: ["Suitability", "Consumer Duty", "AML / KYC", "Regulatory Judgement", "Client Risk", "Portfolio Suitability"],
          learners: [
            {
              name: "Clara",
              cells: [
                { competency: "Suitability", status: "amber", note: "Knowledge ✓ · evidence pending" },
                { competency: "Consumer Duty", status: "amber", note: "Evidence task open" },
                { competency: "AML / KYC", status: "green" },
                { competency: "Regulatory Judgement", status: "green" },
                { competency: "Client Risk", status: "green" },
                { competency: "Portfolio Suitability", status: "amber", note: "Rathbones validation pending" },
              ],
            },
            {
              name: "Theo",
              cells: [
                { competency: "Suitability", status: "red", note: "Module + evidence outstanding" },
                { competency: "Consumer Duty", status: "red", note: "Applied judgement weak" },
                { competency: "AML / KYC", status: "amber" },
                { competency: "Regulatory Judgement", status: "red" },
                { competency: "Client Risk", status: "amber" },
                { competency: "Portfolio Suitability", status: "amber" },
              ],
            },
          ],
        },
        {
          type: "evidence_table",
          columns: ["Learner", "Do not progress until…", "Evidence type", "Owner"],
          rows: [
            ["Clara", "Rathbones suitability evidence task signed off", "Manager-validated", "Manager"],
            ["Clara", "Consumer Duty applied case completed", "Diagnostic + role-play", "Mentor"],
            ["Theo", "Suitability full module + post-assessment ≥ 70%", "Module + assessment", "Embark"],
            ["Theo", "Consumer Duty role-play with manager observation", "Observed", "Manager"],
            ["Theo", "Regulatory Judgement scenario set", "Module + assessment", "Embark"],
          ],
        },
      ],
      evidence: [
        { label: "Clara readiness score", source: "tool:readiness", value: "Ready with support · 2 gaps" },
        { label: "Theo readiness score", source: "tool:readiness", value: "Not yet · 5 gaps (3 risk-critical)" },
        { label: "Cohort gating policy", source: "policy:associate_im_2026" },
      ],
      actions: [
        {
          id: "flag_risk_critical",
          label: "Flag Theo's progression as blocked until risk-critical areas close",
          payload: { learnerId: "rb-l2", reasons: ["Suitability", "Consumer Duty", "Regulatory Judgement"] },
          confirm: true,
        },
        {
          id: "assign_evidence_task",
          label: "Assign Clara her two outstanding evidence tasks",
          payload: { learnerId: "rb-l1", tasks: ["IM-SUIT-EV", "IM-CD-EV"] },
        },
      ],
      followups: [
        "What should I do this week?",
        "Create a readiness-board summary for Clara",
        "Which mentor should pair with Theo?",
      ],
      trace: [
        { tool: "readiness", args: { scope: "learner:rb-l1" }, rows: 1, ms: 71 },
        { tool: "readiness", args: { scope: "learner:rb-l2" }, rows: 1, ms: 69 },
        { tool: "interventions", args: { scope: "cohort:associate-im-2026" }, rows: 12, ms: 88 },
      ],
    },
  },

  /* ─────────────── 4. Manager action plan ─────────────── */
  {
    id: "this-week",
    title: "Manager action plan — this week",
    prompt: "What should I do this week to help this cohort progress?",
    envelope: {
      executive:
        "Two high-priority moves close 70% of the open risk: get Theo paired with a Suitability mentor and sign off Clara's evidence task. Three medium actions pull Felix and the early-career group forward.",
      visuals: [
        {
          type: "action_board",
          columns: [
            {
              title: "High",
              cards: [
                {
                  learner: "Theo",
                  action: "Pair with Suitability mentor + keep full module",
                  why: "Risk-critical gap; biggest readiness lift",
                  actionId: "assign_mentor",
                  payload: { learnerId: "rb-l2", topic: "Suitability" },
                },
                {
                  learner: "Clara",
                  action: "Sign off Rathbones suitability evidence task",
                  why: "Clears her main blocker to Ready",
                  actionId: "assign_evidence_task",
                  payload: { learnerId: "rb-l1", task: "IM-SUIT-EV" },
                },
              ],
            },
            {
              title: "Medium",
              cards: [
                {
                  learner: "Theo",
                  action: "Schedule client-conversation role-play",
                  why: "Client-facing confidence gap",
                  actionId: "assign_skill_target",
                  payload: { learnerId: "rb-l2", target: "client-conversations" },
                },
                {
                  learner: "Felix",
                  action: "Open stretch role-play in portfolio construction",
                  why: "On-track + headroom for stretch",
                  actionId: "assign_skill_target",
                  payload: { learnerId: "rb-l3", target: "portfolio-stretch" },
                },
                {
                  learner: "Cohort",
                  action: "Send Consumer Duty check-in nudge",
                  why: "3 learners with applied-judgement gaps",
                  actionId: "send_check_in",
                  payload: { cohortId: "associate-im-2026", topic: "Consumer Duty" },
                },
              ],
            },
            {
              title: "Low",
              cards: [
                {
                  learner: "Clara",
                  action: "Request reflection on first client meeting",
                  why: "Capture evidence opportunistically",
                  actionId: "request_reflection",
                  payload: { learnerId: "rb-l1", topic: "First client meeting" },
                },
              ],
            },
          ],
        },
      ],
      evidence: [
        { label: "Open actions across cohort", source: "tool:action_centre_history", value: "11" },
        { label: "Forecast readiness lift", source: "tool:propose_actions", value: "+18% if High actions complete" },
      ],
      actions: [
        {
          id: "generate_readiness_pack",
          label: "Build this week's manager pack",
          payload: { cohortId: "associate-im-2026" },
        },
      ],
      followups: [
        "Create a readiness-board summary for Clara",
        "What if Theo doesn't complete Suitability this week?",
        "Show the impact/effort for these actions",
      ],
      trace: [
        { tool: "propose_actions", args: { scope: "cohort:associate-im-2026", horizon: "1w" }, rows: 6, ms: 124 },
        { tool: "action_centre_history", args: { scope: "cohort:associate-im-2026" }, rows: 11, ms: 58 },
      ],
    },
  },

  /* ─────────────── 5. Readiness summary ─────────────── */
  {
    id: "clara-readiness",
    title: "Clara — readiness-board summary",
    prompt: "Create a readiness-board summary for Clara.",
    envelope: {
      executive:
        "Recommendation: Ready with support. Clara is strong across research, communication, and investment expertise; clear her two Rathbones-specific evidence items and she meets Associate IM standard.",
      visuals: [
        {
          type: "kpi_strip",
          items: [
            { label: "Readiness", value: "Ready with support", tone: "amber" },
            { label: "Modules complete", value: "16 / 20", tone: "green", sub: "4 condensed, 6 already covered" },
            { label: "Open evidence", value: "2", tone: "amber", sub: "Suitability · Consumer Duty" },
            { label: "Stretch potential", value: "Yes", tone: "green", sub: "Research & Analysis" },
          ],
        },
        {
          type: "competency_radar",
          subjects: [
            "Suitability",
            "Consumer Duty",
            "Portfolio Construction",
            "Client Conversations",
            "Research & Analysis",
            "Regulatory Judgement",
          ],
          series: [
            { name: "Associate IM target", values: [70, 70, 70, 70, 70, 70], tone: "muted" },
            { name: "Clara", values: [78, 65, 82, 85, 88, 72], tone: "primary" },
          ],
        },
        {
          type: "evidence_table",
          columns: ["Area", "Status", "Notes"],
          rows: [
            ["Suitability", { text: "Evidence pending", tone: "amber" }, "Knowledge meets bar; Rathbones-specific case sign-off needed"],
            ["Consumer Duty", { text: "Evidence pending", tone: "amber" }, "Applied case in progress"],
            ["AML / KYC", { text: "Met", tone: "green" }, "Prior IM evidence accepted"],
            ["Portfolio Construction", { text: "Exceeds", tone: "green" }, "Stretch unlock candidate"],
            ["Research & Analysis", { text: "Exceeds", tone: "green" }, "Strongest area"],
            ["Regulatory Judgement", { text: "Met", tone: "green" }, ""],
          ],
        },
        {
          type: "narrative",
          markdown:
            "**Recommendation**\n\nReady with support. Sign off the suitability evidence task and complete the Consumer Duty applied case to reach **Ready**. Consider unlocking the Research & Analysis stretch path in week 6.",
        },
      ],
      evidence: [
        { label: "Profile", source: "tool:learner_profile · rb-l1" },
        { label: "Module adaptation log", source: "tool:module_progress · rb-l1" },
        { label: "Readiness gates", source: "tool:readiness · rb-l1" },
      ],
      actions: [
        {
          id: "generate_readiness_pack",
          label: "Export Clara's readiness pack",
          payload: { learnerId: "rb-l1", format: "pdf" },
        },
        {
          id: "schedule_1on1",
          label: "Book a 15-min review with Clara",
          payload: { learnerId: "rb-l1", topic: "Readiness sign-off" },
        },
      ],
      followups: [
        "Now do one for Theo",
        "What stretch content would suit Clara?",
        "Draft the message I should send Clara",
      ],
      trace: [
        { tool: "learner_profile", args: { employee_id: "rb-l1" }, rows: 1, ms: 76 },
        { tool: "readiness", args: { scope: "learner:rb-l1" }, rows: 1, ms: 64 },
        { tool: "people_graph_signals", args: { employee_id: "rb-l1" }, rows: 14, ms: 102 },
      ],
    },
  },
];

export function findShowcaseMatch(prompt: string): ShowcasePrompt | null {
  const n = norm(prompt);
  if (!n) return null;
  // Loose match: starter keyword overlap
  const direct = RATHBONES_SHOWCASE.find((s) => norm(s.prompt) === n);
  if (direct) return direct;
  const keyed: Array<[string, string[]]> = [
    ["cohort-health", ["cohort", "readiness picture", "associate im cohort"]],
    ["clara-vs-theo", ["clara", "theo", "different", "compare", "why are"]],
    ["safe-to-progress", ["safe to progress", "progress", "ready to progress", "are clara"]],
    ["this-week", ["this week", "what should i do", "action plan", "intervention"]],
    ["clara-readiness", ["readiness summary", "readiness board", "summary for clara", "clara readiness"]],
  ];
  for (const [id, terms] of keyed) {
    if (terms.some((t) => n.includes(t))) {
      return RATHBONES_SHOWCASE.find((s) => s.id === id) ?? null;
    }
  }
  return null;
}

export const SHOWCASE_ACCOUNT_NAMES = ["rathbones", "pinnacle capital"];

export function isShowcaseAccount(name?: string | null): boolean {
  if (!name) return false;
  const n = name.toLowerCase();
  return SHOWCASE_ACCOUNT_NAMES.some((s) => n.includes(s));
}

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
  /* ─────────────── 6. Draft message to Clara ─────────────── */
  {
    id: "draft-clara-message",
    title: "Draft the message to send Clara",
    prompt: "Draft the message I should send Clara",
    envelope: {
      executive:
        "Here is a draft message you can send Clara today — it acknowledges her strong research signals, confirms she is Ready with support, and asks for the two outstanding evidence items with a proposed slot.",
      visuals: [
        {
          type: "narrative",
          markdown:
            "**Subject:** Quick check-in — Associate IM sign-off\n\nHi Clara,\n\nGreat work over the last sprint — your Research & Analysis and Client Conversations signals are well above the Associate IM bar, and your portfolio construction work is genuinely strong.\n\nTo wrap up your sign-off I just need two evidence items:\n\n1. **Suitability** — the Rathbones-specific case sign-off (you've already met the knowledge bar; this is the applied evidence step).\n2. **Consumer Duty** — the applied case you have in progress; happy to review it together.\n\nCould we grab **15 minutes this Thursday at 14:30**, or Friday morning if that's easier? I'll bring the readiness pack so we can mark off both items in one go.\n\nWhile we're together I'd also like to flag the **Research & Analysis stretch path** — your evidence base says you're ready for it.\n\nThanks,\nEdward",
        },
        {
          type: "evidence_table",
          columns: ["Fact used in draft", "Source"],
          rows: [
            ["Clara is Ready with support · 2 open evidence items", "tool:readiness · rb-l1"],
            ["Strong Research & Analysis (88) and Client Conversations (85) signals", "tool:people_graph_signals · rb-l1"],
            ["Suitability — knowledge ✓, Rathbones-specific evidence pending", "tool:readiness · rb-l1"],
            ["Consumer Duty — applied case in progress", "tool:readiness · rb-l1"],
            ["Stretch candidate: Research & Analysis", "tool:learner_profile · rb-l1"],
          ],
        },
      ],
      evidence: [
        { label: "Clara readiness snapshot", source: "tool:readiness · rb-l1" },
        { label: "Tone reference — prior 1:1 notes", source: "tool:notes · rb-l1", value: "warm, direct" },
      ],
      actions: [
        { id: "send_check_in", label: "Send via Teams (mock)", payload: { learnerId: "rb-l1", channel: "teams" }, confirm: true },
        { id: "schedule_1on1", label: "Book Thursday 14:30 with Clara", payload: { learnerId: "rb-l1", slot: "thu-1430" } },
      ],
      followups: ["Now do one for Theo", "What stretch content would suit Clara?", "Shorten this to two sentences"],
      trace: [
        { tool: "learner_profile", args: { employee_id: "rb-l1" }, rows: 1, ms: 71 },
        { tool: "readiness", args: { scope: "learner:rb-l1" }, rows: 1, ms: 58 },
        { tool: "compose_message", args: { tone: "warm-direct", length: "medium" }, ms: 184 },
      ],
    },
  },

  /* ─────────────── 7. Theo readiness summary ─────────────── */
  {
    id: "theo-readiness",
    title: "Theo — readiness-board summary",
    prompt: "Now do one for Theo",
    envelope: {
      executive:
        "Recommendation: Not yet ready to progress. Theo's research and client-conversation signals are developing, but three risk-critical areas (Suitability, Consumer Duty, Regulatory Judgement) still need full module coverage and observed evidence.",
      visuals: [
        {
          type: "kpi_strip",
          items: [
            { label: "Readiness", value: "Not yet", tone: "red" },
            { label: "Modules complete", value: "9 / 20", tone: "amber", sub: "14 full · 1 already covered" },
            { label: "Open evidence", value: "5", tone: "red", sub: "3 risk-critical" },
            { label: "Stretch potential", value: "No", tone: "neutral", sub: "consolidate basics first" },
          ],
        },
        {
          type: "competency_radar",
          subjects: ["Suitability", "Consumer Duty", "Portfolio Construction", "Client Conversations", "Research & Analysis", "Regulatory Judgement"],
          series: [
            { name: "Associate IM target", values: [70, 70, 70, 70, 70, 70], tone: "muted" },
            { name: "Theo", values: [42, 38, 55, 48, 60, 45], tone: "accent" },
          ],
        },
        {
          type: "evidence_table",
          columns: ["Area", "Status", "Notes"],
          rows: [
            ["Suitability", { text: "Outstanding", tone: "red" }, "Module + post-assessment ≥ 70% required"],
            ["Consumer Duty", { text: "Outstanding", tone: "red" }, "Manager-observed role-play required"],
            ["Regulatory Judgement", { text: "Outstanding", tone: "red" }, "Scenario set + assessment"],
            ["AML / KYC", { text: "Developing", tone: "amber" }, "On track this sprint"],
            ["Client Risk", { text: "Developing", tone: "amber" }, ""],
            ["Research & Analysis", { text: "Met", tone: "green" }, "Strongest area"],
          ],
        },
        {
          type: "narrative",
          markdown:
            "**Recommendation**\n\nKeep full coverage on Suitability, Consumer Duty and Regulatory Judgement. Pair with a Suitability mentor this week. Re-assess in 3 weeks.",
        },
      ],
      evidence: [
        { label: "Profile", source: "tool:learner_profile · rb-l2" },
        { label: "Module adaptation log", source: "tool:module_progress · rb-l2" },
        { label: "Readiness gates", source: "tool:readiness · rb-l2" },
      ],
      actions: [
        { id: "assign_mentor", label: "Pair Theo with Suitability mentor", payload: { learnerId: "rb-l2", topic: "Suitability" }, confirm: true },
        { id: "flag_risk_critical", label: "Flag Theo's progression as blocked", payload: { learnerId: "rb-l2", reasons: ["Suitability", "Consumer Duty", "Regulatory Judgement"] }, confirm: true },
      ],
      followups: ["Which mentor should pair with Theo?", "Which of Theo's modules will move readiness most?", "What if Theo doesn't complete Suitability this week?"],
      trace: [
        { tool: "learner_profile", args: { employee_id: "rb-l2" }, rows: 1, ms: 73 },
        { tool: "readiness", args: { scope: "learner:rb-l2" }, rows: 1, ms: 67 },
        { tool: "people_graph_signals", args: { employee_id: "rb-l2" }, rows: 14, ms: 96 },
      ],
    },
  },

  /* ─────────────── 8. Stretch content for Clara ─────────────── */
  {
    id: "clara-stretch",
    title: "Stretch content for Clara",
    prompt: "What stretch content would suit Clara?",
    envelope: {
      executive:
        "Three stretch paths land safely for Clara — all build on her strongest signals (Research & Analysis 88, Portfolio Construction 82) without competing with the two open evidence items.",
      visuals: [
        {
          type: "kpi_strip",
          items: [
            { label: "Stretch readiness", value: "Yes", tone: "green", sub: "no risk-critical conflicts" },
            { label: "Recommended paths", value: "3", tone: "neutral" },
            { label: "Estimated time", value: "~6h", tone: "neutral", sub: "across 3 weeks" },
          ],
        },
        {
          type: "evidence_table",
          columns: ["Stretch path", "Why it fits Clara", "Effort"],
          rows: [
            ["Research & Analysis — sector deep-dive", "Highest signal (88); reinforces her strongest evidence base", "~2h"],
            ["ESG portfolio construction", "Builds on Portfolio Construction 82; client-relevant for her book", "~2.5h"],
            ["Discretionary mandate scenarios", "Stretches Client Conversations (85) into judgement-heavy decisions", "~1.5h"],
          ],
        },
        {
          type: "narrative",
          markdown:
            "**Sequencing**\n\n1. Start with **ESG portfolio construction** — most client-relevant.\n2. Layer in **Research & Analysis deep-dive** alongside.\n3. Use **Discretionary mandate scenarios** as the capstone, after her two evidence items close.",
        },
      ],
      evidence: [
        { label: "Clara competency profile", source: "tool:people_graph_signals · rb-l1" },
        { label: "Open evidence items", source: "tool:readiness · rb-l1", value: "2 (Suitability, Consumer Duty)" },
      ],
      actions: [
        { id: "assign_skill_target", label: "Assign ESG portfolio construction to Clara", payload: { learnerId: "rb-l1", target: "esg-portfolio" }, confirm: true },
        { id: "assign_skill_target", label: "Assign Research & Analysis deep-dive", payload: { learnerId: "rb-l1", target: "research-deep-dive" } },
      ],
      followups: ["Now do one for Theo", "Draft the message I should send Clara"],
      trace: [
        { tool: "stretch_recommender", args: { employee_id: "rb-l1" }, rows: 3, ms: 112 },
      ],
    },
  },

  /* ─────────────── 9. Mentor for Theo ─────────────── */
  {
    id: "theo-mentor",
    title: "Mentor candidates for Theo",
    prompt: "Which mentor should pair with Theo?",
    envelope: {
      executive:
        "Top match: Imogen Hartley — senior IM with 8 years of Suitability supervision and current capacity. Two backup options if Imogen is unavailable.",
      visuals: [
        {
          type: "evidence_table",
          columns: ["Mentor", "Match", "Why", "Availability"],
          rows: [
            ["Imogen Hartley", { text: "Strong", tone: "green" }, "Senior IM · 8y Suitability supervision · prior mentee NPS 9.2", "2 slots / wk"],
            ["Marcus Reid", { text: "Good", tone: "green" }, "Investment Director · Consumer Duty subject lead", "1 slot / wk"],
            ["Priya Shah", { text: "Backup", tone: "amber" }, "Mid-career IM · early mentor; lighter Suitability depth", "3 slots / wk"],
          ],
        },
        {
          type: "narrative",
          markdown:
            "**Why Imogen leads**\n\nTheo's biggest gap is applied Suitability judgement. Imogen has supervised the exact case types Theo is failing on, and her last two mentees both passed first-attempt sign-off within 6 weeks.",
        },
      ],
      evidence: [
        { label: "Mentor pool", source: "tool:mentors · cohort:associate-im-2026", value: "12 candidates" },
        { label: "Match score model", source: "tool:mentor_match", value: "topic + seniority + capacity + outcomes" },
      ],
      actions: [
        { id: "assign_mentor", label: "Assign Imogen to Theo", payload: { learnerId: "rb-l2", mentorId: "rb-m-imogen", topic: "Suitability" }, confirm: true },
        { id: "schedule_1on1", label: "Send intro 1:1 invite", payload: { learnerId: "rb-l2", mentorId: "rb-m-imogen" } },
      ],
      followups: ["Now do one for Theo", "What if Theo doesn't complete Suitability this week?"],
      trace: [
        { tool: "mentors", args: { topic: "Suitability" }, rows: 12, ms: 88 },
        { tool: "mentor_match", args: { learner: "rb-l2" }, rows: 3, ms: 94 },
      ],
    },
  },

  /* ─────────────── 10. Theo modules — readiness lift ─────────────── */
  {
    id: "theo-module-impact",
    title: "Modules that move Theo's readiness",
    prompt: "Which of Theo's modules will move readiness most?",
    envelope: {
      executive:
        "Five modules account for ~80% of Theo's available readiness lift. Suitability (full) and Consumer Duty (full) are the two highest-impact moves this sprint.",
      visuals: [
        {
          type: "evidence_table",
          columns: ["#", "Module", "Format", "Readiness lift", "Effort"],
          rows: [
            ["1", "Suitability — full module + assessment", "Full", { text: "+9%", tone: "green" }, "3.5h"],
            ["2", "Consumer Duty — applied case", "Full", { text: "+7%", tone: "green" }, "2.5h"],
            ["3", "Regulatory Judgement — scenario set", "Full", { text: "+5%", tone: "green" }, "2h"],
            ["4", "AML / KYC — refresher", "Condensed", { text: "+3%", tone: "amber" }, "45m"],
            ["5", "Client Risk — practical", "Diagnostic + targeted", { text: "+2%", tone: "amber" }, "1h"],
          ],
        },
        {
          type: "narrative",
          markdown: "**This sprint**: items 1 and 2 alone move Theo from *Not yet* to *Ready with support*.",
        },
      ],
      evidence: [
        { label: "Lift model", source: "tool:readiness_simulator · rb-l2" },
        { label: "Current open modules", source: "tool:module_progress · rb-l2", value: "11 outstanding" },
      ],
      actions: [
        { id: "assign_module", label: "Lock Suitability + Consumer Duty as this-sprint focus", payload: { learnerId: "rb-l2", modules: ["IM-SUIT-FULL", "IM-CD-CASE"] }, confirm: true },
      ],
      followups: ["What if Theo doesn't complete Suitability this week?", "Which mentor should pair with Theo?"],
      trace: [{ tool: "readiness_simulator", args: { learner: "rb-l2", horizon: "2w" }, rows: 5, ms: 142 }],
    },
  },

  /* ─────────────── 11. What if Theo skips Suitability ─────────────── */
  {
    id: "theo-what-if",
    title: "Impact if Theo skips Suitability this week",
    prompt: "What if Theo doesn't complete Suitability this week?",
    envelope: {
      executive:
        "Theo slips out of cohort sign-off window by 2 weeks and the cohort readiness average drops from 62% to 58%. Suitability is the single biggest blocker to his progression.",
      visuals: [
        {
          type: "kpi_strip",
          items: [
            { label: "Theo readiness", value: "Stays at 'Not yet'", tone: "red" },
            { label: "Sign-off slip", value: "+2 weeks", tone: "red" },
            { label: "Cohort avg", value: "62% → 58%", tone: "amber" },
            { label: "Risk-critical open", value: "3 → 3", tone: "red" },
          ],
        },
        {
          type: "risk_matrix",
          competencies: ["Suitability", "Consumer Duty", "Regulatory Judgement"],
          learners: [
            {
              name: "Theo (today)",
              cells: [
                { competency: "Suitability", status: "red" },
                { competency: "Consumer Duty", status: "red" },
                { competency: "Regulatory Judgement", status: "red" },
              ],
            },
            {
              name: "Theo (no action)",
              cells: [
                { competency: "Suitability", status: "red", note: "Stays open" },
                { competency: "Consumer Duty", status: "red", note: "Stalled — needs Suitability first" },
                { competency: "Regulatory Judgement", status: "red" },
              ],
            },
          ],
        },
      ],
      evidence: [
        { label: "Cohort gating policy", source: "policy:associate_im_2026" },
        { label: "Readiness simulator", source: "tool:readiness_simulator · rb-l2" },
      ],
      actions: [
        { id: "assign_mentor", label: "Pair Theo with Suitability mentor today", payload: { learnerId: "rb-l2", topic: "Suitability" }, confirm: true },
        { id: "send_check_in", label: "Send Theo a Suitability check-in nudge", payload: { learnerId: "rb-l2", topic: "Suitability" } },
      ],
      followups: ["Which mentor should pair with Theo?", "Which of Theo's modules will move readiness most?"],
      trace: [
        { tool: "readiness_simulator", args: { learner: "rb-l2", scenario: "skip_suitability" }, rows: 1, ms: 121 },
      ],
    },
  },

  /* ─────────────── 12. Impact / effort for week's actions ─────────────── */
  {
    id: "this-week-impact-effort",
    title: "Impact / effort — this week's actions",
    prompt: "Show the impact/effort for these actions",
    envelope: {
      executive:
        "Two actions are high-impact / low-effort and should ship today: Theo + Suitability mentor pairing, and signing off Clara's evidence task. The rest can be sequenced over the week.",
      visuals: [
        {
          type: "evidence_table",
          columns: ["Action", "Impact", "Effort", "Owner"],
          rows: [
            ["Pair Theo with Suitability mentor", { text: "High", tone: "green" }, "Low (~10m)", "Manager"],
            ["Sign off Clara's suitability evidence", { text: "High", tone: "green" }, "Low (~15m)", "Manager"],
            ["Schedule Theo client-conversation role-play", { text: "Medium", tone: "amber" }, "Medium (~20m)", "Mentor"],
            ["Open Felix stretch role-play", { text: "Medium", tone: "amber" }, "Low (~10m)", "Manager"],
            ["Cohort Consumer Duty check-in nudge", { text: "Medium", tone: "amber" }, "Low (~5m)", "Manager"],
            ["Request Clara's first-meeting reflection", "Low", "Low (~5m)", "Manager"],
          ],
        },
        {
          type: "narrative",
          markdown:
            "**Today**: ship the two High / Low actions. **Mid-week**: schedule Theo's role-play and open Felix's stretch. **End of week**: send the cohort nudge and request Clara's reflection.",
        },
      ],
      evidence: [
        { label: "Action board source", source: "tool:propose_actions · cohort:associate-im-2026" },
        { label: "Forecast lift", source: "tool:propose_actions", value: "+18% if High actions complete" },
      ],
      actions: [
        { id: "assign_mentor", label: "Pair Theo with Suitability mentor", payload: { learnerId: "rb-l2", topic: "Suitability" }, confirm: true },
        { id: "assign_evidence_task", label: "Sign off Clara's suitability evidence", payload: { learnerId: "rb-l1", task: "IM-SUIT-EV" } },
      ],
      followups: ["What should I do this week?", "Build this week's manager pack"],
      trace: [{ tool: "propose_actions", args: { scope: "cohort:associate-im-2026", horizon: "1w" }, rows: 6, ms: 124 }],
    },
  },

  /* ─────────────── 13. Export Clara readiness pack ─────────────── */
  {
    id: "clara-readiness-pack",
    title: "Clara — readiness pack preview",
    prompt: "Export Clara's readiness pack",
    envelope: {
      executive:
        "Clara's readiness pack is ready. It contains her recommendation (Ready with support), competency radar, evidence checklist, and the two outstanding sign-off items.",
      visuals: [
        {
          type: "kpi_strip",
          items: [
            { label: "Recommendation", value: "Ready with support", tone: "amber" },
            { label: "Modules", value: "16 / 20", tone: "green" },
            { label: "Open evidence", value: "2", tone: "amber" },
            { label: "Pages", value: "6", tone: "neutral" },
          ],
        },
        {
          type: "narrative",
          markdown:
            "**Pack contents**\n\n1. Cover — Clara Whitfield · Associate IM · Mid-career\n2. Recommendation — *Ready with support*\n3. Competency radar (Clara vs Associate IM target)\n4. Module adaptation log (16 / 20 complete; 6 already covered)\n5. Open evidence checklist — Suitability case · Consumer Duty applied case\n6. Suggested stretch — Research & Analysis\n\n📄 [Download Clara_readiness_pack.pdf](#) *(mock)*",
        },
      ],
      evidence: [
        { label: "Profile snapshot", source: "tool:learner_profile · rb-l1" },
        { label: "Readiness gates", source: "tool:readiness · rb-l1" },
      ],
      actions: [
        { id: "schedule_1on1", label: "Book 15-min sign-off review with Clara", payload: { learnerId: "rb-l1", topic: "Readiness sign-off" } },
      ],
      followups: ["Draft the message I should send Clara", "Now do one for Theo"],
      trace: [{ tool: "generate_readiness_pack", args: { learnerId: "rb-l1", format: "pdf" }, rows: 1, ms: 312 }],
    },
  },

  /* ─────────────── 14. Book 15-min review with Clara ─────────────── */
  {
    id: "clara-book-review",
    title: "Book a 15-min review with Clara",
    prompt: "Book a 15-min review with Clara",
    envelope: {
      executive:
        "Clara has three good 15-minute slots that overlap with your calendar this week. Pick one and I'll send the invite with the readiness pack attached.",
      visuals: [
        {
          type: "evidence_table",
          columns: ["Slot", "Day", "Conflicts", "Best for"],
          rows: [
            ["14:30 – 14:45", "Thursday", "None", "Sign-off review with pack"],
            ["09:15 – 09:30", "Friday", "None", "Quick check-in pre-week"],
            ["16:00 – 16:15", "Friday", "Clara has client call ending 15:55", "Tight — Thursday safer"],
          ],
        },
      ],
      evidence: [{ label: "Calendar tool", source: "tool:calendar · rb-l1 + manager", value: "3 candidate slots" }],
      actions: [
        { id: "schedule_1on1", label: "Book Thursday 14:30", payload: { learnerId: "rb-l1", slot: "thu-1430" }, confirm: true },
        { id: "schedule_1on1", label: "Book Friday 09:15", payload: { learnerId: "rb-l1", slot: "fri-0915" } },
      ],
      followups: ["Draft the message I should send Clara", "Export Clara's readiness pack"],
      trace: [{ tool: "calendar", args: { participants: ["rb-l1", "manager"], duration: 15 }, rows: 3, ms: 84 }],
    },
  },

  /* ─────────────── 15. Build this week's manager pack ─────────────── */
  {
    id: "manager-pack-week",
    title: "This week's manager pack",
    prompt: "Build this week's manager pack",
    envelope: {
      executive:
        "Your manager pack for this week is ready. It bundles the cohort readiness picture, the prioritised action board, and the two highest-impact 1:1 prompts (Clara and Theo).",
      visuals: [
        {
          type: "kpi_strip",
          items: [
            { label: "Cohort readiness", value: "62%", tone: "amber", sub: "target 80%" },
            { label: "High actions", value: "2", tone: "green" },
            { label: "Forecast lift", value: "+18%", tone: "green", sub: "if High ship" },
            { label: "Pages", value: "5", tone: "neutral" },
          ],
        },
        {
          type: "narrative",
          markdown:
            "**Pack contents**\n\n1. Cohort readiness funnel\n2. Top blockers (Suitability, Consumer Duty)\n3. Prioritised action board\n4. 1:1 prompt for Clara — Ready with support\n5. 1:1 prompt for Theo — Not yet, mentor pairing\n\n📄 [Download AssociateIM_week_pack.pdf](#) *(mock)*",
        },
      ],
      evidence: [
        { label: "Cohort overview", source: "tool:cohort_overview · associate-im-2026", value: "9 learners" },
        { label: "Action board", source: "tool:propose_actions", value: "6 actions" },
      ],
      actions: [{ id: "send_check_in", label: "Share pack with co-leaders", payload: { cohortId: "associate-im-2026" } }],
      followups: ["What should I do this week?", "Show the impact/effort for these actions"],
      trace: [{ tool: "generate_readiness_pack", args: { cohortId: "associate-im-2026" }, rows: 1, ms: 268 }],
    },
  },
];

export function findShowcaseMatch(prompt: string): ShowcasePrompt | null {
  const n = norm(prompt);
  if (!n) return null;
  const direct = RATHBONES_SHOWCASE.find((s) => norm(s.prompt) === n);
  if (direct) return direct;
  // Order matters: more specific matches first
  const keyed: Array<[string, string[]]> = [
    ["draft-clara-message", ["draft", "clara"]],
    ["theo-readiness", ["now do one for theo"]],
    ["theo-readiness", ["readiness", "theo"]],
    ["clara-stretch", ["stretch", "clara"]],
    ["theo-mentor", ["mentor", "theo"]],
    ["theo-module-impact", ["theo", "modules"]],
    ["theo-module-impact", ["move readiness"]],
    ["theo-what-if", ["what if theo"]],
    ["theo-what-if", ["skip suitability"]],
    ["this-week-impact-effort", ["impact", "effort"]],
    ["clara-readiness-pack", ["readiness pack"]],
    ["clara-readiness-pack", ["export", "clara"]],
    ["clara-book-review", ["book", "clara"]],
    ["clara-book-review", ["15", "clara"]],
    ["manager-pack-week", ["manager pack"]],
    ["manager-pack-week", ["week", "pack"]],
    ["clara-vs-theo", ["different", "clara", "theo"]],
    ["clara-vs-theo", ["compare", "clara", "theo"]],
    ["safe-to-progress", ["safe to progress"]],
    ["safe-to-progress", ["ready to progress"]],
    ["this-week", ["this week"]],
    ["this-week", ["what should i do"]],
    ["clara-readiness", ["readiness summary"]],
    ["clara-readiness", ["readiness board"]],
    ["clara-readiness", ["summary", "clara"]],
    ["cohort-health", ["cohort", "readiness"]],
    ["cohort-health", ["associate im"]],
  ];
  for (const [id, terms] of keyed) {
    if (terms.every((t) => n.includes(t))) {
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

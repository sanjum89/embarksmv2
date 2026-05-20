/**
 * Deep Research — learner-scoped showcase envelopes.
 * Personal scope: each response uses only the active learner's own data.
 * Modelled on Clara Whitfield (rb-l1) for the Rathbones / Pinnacle demo.
 *
 * No cohort aggregates, no other learners, no team-only actions.
 */
import type { ResponseEnvelope } from "@/lib/deepResearch/envelope";

export interface LearnerShowcasePrompt {
  id: string;
  title: string;
  prompt: string;
  envelope: ResponseEnvelope;
}

const norm = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

export const LEARNER_SHOWCASE: LearnerShowcasePrompt[] = [
  /* 1. Grow My Skills */
  {
    id: "grow-skills",
    title: "Grow My Skills",
    prompt: "Show me recommendations for growing my skills",
    envelope: {
      executive:
        "Your fastest growth areas right now are Suitability evidence and Consumer Duty applied judgement — both are within one Embark AI module of moving you from Practising to Confident.",
      visuals: [
        {
          type: "kpi_strip",
          items: [
            { label: "My readiness", value: "68%", tone: "amber", sub: "target 80%" },
            { label: "Skills at target", value: "9 / 12", tone: "green" },
            { label: "Skills to grow", value: "3", tone: "amber" },
            { label: "Stretch ready", value: "1", tone: "green", sub: "Portfolio construction" },
          ],
        },
        {
          type: "narrative",
          markdown:
            "**Top three recommendations**\n\n1. **Suitability evidence** — one practical evidence task closes the gap.\n2. **Consumer Duty applied judgement** — a 12-minute scenario module followed by a reflection.\n3. **Client conversation: portfolio risk** — voice role-play to lift fluency from Practising to Confident.",
        },
      ],
      evidence: [
        { label: "My competency profile", source: "tool:my_profile · rb-l1", value: "12 tracked skills" },
        { label: "Open evidence items", source: "tool:my_evidence", value: "2 outstanding" },
        { label: "Recent module completion", source: "tool:my_progress · 30d", value: "71%" },
      ],
      actions: [
        {
          id: "assign_module",
          label: "Open the Suitability evidence module",
          payload: { learnerId: "rb-l1", moduleCode: "IM-SUIT-EV" },
        },
        {
          id: "schedule_1on1",
          label: "Book a 15-min check-in with my mentor",
          payload: { learnerId: "rb-l1", topic: "Suitability evidence pacing" },
        },
      ],
      followups: [
        "Which required skills am I missing for my role?",
        "What career paths could these skills unlock?",
        "What have I completed in the last 30 days?",
      ],
      trace: [
        { tool: "my_profile", args: { employee_id: "rb-l1" }, rows: 1, ms: 71 },
        { tool: "my_progress", args: { window: "30d" }, rows: 14, ms: 58 },
        { tool: "recommend_modules", args: { scope: "learner:rb-l1" }, rows: 3, ms: 86 },
      ],
    },
  },

  /* 2. Required Skills */
  {
    id: "required-skills",
    title: "Required Skills",
    prompt: "Show me the required skills for my role",
    envelope: {
      executive:
        "Investment Manager at Rathbones requires 12 core skills. You meet target on 9 and are within one band on the remaining 3 — Suitability, Consumer Duty, and Regulatory Judgement.",
      visuals: [
        {
          type: "narrative",
          markdown:
            "**Role:** Investment Manager · mid-career\n\n**At target (9):** Client relationship management, Portfolio construction, Risk explanation, Markets knowledge, Investment philosophy, Cash management, Reporting, Compliance basics, Stewardship.\n\n**Below target (3):** Suitability evidence, Consumer Duty applied judgement, Regulatory judgement under pressure.",
        },
        {
          type: "kpi_strip",
          items: [
            { label: "Role skills", value: "12", tone: "neutral" },
            { label: "At target", value: "9", tone: "green" },
            { label: "1 band below", value: "3", tone: "amber" },
            { label: "Risk-critical gap", value: "1", tone: "red", sub: "Suitability evidence" },
          ],
        },
      ],
      evidence: [
        { label: "Role profile", source: "tool:role_profile · IM-Mid", value: "12 required skills" },
        { label: "My current bands", source: "tool:my_profile · rb-l1", value: "5-level scale" },
      ],
      actions: [
        {
          id: "assign_skill_target",
          label: "Add Suitability evidence to my growth plan",
          payload: { learnerId: "rb-l1", skill: "suitability-evidence" },
        },
      ],
      followups: [
        "Which modules close these gaps fastest?",
        "What career paths could open if I close them?",
        "Build a reflection on this week's learning.",
      ],
      trace: [
        { tool: "role_profile", args: { role_id: "IM-Mid" }, rows: 12, ms: 64 },
        { tool: "my_profile", args: { employee_id: "rb-l1" }, rows: 1, ms: 51 },
      ],
    },
  },

  /* 3. Explore Career Paths */
  {
    id: "career-paths",
    title: "Explore Career Paths",
    prompt: "Explore career paths based on my current skills",
    envelope: {
      executive:
        "Two adjacent paths fit your current strengths: Senior Investment Manager (1–2 years) and Investment Director (3–4 years). A third stretch path — Wealth Advisory Lead — opens if you build relationship coaching and team leadership.",
      visuals: [
        {
          type: "narrative",
          markdown:
            "**Path A — Senior Investment Manager** (1–2 years)\nMostly leverages skills you already have. Add: complex suitability cases, multi-mandate portfolio oversight.\n\n**Path B — Investment Director** (3–4 years)\nRequires deeper client strategy and team mentoring on top of the Senior IM step.\n\n**Path C — Wealth Advisory Lead** (stretch)\nRequires advisory framing, family-office basics, and team leadership.",
        },
      ],
      evidence: [
        { label: "My profile", source: "tool:my_profile · rb-l1", value: "12 skills" },
        { label: "Career graph", source: "tool:career_graph · IM domain", value: "3 candidate paths" },
      ],
      actions: [
        {
          id: "assign_skill_target",
          label: "Add Senior IM stretch skills to my plan",
          payload: { learnerId: "rb-l1", path: "senior-im" },
        },
      ],
      followups: [
        "What skills do I need for Senior IM?",
        "Show me my activities from this month.",
        "Help me reflect on these options.",
      ],
      trace: [
        { tool: "career_graph", args: { domain: "investment-management", from: "rb-l1" }, rows: 3, ms: 92 },
      ],
    },
  },

  /* 4. View My Activities */
  {
    id: "my-activities",
    title: "View My Activities",
    prompt: "Show me my recent learning activities",
    envelope: {
      executive:
        "In the last 30 days you've completed 11 chapters, 2 role plays, and 1 reflection. Pace is consistent on weekdays; Friday afternoons are your strongest learning window.",
      visuals: [
        {
          type: "kpi_strip",
          items: [
            { label: "Chapters", value: "11", tone: "green", sub: "last 30 days" },
            { label: "Role plays", value: "2", tone: "green" },
            { label: "Reflections", value: "1", tone: "amber", sub: "1 pending" },
            { label: "Streak", value: "6 days", tone: "green" },
          ],
        },
        {
          type: "narrative",
          markdown:
            "**Most recent:**\n- _Suitability framework intro_ · chapter · 2 days ago\n- _Client conversation: portfolio risk_ · role play · 4 days ago\n- _Consumer Duty week-1 reflection_ · 6 days ago",
        },
      ],
      evidence: [
        { label: "Activity log", source: "tool:my_activity · 30d", value: "14 entries" },
      ],
      actions: [
        {
          id: "request_reflection",
          label: "Reflect on this week's learning",
          payload: { learnerId: "rb-l1", window: "7d" },
        },
      ],
      followups: [
        "What should I focus on next week?",
        "Show me the modules I haven't started.",
        "Help me build a reflection.",
      ],
      trace: [
        { tool: "my_activity", args: { window: "30d" }, rows: 14, ms: 47 },
      ],
    },
  },

  /* 5. Build Your Profile */
  {
    id: "build-profile",
    title: "Build Your Profile",
    prompt: "Help me build my professional profile",
    envelope: {
      executive:
        "Your profile is 72% complete. Adding a resume upload and two short career-history notes would push it to 95% and unlock better career-path recommendations.",
      visuals: [
        {
          type: "kpi_strip",
          items: [
            { label: "Profile complete", value: "72%", tone: "amber" },
            { label: "Skills logged", value: "12", tone: "green" },
            { label: "Career history", value: "1 entry", tone: "amber", sub: "+2 to unlock paths" },
            { label: "Resume", value: "Missing", tone: "red" },
          ],
        },
        {
          type: "narrative",
          markdown:
            "**To complete:**\n1. Upload your CV (parsed into history + skills automatically).\n2. Add your last two roles with a one-line accomplishment each.\n3. Confirm self-rated bands on the 3 below-target skills.",
        },
      ],
      evidence: [
        { label: "Profile state", source: "tool:my_profile · rb-l1", value: "5 of 7 sections" },
      ],
      actions: [
        {
          id: "assign_skill_target",
          label: "Upload my resume now",
          payload: { learnerId: "rb-l1", section: "resume" },
        },
      ],
      followups: [
        "What career paths fit my completed profile?",
        "Show me my growth recommendations.",
        "What activities have I completed?",
      ],
      trace: [
        { tool: "my_profile", args: { employee_id: "rb-l1" }, rows: 1, ms: 41 },
      ],
    },
  },

  /* 6. Create a Reflection */
  {
    id: "create-reflection",
    title: "Create a Reflection",
    prompt: "Help me create a reflection on my recent learning",
    envelope: {
      executive:
        "Here's a 3-prompt reflection draft based on this week's activity (Suitability intro, portfolio-risk role play). Answer each in 1–2 sentences and I'll summarise it for your mentor.",
      visuals: [
        {
          type: "narrative",
          markdown:
            "**1. What landed this week?**\n_e.g., the link between client risk tolerance and portfolio drift._\n\n**2. Where did you feel uncertain?**\n_e.g., explaining capacity for loss in plain language._\n\n**3. What will you try next week?**\n_e.g., re-do the role play with a more emotional client persona._",
        },
      ],
      evidence: [
        { label: "Week activity", source: "tool:my_activity · 7d", value: "4 items" },
        { label: "Reflection template", source: "tool:reflection_template · weekly", value: "3 prompts" },
      ],
      actions: [
        {
          id: "request_reflection",
          label: "Save and share with my mentor",
          payload: { learnerId: "rb-l1", mentorId: "rb-mentor" },
        },
      ],
      followups: [
        "Show me what I've completed this week.",
        "What should I focus on next?",
        "Recommend a stretch module.",
      ],
      trace: [
        { tool: "my_activity", args: { window: "7d" }, rows: 4, ms: 39 },
        { tool: "reflection_template", args: { kind: "weekly" }, rows: 3, ms: 22 },
      ],
    },
  },
];

export function findLearnerShowcaseMatch(prompt: string): LearnerShowcasePrompt | null {
  const n = norm(prompt);
  if (!n) return null;
  const direct = LEARNER_SHOWCASE.find((s) => norm(s.prompt) === n);
  if (direct) return direct;
  const keyed: Array<[string, string[]]> = [
    ["grow-skills", ["grow", "skill"]],
    ["grow-skills", ["recommend", "skill"]],
    ["required-skills", ["required", "skill"]],
    ["required-skills", ["role", "skill"]],
    ["career-paths", ["career"]],
    ["my-activities", ["activit"]],
    ["my-activities", ["recent", "learn"]],
    ["build-profile", ["profile"]],
    ["build-profile", ["resume"]],
    ["create-reflection", ["reflect"]],
  ];
  for (const [id, terms] of keyed) {
    if (terms.every((t) => n.includes(t))) {
      return LEARNER_SHOWCASE.find((s) => s.id === id) ?? null;
    }
  }
  return null;
}

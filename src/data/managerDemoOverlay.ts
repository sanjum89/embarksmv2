/**
 * Deterministic manager-view overlay for the 9 Rathbones personas (rb-l1..rb-l9).
 * Returns empty for any other employee — live data flows through unchanged.
 *
 * Used by the manager surfaces (Team Mode, Cohort Hub, Learner Drawer, Action Centre)
 * to guarantee a coherent demo story even when live cohort tables are sparse.
 */

export type LearnerStatus = "rising_star" | "at_risk" | "on_track" | "needs_check_in";

export interface ModuleCellOverlay {
  module_code: string;
  status: "completed" | "in_progress" | "not_started" | "locked";
  adaptation?: "diagnostic_only" | "microlearning" | "skip_after_validation" | "emphasis" | null;
  score?: number;
  last_activity?: string; // human-friendly relative
}

export interface AiPathChange {
  id: string;
  employeeId: string;
  module_code: string;
  module_title: string;
  kind: "skipped" | "microlearning" | "diagnostic_only" | "emphasis" | "reordered";
  reason: string;
  evidence: string[];
  confidence: "low" | "medium" | "high";
  risk: "low" | "medium" | "high";
  needs_approval: boolean;
  created_at: string; // ISO-ish or human
}

export interface ActionItem {
  id: string;
  employeeId: string;
  group:
    | "raised_hand"
    | "reflection_review"
    | "evidence_approval"
    | "skip_approval"
    | "microlearning_approval"
    | "retake_request"
    | "ai_recommendation";
  title: string;
  detail: string;
  severity: "low" | "medium" | "high";
  age: string; // e.g. "2h ago"
  /** For raised_hand actions: the learner's verbatim message to the manager. */
  learner_message?: string;
  /** Optional module context (title) the action relates to. */
  module_title?: string;
}

export interface CpdRow {
  employeeId: string;
  hours_logged: number;
  hours_required: number;
  status: "on_track" | "at_risk" | "overdue";
  evidence_count: number;
}

export interface LearnerOverlay {
  employeeId: string;
  status: LearnerStatus;
  headline: string; // 1-line story for hover + drawer
  story: string; // longer paragraph for drawer Story tab
  cells: ModuleCellOverlay[];
  pathChanges: AiPathChange[];
  actions: ActionItem[];
  cpd: CpdRow;
  reflections: { id: string; topic: string; status: "auto_approved" | "needs_review" | "submitted"; summary: string; submitted_at: string }[];
  rolePlays: { id: string; title: string; score: number; behaviours: string[]; attempted_at: string }[];
  notes_seed: { id: string; body: string; author: string; created_at: string }[];
  timeline: { date: string; label: string }[];
}

const COHORT_ID = "11111111-1111-1111-1111-111111111111";
const COHORT_CODE = "cohort.assoc_im.2026_01";

// Real catalog modules for assoc_im cohort — keep ordered for the heatmap columns.
export const COHORT_MODULES_FALLBACK: { module_code: string; module_title: string; progression_stage: string }[] = [
  { module_code: "mod.assoc_im.foundations", module_title: "Foundations of Investment Management", progression_stage: "foundation" },
  { module_code: "mod.assoc_im.markets", module_title: "Markets & Asset Classes", progression_stage: "foundation" },
  { module_code: "mod.assoc_im.bond_pricing", module_title: "Bond Pricing & Yield Curves", progression_stage: "core" },
  { module_code: "mod.assoc_im.equity_analysis", module_title: "Equity Analysis Frameworks", progression_stage: "core" },
  { module_code: "mod.assoc_im.portfolio_construction", module_title: "Portfolio Construction", progression_stage: "core" },
  { module_code: "mod.assoc_im.client_suitability", module_title: "Client Suitability & MiFID II", progression_stage: "advanced" },
  { module_code: "mod.assoc_im.risk_compliance", module_title: "Risk, Compliance & Conduct", progression_stage: "advanced" },
  { module_code: "mod.assoc_im.client_review", module_title: "Running a Client Review", progression_stage: "mastery" },
];

const isoAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

function buildOverlay(): Record<string, LearnerOverlay> {
  const o: Record<string, LearnerOverlay> = {};

  // Helper to generate a row of cells given a status pattern
  const cells = (
    pattern: ("completed" | "in_progress" | "not_started" | "locked")[],
    adaptations: Partial<Record<number, ModuleCellOverlay["adaptation"]>>,
    scores: Partial<Record<number, number>>
  ): ModuleCellOverlay[] =>
    COHORT_MODULES_FALLBACK.map((m, i) => ({
      module_code: m.module_code,
      status: pattern[i] ?? "not_started",
      adaptation: adaptations[i] ?? null,
      score: scores[i],
      last_activity: pattern[i] === "completed" ? `${i + 1}d ago` : pattern[i] === "in_progress" ? "today" : undefined,
    }));

  // ── Sophie Linden (rb-l1) — early/outside FS — needs full path, slow start ──
  o["rb-l1"] = {
    employeeId: "rb-l1",
    status: "needs_check_in",
    headline: "On full foundation path. Pace is slow but quality is good.",
    story:
      "Sophie joined from outside financial services so AI assigned her the full foundation track with no skips. She has completed 2 of 8 modules and is averaging strong assessment scores (84%) but is two days behind cohort pace. Worth a 15-min check-in to clear blockers before Bond Pricing.",
    cells: cells(
      ["completed", "completed", "in_progress", "not_started", "not_started", "not_started", "not_started", "locked"],
      { 7: null },
      { 0: 86, 1: 82 }
    ),
    pathChanges: [
      {
        id: "pc-l1-1",
        employeeId: "rb-l1",
        module_code: "mod.assoc_im.foundations",
        module_title: "Foundations of Investment Management",
        kind: "emphasis",
        reason: "Sophie is new to FS — extra emphasis on terminology and market structure recommended.",
        evidence: ["Diagnostic 42%", "Background: marketing"],
        confidence: "high",
        risk: "low",
        needs_approval: false,
        created_at: isoAgo(6),
      },
    ],
    actions: [
      {
        id: "a-l1-1",
        employeeId: "rb-l1",
        group: "raised_hand",
        title: "Sophie raised a hand on Markets & Asset Classes",
        detail: "Stuck on the difference between bid/ask spread and dealer markup.",
        severity: "medium",
        age: "3h ago",
        module_title: "Markets & Asset Classes",
        learner_message:
          "Hi Julian — I'm stuck on the bid/ask vs dealer markup section. I tried the glossary and re-watched the short, but I can't quite see the difference when a dealer is also the market maker. Could we walk through a worked example? Happy to do it async or in our 1:1 — whichever works.",
      },
    ],
    cpd: { employeeId: "rb-l1", hours_logged: 4, hours_required: 35, status: "at_risk", evidence_count: 1 },
    reflections: [
      { id: "r-l1-1", topic: "Week 1 reflection", status: "submitted", summary: "Felt overwhelmed by jargon but enjoyed the case studies.", submitted_at: isoAgo(2) },
    ],
    rolePlays: [],
    notes_seed: [],
    timeline: [
      { date: isoAgo(7), label: "Joined cohort" },
      { date: isoAgo(6), label: "AI added Foundations emphasis" },
      { date: isoAgo(2), label: "Submitted Week 1 reflection" },
      { date: isoAgo(0), label: "Raised hand on Markets" },
    ],
  };

  // ── Maya Holloway (rb-l2) — early/fs_non_im — on track ──
  o["rb-l2"] = {
    employeeId: "rb-l2",
    status: "on_track",
    headline: "Strong steady progress. One foundation skip approved last week.",
    story:
      "Maya has FS background (retail banking) so AI converted Markets module into a diagnostic-only check, which she passed. She's tracking on plan with consistent ~80% scores.",
    cells: cells(
      ["completed", "completed", "completed", "in_progress", "not_started", "not_started", "not_started", "locked"],
      { 1: "diagnostic_only" },
      { 0: 78, 1: 91, 2: 80 }
    ),
    pathChanges: [
      {
        id: "pc-l2-1",
        employeeId: "rb-l2",
        module_code: "mod.assoc_im.markets",
        module_title: "Markets & Asset Classes",
        kind: "diagnostic_only",
        reason: "FS background detected; diagnostic confirmed competence (91%).",
        evidence: ["Diagnostic 91%", "Prior role: retail banking 3y"],
        confidence: "high",
        risk: "low",
        needs_approval: false,
        created_at: isoAgo(5),
      },
    ],
    actions: [],
    cpd: { employeeId: "rb-l2", hours_logged: 12, hours_required: 35, status: "on_track", evidence_count: 3 },
    reflections: [],
    rolePlays: [{ id: "rp-l2-1", title: "Client suitability intro", score: 78, behaviours: ["empathy", "active listening"], attempted_at: isoAgo(3) }],
    notes_seed: [],
    timeline: [
      { date: isoAgo(10), label: "Joined cohort" },
      { date: isoAgo(5), label: "AI converted Markets to diagnostic-only" },
      { date: isoAgo(3), label: "Completed first role play" },
    ],
  };

  // ── Theo Marchant (rb-l3) — early/in_im — AT RISK ──
  o["rb-l3"] = {
    employeeId: "rb-l3",
    status: "at_risk",
    headline: "Failed Bond Pricing twice. AI created a microlearning. Awaiting your approval.",
    story:
      "Theo has IM internship background but is repeatedly failing the Bond Pricing module (54%, 61%). AI generated a targeted microlearning on yield curves and recommends a 1:1 before he attempts the readiness gate.",
    cells: cells(
      ["completed", "completed", "in_progress", "not_started", "not_started", "not_started", "not_started", "locked"],
      { 2: "microlearning" },
      { 0: 88, 1: 80, 2: 54 }
    ),
    pathChanges: [
      {
        id: "pc-l3-1",
        employeeId: "rb-l3",
        module_code: "mod.assoc_im.bond_pricing",
        module_title: "Bond Pricing & Yield Curves",
        kind: "microlearning",
        reason: "Two failed attempts on yield-curve questions. Targeted 12-min microlearning generated.",
        evidence: ["Attempt 1: 54%", "Attempt 2: 61%", "Weak tag: yield_curve"],
        confidence: "high",
        risk: "medium",
        needs_approval: true,
        created_at: isoAgo(1),
      },
    ],
    actions: [
      {
        id: "a-l3-1",
        employeeId: "rb-l3",
        group: "microlearning_approval",
        title: "Approve microlearning: Yield Curves for Theo",
        detail: "AI generated a 12-min microlearning after two failed attempts.",
        severity: "high",
        age: "1d ago",
      },
      {
        id: "a-l3-2",
        employeeId: "rb-l3",
        group: "ai_recommendation",
        title: "Schedule a 1:1 with Theo before readiness gate",
        detail: "Risk of failing the gate without a coaching conversation.",
        severity: "high",
        age: "1d ago",
      },
    ],
    cpd: { employeeId: "rb-l3", hours_logged: 6, hours_required: 35, status: "at_risk", evidence_count: 1 },
    reflections: [
      { id: "r-l3-1", topic: "Why Bond Pricing is hard", status: "needs_review", summary: "Theo wrote that the formulas don't click and he learns better from worked examples.", submitted_at: isoAgo(1) },
    ],
    rolePlays: [],
    notes_seed: [],
    timeline: [
      { date: isoAgo(14), label: "Joined cohort" },
      { date: isoAgo(3), label: "Failed Bond Pricing attempt 1 (54%)" },
      { date: isoAgo(2), label: "Failed Bond Pricing attempt 2 (61%)" },
      { date: isoAgo(1), label: "AI created microlearning + flagged for approval" },
    ],
  };

  // ── Owen Castell (rb-l4) — mid/outside FS ──
  o["rb-l4"] = {
    employeeId: "rb-l4",
    status: "on_track",
    headline: "Mid-career switcher. Solid pace, leaning on case studies.",
    story:
      "Owen brings senior consulting experience but is new to IM. Standard path with extra Foundations emphasis. Tracking well.",
    cells: cells(
      ["completed", "completed", "completed", "in_progress", "not_started", "not_started", "not_started", "locked"],
      { 0: "emphasis" },
      { 0: 82, 1: 79, 2: 84 }
    ),
    pathChanges: [],
    actions: [],
    cpd: { employeeId: "rb-l4", hours_logged: 14, hours_required: 35, status: "on_track", evidence_count: 4 },
    reflections: [],
    rolePlays: [],
    notes_seed: [],
    timeline: [{ date: isoAgo(12), label: "Joined cohort" }],
  };

  // ── Priya Aldridge (rb-l5) — mid/fs_non_im ──
  o["rb-l5"] = {
    employeeId: "rb-l5",
    status: "on_track",
    headline: "Coming from compliance. Skipped two foundation modules after diagnostic.",
    story: "Priya scored 88% and 92% on foundation diagnostics so AI skipped Foundations and Markets. Currently on Bond Pricing.",
    cells: cells(
      ["completed", "completed", "in_progress", "not_started", "not_started", "not_started", "not_started", "locked"],
      { 0: "skip_after_validation", 1: "skip_after_validation" },
      { 0: 88, 1: 92 }
    ),
    pathChanges: [
      {
        id: "pc-l5-1",
        employeeId: "rb-l5",
        module_code: "mod.assoc_im.foundations",
        module_title: "Foundations of Investment Management",
        kind: "skipped",
        reason: "Diagnostic 88% — competence demonstrated.",
        evidence: ["Diagnostic 88%", "Prior role: compliance officer 4y"],
        confidence: "high",
        risk: "low",
        needs_approval: false,
        created_at: isoAgo(8),
      },
      {
        id: "pc-l5-2",
        employeeId: "rb-l5",
        module_code: "mod.assoc_im.markets",
        module_title: "Markets & Asset Classes",
        kind: "skipped",
        reason: "Diagnostic 92% — strong markets fluency.",
        evidence: ["Diagnostic 92%"],
        confidence: "high",
        risk: "low",
        needs_approval: false,
        created_at: isoAgo(8),
      },
    ],
    actions: [],
    cpd: { employeeId: "rb-l5", hours_logged: 16, hours_required: 35, status: "on_track", evidence_count: 5 },
    reflections: [],
    rolePlays: [],
    notes_seed: [],
    timeline: [
      { date: isoAgo(10), label: "Joined cohort" },
      { date: isoAgo(8), label: "AI skipped 2 foundation modules" },
    ],
  };

  // ── Clara Wren (rb-l6) — mid/in_im — RISING STAR ──
  o["rb-l6"] = {
    employeeId: "rb-l6",
    status: "rising_star",
    headline: "Two foundation skips approved. Top scores. Ready for stretch.",
    story:
      "Clara is the strongest learner in the cohort. AI compressed two foundation modules into diagnostics (both passed at 90%+) and she's averaging 92% across completed modules. Recommend assigning a stretch module on portfolio construction.",
    cells: cells(
      ["completed", "completed", "completed", "completed", "in_progress", "not_started", "not_started", "not_started"],
      { 0: "skip_after_validation", 1: "skip_after_validation" },
      { 0: 94, 1: 91, 2: 92, 3: 90 }
    ),
    pathChanges: [
      {
        id: "pc-l6-1",
        employeeId: "rb-l6",
        module_code: "mod.assoc_im.foundations",
        module_title: "Foundations of Investment Management",
        kind: "skipped",
        reason: "Diagnostic 94% + 2y IM analyst experience.",
        evidence: ["Diagnostic 94%", "Prior role: IM analyst 2y"],
        confidence: "high",
        risk: "low",
        needs_approval: false,
        created_at: isoAgo(9),
      },
      {
        id: "pc-l6-2",
        employeeId: "rb-l6",
        module_code: "mod.assoc_im.markets",
        module_title: "Markets & Asset Classes",
        kind: "skipped",
        reason: "Diagnostic 91% — markets fluency confirmed.",
        evidence: ["Diagnostic 91%"],
        confidence: "high",
        risk: "low",
        needs_approval: false,
        created_at: isoAgo(9),
      },
    ],
    actions: [
      {
        id: "a-l6-1",
        employeeId: "rb-l6",
        group: "ai_recommendation",
        title: "Assign Clara a stretch module on Portfolio Construction",
        detail: "Consistent 90%+ scores; ready for advanced material.",
        severity: "low",
        age: "2d ago",
      },
    ],
    cpd: { employeeId: "rb-l6", hours_logged: 22, hours_required: 35, status: "on_track", evidence_count: 7 },
    reflections: [
      { id: "r-l6-1", topic: "What's clicking", status: "auto_approved", summary: "Pattern recognition across asset classes is starting to feel intuitive.", submitted_at: isoAgo(2) },
    ],
    rolePlays: [{ id: "rp-l6-1", title: "Client suitability deep dive", score: 91, behaviours: ["clarifying questions", "structured framing"], attempted_at: isoAgo(4) }],
    notes_seed: [],
    timeline: [
      { date: isoAgo(14), label: "Joined cohort" },
      { date: isoAgo(9), label: "AI skipped 2 foundation modules" },
      { date: isoAgo(4), label: "Top role-play score in cohort (91%)" },
    ],
  };

  // ── Rosa Belmont (rb-l7) — exp/outside FS ──
  o["rb-l7"] = {
    employeeId: "rb-l7",
    status: "needs_check_in",
    headline: "Senior hire from tech. Engaged but reflection said she feels patronised.",
    story:
      "Rosa is a senior hire from product management. AI assigned a domain-bridge variant. Her reflection mentioned the foundation content feels 'too 101'. Worth tailoring further.",
    cells: cells(
      ["completed", "in_progress", "not_started", "not_started", "not_started", "not_started", "not_started", "locked"],
      { 0: "diagnostic_only" },
      { 0: 76 }
    ),
    pathChanges: [],
    actions: [
      {
        id: "a-l7-1",
        employeeId: "rb-l7",
        group: "reflection_review",
        title: "Review Rosa's reflection — feels content is too basic",
        detail: "She suggests jumping straight to advanced modules with diagnostics.",
        severity: "medium",
        age: "8h ago",
      },
    ],
    cpd: { employeeId: "rb-l7", hours_logged: 5, hours_required: 35, status: "at_risk", evidence_count: 1 },
    reflections: [
      { id: "r-l7-1", topic: "Honest feedback", status: "needs_review", summary: "Foundation content feels too 101 for my level. Would prefer diagnostic-first across the board.", submitted_at: isoAgo(0) },
    ],
    rolePlays: [],
    notes_seed: [],
    timeline: [{ date: isoAgo(7), label: "Joined cohort" }],
  };

  // ── Felix Arden (rb-l8) — exp/fs_non_im ──
  o["rb-l8"] = {
    employeeId: "rb-l8",
    status: "on_track",
    headline: "Senior FS hire. Most modules diagnostic-only. Strong evidence pipeline.",
    story: "Felix is an experienced banker. AI converted 4 modules into diagnostic-only with evidence. Currently producing real client-suitability work as evidence.",
    cells: cells(
      ["completed", "completed", "completed", "completed", "in_progress", "not_started", "not_started", "not_started"],
      { 0: "diagnostic_only", 1: "diagnostic_only", 2: "diagnostic_only", 3: "diagnostic_only" },
      { 0: 90, 1: 87, 2: 84, 3: 88 }
    ),
    pathChanges: [
      {
        id: "pc-l8-1",
        employeeId: "rb-l8",
        module_code: "mod.assoc_im.equity_analysis",
        module_title: "Equity Analysis Frameworks",
        kind: "diagnostic_only",
        reason: "10y FS experience; diagnostic 88%.",
        evidence: ["Diagnostic 88%"],
        confidence: "high",
        risk: "low",
        needs_approval: false,
        created_at: isoAgo(11),
      },
    ],
    actions: [
      {
        id: "a-l8-1",
        employeeId: "rb-l8",
        group: "evidence_approval",
        title: "Approve Felix's client suitability evidence",
        detail: "Submitted real client meeting notes for assessment.",
        severity: "medium",
        age: "5h ago",
      },
    ],
    cpd: { employeeId: "rb-l8", hours_logged: 28, hours_required: 35, status: "on_track", evidence_count: 9 },
    reflections: [],
    rolePlays: [{ id: "rp-l8-1", title: "Difficult client conversation", score: 86, behaviours: ["composure", "regulatory framing"], attempted_at: isoAgo(2) }],
    notes_seed: [],
    timeline: [
      { date: isoAgo(14), label: "Joined cohort" },
      { date: isoAgo(11), label: "AI converted 4 modules to diagnostic-only" },
    ],
  };

  // ── Elliot Hayes (rb-l9) — exp/in_im — RISING STAR ──
  o["rb-l9"] = {
    employeeId: "rb-l9",
    status: "rising_star",
    headline: "Experienced IM hire. Mostly skipped foundations. Ready for readiness gate.",
    story: "Elliot has 8y IM experience. AI compressed 5 foundation modules. He's approaching the readiness gate next week.",
    cells: cells(
      ["completed", "completed", "completed", "completed", "completed", "in_progress", "not_started", "not_started"],
      { 0: "skip_after_validation", 1: "skip_after_validation", 2: "diagnostic_only", 3: "diagnostic_only", 4: "diagnostic_only" },
      { 0: 96, 1: 95, 2: 93, 3: 91, 4: 90 }
    ),
    pathChanges: [
      {
        id: "pc-l9-1",
        employeeId: "rb-l9",
        module_code: "mod.assoc_im.foundations",
        module_title: "Foundations of Investment Management",
        kind: "skipped",
        reason: "8y IM experience; diagnostic 96%.",
        evidence: ["Diagnostic 96%", "Prior role: IM 8y"],
        confidence: "high",
        risk: "low",
        needs_approval: false,
        created_at: isoAgo(13),
      },
    ],
    actions: [
      {
        id: "a-l9-1",
        employeeId: "rb-l9",
        group: "ai_recommendation",
        title: "Approve Elliot for readiness gate",
        detail: "All prerequisites met with strong scores.",
        severity: "low",
        age: "1d ago",
      },
    ],
    cpd: { employeeId: "rb-l9", hours_logged: 31, hours_required: 35, status: "on_track", evidence_count: 11 },
    reflections: [],
    rolePlays: [{ id: "rp-l9-1", title: "Portfolio rebalancing pitch", score: 94, behaviours: ["clarity", "data-led"], attempted_at: isoAgo(1) }],
    notes_seed: [],
    timeline: [
      { date: isoAgo(14), label: "Joined cohort" },
      { date: isoAgo(13), label: "AI skipped 5 foundation modules" },
      { date: isoAgo(1), label: "Top role-play in cohort (94%)" },
    ],
  };

  return o;
}

const OVERLAY = buildOverlay();

export const RATHBONES_PERSONA_IDS = ["rb-l1", "rb-l2", "rb-l3", "rb-l4", "rb-l5", "rb-l6", "rb-l7", "rb-l8", "rb-l9"];
export const RATHBONES_MANAGER_ID = "rb-mgr";
export const RATHBONES_COHORT_ID = COHORT_ID;
export const RATHBONES_COHORT_CODE = COHORT_CODE;

export function getDemoOverlay(employeeId: string): LearnerOverlay | null {
  return OVERLAY[employeeId] ?? null;
}

export function getAllDemoOverlays(): LearnerOverlay[] {
  return RATHBONES_PERSONA_IDS.map((id) => OVERLAY[id]).filter(Boolean);
}

export function isDemoEmployee(employeeId: string): boolean {
  return employeeId in OVERLAY;
}

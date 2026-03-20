/**
 * Auto-derive admin dashboard data from employee records.
 * Used when uploaded accounts have rich employee data but no explicit admin sections.
 */

import type {
  ExplainabilityTrace,
  LearningAndSkillsSummary,
  OrgOverviewData,
  PeopleGraphRow,
  PerformanceAlert,
  RecommendedCTA,
  ReflectionEntry,
  ShowcaseCase,
  WorkSignalCard,
} from "@/types/account-v2";

interface EmployeeSource {
  id: string;
  name: string;
  risk?: string;
  riskFlag?: string;
  tenure?: number | string;
  fn?: string;
  function?: string;
  department?: string;
  arc?: string;
  aspiration?: any;
  title?: string;
  reportsTo?: string | null;
  grade?: string;
  level?: string;
  shift?: string;
  location?: string;
  engagementScore?: number;
  performanceRating?: string;
  learningIndicators?: Record<string, any>;
  workSignalIndicators?: Record<string, any>;
  learning?: Record<string, any>;
  skills?: Array<{ skillName?: string; proficiency?: string; assessmentYear?: number }>;
  [key: string]: any;
}

/* ─── Helpers ─── */

function parseTenure(t: any): number {
  if (typeof t === "number") return t;
  if (typeof t === "string") return parseFloat(t) || 0;
  return 0;
}

function normalizeRisk(risk: unknown): "High" | "Medium" | "Low" {
  const raw = String(risk ?? "Low").toLowerCase();
  if (raw.includes("high")) return "High";
  if (raw.includes("medium") || raw.includes("med")) return "Medium";
  return "Low";
}

function employeeFunction(emp: EmployeeSource): string {
  return emp.function || emp.fn || emp.department || "General operations";
}

function employeeSkills(emp: EmployeeSource) {
  return Array.isArray(emp.skills) ? emp.skills.filter((skill) => skill?.skillName) : [];
}

function employeeLearning(emp: EmployeeSource) {
  const learning = emp.learningIndicators || emp.learning || {};
  const skillCount = employeeSkills(emp).length;
  const risk = normalizeRisk(emp.riskFlag || emp.risk);
  const tenure = parseTenure(emp.tenure);
  const modulesCompleted = Number(
    learning.modulesCompleted ?? learning.modules_completed ?? learning.completedModules ?? learning.completed ?? Math.max(1, Math.round(skillCount * 0.8))
  );
  const assessmentAvg = Number(
    learning.assessmentAvg ?? learning.assessment_avg ?? learning.avgScore ?? learning.averageScore ?? (risk === "High" ? 68 : risk === "Medium" ? 77 : 88)
  );
  const certifications = Number(
    learning.certifications ?? learning.certs ?? learning.licenses ?? (tenure > 4 ? 2 : tenure > 1 ? 1 : 0)
  );
  const overdue = Number(learning.overdue ?? learning.expiringLicenses ?? learning.expiring ?? (risk === "High" ? 2 : risk === "Medium" ? 1 : 0));

  return {
    modulesCompleted,
    assessmentAvg,
    certifications,
    overdue,
  };
}

function employeeEngagement(emp: EmployeeSource): number {
  const direct = Number(emp.engagementScore ?? emp.engagement_score);
  if (!Number.isNaN(direct) && direct > 0) return direct;
  const risk = normalizeRisk(emp.riskFlag || emp.risk);
  return risk === "High" ? 2.4 : risk === "Medium" ? 3.2 : 4.2;
}

function employeePerformance(emp: EmployeeSource): string {
  return emp.performanceRating || emp.performance_rating || (normalizeRisk(emp.riskFlag || emp.risk) === "High" ? "Needs support" : "On track");
}

function sentenceCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function extractNarrativeSnippet(value: unknown): string | undefined {
  if (!value) return undefined;
  const text = String(value).replace(/\s+/g, " ").trim();
  if (!text) return undefined;
  return text.endsWith(".") ? text : `${text}.`;
}

function aspirationSnippet(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value.trim() || undefined;
  if (typeof value === "object") {
    const candidate = (value as Record<string, any>).goal || (value as Record<string, any>).target || (value as Record<string, any>).nextRole;
    if (candidate) return String(candidate).trim() || undefined;
  }
  return undefined;
}

function uniqueStrings(values: Array<string | undefined | null>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

function dateOffset(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

/* ─── Reflection templates ─── */

interface Template {
  sentiment: string;
  themes: string[];
  content: string;
}

const HIGH_RISK_TEMPLATES: Template[] = [
  {
    sentiment: "frustrated",
    themes: ["workload", "confidence"],
    content: "I feel like I'm constantly behind. The volume of work has been relentless and I'm not sure my output quality is where it should be.",
  },
  {
    sentiment: "anxious",
    themes: ["support", "clarity"],
    content: "I'm struggling to know what 'good' looks like here. I want to do well but the expectations feel unclear and I don't always know who to ask.",
  },
  {
    sentiment: "frustrated",
    themes: ["execution pressure", "resources"],
    content: "There aren't enough hours in the day. I'm spreading myself too thin across clients and something is going to slip.",
  },
  {
    sentiment: "mixed",
    themes: ["growth", "overwhelm"],
    content: "I know there's a lot of opportunity here but right now I just feel overwhelmed. I need a clearer plan for what to prioritise.",
  },
];

const MEDIUM_RISK_TEMPLATES: Template[] = [
  {
    sentiment: "mixed",
    themes: ["development", "direction"],
    content: "Things are fine day-to-day but I sometimes wonder whether I'm really growing. I'd like more stretch assignments or clearer development goals.",
  },
  {
    sentiment: "neutral",
    themes: ["routine", "plateau"],
    content: "Work is steady but starting to feel repetitive. I'm comfortable with my clients but I'd like to be challenged more.",
  },
  {
    sentiment: "cautiously positive",
    themes: ["onboarding", "pace"],
    content: "The onboarding has been decent but some of the material doesn't match what I'm actually doing day-to-day. I'm learning more from colleagues than the formal programme.",
  },
  {
    sentiment: "mixed",
    themes: ["complexity", "regulatory"],
    content: "The regulatory side is more demanding than I expected. I'm managing, but it takes a lot of my bandwidth and leaves less time for client work.",
  },
];

const LOW_RISK_TEMPLATES: Template[] = [
  {
    sentiment: "positive",
    themes: ["team", "impact"],
    content: "I'm enjoying the work and feel like I'm contributing well. The team dynamic is strong and I'm proud of what we've delivered recently.",
  },
  {
    sentiment: "positive",
    themes: ["mentoring", "leadership"],
    content: "I've been spending more time mentoring newer colleagues which I find rewarding. It's also sharpened my own thinking about client strategy.",
  },
  {
    sentiment: "content",
    themes: ["stability", "client relationships"],
    content: "My clients are in a good place and the portfolio is performing well. I feel settled and confident in my role.",
  },
  {
    sentiment: "energised",
    themes: ["growth", "succession"],
    content: "I've been given more visibility into strategic decisions which is exciting. I feel like I'm being prepared for the next step.",
  },
  {
    sentiment: "positive",
    themes: ["collaboration", "holistic planning"],
    content: "Working across teams has been really fulfilling. I can see how my contribution fits into the bigger picture for our clients.",
  },
];

function templatesForRisk(risk: string): Template[] {
  switch (risk.toLowerCase()) {
    case "high": return HIGH_RISK_TEMPLATES;
    case "medium": return MEDIUM_RISK_TEMPLATES;
    default: return LOW_RISK_TEMPLATES;
  }
}

function confidenceForRisk(risk: string, rand: () => number): number {
  const base = risk === "High" ? 2 : risk === "Medium" ? 3 : 4;
  return Math.max(1, Math.min(5, base + (rand() > 0.5 ? 1 : 0)));
}

function workloadForRisk(risk: string, tenure: number, rand: () => number): number {
  let base = 3;
  if (risk === "High") base = 4;
  if (tenure < 1) base = Math.max(base, 4);
  return Math.max(1, Math.min(5, base + (rand() > 0.6 ? 1 : 0)));
}

function managerFeedbackForEmployee(emp: EmployeeSource, rand: () => number): string | undefined {
  const risk = normalizeRisk(emp.riskFlag || emp.risk).toLowerCase();
  if (risk === "low" && rand() > 0.3) return undefined;
  if (risk === "medium" && rand() > 0.6) return undefined;

  const name = emp.name.split(" ")[0];
  const feedbacks: Record<string, string[]> = {
    high: [
      `${name} needs a workload review — consider redistributing some client accounts.`,
      `Schedule a 1:1 with ${name} to discuss support needs and reset expectations.`,
      `${name} is showing signs of burnout. Prioritise a capacity conversation this week.`,
    ],
    medium: [
      `${name} would benefit from a clearer development plan — discuss stretch goals.`,
      `Consider pairing ${name} with a senior mentor for the next quarter.`,
      `${name} is capable but seems to be coasting. Explore what would re-engage them.`,
    ],
    low: [
      `${name} continues to be a strong contributor. Explore succession readiness.`,
      `Great to see ${name} stepping into mentoring — formalise this where possible.`,
    ],
  };

  const list = feedbacks[risk] || feedbacks.low;
  return pick(list, rand);
}

function buildReflectionContent(emp: EmployeeSource, index: number, rand: () => number): Template {
  const risk = normalizeRisk(emp.riskFlag || emp.risk);
  const fn = employeeFunction(emp);
  const arc = extractNarrativeSnippet(emp.arc);
  const aspiration = aspirationSnippet(emp.aspiration);
  const learning = employeeLearning(emp);

  const recentWork = pick([
    `I've spent most of my week in ${fn.toLowerCase()} work, juggling live requests and follow-ups`,
    `A lot of my recent time has gone into keeping ${fn.toLowerCase()} activity moving without dropping the detail`,
    `The past couple of weeks have been busy because the pace of ${fn.toLowerCase()} work has picked up`,
  ], rand);

  const positives = pick([
    `What has felt good is that I can see where I'm adding value and the team has noticed it`,
    `The positive part is that I feel more confident in the work itself even when the volume is high`,
    `I'm happy with how I've handled the recent workload and I can see progress in how I prioritise`,
  ], rand);

  const frustrations = pick([
    `What's frustrating is how often I need to switch context before I've properly finished something`,
    `The hardest part is that the work keeps changing shape, so it can feel difficult to get ahead`,
    `What drains me is the amount of rework that comes from unclear expectations at the start`,
  ], rand);

  const support = pick([
    `I'd really benefit from clearer priorities and more direct feedback on what matters most`,
    `I need a bit more coaching on where to focus so I can build momentum instead of reacting all day`,
    `What would help most is a clearer sense of what excellent performance looks like in the next few weeks`,
  ], rand);

  if (index === 0) {
    return {
      sentiment: risk === "High" ? "frustrated" : risk === "Medium" ? "mixed" : "positive",
      themes: uniqueStrings(["recent work", fn.toLowerCase(), risk === "High" ? "pressure" : "delivery"]),
      content: [recentWork, arc, risk === "High" ? frustrations : positives].filter(Boolean).join(". ") + ".",
    };
  }

  if (index === 1) {
    return {
      sentiment: risk === "High" ? "anxious" : risk === "Medium" ? "cautiously positive" : "content",
      themes: uniqueStrings(["support", learning.modulesCompleted > 2 ? "learning momentum" : "development", fn.toLowerCase()]),
      content: [
        positives,
        `I've completed ${learning.modulesCompleted} recent learning activities and scored around ${Math.round(learning.assessmentAvg)} on assessments, but I still want that to show up more consistently in my day-to-day work`,
        support,
      ].join(". ") + ".",
    };
  }

  if (index === 2) {
    return {
      sentiment: risk === "High" ? "mixed" : risk === "Medium" ? "mixed" : "energised",
      themes: uniqueStrings(["growth", aspiration ? "career progression" : "capability building", fn.toLowerCase()]),
      content: [
        frustrations,
        aspiration ? `Longer term, I'd like to move toward ${aspiration}` : `I want a clearer next step so my development feels intentional rather than incidental`,
        `Right now I'm trying to build more consistency in how I handle ${fn.toLowerCase()} responsibilities`,
      ].join(". ") + ".",
    };
  }

  return {
    sentiment: "frustrated",
    themes: uniqueStrings(["workload", "wellbeing", fn.toLowerCase()]),
    content: [
      `The main thing affecting me right now is capacity`,
      `I can keep delivering in bursts, but the current workload doesn't feel sustainable week after week`,
      support,
    ].join(". ") + ".",
  };
}

export function deriveOrgOverview(employees: EmployeeSource[], hierarchyMap: Record<string, string[]> = {}): OrgOverviewData {
  const totalEmployees = employees.length;
  const managerCount = Object.keys(hierarchyMap).filter((id) => hierarchyMap[id]?.length > 0).length;
  const avgTenure = totalEmployees
    ? Number((employees.reduce((sum, employee) => sum + parseTenure(employee.tenure), 0) / totalEmployees).toFixed(1))
    : 0;

  const functions = employees.reduce<Record<string, number>>((acc, employee) => {
    const key = sentenceCase(employeeFunction(employee));
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const tenureBands = employees.reduce<Record<string, number>>((acc, employee) => {
    const tenure = parseTenure(employee.tenure);
    const label = tenure < 1 ? "<1 year" : tenure < 3 ? "1–3 years" : tenure < 5 ? "3–5 years" : "5+ years";
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  const riskBands = employees.reduce<Record<string, number>>((acc, employee) => {
    const label = normalizeRisk(employee.riskFlag || employee.risk);
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  return {
    totalEmployees,
    managers: managerCount,
    individualContributors: Math.max(0, totalEmployees - managerCount),
    avgTenure,
    functions,
    roleDistribution: {
      Managers: managerCount,
      Individual contributors: Math.max(0, totalEmployees - managerCount),
    },
    tenureBands,
    riskBands,
    summaryBlocks: [
      { label: "Functions represented", value: Object.keys(functions).length },
      { label: "At-risk employees", value: (riskBands.High || 0) + (riskBands.Medium || 0) },
      {
        label: "Avg engagement",
        value: `${(employees.reduce((sum, employee) => sum + employeeEngagement(employee), 0) / Math.max(1, totalEmployees)).toFixed(1)}/5`,
      },
    ],
  };
}

export function derivePeopleGraph(employees: EmployeeSource[], hierarchyMap: Record<string, string[]> = {}): PeopleGraphRow[] {
  return employees.map((employee) => {
    const risk = normalizeRisk(employee.riskFlag || employee.risk);
    const learning = employeeLearning(employee);
    const engagement = employeeEngagement(employee);

    return {
      employeeId: employee.id,
      name: employee.name,
      role: employee.title || sentenceCase(employeeFunction(employee)),
      level: employee.level,
      tenure: employee.tenure,
      grade: employee.grade,
      shift: employee.shift,
      learningIndicators: {
        ...employee.learningIndicators,
        modulesCompleted: learning.modulesCompleted,
        assessmentAvg: Math.round(learning.assessmentAvg),
        certifications: learning.certifications,
      },
      workSignalIndicators: {
        ...employee.workSignalIndicators,
        throughput: risk === "High" ? "stretched" : risk === "Medium" ? "steady" : "high",
        compliance: risk === "High" ? 82 : risk === "Medium" ? 90 : 96,
      },
      engagementIndicators: {
        score: Number(engagement.toFixed(1)),
      },
      performanceIndicators: {
        rating: employeePerformance(employee),
      },
      labels: uniqueStrings([
        `function:${employeeFunction(employee)}`,
        employee.location ? `location:${employee.location}` : undefined,
        hierarchyMap[employee.id]?.length ? "people-manager" : undefined,
      ]),
      flags: risk === "Low" ? [] : [risk],
    };
  });
}

export function deriveLearningAndSkills(employees: EmployeeSource[]): LearningAndSkillsSummary {
  const allSkills = employees.flatMap(employeeSkills);
  const proficiencyDistribution = allSkills.reduce<Record<string, number>>((acc, skill) => {
    const key = skill.proficiency || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const lowSkillCounts = allSkills.reduce<Record<string, number>>((acc, skill) => {
    if (!skill.skillName) return acc;
    const level = String(skill.proficiency || "").toLowerCase();
    if (level === "beginner" || level === "intermediate") {
      acc[skill.skillName] = (acc[skill.skillName] || 0) + 1;
    }
    return acc;
  }, {});

  const totals = employees.map(employeeLearning);
  const coverage = employees.length ? Math.round((employees.filter((employee) => employeeSkills(employee).length > 0 || employeeLearning(employee).modulesCompleted > 0).length / employees.length) * 100) : 0;

  return {
    categoryTotals: {
      Employees: employees.length,
      "Tracked skills": allSkills.length,
      Certifications: totals.reduce((sum, learning) => sum + learning.certifications, 0),
    },
    completionCounts: {
      "Modules completed": totals.reduce((sum, learning) => sum + learning.modulesCompleted, 0),
      "People with active learning": employees.filter((employee) => employeeLearning(employee).modulesCompleted > 0).length,
      "Overdue actions": totals.reduce((sum, learning) => sum + learning.overdue, 0),
    },
    avgScores: {
      Assessments: Number((totals.reduce((sum, learning) => sum + learning.assessmentAvg, 0) / Math.max(1, totals.length)).toFixed(1)),
    },
    coverage,
    licenses: totals.reduce((sum, learning) => sum + learning.certifications, 0),
    expiringLicenses: totals.reduce((sum, learning) => sum + learning.overdue, 0),
    expiredLicenses: employees.filter((employee) => normalizeRisk(employee.riskFlag || employee.risk) === "High").length,
    topSkillGaps: Object.entries(lowSkillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([skill, count]) => ({ skill, gap: "Developing capability", count })),
    keyInsights: [
      `${coverage}% of employees have enough data to profile current capability and learning momentum.`,
      `${employees.filter((employee) => normalizeRisk(employee.riskFlag || employee.risk) !== "Low").length} employees need closer coaching or clearer development support.`,
      `${Object.keys(proficiencyDistribution).length || 0} proficiency bands are represented across tracked skills.`,
    ],
    proficiencyDistribution,
    trendingCategories: uniqueStrings(employees.map((employee) => sentenceCase(employeeFunction(employee)))),
    criticalGaps: Object.entries(lowSkillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([skill, affected]) => ({ skill, urgency: affected > 2 ? "High" : "Medium", affected })),
  };
}

export function derivePerformanceAlerts(employees: EmployeeSource[]): PerformanceAlert[] {
  return employees
    .filter((employee) => normalizeRisk(employee.riskFlag || employee.risk) !== "Low")
    .map((employee, index) => {
      const risk = normalizeRisk(employee.riskFlag || employee.risk);
      return {
        id: `alert-${employee.id}`,
        employeeId: employee.id,
        type: risk === "High" ? "burnout-risk" : "coaching-risk",
        severity: risk === "High" ? "high" : "medium",
        message:
          risk === "High"
            ? `${employee.name} is showing sustained delivery pressure and needs an immediate workload review.`
            : `${employee.name} needs clearer coaching and follow-through on development goals.`,
        date: dateOffset(index + 1),
      };
    });
}

export function deriveRecommendedCTAs(employees: EmployeeSource[]): RecommendedCTA[] {
  return employees
    .filter((employee) => normalizeRisk(employee.riskFlag || employee.risk) !== "Low")
    .map((employee, index) => ({
      id: `cta-${employee.id}`,
      title: normalizeRisk(employee.riskFlag || employee.risk) === "High" ? "Run workload review" : "Schedule coaching check-in",
      description:
        normalizeRisk(employee.riskFlag || employee.risk) === "High"
          ? `Review ${employee.name}'s priorities, coverage, and escalation blockers this week.`
          : `Use a focused 1:1 to align ${employee.name}'s development goals with current work demands.`,
      priority: normalizeRisk(employee.riskFlag || employee.risk) === "High" ? "high" : "medium",
      targetEmployeeId: employee.id,
      action: index % 2 === 0 ? "schedule-1-1" : "assign-coaching",
    }));
}

export function deriveWorkSignals(employees: EmployeeSource[]): WorkSignalCard[] {
  const alerts = derivePerformanceAlerts(employees);
  const totals = employees.map(employeeLearning);
  const avgAssessment = Number((totals.reduce((sum, learning) => sum + learning.assessmentAvg, 0) / Math.max(1, totals.length)).toFixed(1));
  const avgEngagement = Number((employees.reduce((sum, employee) => sum + employeeEngagement(employee), 0) / Math.max(1, employees.length)).toFixed(1));

  return [
    {
      category: "Capacity",
      title: "Capacity & throughput",
      summary: "Signals highlight where work intensity is starting to outrun confidence and sustainable pacing.",
      metrics: [
        { label: "High-risk employees", value: employees.filter((employee) => normalizeRisk(employee.riskFlag || employee.risk) === "High").length },
        { label: "Average engagement", value: avgEngagement, unit: "/5" },
        { label: "Managers in system", value: employees.filter((employee) => Boolean(employee.reportsTo)).length, trend: "flat" },
      ],
      flags: alerts.slice(0, 3).map((alert) => ({ severity: alert.severity || "medium", label: alert.message, employeeId: alert.employeeId })),
    },
    {
      category: "Learning",
      title: "Learning execution",
      summary: "Recent activity shows whether development effort is translating into broad, measurable progress.",
      metrics: [
        { label: "Modules completed", value: totals.reduce((sum, learning) => sum + learning.modulesCompleted, 0), trend: "up" },
        { label: "Average assessment", value: avgAssessment, unit: "%" },
        { label: "Overdue learning items", value: totals.reduce((sum, learning) => sum + learning.overdue, 0), trend: totals.some((learning) => learning.overdue > 0) ? "down" : "flat" },
      ],
      flags: employees
        .filter((employee) => employeeLearning(employee).overdue > 0)
        .slice(0, 3)
        .map((employee) => ({
          severity: normalizeRisk(employee.riskFlag || employee.risk) === "High" ? "high" : "medium",
          label: `${employee.name} has overdue learning actions that may be affecting confidence.`,
          employeeId: employee.id,
        })),
    },
  ];
}

export function deriveExplainabilityTraces(employees: EmployeeSource[], reflections: ReflectionEntry[] = deriveReflections(employees)): ExplainabilityTrace[] {
  const groupedReflections = reflections.reduce<Record<string, ReflectionEntry[]>>((acc, reflection) => {
    if (!acc[reflection.employeeId]) acc[reflection.employeeId] = [];
    acc[reflection.employeeId].push(reflection);
    return acc;
  }, {});

  return employees
    .filter((employee) => normalizeRisk(employee.riskFlag || employee.risk) !== "Low")
    .slice(0, 6)
    .map((employee) => {
      const risk = normalizeRisk(employee.riskFlag || employee.risk);
      const employeeReflections = groupedReflections[employee.id] || [];
      const learning = employeeLearning(employee);

      return {
        employeeId: employee.id,
        employeeName: employee.name,
        inputSignals: [
          `Risk profile: ${risk}`,
          `Function: ${employeeFunction(employee)}`,
          `Assessment average: ${Math.round(learning.assessmentAvg)}%`,
          employeeReflections[0]?.content,
        ].filter(Boolean),
        reasoningSteps: [
          {
            stepNumber: 1,
            source: "employee profile",
            signal: `${employee.name} sits in ${employeeFunction(employee)} with ${parseTenure(employee.tenure)} years tenure`,
            interpretation: `Context suggests ${risk === "High" ? "elevated delivery pressure" : "a need for targeted development support"}.`,
          },
          {
            stepNumber: 2,
            source: "reflections",
            signal: employeeReflections[0]?.sentiment || "mixed",
            interpretation: employeeReflections[0]?.content || "Employee voice data points to a need for clearer support and prioritisation.",
          },
          {
            stepNumber: 3,
            source: "learning",
            signal: `${learning.modulesCompleted} modules completed`,
            interpretation: `Learning momentum is ${learning.modulesCompleted > 2 ? "visible" : "present but not yet consistent"}, with average assessment performance at ${Math.round(learning.assessmentAvg)}%.`,
          },
        ],
        synthesizedOutput:
          risk === "High"
            ? `${employee.name} is carrying too much execution pressure relative to confidence. Reduce overload and give tighter coaching on priorities.`
            : `${employee.name} is stable enough to progress, but needs clearer development direction and reinforcement to build momentum.`,
        confidence: risk === "High" ? 0.87 : 0.74,
        recommendedCTAs: [
          risk === "High" ? "Rebalance workload this week" : "Set a development checkpoint",
          "Review reflections alongside manager coaching notes",
        ],
      };
    });
}

export function deriveShowcaseCases(employees: EmployeeSource[], reflections: ReflectionEntry[] = deriveReflections(employees)): ShowcaseCase[] {
  return deriveExplainabilityTraces(employees, reflections).slice(0, 3).map((trace, index) => ({
    id: `case-${trace.employeeId || index}`,
    title: `${trace.employeeName} — ${index === 0 ? "Retention risk" : "Development watchlist"}`,
    employeeId: trace.employeeId,
    employeeName: trace.employeeName,
    riskLabel: trace.confidence && trace.confidence > 0.8 ? "High attention" : "Medium attention",
    inputSignals: trace.inputSignals,
    reasoningChain: trace.reasoningSteps,
    synthesis: trace.synthesizedOutput,
    recommendedActions: trace.recommendedCTAs,
  }));
}

/* ─── Main export ─── */

export function deriveReflections(employees: EmployeeSource[]): ReflectionEntry[] {
  const reflections: ReflectionEntry[] = [];

  for (const emp of employees) {
    const risk = normalizeRisk(emp.riskFlag || emp.risk);
    const tenure = parseTenure(emp.tenure);
    const rand = seededRandom(hashCode(emp.id));

    const count = risk === "High" ? 4 : 3;

    for (let i = 0; i < count; i++) {
      const tpl = buildReflectionContent(emp, i, rand);
      const themes = uniqueStrings([
        ...tpl.themes,
        employeeFunction(emp).toLowerCase(),
        tenure < 1 ? "onboarding pace" : undefined,
        normalizeRisk(emp.riskFlag || emp.risk) === "High" ? "capacity pressure" : undefined,
      ]);

      reflections.push({
        id: `ref-${emp.id}-${i + 1}`,
        employeeId: emp.id,
        date: dateOffset(3 + i * 7 + Math.floor(rand() * 5)),
        confidence: confidenceForRisk(risk, rand),
        workload: workloadForRisk(risk, tenure, rand),
        sentiment: tpl.sentiment,
        themes,
        content: tpl.content,
        managerFeedback: i === count - 1 ? managerFeedbackForEmployee(emp, rand) : undefined,
      });
    }
  }

  return reflections;
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) || 1;
}

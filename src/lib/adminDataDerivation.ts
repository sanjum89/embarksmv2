/**
 * Auto-derive admin dashboard data from employee records.
 * Used when uploaded accounts have rich employee data but no explicit admin sections.
 */

import type { ReflectionEntry } from "@/types/account-v2";

interface EmployeeSource {
  id: string;
  name: string;
  risk?: string;
  tenure?: number | string;
  fn?: string;
  arc?: string;
  aspiration?: any;
  title?: string;
  [key: string]: any;
}

/* ─── Helpers ─── */

function parseTenure(t: any): number {
  if (typeof t === "number") return t;
  if (typeof t === "string") return parseFloat(t) || 0;
  return 0;
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
  const risk = (emp.risk || "Low").toLowerCase();
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

/* ─── Main export ─── */

export function deriveReflections(employees: EmployeeSource[]): ReflectionEntry[] {
  const reflections: ReflectionEntry[] = [];

  for (const emp of employees) {
    const risk = emp.risk || "Low";
    const tenure = parseTenure(emp.tenure);
    const templates = templatesForRisk(risk);
    const rand = seededRandom(hashCode(emp.id));

    // 2-4 entries per employee
    const count = risk === "High" ? 4 : risk === "Medium" ? 3 : 2;
    const used = new Set<number>();

    for (let i = 0; i < count && i < templates.length; i++) {
      let idx: number;
      do {
        idx = Math.floor(rand() * templates.length);
      } while (used.has(idx) && used.size < templates.length);
      used.add(idx);

      const tpl = templates[idx];

      // Add function-specific theme if present
      const themes = [...tpl.themes];
      if (emp.fn && !themes.includes(emp.fn.toLowerCase())) {
        themes.push(emp.fn.toLowerCase());
      }

      reflections.push({
        id: `ref-${emp.id}-${i + 1}`,
        employeeId: emp.id,
        date: dateOffset(3 + i * 7 + Math.floor(rand() * 5)),
        confidence: confidenceForRisk(risk, rand),
        workload: workloadForRisk(risk, tenure, rand),
        sentiment: tpl.sentiment,
        themes,
        content: tpl.content,
        managerFeedback: i === 0 ? managerFeedbackForEmployee(emp, rand) : undefined,
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

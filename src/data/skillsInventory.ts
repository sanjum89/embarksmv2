/**
 * Skills Inventory — derived from the SkyHive skills database (~57,800 skills).
 * 
 * CX_SKILLS: ~200 curated CX-relevant skills for immediate use in user profiles.
 * Full inventory is lazy-loaded from /data/skyhive-skills.json.
 */

import type { Proficiency, SkillEntry } from "@/types/learning";

export interface SkillCategory {
  name: string;
  skills: string[];
}

/* ─── Curated CX-relevant skills (~200) ─── */
export const CX_SKILLS: string[] = [
  // Communication
  "active listening", "accent reduction", "accepting feedback", "assertive communication",
  "business communication", "business correspondence", "business writing", "call center management",
  "call center operations", "call handling", "call monitoring", "call quality monitoring",
  "client communication", "client relations", "client relationship management", "communication skills",
  "complaint handling", "conflict management", "conflict resolution", "conversational skills",
  "correspondence management", "crisis communication", "cross-cultural communication",
  "customer communication", "customer correspondence", "de-escalation", "diplomatic communication",
  "email communication", "email etiquette", "empathetic communication", "empathy",
  "feedback delivery", "interpersonal communication", "interpersonal skills",
  "multilingual communication", "negotiation", "nonverbal communication",
  "oral communication", "persuasion", "professional communication", "public speaking",
  "rapport building", "relationship building", "stakeholder communication",
  "telephone etiquette", "verbal communication", "written communication",
  
  // Customer Service
  "A/B testing", "account management", "account servicing", "billing support",
  "case management", "chat support", "client advocacy", "client engagement",
  "client onboarding", "client satisfaction", "client support", "complaint management",
  "consumer behavior", "consumer insights", "contact center management",
  "contact center operations", "customer acquisition", "customer advocacy",
  "customer analysis", "customer centricity", "customer data management",
  "customer education", "customer engagement", "customer experience",
  "customer experience design", "customer experience management", "customer experience strategy",
  "customer feedback analysis", "customer insight", "customer interaction",
  "customer journey mapping", "customer lifecycle management", "customer loyalty",
  "customer needs assessment", "customer onboarding", "customer profiling",
  "customer relationship management", "customer research", "customer retention",
  "customer satisfaction", "customer segmentation", "customer service",
  "customer service excellence", "customer service management", "customer service training",
  "customer success", "customer support", "customer value management",
  "digital customer experience", "first call resolution", "help desk support",
  "incident management", "issue resolution", "issue tracking",
  "live chat support", "multichannel support", "net promoter score",
  "omnichannel strategy", "order management", "phone support",
  "problem resolution", "quality assurance", "queue management",
  "refund processing", "returns management", "satisfaction surveys",
  "self-service portal management", "service delivery", "service desk management",
  "service excellence", "service level agreement management", "service recovery",
  "subscription management", "support operations", "support ticket management",
  "technical support", "ticket triage", "user support",
  "voice of the customer", "warranty management",
  
  // Technical Support
  "CRM software", "Freshdesk", "Salesforce", "Zendesk",
  "ServiceNow", "Intercom", "HubSpot Service Hub", "Jira Service Management",
  "knowledge base management", "knowledge management", "remote troubleshooting",
  "remote desktop support", "screen sharing tools", "software troubleshooting",
  "system diagnostics", "technical documentation", "troubleshooting",
  "troubleshooting methodology", "VPN troubleshooting", "Wi-Fi troubleshooting",
  "device setup support", "hardware troubleshooting", "mobile device support",
  "network troubleshooting", "password reset procedures", "software installation support",
  
  // Product Knowledge
  "Apple ecosystem", "Apple ID support", "iCloud support",
  "iOS troubleshooting", "macOS troubleshooting", "product demonstration",
  "product knowledge", "product training", "SaaS product support",
  "software product knowledge", "subscription billing", "warranty claims",
  
  // Analytics & Tools
  "360 feedback", "analytics", "business intelligence",
  "call analytics", "customer analytics", "dashboard creation",
  "data analysis", "data visualization", "Excel", "Google Analytics",
  "KPI tracking", "metrics analysis", "performance analytics",
  "Power BI", "quality metrics", "reporting",
  "sentiment analysis", "speech analytics", "survey design",
  "Tableau", "trend analysis", "workforce analytics",
  
  // Leadership & Coaching
  "absence management", "change management", "coaching",
  "continuous improvement", "employee development", "employee engagement",
  "facilitation", "leadership", "mentoring", "onboarding design",
  "people management", "performance management", "process improvement",
  "program management", "project management", "quality management",
  "resource management", "staff training", "succession planning",
  "talent development", "team building", "team leadership",
  "time management", "training delivery", "training design",
  "training evaluation", "training needs analysis", "workforce management",
  "workforce planning",
  
  // Compliance & Privacy
  "CCPA compliance", "compliance monitoring", "consumer protection",
  "data privacy", "data protection", "data security",
  "GDPR compliance", "HIPAA compliance", "identity verification",
  "information security", "PCI DSS compliance", "privacy policy",
  "quality auditing", "regulatory compliance", "risk management",
  "security awareness",
];

export const SKILL_CATEGORIES: SkillCategory[] = [
  {
    name: "Communication",
    skills: CX_SKILLS.slice(0, 47),
  },
  {
    name: "Customer Service",
    skills: CX_SKILLS.slice(47, 121),
  },
  {
    name: "Technical Support",
    skills: CX_SKILLS.slice(121, 147),
  },
  {
    name: "Product Knowledge",
    skills: CX_SKILLS.slice(147, 159),
  },
  {
    name: "Analytics & Tools",
    skills: CX_SKILLS.slice(159, 181),
  },
  {
    name: "Leadership & Coaching",
    skills: CX_SKILLS.slice(181, 210),
  },
  {
    name: "Compliance & Privacy",
    skills: CX_SKILLS.slice(210),
  },
];

/* ─── Deterministic skill assignment for user profiles ─── */
const PROFICIENCY_LEVELS: Proficiency[] = ["Beginner", "Intermediate", "Advanced", "Expert", "Master"];

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getRandomSkillsForUser(
  userId: string,
  count: number = 8
): SkillEntry[] {
  const hash = simpleHash(userId);
  const selected: SkillEntry[] = [];
  const usedIndices = new Set<number>();

  for (let i = 0; i < count && usedIndices.size < CX_SKILLS.length; i++) {
    let idx = (hash + i * 7 + i * i) % CX_SKILLS.length;
    while (usedIndices.has(idx)) {
      idx = (idx + 1) % CX_SKILLS.length;
    }
    usedIndices.add(idx);

    const profIdx = (hash + i * 3) % PROFICIENCY_LEVELS.length;
    selected.push({
      skill_name: CX_SKILLS[idx],
      proficiency: PROFICIENCY_LEVELS[profIdx],
      assessment_year: 2025 + (i % 2),
    });
  }
  return selected;
}

/* ─── Lazy-loaded full inventory from JSON ─── */
let cachedSkills: string[] | null = null;

export async function getAllSkills(): Promise<string[]> {
  if (cachedSkills) return cachedSkills;
  try {
    const res = await fetch("/data/skyhive-skills.json");
    cachedSkills = await res.json();
    return cachedSkills!;
  } catch {
    console.warn("Failed to load full skills inventory, using CX subset");
    return CX_SKILLS;
  }
}

export async function searchSkillsInventory(query: string): Promise<string[]> {
  const all = await getAllSkills();
  const q = query.toLowerCase();
  return all.filter((s) => s.toLowerCase().includes(q)).slice(0, 50);
}

import type {
  User,
  SkillTarget,
  RolePlay,
  Assessment,
  LearningModule,
  PeopleGraphSignal,
  SkillEntry,
  SkillRequirement,
} from "@/types/learning";
import { expandedModules } from "@/data/contentModules";

/* ─── Users ─── */
export const currentUser: User = {
  id: "u1",
  name: "Alex Rivera",
  email: "alex@wfai.com",
  role: "learner",
  avatarUrl: "",
  title: "Product Manager",
  canManage: true,
};

export const mayaThompson: User = {
  id: "u6",
  name: "Maya Thompson",
  email: "maya@wfai.com",
  role: "learner",
  avatarUrl: "",
  title: "Apple L1 Customer Support Executive",
};

export const marcusWellington: User = {
  id: "u7",
  name: "Marcus Wellington",
  email: "marcus.w@wfai.com",
  role: "manager",
  avatarUrl: "",
  title: "Regional Training Manager",
  canManage: true,
};

export const rajPatel: User = {
  id: "u8",
  name: "Raj Patel",
  email: "raj@wfai.com",
  role: "learner",
  avatarUrl: "",
  title: "Apple L1 Customer Support Executive",
};

export const priyaMenon: User = {
  id: "u10",
  name: "Emily Watson",
  email: "emily.watson@wfai.com",
  role: "learner",
  avatarUrl: "",
  title: "Apple L1 Customer Support Executive (Fresher)",
};

export const availableUsers: User[] = [currentUser, marcusWellington, mayaThompson, rajPatel, priyaMenon];

/* ─── New Hires ─── */
export interface NewHire {
  user: User;
  title: string;
  startDate: string;
  location: string;
  yearsExperience: number;
  skills: { name: string; level: string }[];
  trainingStatus: "not_started" | "in_progress" | "completed";
  program?: string;
}

export const mockNewHires: NewHire[] = [
  {
    user: mayaThompson,
    title: "Apple L1 Customer Support Executive",
    startDate: "2026-02-15",
    location: "Austin, TX",
    yearsExperience: 3,
    skills: [
      { name: "Customer Communication", level: "Advanced" },
      { name: "Empathy and De-escalation", level: "Advanced" },
      { name: "Apple Product Basics", level: "Beginner" },
      { name: "Apple ID and iCloud Support", level: "Beginner" },
    ],
    trainingStatus: "not_started",
    program: "Apple Support Program",
  },
  {
    user: rajPatel,
    title: "Apple L1 Customer Support Executive",
    startDate: "2026-02-20",
    location: "Bangalore, India",
    yearsExperience: 2,
    skills: [
      { name: "Customer Communication", level: "Intermediate" },
      { name: "Guided Troubleshooting", level: "Intermediate" },
      { name: "Apple Product Basics", level: "Beginner" },
    ],
    trainingStatus: "not_started",
    program: "Apple Support Program",
  },
  {
    user: { id: "u9", name: "Lena Okafor", email: "lena@wfai.com", role: "learner" },
    title: "Apple L1 Customer Support Executive",
    startDate: "2026-03-01",
    location: "London, UK",
    yearsExperience: 4,
    skills: [
      { name: "Customer Communication", level: "Advanced" },
      { name: "Case Documentation", level: "Advanced" },
      { name: "Escalation Handling", level: "Intermediate" },
      { name: "Apple Product Basics", level: "Beginner" },
    ],
    trainingStatus: "not_started",
    program: "Apple Support Program",
  },
  {
    user: priyaMenon,
    title: "Apple L1 Customer Support Executive (Fresher)",
    startDate: "2026-03-05",
    location: "Chennai, India",
    yearsExperience: 0,
    skills: [
      { name: "Customer Communication", level: "Beginner" },
      { name: "Apple Product Basics", level: "Beginner" },
      { name: "Troubleshooting", level: "Beginner" },
    ],
    trainingStatus: "not_started",
    program: "Apple Support Program",
  },
];

/* ─── Program Contexts ─── */
export interface ProgramContext {
  id: string;
  name: string;
  description: string;
  category: string;
  skillTargetId: string;
  assessmentPassPercentage: number;
  adaptiveSkipThresholds: { skipOne: number; skipTwo: number };
  finalRolePlayId: string;
  assignedLearners: string[];
}

export const mockProgramContexts: ProgramContext[] = [
  {
    id: "pc1",
    name: "Apple L1 Customer Support",
    description: "Complete onboarding program for new hires joining the Apple L1 Customer Support team. Covers product ecosystem, troubleshooting workflows, billing, warranty, and live call readiness.",
    category: "Apple Support Program",
    skillTargetId: "st4",
    assessmentPassPercentage: 70,
    adaptiveSkipThresholds: { skipOne: 80, skipTwo: 90 },
    finalRolePlayId: "rp13",
    assignedLearners: ["u6", "u8", "u9", "u10"],
  },
];

export const mockTeamMembers: User[] = [
  currentUser,
  { id: "u2", name: "Jordan Chen", email: "jordan@wfai.com", role: "learner" },
  { id: "u3", name: "Priya Sharma", email: "priya@wfai.com", role: "learner" },
  { id: "u4", name: "Marcus Williams", email: "marcus@wfai.com", role: "learner" },
  { id: "u5", name: "Sofia Martinez", email: "sofia@wfai.com", role: "manager" },
  mayaThompson,
];

/* ─── Assessments ─── */
export const mockAssessments: Assessment[] = [
  {
    id: "a1",
    title: "Pre-Assessment: Objection Basics",
    type: "pre",
    passingScore: 70,
    questions: [
      { id: "q1", question: "What is the first step in the LAER objection handling framework?", options: ["Listen", "Argue", "Escalate", "Redirect"], correctIndex: 0 },
      { id: "q2", question: "When a customer says 'It's too expensive,' you should:", options: ["Offer an immediate discount", "Acknowledge the concern and explore value", "Move on to the next feature", "End the conversation"], correctIndex: 1 },
      { id: "q3", question: "Which technique helps reframe a price objection?", options: ["Ignoring it", "Comparing cost to value delivered", "Repeating the price louder", "Blaming the competitor"], correctIndex: 1 },
      { id: "q4", question: "Active listening during objections means:", options: ["Waiting for your turn to speak", "Paraphrasing the customer's concern", "Taking notes silently", "Interrupting with solutions"], correctIndex: 1 },
      { id: "q5", question: "The best time to address objections is:", options: ["Never — avoid them", "Before they arise, proactively", "Only after the deal is lost", "When the manager steps in"], correctIndex: 1 },
    ],
  },
  {
    id: "a2",
    title: "Post-Assessment: Objection Mastery",
    type: "post",
    passingScore: 80,
    questions: [
      { id: "q6", question: "In the LAER model, what does 'E' stand for?", options: ["Evaluate", "Explore", "Empathize", "Execute"], correctIndex: 1 },
      { id: "q7", question: "When facing a competitor comparison objection, you should:", options: ["Badmouth the competitor", "Focus on unique differentiators", "Admit defeat", "Change the subject"], correctIndex: 1 },
      { id: "q8", question: "A customer says 'We're happy with our current vendor.' Best response?", options: ["Hang up", "Ask what they'd improve about their current solution", "Offer 50% off", "Send more brochures"], correctIndex: 1 },
      { id: "q9", question: "Reframing is most effective when you:", options: ["Deny the problem exists", "Shift perspective to show hidden value", "Agree the product is flawed", "Promise future fixes"], correctIndex: 1 },
      { id: "q10", question: "After resolving an objection, you should:", options: ["Move forward with confidence", "Ask if they have more objections repeatedly", "Revisit the objection again", "Apologize for the inconvenience"], correctIndex: 0 },
    ],
  },
  {
    id: "a3",
    title: "Pre-Assessment: Product Basics",
    type: "pre",
    passingScore: 70,
    questions: [
      { id: "q11", question: "What is the primary market segment for Enterprise Suite?", options: ["Startups", "Mid-market to Enterprise", "Consumers", "Government only"], correctIndex: 1 },
      { id: "q12", question: "Which feature differentiates Enterprise Suite from competitors?", options: ["Basic CRM", "AI-powered analytics dashboard", "Free email", "Social media posting"], correctIndex: 1 },
      { id: "q13", question: "Enterprise Suite's deployment model is:", options: ["On-premise only", "Cloud-only", "Hybrid cloud with on-premise option", "Desktop application"], correctIndex: 2 },
    ],
  },
  {
    id: "a4",
    title: "Post-Assessment: Product Mastery",
    type: "post",
    passingScore: 80,
    questions: [
      { id: "q14", question: "What compliance certifications does Enterprise Suite hold?", options: ["None", "SOC 2 and ISO 27001", "PCI only", "HIPAA only"], correctIndex: 1 },
      { id: "q15", question: "The average implementation timeline for Enterprise Suite is:", options: ["1 day", "2-4 weeks", "6 months", "1 year"], correctIndex: 1 },
    ],
  },
  {
    id: "a5",
    title: "Pre-Assessment: Empathy Baseline",
    type: "pre",
    passingScore: 60,
    questions: [
      { id: "q16", question: "Empathetic communication starts with:", options: ["Solving the problem immediately", "Acknowledging the person's feelings", "Explaining your policy", "Transferring to a manager"], correctIndex: 1 },
      { id: "q17", question: "Which phrase demonstrates empathy?", options: ["That's not our fault", "I understand how frustrating this must be", "Let me check our policy", "Please hold"], correctIndex: 1 },
    ],
  },
  {
    id: "a6",
    title: "Post-Assessment: Empathy Mastery",
    type: "post",
    passingScore: 80,
    questions: [
      { id: "q18", question: "When a customer is emotional, you should first:", options: ["Fix the technical issue", "Validate their emotional experience", "Escalate immediately", "Offer compensation"], correctIndex: 1 },
      { id: "q19", question: "Reflective listening involves:", options: ["Repeating exactly what was said", "Paraphrasing to confirm understanding", "Ignoring emotions", "Asking yes/no questions only"], correctIndex: 1 },
    ],
  },
  {
    id: "a7",
    title: "Pre-Assessment: Apple Support Fundamentals",
    type: "pre",
    passingScore: 70,
    questions: [
      { id: "q20", question: "What is the primary purpose of an Apple ID?", options: ["Hardware registration only", "Single sign-on for all Apple services", "Warranty tracking", "Device encryption"], correctIndex: 1 },
      { id: "q21", question: "iCloud storage is used for:", options: ["Only photos", "Backing up and syncing data across devices", "Running apps remotely", "Apple Pay transactions"], correctIndex: 1 },
      { id: "q22", question: "When a customer reports a billing issue, the first step is:", options: ["Issue an immediate refund", "Verify the customer's identity and review the charge", "Transfer to billing department", "End the call"], correctIndex: 1 },
      { id: "q23", question: "Which Apple device runs iPadOS?", options: ["MacBook", "iPhone", "iPad", "Apple Watch"], correctIndex: 2 },
      { id: "q24", question: "AppleCare+ provides:", options: ["Free unlimited repairs", "Extended warranty with accidental damage coverage", "Free device upgrades", "Priority store access"], correctIndex: 1 },
    ],
  },
];

/* ─── Learning Modules ─── */
export const mockLearningModules: LearningModule[] = [
  { id: "m1", title: "Objection Handling Framework", contentType: "video", contentUrl: "https://example.com/laer-framework", duration: "25 min", transcript: "In this module, we'll cover the LAER framework — Listen, Acknowledge, Explore, Respond. This proven methodology helps sales professionals navigate even the toughest customer objections with confidence and empathy.\n\nStep 1: Listen — Give the customer your full attention. Don't interrupt. Let them express their complete concern.\n\nStep 2: Acknowledge — Show that you've heard and understood their concern. Use phrases like 'I understand why that's important to you.'\n\nStep 3: Explore — Ask open-ended questions to dig deeper. Often the stated objection isn't the real concern.\n\nStep 4: Respond — Once you truly understand the objection, address it directly with relevant value propositions." },
  { id: "m2", title: "Advanced Reframing Techniques", contentType: "document", contentUrl: "https://example.com/reframing-guide.pdf", duration: "20 min", transcript: "Reframing is the art of helping customers see their situation from a different perspective. This guide covers five advanced reframing techniques used by top-performing sales professionals." },
  { id: "m3", title: "Enterprise Suite Overview", contentType: "video", contentUrl: "https://example.com/enterprise-overview", duration: "30 min", transcript: "Welcome to the Enterprise Suite product overview. In this training, you'll learn about our core platform capabilities, key differentiators, and the value propositions that resonate with enterprise buyers." },
  { id: "m4", title: "Competitive Positioning", contentType: "document", contentUrl: "https://example.com/competitive-positioning.pdf", duration: "20 min", transcript: "This document covers how to position our Enterprise Suite against key competitors. You'll learn the strengths and weaknesses of competing products, and how to articulate our unique value in head-to-head comparisons." },
  { id: "m5", title: "Active Listening Techniques", contentType: "video", contentUrl: "https://example.com/active-listening", duration: "20 min", transcript: "Active listening is more than just hearing words — it's about fully engaging with the speaker. This module covers techniques including mirroring, paraphrasing, and emotional labeling." },
  { id: "m6", title: "Apple Product Ecosystem Overview", contentType: "video", contentUrl: "https://example.com/apple-ecosystem", duration: "25 min", transcript: "Welcome to the Apple Product Ecosystem Overview. In this video, we'll walk through the full range of Apple hardware and software products, how they integrate with each other, and the key selling points that matter to customers." },
  { id: "m7", title: "Apple ID and iCloud Fundamentals", contentType: "video", contentUrl: "https://example.com/apple-id-icloud", duration: "30 min", transcript: "This module covers Apple ID creation, management, and troubleshooting. You'll also learn about iCloud services including iCloud Drive, Photos, Backup, and Family Sharing — and how to guide customers through common issues." },
  { id: "m8", title: "iPhone and iPad Basics", contentType: "video", contentUrl: "https://example.com/iphone-ipad-basics", duration: "25 min", transcript: "In this training, we cover the fundamentals of iPhone and iPad support. Topics include device setup, iOS navigation, accessibility features, software updates, and the most common support requests you'll encounter." },
  { id: "m9", title: "Mac Basics for Support", contentType: "document", contentUrl: "https://example.com/mac-basics.pdf", duration: "20 min", transcript: "This guide covers macOS fundamentals for support agents. You'll learn about System Preferences, Finder navigation, user account management, disk utility basics, and common troubleshooting steps for Mac hardware and software issues." },
  { id: "m10", title: "Classroom: Live Device Handling Lab", contentType: "video", contentUrl: "https://example.com/device-handling-lab", duration: "60 min", transcript: "This hands-on lab session walks you through proper device handling procedures. You'll practice inspecting devices, running diagnostics, performing resets, and documenting findings — all following Apple's service guidelines." },
  { id: "m11", title: "Apple Billing and Subscriptions", contentType: "document", contentUrl: "https://example.com/apple-billing.pdf", duration: "20 min", transcript: "This document covers Apple billing systems, App Store and iTunes purchase support, subscription management, refund policies, and how to help customers resolve payment-related issues." },
  { id: "m12", title: "Warranty and Repair Processes", contentType: "document", contentUrl: "https://example.com/warranty-repair.pdf", duration: "25 min", transcript: "Learn about Apple's warranty coverage, AppleCare+ plans, repair eligibility criteria, and the end-to-end repair process. This guide also covers how to set customer expectations around repair timelines and costs." },
  { id: "m13", title: "Guided Troubleshooting Workflows", contentType: "video", contentUrl: "https://example.com/troubleshooting-workflows", duration: "30 min", transcript: "This video demonstrates structured troubleshooting workflows for the most common Apple support cases. You'll learn how to use decision trees, diagnostic tools, and knowledge base articles to resolve issues efficiently." },
  { id: "m14", title: "Apple Service and Support Options", contentType: "document", contentUrl: "https://example.com/service-options.pdf", duration: "20 min", transcript: "This reference document outlines all available Apple service and support channels — including phone, chat, mail-in, walk-in, and authorized service providers. Learn when to recommend each option to customers." },
  { id: "m15", title: "Customer Verification and Privacy", contentType: "video", contentUrl: "https://example.com/verification-privacy", duration: "20 min", transcript: "Privacy and security are foundational to Apple support. This module covers customer identity verification procedures, data protection policies, and how to handle sensitive information during support interactions." },
  { id: "m16", title: "Escalation Procedures", contentType: "document", contentUrl: "https://example.com/escalation.pdf", duration: "15 min", transcript: "This guide explains when and how to escalate support cases. Topics include escalation triggers, tier 2 handoff protocols, manager escalation procedures, and how to document escalation reasons effectively." },
  { id: "m17", title: "Case Documentation Best Practices", contentType: "document", contentUrl: "https://example.com/case-docs.pdf", duration: "20 min", transcript: "Proper case documentation ensures continuity and quality. This module covers how to write clear case notes, tag issues correctly, record troubleshooting steps taken, and close cases with appropriate resolution codes." },
  { id: "m18", title: "Apple Ecosystem Navigation Deep Dive", contentType: "video", contentUrl: "https://example.com/ecosystem-deep-dive", duration: "25 min", transcript: "Building on the ecosystem overview, this deep dive explores cross-device features like Handoff, AirDrop, Universal Clipboard, and Continuity Camera. You'll learn how to troubleshoot connectivity between Apple devices." },
  { id: "m19", title: "Live Readiness Review", contentType: "video", contentUrl: "https://example.com/readiness-review", duration: "20 min", transcript: "This final review session assesses your readiness to handle live customer interactions. We'll walk through sample scenarios, review key policies, and ensure you're confident with all tools and procedures." },
  ...expandedModules,
];

/* ─── Skill Targets ─── */
export const mockSkillTargets: SkillTarget[] = [
  {
    id: "st1",
    title: "Customer Objection Handling",
    description: "Master techniques for handling common customer objections during sales conversations.",
    category: "Sales Skills",
    assignedTo: ["u1", "u2", "u3"],
    progress: 35,
    dueDate: "2026-03-15",
    skills: [
      { name: "Objection Handling", current: "Beginner", target: "Advanced" },
      { name: "Reframing", current: "Beginner", target: "Intermediate" },
      { name: "Active Listening", current: "Intermediate", target: "Advanced" },
    ],
    steps: [
      { id: "s1", type: "assessment", title: "Pre-Assessment: Objection Basics", description: "Test your current knowledge of objection handling.", order: 1, skippable: false, status: "completed", duration: "15 min", referenceId: "a1" },
      { id: "s2", type: "module", title: "Objection Handling Framework", description: "Learn the LAER framework for handling objections.", order: 2, skippable: true, skipCondition: "Pre-assessment score > 80%", status: "in_progress", duration: "25 min", referenceId: "m1" },
      { id: "s3", type: "module", title: "Advanced Reframing Techniques", description: "Deep dive into reframing customer concerns.", order: 3, skippable: true, skipCondition: "Pre-assessment score > 90%", status: "locked", duration: "20 min", referenceId: "m2" },
      { id: "s4", type: "role_play", title: "Practice: Price Objection Scenario", description: "Role play with AI customer who objects to pricing.", order: 4, skippable: false, status: "locked", duration: "15 min", referenceId: "rp1" },
      { id: "s5", type: "assessment", title: "Post-Assessment: Objection Mastery", description: "Validate your objection handling proficiency.", order: 5, skippable: false, status: "locked", duration: "20 min", referenceId: "a2" },
    ],
  },
  {
    id: "st2",
    title: "Product Knowledge: Enterprise Suite",
    description: "Deep understanding of the Enterprise Suite product line for effective consultative selling.",
    category: "Product Knowledge",
    assignedTo: ["u1", "u4"],
    progress: 0,
    dueDate: "2026-03-22",
    skills: [
      { name: "Product Knowledge", current: "Beginner", target: "Expert" },
      { name: "Competitive Positioning", current: "Beginner", target: "Advanced" },
      { name: "Consultative Selling", current: "Intermediate", target: "Expert" },
      { name: "Demo Skills", current: "Beginner", target: "Advanced" },
    ],
    steps: [
      { id: "s6", type: "assessment", title: "Pre-Assessment: Product Basics", description: "Baseline product knowledge check.", order: 1, skippable: false, status: "available", duration: "10 min", referenceId: "a3" },
      { id: "s7", type: "module", title: "Enterprise Suite Overview", description: "Core features and value propositions.", order: 2, skippable: true, status: "locked", duration: "30 min", referenceId: "m3" },
      { id: "s8", type: "module", title: "Competitive Positioning", description: "How Enterprise Suite compares to competitors.", order: 3, skippable: true, status: "locked", duration: "20 min", referenceId: "m4" },
      { id: "s9", type: "role_play", title: "Demo Walkthrough Simulation", description: "Practice giving a product demo to an AI prospect.", order: 4, skippable: false, status: "locked", duration: "20 min", referenceId: "rp2" },
      { id: "s10", type: "assessment", title: "Post-Assessment: Product Mastery", description: "Final product knowledge validation.", order: 5, skippable: false, status: "locked", duration: "15 min", referenceId: "a4" },
    ],
  },
  {
    id: "st3",
    title: "Empathetic Communication",
    description: "Develop empathy-driven communication skills for customer-facing interactions.",
    category: "Soft Skills",
    assignedTo: ["u1", "u2", "u3", "u4"],
    progress: 80,
    dueDate: "2026-03-10",
    skills: [
      { name: "Empathetic Communication", current: "Intermediate", target: "Expert" },
      { name: "Active Listening", current: "Intermediate", target: "Advanced" },
    ],
    steps: [
      { id: "s11", type: "assessment", title: "Pre-Assessment: Empathy Baseline", description: "Assess current empathetic communication level.", order: 1, skippable: false, status: "completed", duration: "10 min", referenceId: "a5" },
      { id: "s12", type: "module", title: "Active Listening Techniques", description: "Master active listening for customer conversations.", order: 2, skippable: false, status: "completed", duration: "20 min", referenceId: "m5" },
      { id: "s13", type: "role_play", title: "Frustrated Customer Scenario", description: "Handle an upset customer with empathy.", order: 3, skippable: false, status: "completed", duration: "15 min", referenceId: "rp3" },
      { id: "s14", type: "assessment", title: "Post-Assessment: Empathy Mastery", description: "Final empathy communication check.", order: 4, skippable: false, status: "in_progress", duration: "15 min", referenceId: "a6" },
    ],
  },
  {
    id: "st4",
    title: "Apple L1 Customer Support Readiness",
    description: "Complete onboarding path for new hires joining as Apple L1 Customer Support Executive.",
    category: "Apple Support Program",
    assignedTo: ["u6"],
    progress: 0,
    dueDate: "2026-04-15",
    skills: [
      { name: "Apple Product Knowledge", current: "Beginner", target: "Advanced" },
      { name: "Troubleshooting", current: "Beginner", target: "Advanced" },
      { name: "Customer Verification", current: "Beginner", target: "Intermediate" },
      { name: "Billing Support", current: "Beginner", target: "Intermediate" },
      { name: "Escalation Handling", current: "Beginner", target: "Intermediate" },
    ],
    steps: [
      { id: "s15", type: "assessment", title: "Pre-Assessment: Apple Support Fundamentals", description: "Baseline assessment covering Apple ID, iCloud, billing, and device basics.", order: 1, skippable: false, status: "available", duration: "15 min", referenceId: "a7" },
      { id: "s16", type: "module", title: "Apple Product Ecosystem Overview", description: "Overview of the Apple hardware and software ecosystem.", order: 2, skippable: true, skipCondition: "Pre-assessment score > 80%", status: "locked", duration: "25 min", referenceId: "m6" },
      { id: "s17", type: "module", title: "Apple ID and iCloud Fundamentals", description: "Deep dive into Apple ID management and iCloud services.", order: 3, skippable: true, skipCondition: "Pre-assessment score ≥ 90%", status: "locked", duration: "30 min", referenceId: "m7" },
      { id: "s18", type: "module", title: "iPhone and iPad Basics", description: "Core knowledge for supporting iPhone and iPad users.", order: 4, skippable: false, status: "locked", duration: "25 min", referenceId: "m8" },
      { id: "s19", type: "module", title: "Mac Basics for Support", description: "Essential Mac knowledge for L1 support agents.", order: 5, skippable: false, status: "locked", duration: "20 min", referenceId: "m9" },
      { id: "s20", type: "module", title: "Classroom: Live Device Handling Lab", description: "Offline / Classroom session — hands-on practice with Apple devices.", order: 6, skippable: false, status: "locked", duration: "60 min", referenceId: "m10" },
      { id: "s21", type: "module", title: "Apple Billing and Subscriptions", description: "Understanding Apple billing, subscriptions, and refund processes.", order: 7, skippable: false, status: "locked", duration: "20 min", referenceId: "m11" },
      { id: "s22", type: "module", title: "Warranty and Repair Processes", description: "Apple warranty policies, AppleCare+, and repair workflows.", order: 8, skippable: false, status: "locked", duration: "25 min", referenceId: "m12" },
      { id: "s23", type: "module", title: "Guided Troubleshooting Workflows", description: "Step-by-step troubleshooting guides for common Apple issues.", order: 9, skippable: false, status: "locked", duration: "30 min", referenceId: "m13" },
      { id: "s24", type: "module", title: "Apple Service and Support Options", description: "Overview of Apple support channels, service tiers, and options.", order: 10, skippable: false, status: "locked", duration: "20 min", referenceId: "m14" },
      { id: "s25", type: "module", title: "Customer Verification and Privacy", description: "Identity verification protocols and Apple privacy standards.", order: 11, skippable: false, status: "locked", duration: "20 min", referenceId: "m15" },
      { id: "s26", type: "module", title: "Escalation Procedures", description: "When and how to escalate issues to L2 or specialist teams.", order: 12, skippable: false, status: "locked", duration: "15 min", referenceId: "m16" },
      { id: "s27", type: "module", title: "Case Documentation Best Practices", description: "Writing clear, complete case notes for handoffs and audits.", order: 13, skippable: false, status: "locked", duration: "20 min", referenceId: "m17" },
      { id: "s28", type: "module", title: "Apple Ecosystem Navigation Deep Dive", description: "Advanced navigation across Apple tools, portals, and knowledge bases.", order: 14, skippable: false, status: "locked", duration: "25 min", referenceId: "m18" },
      { id: "s29", type: "module", title: "Live Readiness Review", description: "Final review session before live customer handling.", order: 15, skippable: false, status: "locked", duration: "20 min", referenceId: "m19" },
      { id: "s29b", type: "assessment", title: "Final Knowledge Check", description: "Comprehensive assessment covering all Apple L1 support topics before the live simulation.", order: 16, skippable: false, status: "locked", duration: "20 min", referenceId: "a8" },
      { id: "s30", type: "role_play", title: "Live Customer Call Simulation", description: "End-to-end simulated customer call covering Apple L1 support scenarios.", order: 17, skippable: false, status: "locked", duration: "25 min", referenceId: "rp13" },
    ],
  },
  {
    id: "st5",
    title: "Apple L1 Customer Support Readiness",
    description: "Complete onboarding path for new hires joining as Apple L1 Customer Support Executive. Pre-received HRIS signals have marked foundational modules as complete.",
    category: "Apple Support Program",
    assignedTo: ["u8"],
    progress: 13,
    dueDate: "2026-04-20",
    skills: [
      { name: "Apple Product Knowledge", current: "Beginner", target: "Advanced" },
      { name: "Troubleshooting", current: "Beginner", target: "Advanced" },
      { name: "Customer Verification", current: "Beginner", target: "Intermediate" },
      { name: "Billing Support", current: "Beginner", target: "Intermediate" },
      { name: "Escalation Handling", current: "Beginner", target: "Intermediate" },
    ],
    steps: [
      { id: "s31", type: "module", title: "Apple Product Ecosystem Overview", description: "Overview of the Apple hardware and software ecosystem.", order: 1, skippable: false, status: "completed", duration: "25 min", referenceId: "m6" },
      { id: "s32", type: "module", title: "Apple ID and iCloud Fundamentals", description: "Deep dive into Apple ID management and iCloud services.", order: 2, skippable: false, status: "completed", duration: "30 min", referenceId: "m7" },
      { id: "s33", type: "module", title: "iPhone and iPad Basics", description: "Core knowledge for supporting iPhone and iPad users.", order: 3, skippable: false, status: "available", duration: "25 min", referenceId: "m8" },
      { id: "s34", type: "module", title: "Mac Basics for Support", description: "Essential Mac knowledge for L1 support agents.", order: 4, skippable: false, status: "locked", duration: "20 min", referenceId: "m9" },
      { id: "s35", type: "module", title: "Classroom: Live Device Handling Lab", description: "Offline / Classroom session — hands-on practice with Apple devices.", order: 5, skippable: false, status: "locked", duration: "60 min", referenceId: "m10" },
      { id: "s36", type: "module", title: "Apple Billing and Subscriptions", description: "Understanding Apple billing, subscriptions, and refund processes.", order: 6, skippable: false, status: "locked", duration: "20 min", referenceId: "m11" },
      { id: "s37", type: "module", title: "Warranty and Repair Processes", description: "Apple warranty policies, AppleCare+, and repair workflows.", order: 7, skippable: false, status: "locked", duration: "25 min", referenceId: "m12" },
      { id: "s38", type: "module", title: "Guided Troubleshooting Workflows", description: "Step-by-step troubleshooting guides for common Apple issues.", order: 8, skippable: false, status: "locked", duration: "30 min", referenceId: "m13" },
      { id: "s39", type: "module", title: "Apple Service and Support Options", description: "Overview of Apple support channels, service tiers, and options.", order: 9, skippable: false, status: "locked", duration: "20 min", referenceId: "m14" },
      { id: "s40", type: "module", title: "Customer Verification and Privacy", description: "Identity verification protocols and Apple privacy standards.", order: 10, skippable: false, status: "locked", duration: "20 min", referenceId: "m15" },
      { id: "s41", type: "module", title: "Escalation Procedures", description: "When and how to escalate issues to L2 or specialist teams.", order: 11, skippable: false, status: "locked", duration: "15 min", referenceId: "m16" },
      { id: "s42", type: "module", title: "Case Documentation Best Practices", description: "Writing clear, complete case notes for handoffs and audits.", order: 12, skippable: false, status: "locked", duration: "20 min", referenceId: "m17" },
      { id: "s43", type: "module", title: "Apple Ecosystem Navigation Deep Dive", description: "Advanced navigation across Apple tools, portals, and knowledge bases.", order: 13, skippable: false, status: "locked", duration: "25 min", referenceId: "m18" },
      { id: "s44", type: "module", title: "Live Readiness Review", description: "Final review session before live customer handling.", order: 14, skippable: false, status: "locked", duration: "20 min", referenceId: "m19" },
      { id: "s44b", type: "assessment", title: "Final Knowledge Check", description: "Comprehensive assessment covering all Apple L1 support topics before the live simulation.", order: 15, skippable: false, status: "locked", duration: "20 min", referenceId: "a8" },
      { id: "s45", type: "role_play", title: "Live Customer Call Simulation", description: "End-to-end simulated customer call covering Apple L1 support scenarios.", order: 16, skippable: false, status: "locked", duration: "25 min", referenceId: "rp13" },
    ],
  },
  {
    id: "st6",
    title: "Apple L1 Customer Support Readiness",
    description: "Complete onboarding path for fresher candidates joining as Apple L1 Customer Support Executive. No assessments — all modules must be completed sequentially.",
    category: "Apple Support Program",
    assignedTo: ["u10"],
    progress: 0,
    dueDate: "2026-05-01",
    skills: [
      { name: "Apple Product Knowledge", current: "Beginner", target: "Advanced" },
      { name: "Troubleshooting", current: "Beginner", target: "Advanced" },
      { name: "Customer Verification", current: "Beginner", target: "Intermediate" },
      { name: "Billing Support", current: "Beginner", target: "Intermediate" },
      { name: "Escalation Handling", current: "Beginner", target: "Intermediate" },
    ],
    steps: [
      { id: "s46", type: "module", title: "Apple Product Ecosystem Overview", description: "Overview of the Apple hardware and software ecosystem.", order: 1, skippable: false, status: "available", duration: "25 min", referenceId: "m6" },
      { id: "s47", type: "module", title: "Apple ID and iCloud Fundamentals", description: "Deep dive into Apple ID management and iCloud services.", order: 2, skippable: false, status: "locked", duration: "30 min", referenceId: "m7" },
      { id: "s48", type: "module", title: "iPhone and iPad Basics", description: "Core knowledge for supporting iPhone and iPad users.", order: 3, skippable: false, status: "locked", duration: "25 min", referenceId: "m8" },
      { id: "s49", type: "module", title: "Mac Basics for Support", description: "Essential Mac knowledge for L1 support agents.", order: 4, skippable: false, status: "locked", duration: "20 min", referenceId: "m9" },
      { id: "s50", type: "module", title: "Classroom: Live Device Handling Lab", description: "Offline / Classroom session — hands-on practice with Apple devices.", order: 5, skippable: false, status: "locked", duration: "60 min", referenceId: "m10" },
      { id: "s51", type: "module", title: "Apple Billing and Subscriptions", description: "Understanding Apple billing, subscriptions, and refund processes.", order: 6, skippable: false, status: "locked", duration: "20 min", referenceId: "m11" },
      { id: "s52", type: "module", title: "Warranty and Repair Processes", description: "Apple warranty policies, AppleCare+, and repair workflows.", order: 7, skippable: false, status: "locked", duration: "25 min", referenceId: "m12" },
      { id: "s53", type: "module", title: "Guided Troubleshooting Workflows", description: "Step-by-step troubleshooting guides for common Apple issues.", order: 8, skippable: false, status: "locked", duration: "30 min", referenceId: "m13" },
      { id: "s54", type: "module", title: "Apple Service and Support Options", description: "Overview of Apple support channels, service tiers, and options.", order: 9, skippable: false, status: "locked", duration: "20 min", referenceId: "m14" },
      { id: "s55", type: "module", title: "Customer Verification and Privacy", description: "Identity verification protocols and Apple privacy standards.", order: 10, skippable: false, status: "locked", duration: "20 min", referenceId: "m15" },
      { id: "s56", type: "module", title: "Escalation Procedures", description: "When and how to escalate issues to L2 or specialist teams.", order: 11, skippable: false, status: "locked", duration: "15 min", referenceId: "m16" },
      { id: "s57", type: "module", title: "Case Documentation Best Practices", description: "Writing clear, complete case notes for handoffs and audits.", order: 12, skippable: false, status: "locked", duration: "20 min", referenceId: "m17" },
      { id: "s58", type: "module", title: "Apple Ecosystem Navigation Deep Dive", description: "Advanced navigation across Apple tools, portals, and knowledge bases.", order: 13, skippable: false, status: "locked", duration: "25 min", referenceId: "m18" },
      { id: "s59", type: "module", title: "Live Readiness Review", description: "Final review session before live customer handling.", order: 14, skippable: false, status: "locked", duration: "20 min", referenceId: "m19" },
      { id: "s60", type: "role_play", title: "Live Customer Call Simulation", description: "End-to-end simulated customer call covering Apple L1 support scenarios.", order: 15, skippable: false, status: "locked", duration: "25 min", referenceId: "rp13" },
    ],
  },
];
/* ─── Role Plays ─── */
export const mockRolePlayBank: RolePlay[] = [
  { id: "rp1", title: "Price Objection – SMB Customer", scenario: "A budget-conscious small business owner is evaluating your product alongside two competitors. They like the features but push back hard on pricing, asking for a 30% discount.", difficulty: "intermediate", isPrivate: false, tags: ["pricing", "objections", "SMB"], aiCloneConfig: { persona: "Budget-conscious small business owner", context: "Evaluating 3 competitors, price-sensitive, team of 12" } },
  { id: "rp2", title: "Enterprise Demo Walkthrough", scenario: "A VP of Operations at a Fortune 500 company wants a focused demo of your reporting and compliance features. They have strict requirements and limited time.", difficulty: "advanced", isPrivate: false, tags: ["demo", "enterprise", "product"], aiCloneConfig: { persona: "VP of Operations at Fortune 500", context: "Needs compliance reporting, has strict requirements, 30-minute window" } },
  { id: "rp3", title: "Frustrated Customer – Service Outage", scenario: "A customer calls furious about a 4-hour service outage that caused their team to miss a critical deadline. They're considering cancellation.", difficulty: "intermediate", isPrivate: false, tags: ["support", "empathy", "crisis"], aiCloneConfig: { persona: "Angry operations manager", context: "Lost revenue due to outage, considering cancellation, has been a customer for 2 years" } },
  { id: "rp4", title: "Upsell Conversation", scenario: "An existing customer on the basic plan is showing growth signals — their team doubled and they're using 90% of plan limits. Time to discuss upgrading.", difficulty: "beginner", isPrivate: false, tags: ["upsell", "growth", "retention"], aiCloneConfig: { persona: "Happy customer, growing team", context: "Using 90% of plan limits, team doubled in size, very satisfied with product" } },
  { id: "rp5", title: "Contract Renewal Negotiation", scenario: "A procurement manager has internal pressure to cut costs by 15%. Your contract is up for renewal and they want a significant discount or they'll evaluate alternatives.", difficulty: "advanced", isPrivate: false, tags: ["renewal", "negotiation", "pricing"], aiCloneConfig: { persona: "Procurement manager", context: "Internal pressure to cut costs by 15%, 3-year customer, high usage" } },
  { id: "rp6", title: "Cold Call – New Prospect", scenario: "You're cold-calling a marketing director who has never heard of your product. You have 60 seconds to earn their interest.", difficulty: "beginner", isPrivate: false, tags: ["cold-call", "prospecting", "opening"], aiCloneConfig: { persona: "Busy marketing director", context: "No prior awareness, gets 10 cold calls a day, skeptical but open-minded" } },
  { id: "rp7", title: "Billing Dispute — Overcharged Customer", scenario: "A customer notices an unexpected charge on their Apple account and calls in demanding an immediate refund. They are frustrated and mention switching to Android.", difficulty: "intermediate", isPrivate: false, tags: ["support", "billing", "empathy", "apple"], aiCloneConfig: { persona: "Frustrated Apple customer", context: "Overcharged $49.99, loyal customer for 5 years, considering switching platforms" } },
  { id: "rp8", title: "Device Setup — First-Time iPhone User", scenario: "An elderly customer just purchased their first iPhone and needs help setting up iCloud, contacts, and basic navigation. They are patient but easily overwhelmed.", difficulty: "beginner", isPrivate: false, tags: ["support", "device", "apple", "onboarding"], aiCloneConfig: { persona: "First-time iPhone owner, age 68", context: "Switched from a flip phone, needs help with basics, patient but confused" } },
  { id: "rp9", title: "Account Recovery — Locked Apple ID", scenario: "A customer is locked out of their Apple ID after multiple failed password attempts. They need access urgently for a work presentation stored in iCloud.", difficulty: "intermediate", isPrivate: false, tags: ["support", "account", "apple", "urgent"], aiCloneConfig: { persona: "Panicked professional", context: "Locked out of Apple ID, critical presentation in iCloud, meeting in 2 hours" } },
  { id: "rp10", title: "Service Outage — iCloud Sync Issues", scenario: "A customer reports that their iCloud photos and documents haven't synced for 3 days across their devices. They rely on iCloud for their small business.", difficulty: "intermediate", isPrivate: false, tags: ["support", "apple", "empathy", "technical"], aiCloneConfig: { persona: "Small business owner", context: "iCloud sync broken for 3 days, uses it for business documents, losing productivity" } },
  { id: "rp11", title: "Warranty Claim — Cracked Screen", scenario: "A customer's iPhone screen cracked after a minor drop. They believe it should be covered under warranty. The device is 10 months old but has no AppleCare+.", difficulty: "advanced", isPrivate: false, tags: ["support", "apple", "warranty", "escalation"], aiCloneConfig: { persona: "Upset iPhone owner", context: "Cracked screen, no AppleCare+, device 10 months old, expects free repair" } },
  { id: "rp12", title: "Subscription Cancellation — Apple One", scenario: "A customer wants to cancel their Apple One family plan. They feel it's too expensive and only use Apple Music. They need guidance on what they'll lose and alternatives.", difficulty: "beginner", isPrivate: false, tags: ["support", "billing", "apple", "retention"], aiCloneConfig: { persona: "Cost-conscious family plan subscriber", context: "Paying $32.95/mo for Apple One Family, only uses Music, wants to downgrade" } },
  { id: "rp13", title: "Live Customer Call Simulation — Apple L1", scenario: "A customer calls with a complex issue involving Apple ID recovery, iCloud sync problems, and a billing dispute. Handle the full interaction end-to-end following Apple support protocols.", difficulty: "advanced", isPrivate: false, tags: ["support", "apple", "live-sim", "L1"], aiCloneConfig: { persona: "Frustrated Apple customer with multiple issues", context: "Apple ID locked, iCloud not syncing, unexpected charge on account, wants all resolved in one call" } },
];

/* ─── People Graph Signals ─── */
export const mockPeopleGraphSignals: PeopleGraphSignal[] = [
  { id: "sig1", userId: "u1", skillTargetId: "st1", stepId: "s1", signalType: "assessment_score", value: 72, timestamp: "2026-02-20T10:30:00Z", excludeFromGraph: false },
  { id: "sig2", userId: "u1", skillTargetId: "st3", stepId: "s11", signalType: "assessment_score", value: 65, timestamp: "2026-02-18T09:15:00Z", excludeFromGraph: false },
  { id: "sig3", userId: "u1", skillTargetId: "st3", stepId: "s12", signalType: "module_completion", value: 100, timestamp: "2026-02-19T14:00:00Z", excludeFromGraph: false },
  { id: "sig4", userId: "u1", skillTargetId: "st3", stepId: "s13", signalType: "role_play_rating", value: 85, timestamp: "2026-02-21T11:45:00Z", excludeFromGraph: false },
  { id: "sig5", userId: "u2", skillTargetId: "st1", stepId: "s1", signalType: "assessment_score", value: 88, timestamp: "2026-02-19T08:30:00Z", excludeFromGraph: false },
  { id: "sig6", userId: "u2", skillTargetId: "st3", stepId: "s11", signalType: "assessment_score", value: 78, timestamp: "2026-02-17T10:00:00Z", excludeFromGraph: false },
  { id: "sig7", userId: "u3", skillTargetId: "st1", stepId: "s1", signalType: "assessment_score", value: 55, timestamp: "2026-02-20T14:00:00Z", excludeFromGraph: false },
  { id: "sig8", userId: "u3", skillTargetId: "st3", stepId: "s11", signalType: "assessment_score", value: 92, timestamp: "2026-02-18T16:30:00Z", excludeFromGraph: false },
  { id: "sig9", userId: "u4", skillTargetId: "st2", stepId: "s6", signalType: "assessment_score", value: 60, timestamp: "2026-02-22T09:00:00Z", excludeFromGraph: false },
  { id: "sig10", userId: "u1", skillTargetId: "st3", stepId: "s13", signalType: "role_play_rating", value: 90, timestamp: "2026-02-22T15:00:00Z", excludeFromGraph: true },
];

/* ─── Manager assignments mock ─── */
export interface TeamMemberProgress {
  user: User;
  skillTargetId: string;
  progress: number;
  lastActivity: string;
  status: "on_track" | "at_risk" | "completed";
}

export const mockTeamProgress: TeamMemberProgress[] = [
  { user: mockTeamMembers[1], skillTargetId: "st1", progress: 60, lastActivity: "2026-02-25T10:00:00Z", status: "on_track" },
  { user: mockTeamMembers[2], skillTargetId: "st1", progress: 20, lastActivity: "2026-02-20T14:00:00Z", status: "at_risk" },
  { user: mockTeamMembers[1], skillTargetId: "st3", progress: 100, lastActivity: "2026-02-24T16:00:00Z", status: "completed" },
  { user: mockTeamMembers[2], skillTargetId: "st3", progress: 75, lastActivity: "2026-02-23T09:00:00Z", status: "on_track" },
  { user: mockTeamMembers[3], skillTargetId: "st2", progress: 20, lastActivity: "2026-02-22T09:00:00Z", status: "at_risk" },
  { user: mockTeamMembers[3], skillTargetId: "st3", progress: 50, lastActivity: "2026-02-24T11:00:00Z", status: "on_track" },
];

/* ─── Per-User Profile Data ─── */
export interface ProfileData {
  title: string;
  location: string;
  manager: string;
  yearsExperience: number;
  summary: string;
  status?: string;
  department?: string;
  program?: string;
  team?: string;
  roleSnapshotText: string;
  projectSnapshotText: string;
  roleSkillsCurrent: SkillEntry[];
  roleSkillsRequired: SkillRequirement[];
  projectSkillsCurrent: SkillEntry[];
  projectSkillsRequired: SkillRequirement[];
  otherSkills: SkillEntry[];
}

export const profileDataByUser: Record<string, ProfileData> = {
  u1: {
    title: "Senior Director, Product Management",
    location: "San Francisco, CA",
    manager: "Hitesh Dholakia",
    yearsExperience: 14,
    summary:
      "Developer turned product and sales leader with 12+ years of experience building, and commercializing SaaS platforms. Co-founded and grew a bootstrapped B2B SaaS startup that managed client workflows exceeding $200M. Closed multi-year contracts with leading e-commerce and BFSI enterprises, including Flipkart, Tata, AngelOne and ICICI.",
    roleSnapshotText: "Own the product vision and end-to-end execution of the WFAI Onboarding use case. Translate complex enterprise workforce challenges into scalable, AI-driven solutions.",
    projectSnapshotText: "Currently assigned to the WFAI Onboarding project, focusing on building dynamic People Graph across skills, performance, and training data to enable real-time deployment decisions.",
    roleSkillsCurrent: [
      { skill_name: "Product Strategy", proficiency: "Expert", assessment_year: 2026 },
      { skill_name: "Stakeholder Management", proficiency: "Expert", assessment_year: 2026 },
      { skill_name: "Product Ops & Scaling", proficiency: "Advanced", assessment_year: 2026 },
      { skill_name: "Prioritization Rigor", proficiency: "Advanced", assessment_year: 2026 },
    ],
    roleSkillsRequired: [
      { skill_name: "Product Strategy", proficiency: "Expert" },
      { skill_name: "Stakeholder Management", proficiency: "Expert" },
      { skill_name: "Product Ops & Scaling", proficiency: "Expert" },
      { skill_name: "Prioritization Rigor", proficiency: "Expert" },
    ],
    projectSkillsCurrent: [
      { skill_name: "Lovable AI", proficiency: "Intermediate", assessment_year: 2026 },
      { skill_name: "FigJam", proficiency: "Beginner", assessment_year: 2026 },
      { skill_name: "Figma Wireframing", proficiency: "Intermediate", assessment_year: 2026 },
      { skill_name: "Figma Make", proficiency: "Beginner", assessment_year: 2026 },
    ],
    projectSkillsRequired: [
      { skill_name: "Lovable AI", proficiency: "Advanced" },
      { skill_name: "FigJam", proficiency: "Intermediate" },
      { skill_name: "Figma Wireframing", proficiency: "Advanced" },
      { skill_name: "Figma Make", proficiency: "Intermediate" },
    ],
    otherSkills: [
      { skill_name: "Python", proficiency: "Intermediate", assessment_year: 2024 },
      { skill_name: "SQL", proficiency: "Intermediate", assessment_year: 2025 },
      { skill_name: "OpenKnime - Analytics", proficiency: "Advanced", assessment_year: 2025 },
      { skill_name: "A/B testing", proficiency: "Intermediate", assessment_year: 2025 },
      { skill_name: "data visualization", proficiency: "Advanced", assessment_year: 2025 },
      { skill_name: "stakeholder communication", proficiency: "Expert", assessment_year: 2026 },
      { skill_name: "customer journey mapping", proficiency: "Intermediate", assessment_year: 2025 },
      { skill_name: "change management", proficiency: "Advanced", assessment_year: 2024 },
    ],
  },
  u6: {
    title: "Apple L1 Customer Support Executive",
    location: "Austin, Texas, USA",
    manager: "Marcus Wellington",
    yearsExperience: 3,
    status: "New Hire",
    department: "Customer Support",
    program: "Apple Support Program",
    team: "Apple L1 Customer Care",
    summary:
      "Customer support professional with 3 years of experience across general customer support and technical support environments. Strong in communication, empathy, issue clarification, and documentation. Recently joined the Apple Support Program as an L1 Customer Support Executive. Shows strong customer-facing fundamentals, but needs deeper Apple product, Apple ID, iCloud, and Apple ecosystem troubleshooting knowledge to become fully ready for live customer handling.",
    roleSnapshotText: "As a Customer Support Executive L1, you handle first-line customer queries across account access, product or service basics, troubleshooting, billing questions, and guided support.",
    projectSnapshotText: "You're currently assigned to the Apple Support Program, supporting customers who reach out with queries related to account access, Apple ID, iCloud, product basics, device troubleshooting, billing, subscriptions, warranty, and service options.",
    roleSkillsCurrent: [
      { skill_name: "Customer Communication", proficiency: "Advanced", assessment_year: 2026 },
      { skill_name: "Empathy and De-escalation", proficiency: "Advanced", assessment_year: 2026 },
      { skill_name: "Issue Probing and Clarification", proficiency: "Advanced", assessment_year: 2026 },
      { skill_name: "Case Documentation", proficiency: "Advanced", assessment_year: 2026 },
      { skill_name: "Knowledge Base Navigation", proficiency: "Intermediate", assessment_year: 2026 },
      { skill_name: "Customer Verification and Privacy Basics", proficiency: "Intermediate", assessment_year: 2026 },
      { skill_name: "Guided Troubleshooting", proficiency: "Intermediate", assessment_year: 2026 },
      { skill_name: "Escalation Handling", proficiency: "Intermediate", assessment_year: 2026 },
    ],
    roleSkillsRequired: [
      { skill_name: "Customer Communication", proficiency: "Advanced" },
      { skill_name: "Empathy and De-escalation", proficiency: "Advanced" },
      { skill_name: "Issue Probing and Clarification", proficiency: "Advanced" },
      { skill_name: "Case Documentation", proficiency: "Advanced" },
      { skill_name: "Knowledge Base Navigation", proficiency: "Intermediate" },
      { skill_name: "Customer Verification and Privacy Basics", proficiency: "Intermediate" },
      { skill_name: "Guided Troubleshooting", proficiency: "Intermediate" },
      { skill_name: "Escalation Handling", proficiency: "Intermediate" },
    ],
    projectSkillsCurrent: [
      { skill_name: "Apple Product Basics", proficiency: "Beginner", assessment_year: 2026 },
      { skill_name: "Apple ID and iCloud Support", proficiency: "Beginner", assessment_year: 2026 },
      { skill_name: "iPhone and iPad Troubleshooting", proficiency: "Beginner", assessment_year: 2026 },
      { skill_name: "Mac Basics", proficiency: "Beginner", assessment_year: 2026 },
      { skill_name: "Warranty and Repair Process Understanding", proficiency: "Beginner", assessment_year: 2026 },
      { skill_name: "Apple Ecosystem Navigation", proficiency: "Beginner", assessment_year: 2026 },
      { skill_name: "Apple Service and Support Options", proficiency: "Beginner", assessment_year: 2026 },
      { skill_name: "Apple Billing and Subscription Support", proficiency: "Intermediate", assessment_year: 2026 },
    ],
    projectSkillsRequired: [
      { skill_name: "Apple Product Basics", proficiency: "Advanced" },
      { skill_name: "Apple ID and iCloud Support", proficiency: "Advanced" },
      { skill_name: "iPhone and iPad Troubleshooting", proficiency: "Intermediate" },
      { skill_name: "Mac Basics", proficiency: "Intermediate" },
      { skill_name: "Warranty and Repair Process Understanding", proficiency: "Intermediate" },
      { skill_name: "Apple Ecosystem Navigation", proficiency: "Intermediate" },
      { skill_name: "Apple Service and Support Options", proficiency: "Intermediate" },
      { skill_name: "Apple Billing and Subscription Support", proficiency: "Intermediate" },
    ],
    otherSkills: [
      { skill_name: "Salesforce", proficiency: "Intermediate", assessment_year: 2025 },
      { skill_name: "Zendesk", proficiency: "Advanced", assessment_year: 2025 },
      { skill_name: "Apple GSX", proficiency: "Intermediate", assessment_year: 2026 },
      { skill_name: "remote troubleshooting", proficiency: "Intermediate", assessment_year: 2025 },
      { skill_name: "service level agreement management", proficiency: "Advanced", assessment_year: 2025 },
      { skill_name: "customer satisfaction", proficiency: "Advanced", assessment_year: 2025 },
      { skill_name: "subscription management", proficiency: "Intermediate", assessment_year: 2025 },
      { skill_name: "device setup support", proficiency: "Intermediate", assessment_year: 2025 },
      { skill_name: "knowledge base management", proficiency: "Intermediate", assessment_year: 2025 },
      { skill_name: "multichannel support", proficiency: "Intermediate", assessment_year: 2025 },
      { skill_name: "empathy", proficiency: "Advanced", assessment_year: 2026 },
      { skill_name: "conflict resolution", proficiency: "Intermediate", assessment_year: 2025 },
      { skill_name: "first call resolution", proficiency: "Intermediate", assessment_year: 2025 },
      { skill_name: "chat support", proficiency: "Advanced", assessment_year: 2025 },
    ],
  },
  u8: {
    title: "Apple L1 Customer Support Executive",
    location: "Bangalore, India",
    manager: "Marcus Wellington",
    yearsExperience: 2,
    status: "New Hire",
    department: "Customer Support",
    program: "Apple Support Program",
    team: "Apple L1 Customer Care",
    summary:
      "Customer support professional with 2 years of experience in general customer support and guided troubleshooting. Recently joined the Apple Support Program as an L1 Customer Support Executive. HRIS records indicate prior exposure to Apple Product Ecosystem and Apple ID/iCloud fundamentals from a previous employer, allowing those modules to be pre-credited.",
    roleSnapshotText: "As a Customer Support Executive L1, you handle first-line customer queries across account access, product or service basics, troubleshooting, billing questions, and guided support.",
    projectSnapshotText: "You're currently assigned to the Apple Support Program. Your foundational Apple product and iCloud modules have been pre-credited from HRIS data, so your path starts at iPhone and iPad Basics.",
    roleSkillsCurrent: [
      { skill_name: "Customer Communication", proficiency: "Intermediate", assessment_year: 2026 },
      { skill_name: "Empathy and De-escalation", proficiency: "Intermediate", assessment_year: 2026 },
      { skill_name: "Issue Probing and Clarification", proficiency: "Intermediate", assessment_year: 2026 },
      { skill_name: "Case Documentation", proficiency: "Beginner", assessment_year: 2026 },
      { skill_name: "Knowledge Base Navigation", proficiency: "Beginner", assessment_year: 2026 },
      { skill_name: "Guided Troubleshooting", proficiency: "Intermediate", assessment_year: 2026 },
      { skill_name: "Escalation Handling", proficiency: "Beginner", assessment_year: 2026 },
    ],
    roleSkillsRequired: [
      { skill_name: "Customer Communication", proficiency: "Advanced" },
      { skill_name: "Empathy and De-escalation", proficiency: "Advanced" },
      { skill_name: "Issue Probing and Clarification", proficiency: "Advanced" },
      { skill_name: "Case Documentation", proficiency: "Advanced" },
      { skill_name: "Knowledge Base Navigation", proficiency: "Intermediate" },
      { skill_name: "Guided Troubleshooting", proficiency: "Intermediate" },
      { skill_name: "Escalation Handling", proficiency: "Intermediate" },
    ],
    projectSkillsCurrent: [
      { skill_name: "Apple Product Basics", proficiency: "Intermediate", assessment_year: 2026 },
      { skill_name: "Apple ID and iCloud Support", proficiency: "Intermediate", assessment_year: 2026 },
      { skill_name: "iPhone and iPad Troubleshooting", proficiency: "Beginner", assessment_year: 2026 },
      { skill_name: "Mac Basics", proficiency: "Beginner", assessment_year: 2026 },
      { skill_name: "Warranty and Repair Process Understanding", proficiency: "Beginner", assessment_year: 2026 },
      { skill_name: "Apple Ecosystem Navigation", proficiency: "Beginner", assessment_year: 2026 },
      { skill_name: "Apple Service and Support Options", proficiency: "Beginner", assessment_year: 2026 },
      { skill_name: "Apple Billing and Subscription Support", proficiency: "Beginner", assessment_year: 2026 },
    ],
    projectSkillsRequired: [
      { skill_name: "Apple Product Basics", proficiency: "Advanced" },
      { skill_name: "Apple ID and iCloud Support", proficiency: "Advanced" },
      { skill_name: "iPhone and iPad Troubleshooting", proficiency: "Intermediate" },
      { skill_name: "Mac Basics", proficiency: "Intermediate" },
      { skill_name: "Warranty and Repair Process Understanding", proficiency: "Intermediate" },
      { skill_name: "Apple Ecosystem Navigation", proficiency: "Intermediate" },
      { skill_name: "Apple Service and Support Options", proficiency: "Intermediate" },
      { skill_name: "Apple Billing and Subscription Support", proficiency: "Intermediate" },
    ],
    otherSkills: [
      { skill_name: "Freshdesk", proficiency: "Advanced", assessment_year: 2025 },
      { skill_name: "remote troubleshooting", proficiency: "Intermediate", assessment_year: 2025 },
      { skill_name: "device setup support", proficiency: "Intermediate", assessment_year: 2025 },
      { skill_name: "phone support", proficiency: "Intermediate", assessment_year: 2025 },
      { skill_name: "ticket triage", proficiency: "Beginner", assessment_year: 2025 },
      { skill_name: "customer onboarding", proficiency: "Beginner", assessment_year: 2025 },
      { skill_name: "email communication", proficiency: "Intermediate", assessment_year: 2025 },
      { skill_name: "troubleshooting", proficiency: "Intermediate", assessment_year: 2025 },
      { skill_name: "CRM software", proficiency: "Intermediate", assessment_year: 2025 },
    ],
  },
  u7: {
    title: "Regional Training Manager",
    location: "Chicago, IL",
    manager: "VP of Learning & Development",
    yearsExperience: 8,
    summary:
      "Experienced training manager with 8+ years leading onboarding programs and upskilling initiatives across distributed teams. Skilled in instructional design, performance analytics, and stakeholder alignment. Currently overseeing the Apple L1 Customer Support onboarding program rollout.",
    roleSnapshotText: "Lead the design, delivery, and optimization of training programs across regional teams. Ensure consistent quality and measurable learning outcomes.",
    projectSnapshotText: "Currently managing the Apple L1 Customer Support onboarding program, overseeing training assignments, learner progress, and program effectiveness metrics.",
    roleSkillsCurrent: [
      { skill_name: "People Management", proficiency: "Advanced", assessment_year: 2026 },
      { skill_name: "Training Design", proficiency: "Intermediate", assessment_year: 2026 },
      { skill_name: "Performance Analytics", proficiency: "Intermediate", assessment_year: 2026 },
      { skill_name: "Stakeholder Communication", proficiency: "Advanced", assessment_year: 2025 },
    ],
    roleSkillsRequired: [
      { skill_name: "People Management", proficiency: "Expert" },
      { skill_name: "Training Design", proficiency: "Advanced" },
      { skill_name: "Performance Analytics", proficiency: "Advanced" },
      { skill_name: "Stakeholder Communication", proficiency: "Expert" },
    ],
    projectSkillsCurrent: [
      { skill_name: "LMS Administration", proficiency: "Intermediate", assessment_year: 2026 },
      { skill_name: "Content Curation", proficiency: "Beginner", assessment_year: 2026 },
      { skill_name: "Data-Driven Coaching", proficiency: "Beginner", assessment_year: 2026 },
      { skill_name: "Program Impact Measurement", proficiency: "Beginner", assessment_year: 2026 },
    ],
    projectSkillsRequired: [
      { skill_name: "LMS Administration", proficiency: "Advanced" },
      { skill_name: "Content Curation", proficiency: "Intermediate" },
      { skill_name: "Data-Driven Coaching", proficiency: "Advanced" },
      { skill_name: "Program Impact Measurement", proficiency: "Advanced" },
    ],
    otherSkills: [
      { skill_name: "public speaking", proficiency: "Advanced", assessment_year: 2025 },
      { skill_name: "facilitation", proficiency: "Expert", assessment_year: 2025 },
      { skill_name: "change management", proficiency: "Intermediate", assessment_year: 2024 },
      { skill_name: "coaching", proficiency: "Advanced", assessment_year: 2025 },
      { skill_name: "training delivery", proficiency: "Expert", assessment_year: 2025 },
      { skill_name: "training design", proficiency: "Advanced", assessment_year: 2025 },
      { skill_name: "workforce management", proficiency: "Intermediate", assessment_year: 2024 },
      { skill_name: "performance analytics", proficiency: "Intermediate", assessment_year: 2025 },
      { skill_name: "quality management", proficiency: "Advanced", assessment_year: 2025 },
      { skill_name: "onboarding design", proficiency: "Advanced", assessment_year: 2025 },
      { skill_name: "mentoring", proficiency: "Expert", assessment_year: 2025 },
      { skill_name: "customer experience strategy", proficiency: "Intermediate", assessment_year: 2024 },
    ],
  },
};

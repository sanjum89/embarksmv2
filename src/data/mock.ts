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

/* ─── Users ─── */
export const currentUser: User = {
  id: "u1",
  name: "Alex Rivera",
  email: "alex@wfai.com",
  role: "learner",
  avatarUrl: "",
};

export const mayaThompson: User = {
  id: "u6",
  name: "Maya Thompson",
  email: "maya@wfai.com",
  role: "learner",
  avatarUrl: "",
};

export const availableUsers: User[] = [currentUser, samTaylor];

export const mockTeamMembers: User[] = [
  currentUser,
  { id: "u2", name: "Jordan Chen", email: "jordan@wfai.com", role: "learner" },
  { id: "u3", name: "Priya Sharma", email: "priya@wfai.com", role: "learner" },
  { id: "u4", name: "Marcus Williams", email: "marcus@wfai.com", role: "learner" },
  { id: "u5", name: "Sofia Martinez", email: "sofia@wfai.com", role: "manager" },
  samTaylor,
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
];

/* ─── Learning Modules ─── */
export const mockLearningModules: LearningModule[] = [
  { id: "m1", title: "Objection Handling Framework", contentType: "video", contentUrl: "https://example.com/laer-framework", duration: "25 min", transcript: "In this module, we'll cover the LAER framework — Listen, Acknowledge, Explore, Respond. This proven methodology helps sales professionals navigate even the toughest customer objections with confidence and empathy.\n\nStep 1: Listen — Give the customer your full attention. Don't interrupt. Let them express their complete concern.\n\nStep 2: Acknowledge — Show that you've heard and understood their concern. Use phrases like 'I understand why that's important to you.'\n\nStep 3: Explore — Ask open-ended questions to dig deeper. Often the stated objection isn't the real concern.\n\nStep 4: Respond — Once you truly understand the objection, address it directly with relevant value propositions." },
  { id: "m2", title: "Advanced Reframing Techniques", contentType: "document", contentUrl: "https://example.com/reframing-guide.pdf", duration: "20 min", transcript: "Reframing is the art of helping customers see their situation from a different perspective. This guide covers five advanced reframing techniques used by top-performing sales professionals." },
  { id: "m3", title: "Enterprise Suite Overview", contentType: "video", contentUrl: "https://example.com/enterprise-overview", duration: "30 min", transcript: "Welcome to the Enterprise Suite product overview. In this training, you'll learn about our core platform capabilities, key differentiators, and the value propositions that resonate with enterprise buyers." },
  { id: "m4", title: "Competitive Positioning", contentType: "document", contentUrl: "https://example.com/competitive-positioning.pdf", duration: "20 min" },
  { id: "m5", title: "Active Listening Techniques", contentType: "video", contentUrl: "https://example.com/active-listening", duration: "20 min", transcript: "Active listening is more than just hearing words — it's about fully engaging with the speaker. This module covers techniques including mirroring, paraphrasing, and emotional labeling." },
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
    steps: [
      { id: "s11", type: "assessment", title: "Pre-Assessment: Empathy Baseline", description: "Assess current empathetic communication level.", order: 1, skippable: false, status: "completed", duration: "10 min", referenceId: "a5" },
      { id: "s12", type: "module", title: "Active Listening Techniques", description: "Master active listening for customer conversations.", order: 2, skippable: false, status: "completed", duration: "20 min", referenceId: "m5" },
      { id: "s13", type: "role_play", title: "Frustrated Customer Scenario", description: "Handle an upset customer with empathy.", order: 3, skippable: false, status: "completed", duration: "15 min", referenceId: "rp3" },
      { id: "s14", type: "assessment", title: "Post-Assessment: Empathy Mastery", description: "Final empathy communication check.", order: 4, skippable: false, status: "in_progress", duration: "15 min", referenceId: "a6" },
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
  coreSkills: string[];
  otherSkills: { name: string; level: string; year: string }[];
  roleSnapshotText: string;
  projectSnapshotText: string;
  radarSkills: { skill: string; score: number; target: number }[];
  skillGapRows: {
    left: { skill: string; level: string; target: string; hasSkill: boolean };
    right: { skill: string; level: string; target: string | null; hasSkill: boolean };
  }[];
}

export const profileDataByUser: Record<string, ProfileData> = {
  u1: {
    title: "Senior Director, Product Management",
    location: "San Francisco, CA",
    manager: "Hitesh Dholakia",
    yearsExperience: 14,
    summary:
      "Developer turned product and sales leader with 12+ years of experience building, and commercializing SaaS platforms. Co-founded and grew a bootstrapped B2B SaaS startup that managed client workflows exceeding $200M. Closed multi-year contracts with leading e-commerce and BFSI enterprises, including Flipkart, Tata, AngelOne and ICICI.",
    coreSkills: [
      "Product Strategy",
      "Stakeholder Management",
      "Product Ops & Scaling",
      "Prioritization Rigor",
      "Lovable AI",
      "FigJam",
      "Figma Wireframing",
      "Figma Make",
    ],
    otherSkills: [
      { name: "Python", level: "I", year: "'24" },
      { name: "SQL", level: "I", year: "'25" },
      { name: "OpenKnime - Analytics", level: "A", year: "'25" },
    ],
    roleSnapshotText: "Own the product vision and end-to-end execution of the WFAI Onboarding use case. Translate complex enterprise workforce challenges into scalable, AI-driven solutions.",
    projectSnapshotText: "Currently assigned to the WFAI Onboarding project, focusing on building dynamic People Graph across skills, performance, and training data to enable real-time deployment decisions.",
    radarSkills: [
      { skill: "Product Strategy", score: 80, target: 80 },
      { skill: "Stakeholder Mgmt", score: 80, target: 80 },
      { skill: "Product Ops", score: 60, target: 80 },
      { skill: "Prioritization", score: 60, target: 80 },
      { skill: "Figma Wireframing", score: 40, target: 60 },
      { skill: "Figma Make", score: 20, target: 40 },
      { skill: "FigJam", score: 20, target: 40 },
      { skill: "Lovable AI", score: 40, target: 60 },
    ],
    skillGapRows: [
      { left: { skill: "Product Stra…", level: "E", target: "✓", hasSkill: true },  right: { skill: "Figma Wiref…", level: "I", target: "A", hasSkill: true } },
      { left: { skill: "Stakeholder…", level: "E", target: "✓", hasSkill: true },   right: { skill: "Figma Make", level: "B", target: null, hasSkill: false } },
      { left: { skill: "Product Ops…", level: "A", target: "E", hasSkill: true },   right: { skill: "FigJam", level: "B", target: null, hasSkill: false } },
      { left: { skill: "Prioritization…", level: "A", target: "E", hasSkill: true }, right: { skill: "Lovable AI", level: "I", target: null, hasSkill: false } },
    ],
  },
  u6: {
    title: "L1 Customer Support Executive",
    location: "Austin, TX",
    manager: "Rachel Kim",
    yearsExperience: 2,
    summary:
      "Customer-focused support specialist with 2 years of experience in L1 technical and billing support for consumer electronics. Currently assigned to the Apple Customer Support Project handling iPhone, iCloud, and Apple One inquiries. Known for high first-call resolution rates and strong empathy scores.",
    coreSkills: [
      "Customer Communication",
      "Apple Product Knowledge",
      "Issue Triage",
      "CRM Tools",
    ],
    otherSkills: [
      { name: "Zendesk", level: "A", year: "'25" },
      { name: "Salesforce", level: "I", year: "'25" },
      { name: "Apple GSX", level: "I", year: "'26" },
    ],
    roleSnapshotText: "Provide first-level technical and billing support for Apple products. Resolve customer issues within SLA, escalate complex cases to L2, and maintain a CSAT score above 90%.",
    projectSnapshotText: "Currently assigned to the Apple Customer Support Project, handling inbound calls and chats for iPhone, iCloud, Apple One, and warranty-related inquiries across the US region.",
    radarSkills: [
      { skill: "Communication", score: 80, target: 80 },
      { skill: "Apple Products", score: 60, target: 80 },
      { skill: "Issue Triage", score: 60, target: 80 },
      { skill: "CRM Tools", score: 40, target: 60 },
      { skill: "Empathy", score: 80, target: 80 },
      { skill: "Escalation Mgmt", score: 40, target: 60 },
      { skill: "Billing Systems", score: 40, target: 60 },
      { skill: "Technical Debug", score: 20, target: 60 },
    ],
    skillGapRows: [
      { left: { skill: "Communication", level: "E", target: "✓", hasSkill: true },  right: { skill: "CRM Tools", level: "I", target: "A", hasSkill: true } },
      { left: { skill: "Empathy", level: "E", target: "✓", hasSkill: true },        right: { skill: "Escalation Mgmt", level: "I", target: "A", hasSkill: true } },
      { left: { skill: "Apple Products", level: "A", target: "E", hasSkill: true }, right: { skill: "Billing Systems", level: "I", target: "A", hasSkill: true } },
      { left: { skill: "Issue Triage", level: "A", target: "E", hasSkill: true },   right: { skill: "Technical Debug", level: "B", target: "A", hasSkill: true } },
    ],
  },
};

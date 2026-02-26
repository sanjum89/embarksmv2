import type { User, SkillTarget, RolePlay } from "@/types/learning";

export const currentUser: User = {
  id: "u1",
  name: "Alex Rivera",
  email: "alex@wfai.com",
  role: "learner",
  avatarUrl: "",
};

export const mockSkillTargets: SkillTarget[] = [
  {
    id: "st1",
    title: "Customer Objection Handling",
    description: "Master techniques for handling common customer objections during sales conversations.",
    category: "Sales Skills",
    assignedTo: ["u1"],
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
    assignedTo: ["u1"],
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
    assignedTo: ["u1"],
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

export const mockRolePlayBank: RolePlay[] = [
  { id: "rp1", title: "Price Objection – SMB Customer", scenario: "Customer pushes back on pricing for the standard plan.", difficulty: "intermediate", isPrivate: false, tags: ["pricing", "objections", "SMB"], aiCloneConfig: { persona: "Budget-conscious small business owner", context: "Evaluating 3 competitors, price-sensitive" } },
  { id: "rp2", title: "Enterprise Demo Walkthrough", scenario: "Prospect wants a focused demo of reporting features.", difficulty: "advanced", isPrivate: false, tags: ["demo", "enterprise", "product"], aiCloneConfig: { persona: "VP of Operations at Fortune 500", context: "Needs compliance reporting, has strict requirements" } },
  { id: "rp3", title: "Frustrated Customer – Service Outage", scenario: "Customer calls about a 4-hour service outage affecting their business.", difficulty: "intermediate", isPrivate: false, tags: ["support", "empathy", "crisis"], aiCloneConfig: { persona: "Angry operations manager", context: "Lost revenue due to outage, considering cancellation" } },
  { id: "rp4", title: "Upsell Conversation", scenario: "Existing customer on basic plan showing growth signals.", difficulty: "beginner", isPrivate: false, tags: ["upsell", "growth", "retention"], aiCloneConfig: { persona: "Happy customer, growing team", context: "Using 90% of plan limits, team doubled in size" } },
  { id: "rp5", title: "Contract Renewal Negotiation", scenario: "Customer wants a discount on annual renewal.", difficulty: "advanced", isPrivate: false, tags: ["renewal", "negotiation", "pricing"], aiCloneConfig: { persona: "Procurement manager", context: "Internal pressure to cut costs by 15%" } },
];

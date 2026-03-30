import type { AccountData, AccountEmployee, Account } from "@/types/account";
import type { NormalizedAccount, AccountUser, AccountProject, ProjectAssignment, AccountRole } from "@/types/account-v2";
import type { ReflectionEntry, WorkSignalCard, NamedEmployeeRecord, PeopleGraphRow, PerformanceAlert, RecommendedCTA, LearningAndSkillsSummary, OrgOverviewData } from "@/types/account-v2";
import {
  currentUser,
  marcusWellington,
  mayaThompson,
  rajPatel,
  priyaMenon,
  sarahAdmin,
  claraWhitfield,
  elliotHargreaves,
  sophieLangford,
  availableUsers as defaultAvailableUsers,
  mockNewHires,
  mockProgramContexts,
  mockTeamMembers,
  mockAssessments,
  mockLearningModules,
  mockSkillTargets,
  mockRolePlayBank,
  profileDataByUser,
} from "@/data/mock";
import type { User } from "@/types/learning";

function toAccountEmployee(user: typeof currentUser, reportsTo?: string | null): AccountEmployee {
  return { ...user, reportsTo: reportsTo ?? null };
}

export function buildDefaultAccountData(): AccountData {
  const employees: AccountEmployee[] = [
    toAccountEmployee(currentUser, null),
    toAccountEmployee(marcusWellington, null),
    toAccountEmployee(mayaThompson, "u1"),
    toAccountEmployee(rajPatel, "u1"),
    toAccountEmployee(priyaMenon, "u7"),
    toAccountEmployee(sarahAdmin, null),
    toAccountEmployee(claraWhitfield, "u1"),
    toAccountEmployee(elliotHargreaves, "u1"),
    toAccountEmployee(sophieLangford, "u1"),
  ];

  return {
    employees,
    skillTargets: mockSkillTargets,
    rolePlays: mockRolePlayBank,
    assessments: mockAssessments,
    learningModules: mockLearningModules,
    newHires: mockNewHires,
    programContexts: mockProgramContexts,
    teamMembers: mockTeamMembers,
    profileData: profileDataByUser,
  };
}

export function buildDefaultAccount(): Omit<Account, "id" | "created_at"> {
  return {
    name: "Cornerstone Demo",
    logo: null,
    accent_color: null,
    use_case_context: null,
    is_default: true,
    data: buildDefaultAccountData(),
  };
}

/* ─── Sample admin-visible data for the default account ─── */

function buildDefaultReflections(): ReflectionEntry[] {
  return [
    { id: "ref1", employeeId: "u6", date: "2026-03-12", confidence: 3, workload: 4, sentiment: "neutral", themes: ["onboarding pace", "product complexity"], content: "The Apple ecosystem is larger than I expected. Feeling okay but there's a lot to absorb.", managerFeedback: "Maya is progressing steadily — keep encouraging her on iCloud modules." },
    { id: "ref2", employeeId: "u6", date: "2026-03-05", confidence: 2, workload: 3, sentiment: "negative", themes: ["confidence", "knowledge gaps"], content: "Struggled with the billing module. Not sure I'll be ready for live calls on time.", managerFeedback: "Paired Maya with Raj for peer study sessions on billing." },
    { id: "ref3", employeeId: "u8", date: "2026-03-10", confidence: 4, workload: 3, sentiment: "positive", themes: ["pre-credited modules", "momentum"], content: "Having the ecosystem and iCloud modules pre-credited helped a lot. Feeling confident about iPhone basics.", managerFeedback: "Raj's prior experience is paying off — strong start." },
    { id: "ref4", employeeId: "u10", date: "2026-03-08", confidence: 2, workload: 5, sentiment: "negative", themes: ["overwhelmed", "fresher anxiety"], content: "Everything is new. I don't have any tech support background and the modules feel dense.", managerFeedback: "Emma needs extra scaffolding. Consider scheduling 1:1 check-ins twice a week." },
    { id: "ref5", employeeId: "u10", date: "2026-03-15", confidence: 3, workload: 4, sentiment: "neutral", themes: ["improving", "peer support"], content: "The device handling lab was really helpful. Starting to feel less lost.", managerFeedback: "Good progress — the hands-on sessions are making a difference." },
    { id: "ref6", employeeId: "u1", date: "2026-03-14", confidence: 4, workload: 3, sentiment: "positive", themes: ["team progress", "program design"], content: "The onboarding program is running smoothly. Maya and Raj are on track, Emma needs more support." },
    { id: "ref7", employeeId: "u7", date: "2026-03-13", confidence: 4, workload: 4, sentiment: "positive", themes: ["program rollout", "training quality"], content: "Apple L1 program rollout going well. The adaptive skip logic is saving time for experienced hires." },
  ];
}

function buildDefaultWorkSignals(): WorkSignalCard[] {
  return [
    {
      category: "Productivity",
      title: "Training Throughput",
      summary: "Learners are completing an average of 2.3 modules per week against a target of 3.",
      metrics: [
        { label: "Avg modules/week", value: 2.3, benchmark: 3, trend: "up" },
        { label: "On-time completion rate", value: "68%", trend: "stable" },
        { label: "Avg time per module", value: "28 min", unit: "", benchmark: "25 min" },
      ],
      flags: [
        { severity: "medium", label: "Below target throughput", description: "2 of 4 learners are behind the 3 modules/week target." },
      ],
    },
    {
      category: "Quality",
      title: "Assessment Performance",
      summary: "Pre-assessment scores average 58%, post-assessment scores average 79%.",
      metrics: [
        { label: "Avg pre-assessment score", value: "58%", trend: "stable" },
        { label: "Avg post-assessment score", value: "79%", trend: "up" },
        { label: "First-attempt pass rate", value: "72%", trend: "up" },
      ],
      flags: [],
    },
    {
      category: "Compliance",
      title: "Program Adherence",
      summary: "All learners are following the prescribed module sequence. No policy violations.",
      metrics: [
        { label: "Sequence compliance", value: "100%", trend: "stable" },
        { label: "Overdue modules", value: 1, trend: "down" },
      ],
      flags: [
        { severity: "low", label: "1 overdue module", description: "Emma Sullivan has not started Apple Product Ecosystem Overview (due 3 days ago).", employeeId: "u10" },
      ],
    },
    {
      category: "Capacity",
      title: "Learner Workload",
      summary: "Average self-reported workload is 3.8/5. One learner flagged as overloaded.",
      metrics: [
        { label: "Avg workload score", value: 3.8, benchmark: 3.5 },
        { label: "Learners at capacity (4+)", value: 2 },
      ],
      flags: [
        { severity: "high", label: "High workload — Emma Sullivan", description: "Reported workload 5/5 in latest reflection. Consider reducing module pace.", employeeId: "u10" },
      ],
    },
  ];
}

function buildDefaultNamedEmployees(): NamedEmployeeRecord[] {
  const empData: Array<{ id: string; grade: string; level: string; tenure: number; shift: string; engagement: number; performance: string; risk: string }> = [
    { id: "u1", grade: "L6", level: "Senior", tenure: 14, shift: "Day", engagement: 4.2, performance: "Exceeds", risk: "none" },
    { id: "u7", grade: "L5", level: "Senior", tenure: 8, shift: "Day", engagement: 4.0, performance: "Meets", risk: "none" },
    { id: "u6", grade: "L2", level: "Junior", tenure: 0.1, shift: "Day", engagement: 3.5, performance: "New Hire", risk: "low" },
    { id: "u8", grade: "L2", level: "Junior", tenure: 0.1, shift: "Day", engagement: 3.8, performance: "New Hire", risk: "none" },
    { id: "u10", grade: "L1", level: "Entry", tenure: 0.05, shift: "Day", engagement: 3.0, performance: "New Hire", risk: "medium" },
    { id: "u11", grade: "L7", level: "Director", tenure: 10, shift: "Day", engagement: 4.5, performance: "Exceeds", risk: "none" },
  ];

  return empData.map((d) => {
    const profile = profileDataByUser[d.id];
    const user = defaultAvailableUsers.find((u) => u.id === d.id);
    return {
      id: d.id,
      name: user?.name || d.id,
      email: user?.email || "",
      title: profile?.title || user?.title,
      department: profile?.department || "Operations",
      grade: d.grade,
      level: d.level,
      tenure: d.tenure,
      shift: d.shift,
      engagementScore: d.engagement,
      performanceRating: d.performance,
      riskFlag: d.risk,
      avatarUrl: user?.avatarUrl,
      reportsTo: null,
    };
  });
}

function buildDefaultPeopleGraph(): PeopleGraphRow[] {
  const named = buildDefaultNamedEmployees();
  return named.map((n) => ({
    employeeId: n.id,
    name: n.name,
    role: n.title,
    level: n.level,
    tenure: n.tenure,
    grade: n.grade,
    shift: n.shift,
    learningIndicators: { modulesCompleted: n.id === "u8" ? 2 : 0, assessmentAvg: n.id === "u8" ? 74 : undefined },
    workSignalIndicators: { throughput: n.performanceRating === "Exceeds" ? "high" : "normal" },
    engagementIndicators: { score: n.engagementScore },
    performanceIndicators: { rating: n.performanceRating },
    labels: n.riskFlag !== "none" ? [`risk:${n.riskFlag}`] : [],
    flags: n.riskFlag === "medium" ? ["needs-attention"] : [],
  }));
}

function buildDefaultOrgOverview(): OrgOverviewData {
  return {
    totalEmployees: 6,
    managers: 2,
    individualContributors: 3,
    avgTenure: 5.4,
    functions: { "Product Management": 1, "Customer Support": 3, "Training": 1, "HR": 1 },
    roleDistribution: { admin: 1, manager: 2, learner: 3 },
    tenureBands: { "< 1 year": 3, "1-5 years": 0, "5-10 years": 1, "10+ years": 2 },
    riskBands: { none: 4, low: 1, medium: 1 },
    summaryBlocks: [
      { label: "Total Employees", value: 6 },
      { label: "Active Programs", value: 1, description: "Apple Support Program" },
      { label: "Avg Engagement", value: "3.8 / 5" },
      { label: "At-Risk Learners", value: 1, description: "Emma Sullivan — high workload, fresher" },
    ],
  };
}

function buildDefaultPerformanceAlerts(): PerformanceAlert[] {
  return [
    { id: "pa1", employeeId: "u10", type: "workload", severity: "high", message: "Emma Sullivan reported 5/5 workload in her latest reflection. Consider reducing module pace.", date: "2026-03-15" },
    { id: "pa2", employeeId: "u10", type: "progress", severity: "medium", message: "Emma Sullivan has not started her first module and is 3 days overdue.", date: "2026-03-14" },
    { id: "pa3", employeeId: "u6", type: "confidence", severity: "low", message: "Maya Thompson's confidence dropped from 3 to 2 between her last two reflections.", date: "2026-03-12" },
  ];
}

function buildDefaultRecommendedCTAs(): RecommendedCTA[] {
  return [
    { id: "cta1", title: "Schedule 1:1 with Emma Sullivan", description: "High workload and low confidence indicate she may need additional support.", priority: "high", targetEmployeeId: "u10", action: "schedule_meeting" },
    { id: "cta2", title: "Pair Maya with Raj for billing study", description: "Maya struggled with the billing module — Raj has stronger billing fundamentals.", priority: "medium", targetEmployeeId: "u6", action: "peer_pairing" },
    { id: "cta3", title: "Review program pacing", description: "2 of 4 learners are below the 3 modules/week throughput target.", priority: "medium", action: "program_review" },
  ];
}

function buildDefaultLearningAndSkills(): LearningAndSkillsSummary {
  return {
    categoryTotals: { "Apple Support Program": 17, "Sales Skills": 5, "Product Knowledge": 5, "Soft Skills": 4 },
    completionCounts: { completed: 4, inProgress: 2, notStarted: 25 },
    avgScores: { preAssessment: 58, postAssessment: 79 },
    coverage: 42,
    licenses: 0,
    expiringLicenses: 0,
    expiredLicenses: 0,
    topSkillGaps: [
      { skill: "Apple Product Knowledge", gap: "Beginner → Advanced", count: 3 },
      { skill: "Troubleshooting", gap: "Beginner → Advanced", count: 3 },
      { skill: "Billing Support", gap: "Beginner → Intermediate", count: 2 },
      { skill: "Escalation Handling", gap: "Beginner → Intermediate", count: 3 },
    ],
    keyInsights: [
      "3 of 4 learners are at Beginner level for Apple Product Knowledge",
      "Raj Patel has pre-credited modules giving him a head start",
      "Emma Sullivan (fresher) has the widest skill gaps across all categories",
    ],
    proficiencyDistribution: { Beginner: 48, Intermediate: 28, Advanced: 18, Expert: 6 },
    trendingCategories: ["Apple Support Program"],
    criticalGaps: [
      { skill: "Apple Product Knowledge", urgency: "high", affected: 3 },
      { skill: "Troubleshooting", urgency: "high", affected: 3 },
    ],
  };
}

function buildDefaultRolesCatalog(): Record<string, AccountRole> {
  return {
    "role-grad-trainee": {
      id: "role-grad-trainee",
      name: "Graduate Trainee",
      snapshotText: "In this role, we expect you to build core investment, professional, and client-service capability, contribute reliably across assignments, and develop the judgement and discipline needed for more advanced roles.",
      description: `As a Graduate Trainee, you are in a structured early-career role where we expect you to build a strong foundation in wealth and investment management.

In this role, we expect you to:
• learn how the business works and how different teams contribute to client outcomes
• develop your understanding of core investment and wealth-management concepts
• contribute reliably to day-to-day work, projects, and learning activities
• build professional confidence, good judgement, and attention to detail
• make steady progress toward more independent and higher-responsibility roles

Your main areas of focus are:
• learning quickly and applying feedback well
• becoming dependable in the work assigned to you
• strengthening communication and professional confidence
• building the technical and behavioural foundation needed for future progression

Skills and proficiency we expect in this role

At this stage, we expect you to be developing the following capabilities:
• Client Relationship Management — Beginner
• Investment Communication — Beginner
• Investment Research — Beginner
• Portfolio Construction — Beginner
• Portfolio Management — Beginner
• Suitability and Documentation — Beginner
• Regulatory Compliance — Beginner
• Commercial Awareness — Beginner
• Active Listening — Intermediate
• Attention to Detail — Intermediate
• Relationship Building — Intermediate
• Professional Integrity — Intermediate
• Client Administration — Intermediate
• Adaptability — Intermediate

This role is preparing you for:
• Assistant Investment Manager
• Investment Analyst
• Portfolio Analyst

In simple terms, we expect you to use this stage to turn potential into dependable capability.`,
      detailedDescription: `As a Graduate Trainee, we expect you to use this stage of your career to build the core knowledge, behaviours, and judgement needed to grow into a successful investment or wealth-management professional. This is not a role where we expect you to operate independently at full Investment Manager level. Instead, we expect you to learn through structured experience, practical exposure, feedback, mentoring, and professional development.

What we expect from you in this role

In this role, we expect you to:
• build a clear understanding of how the firm serves clients and how different teams contribute to client outcomes
• develop the technical foundations of wealth management, investment thinking, portfolio construction, suitability, and market awareness
• support day-to-day work reliably, with strong attention to detail and professionalism
• learn from feedback, ask thoughtful questions, and become increasingly confident in how you contribute
• show integrity, proactivity, and a strong orientation toward client service

What your responsibilities are likely to include

Depending on your assignment or team, we would typically expect you to:
• support research, portfolio administration, documentation, meeting preparation, and follow-up activity
• contribute to projects and team initiatives
• build familiarity with client objectives, risk appetite, and suitability concepts
• develop your understanding of investment products, markets, and portfolio thinking
• work professionally with managers, mentors, and peers
• progress through structured learning and professional development
• build your internal network and understand how the wider business fits together

Skills and proficiency expected in this role

We expect you to develop capability in the following areas:
• Client Relationship Management — Beginner
• Investment Communication — Beginner
• Investment Research — Beginner
• Portfolio Construction — Beginner
• Portfolio Management — Beginner
• Suitability and Documentation — Beginner
• Regulatory Compliance — Beginner
• Commercial Awareness — Beginner
• Active Listening — Intermediate
• Attention to Detail — Intermediate
• Relationship Building — Intermediate
• Professional Integrity — Intermediate
• Client Administration — Intermediate
• Adaptability — Intermediate

These expectations mean that we do not expect deep independent technical mastery yet, but we do expect stronger professional behaviours, learning discipline, and reliable execution.

What success looks like

You are doing well in this role when you:
• show curiosity and learn quickly
• become dependable in the work assigned to you
• communicate clearly and professionally
• demonstrate strong attention to detail
• respond well to feedback and improve visibly over time
• understand how your work supports better client outcomes
• build trust with colleagues through professionalism and consistency

What you are growing toward

In this role, we are helping you build toward progression into roles such as:
• Assistant Investment Manager
• Investment Analyst
• Portfolio Analyst
• and, over time, Investment Manager

Why this role matters for your development

This role gives you the opportunity to build:
• practical experience in a professional wealth-management environment
• stronger technical and commercial understanding
• better judgement and professional discipline
• exposure to how investment work is delivered in practice
• a foundation for more specialized and client-facing roles later

In simple terms

In this role, we expect you to build the technical understanding, professional habits, and client-focused mindset that will prepare you for more independent and higher-impact work over time.`,
      requiredSkills: [
        { skillName: "Client Relationship Management", proficiency: "Beginner" },
        { skillName: "Investment Communication", proficiency: "Beginner" },
        { skillName: "Investment Research", proficiency: "Beginner" },
        { skillName: "Portfolio Construction", proficiency: "Beginner" },
        { skillName: "Portfolio Management", proficiency: "Beginner" },
        { skillName: "Suitability & Documentation", proficiency: "Beginner" },
        { skillName: "Regulatory Compliance", proficiency: "Beginner" },
        { skillName: "Commercial Awareness", proficiency: "Beginner" },
        { skillName: "Active Listening", proficiency: "Intermediate" },
        { skillName: "Attention to Detail", proficiency: "Intermediate" },
        { skillName: "Relationship Building", proficiency: "Intermediate" },
        { skillName: "Professional Integrity", proficiency: "Intermediate" },
        { skillName: "Client Administration", proficiency: "Intermediate" },
        { skillName: "Adaptability", proficiency: "Intermediate" },
      ],
    },
    "role-asst-inv-mgr": {
      id: "role-asst-inv-mgr",
      name: "Assistant Investment Manager",
      snapshotText: "In this role, we expect you to support client portfolio work, contribute to research and suitability processes, communicate clearly, and build the judgement, confidence, and consistency needed for full Investment Manager responsibility.",
      description: `As an Assistant Investment Manager, you are expected to operate beyond pure learning and begin contributing meaningfully to real client and investment work. This role sits between early-career development and full Investment Manager ownership.

In this role, we expect you to:
• support portfolio management and client servicing activity reliably
• strengthen your understanding of suitability, risk, documentation, and investment rationale
• communicate clearly with colleagues and begin contributing more confidently in client-related work
• build independence in research, analysis, and portfolio-support activity
• develop the judgement and consistency needed for more direct ownership over time

Your focus at this stage is:
• turning technical knowledge into dependable day-to-day execution
• understanding how investment decisions connect to client objectives
• becoming stronger in judgement, communication, and professional discipline
• building confidence in a regulated, client-trust environment

Skills and proficiency we expect in this role

At this stage, we expect you to demonstrate or build toward:
• Client Relationship Management — Intermediate
• Investment Communication — Intermediate
• Investment Research — Intermediate
• Portfolio Construction — Intermediate
• Portfolio Management — Intermediate
• Suitability and Documentation — Intermediate
• Regulatory Compliance — Intermediate
• Portfolio Risk Alignment — Intermediate
• Commercial Awareness — Intermediate
• Active Listening — Intermediate
• Relationship Building — Intermediate
• Attention to Detail — Intermediate
• Client Administration — Intermediate
• Wealth Planning Collaboration — Intermediate
• Professional Integrity — Advanced

This role is preparing you for:
• Investment Manager
• Specialist client-facing portfolio responsibility
• broader commercial, client, and judgement-led ownership over time

In simple terms, we expect you to move from supporting the work to understanding it deeply enough to take on more of it with confidence.`,
      detailedDescription: `As an Assistant Investment Manager, we expect you to support the delivery of high-quality client and investment work while continuing to develop the technical understanding, judgement, and professional confidence needed to progress into a full Investment Manager role. In a Rathbones-style wealth-management environment, this role is not purely administrative and not yet fully independent portfolio ownership either. It is a development stage where you are expected to contribute meaningfully, learn in context, and show that you can handle greater responsibility over time. Rathbones' early-careers material and graduate outcomes point to Assistant Investment Manager as a believable progression point between structured entry routes and more senior client-facing roles.

What we expect from you in this role

In this role, we expect you to:
• support portfolio and client work with a high level of professionalism and consistency
• build a stronger practical understanding of how investment recommendations are formed and documented
• understand how client objectives, risk tolerance, suitability, and market context connect to portfolio decisions
• contribute reliably to research, reviews, documentation, and follow-up work
• grow in confidence when discussing investment thinking and client needs with colleagues and, over time, clients
• show strong judgement, attention to detail, and ownership in a regulated environment

What your responsibilities are likely to include

Depending on the team or assignment, we would typically expect you to:
• support portfolio monitoring, review preparation, and investment documentation
• contribute to research and analysis that inform portfolio decisions
• help prepare materials and follow-up actions related to client meetings
• understand and apply suitability and documentation requirements carefully
• support communication around investment decisions, performance, and rationale
• work closely with more senior investment professionals and partner teams
• build stronger awareness of risk, regulation, and client outcomes
• contribute reliably to the smooth execution of client and portfolio work

This is consistent with what wealth-management progression typically looks like: moving from broad entry-level development into more applied, client-relevant portfolio and research work before taking on full Investment Manager responsibility.

Skills and proficiency expected in this role

We expect you to demonstrate or build toward the following capability level:
• Client Relationship Management — Intermediate
• Investment Communication — Intermediate
• Investment Research — Intermediate
• Portfolio Construction — Intermediate
• Portfolio Management — Intermediate
• Suitability and Documentation — Intermediate
• Regulatory Compliance — Intermediate
• Portfolio Risk Alignment — Intermediate
• Commercial Awareness — Intermediate
• Active Listening — Intermediate
• Relationship Building — Intermediate
• Attention to Detail — Intermediate
• Client Administration — Intermediate
• Wealth Planning Collaboration — Intermediate
• Professional Integrity — Advanced

What success looks like

You are doing well in this role when you:
• contribute reliably to client and investment workflows
• understand the reasoning behind investment decisions more clearly over time
• show good judgement in documentation, follow-through, and suitability-related work
• communicate clearly and professionally with colleagues and in client-related contexts
• become more confident in how you support portfolio and client outcomes
• show you can handle greater complexity without losing consistency or attention to detail

What you are growing toward

In this role, we are helping you grow toward:
• Investment Manager
• stronger ownership of client relationships and portfolio decisions
• more independent judgement in research, suitability, and investment communication
• broader contribution to commercial, client, and business-development activity

A company like Rathbones positions long-term development as a core part of career progression, and the broader wealth-management qualification path also supports this step-up into more independent client and portfolio responsibility.

Why this role matters for your development

This role matters because it helps you:
• move from foundational learning into applied investment and client work
• build stronger judgement in a regulated, high-trust environment
• connect technical investment knowledge with client needs and business outcomes
• prepare for a more independent portfolio and client-facing future
• build the consistency, credibility, and professional maturity needed for the next role

The wider industry path supports this progression too. CISI positions wealth-management qualifications as a progressive route for practitioners, and the Chartered Wealth Manager pathway is aimed at professionals working toward high-quality portfolio and client service in wealth management.

In simple terms

In this role, we expect you to become a dependable, increasingly confident contributor to client and portfolio work, while building the technical judgement and professional maturity needed to progress into an Investment Manager role.`,
      requiredSkills: [
        { skillName: "Client Relationship Management", proficiency: "Intermediate" },
        { skillName: "Investment Communication", proficiency: "Intermediate" },
        { skillName: "Investment Research", proficiency: "Intermediate" },
        { skillName: "Portfolio Construction", proficiency: "Intermediate" },
        { skillName: "Portfolio Management", proficiency: "Intermediate" },
        { skillName: "Suitability & Documentation", proficiency: "Intermediate" },
        { skillName: "Regulatory Compliance", proficiency: "Intermediate" },
        { skillName: "Portfolio Risk Alignment", proficiency: "Intermediate" },
        { skillName: "Commercial Awareness", proficiency: "Intermediate" },
        { skillName: "Active Listening", proficiency: "Intermediate" },
        { skillName: "Relationship Building", proficiency: "Intermediate" },
        { skillName: "Attention to Detail", proficiency: "Intermediate" },
        { skillName: "Client Administration", proficiency: "Intermediate" },
        { skillName: "Wealth Planning Collaboration", proficiency: "Intermediate" },
        { skillName: "Professional Integrity", proficiency: "Advanced" },
      ],
    },
    "role-inv-mgr": {
      id: "role-inv-mgr",
      name: "Investment Manager",
      snapshotText: "In this role, we expect you to manage client portfolios, make suitable investment decisions, communicate clearly with clients and colleagues, and contribute to strong client outcomes, growth, and professional trust.",
      description: `As an Investment Manager, we expect you to take much greater ownership of client portfolios, investment recommendations, and relationship quality. At this stage, you are no longer mainly building foundations. You are expected to use your judgement consistently, work confidently with clients, and contribute to both investment delivery and the growth of the business. Rathbones' current Investment Manager role content emphasizes client outcomes, business development, commercial awareness, and confidence in delivering the Rathbones proposition.

In this role, we expect you to:

• manage client portfolios in line with client objectives, suitability, and risk requirements
• explain investment thinking clearly and confidently to clients and colleagues
• make sound recommendations supported by research, judgement, and documentation
• maintain strong standards in regulatory conduct, suitability, and client communication
• contribute to the growth of your client book and broader business-development activity

Your focus at this stage is:

• applying strong judgement in real client situations
• balancing investment thinking with client needs and risk tolerance
• building trust through communication, consistency, and professionalism
• contributing commercially as well as technically
• preparing for more senior client and leadership responsibility over time

Skills and proficiency we expect in this role

At this stage, we expect you to demonstrate or build toward:

• Client Relationship Management — Advanced
• Investment Communication — Advanced
• Investment Research — Advanced
• Portfolio Construction — Advanced
• Portfolio Management — Advanced
• Suitability and Documentation — Advanced
• Regulatory Compliance — Advanced
• Portfolio Risk Alignment — Advanced
• Commercial Awareness — Advanced
• Business Development — Intermediate
• Active Listening — Advanced
• Relationship Building — Advanced
• Attention to Detail — Advanced
• Client Administration — Intermediate
• Wealth Planning Collaboration — Intermediate
• Professional Integrity — Advanced

This role is preparing you for:

• Senior Investment Manager
• broader ownership of complex client relationships
• stronger commercial and mentoring responsibility
• progression into more senior portfolio or team leadership roles

In simple terms, we expect you to move from supporting investment work to owning it with confidence, sound judgement, and strong client focus.`,
      detailedDescription: `As an Investment Manager, we expect you to take primary responsibility for managing client portfolios and delivering high-quality investment outcomes in a way that is suitable, commercially aware, and aligned to the firm's standards. This is a fully client-relevant role. We expect you to combine technical investment knowledge with communication skill, judgement, and trustworthiness. Rathbones' current Investment Manager role content explicitly highlights good client outcomes, business development, growth of the client book, confidence in delivering the Rathbones proposition, and contribution to firm growth initiatives.

What we expect from you in this role

In this role, we expect you to:

• manage client portfolios responsibly and in line with client objectives and risk profile
• make sound investment decisions and recommendations supported by analysis and judgement
• communicate clearly with clients about portfolios, performance, risks, and trade-offs
• maintain high standards in suitability, documentation, and regulatory conduct
• build and sustain trusted client relationships over time
• contribute to growth by developing your client book and supporting business-development activity

What your responsibilities are likely to include

Depending on your client segment and business area, we would typically expect you to:

• review and manage portfolios in line with suitability and client requirements
• understand client needs, objectives, and preferences and reflect these in portfolio decisions
• explain investment recommendations and portfolio changes clearly and professionally
• prepare and maintain documentation that supports investment rationale and suitability
• respond appropriately to market developments and assess their relevance to client portfolios
• contribute to new business conversations, pipeline development, and growth initiatives
• work with colleagues across related functions where client outcomes depend on joined-up delivery

Rathbones' published Investment Manager role content specifically calls out business-development expectations, ability to deliver the Rathbones pitch with confidence and clarity, and contribution to firm growth.

Skills and proficiency expected in this role

We expect you to demonstrate or build toward the following capability level:

• Client Relationship Management — Advanced
• Investment Communication — Advanced
• Investment Research — Advanced
• Portfolio Construction — Advanced
• Portfolio Management — Advanced
• Suitability and Documentation — Advanced
• Regulatory Compliance — Advanced
• Portfolio Risk Alignment — Advanced
• Commercial Awareness — Advanced
• Business Development — Intermediate
• Active Listening — Advanced
• Relationship Building — Advanced
• Attention to Detail — Advanced
• Client Administration — Intermediate
• Wealth Planning Collaboration — Intermediate
• Professional Integrity — Advanced

These expectations are consistent with the broader UK wealth-management standard for professionals who are expected to provide high-quality service to clients, understand financial markets, portfolio construction, and applied wealth management. The CISI Chartered Wealth Manager qualification is specifically aimed at wealth managers, private client managers, and discretionary portfolio managers, and covers financial markets, portfolio construction theory, and applied wealth management.

What success looks like

You are doing well in this role when you:

• manage portfolios with sound judgement and clear rationale
• align investment decisions to client needs, suitability, and risk profile
• communicate confidently and credibly with clients
• maintain strong documentation and regulatory discipline
• build trusted long-term relationships with clients and colleagues
• contribute to commercial growth without losing focus on client outcomes
• show consistency under pressure, especially when markets or client needs change

What you are growing toward

In this role, we are helping you build toward:

• Senior Investment Manager
• broader ownership of more complex client situations
• stronger mentoring and leadership contribution
• deeper commercial impact
• progression into more senior portfolio, team, or leadership roles

This is consistent with the wider wealth-management career path, where investment professionals typically progress from more analytical or associate roles into portfolio responsibility, and then into broader leadership and commercial accountability over time.

Why this role matters for your development

This role matters because it is the point where technical capability, client trust, and professional judgement must come together. It helps you:

• strengthen your credibility in client-facing investment work
• build confidence in handling real portfolio decisions and trade-offs
• connect research and portfolio thinking to real client outcomes
• deepen your commercial awareness and growth contribution
• prepare for more senior leadership, mentoring, and portfolio responsibility later

In simple terms

In this role, we expect you to deliver strong client outcomes through sound portfolio judgement, clear communication, disciplined suitability and documentation, and growing commercial contribution.`,
      requiredSkills: [
        { skillName: "Client Relationship Management", proficiency: "Advanced" },
        { skillName: "Investment Communication", proficiency: "Advanced" },
        { skillName: "Investment Research", proficiency: "Advanced" },
        { skillName: "Portfolio Construction", proficiency: "Advanced" },
        { skillName: "Portfolio Management", proficiency: "Advanced" },
        { skillName: "Suitability & Documentation", proficiency: "Advanced" },
        { skillName: "Regulatory Compliance", proficiency: "Advanced" },
        { skillName: "Portfolio Risk Alignment", proficiency: "Advanced" },
        { skillName: "Commercial Awareness", proficiency: "Advanced" },
        { skillName: "Business Development", proficiency: "Intermediate" },
        { skillName: "Active Listening", proficiency: "Advanced" },
        { skillName: "Relationship Building", proficiency: "Advanced" },
        { skillName: "Attention to Detail", proficiency: "Advanced" },
        { skillName: "Client Administration", proficiency: "Intermediate" },
        { skillName: "Wealth Planning Collaboration", proficiency: "Intermediate" },
        { skillName: "Professional Integrity", proficiency: "Advanced" },
      ],
    },
    "role-inv-director": {
      id: "role-inv-director",
      name: "Investment Director",
      snapshotText: "In this role, we expect you to lead complex client relationships, oversee portfolio strategy and risk, support business growth, and set a high standard in judgement, communication, mentoring, and professional trust.",
      description: `As an Investment Director, we expect you to operate at a senior level across client relationships, portfolio leadership, commercial contribution, and team influence. At this stage, you are expected to combine strong investment judgement with credibility, trust, and broader leadership across the business.

In this role, we expect you to:

• take ownership of significant client relationships and portfolio outcomes
• apply strong judgement across investment decisions, risk, and suitability
• communicate clearly and credibly with clients, advisers, and colleagues
• contribute to business development, growth, and long-term client value
• support the development of others through mentoring, coaching, and example

Your focus at this stage is:

• leading with sound judgement in more complex situations
• balancing client needs, investment discipline, and commercial awareness
• setting a high standard in communication, trust, and professionalism
• helping others perform well through guidance and support
• contributing not only as a portfolio leader, but as a senior presence in the business

Skills and proficiency we expect in this role:

• Client Relationship Management — Expert
• Investment Communication — Expert
• Investment Research — Expert
• Portfolio Construction — Expert
• Portfolio Management — Expert
• Suitability and Documentation — Expert
• Regulatory Compliance — Advanced
• Portfolio Risk Alignment — Expert
• Commercial Awareness — Expert
• Business Development — Advanced
• Active Listening — Advanced
• Relationship Building — Expert
• Attention to Detail — Advanced
• Client Administration — Advanced
• Wealth Planning Collaboration — Advanced
• Mentoring and Coaching — Advanced
• Professional Integrity — Expert
• Leadership / Team Contribution — Advanced

This role is preparing you for:

• broader team or proposition leadership
• larger or more complex portfolio responsibility
• senior strategic influence across client and investment activity

In simple terms, we expect you to lead with judgement, credibility, and consistency, while helping deliver strong client outcomes and stronger team capability.`,
      detailedDescription: `As an Investment Director, we expect you to act as a senior investment professional with significant responsibility for client outcomes, portfolio oversight, communication quality, and leadership through influence. In a Rathbones-style environment, this role goes beyond managing day-to-day portfolio activity. We expect you to bring stronger technical authority, deeper risk judgement, and greater confidence in guiding clients, advisers, and colleagues through more complex investment situations. Rathbones' senior portfolio leadership content describes this type of role as a senior member responsible for portfolio management and governance, acting as a technical investment specialist and primary investment-facing contact, while ensuring robust and scalable investment process.

What we expect from you in this role:

In this role, we expect you to:

• lead and oversee portfolio decisions with strong judgement and accountability
• manage significant client relationships with credibility and consistency
• ensure investment recommendations, suitability, and documentation are of a high standard
• communicate clearly and authoritatively with clients, colleagues, and advisers
• contribute to business growth through trusted relationships and commercial awareness
• support others through mentoring, coaching, and professional example
• maintain strong judgement under pressure, especially where markets, client expectations, and risk considerations intersect

What your responsibilities are likely to include:

Depending on the business area, we would typically expect you to:

• oversee client portfolios and more complex investment situations
• provide senior input into portfolio construction, portfolio changes, and investment rationale
• act as a key point of contact on investment matters for clients or advisers
• assess market developments and determine their relevance to portfolios and recommendations
• maintain strong governance, process discipline, and standards of documentation
• contribute to growth, proposition credibility, and long-term relationship value
• help develop less experienced colleagues and raise the standard of investment thinking across the team

Rathbones' current senior portfolio leadership material highlights portfolio management and governance, technical investment-specialist responsibility, investment-facing contact with advisers, and ensuring a robust, scalable investment process.

Skills and proficiency expected in this role:

We expect you to demonstrate or build toward the following capability level:

• Client Relationship Management — Expert
• Investment Communication — Expert
• Investment Research — Expert
• Portfolio Construction — Expert
• Portfolio Management — Expert
• Suitability and Documentation — Expert
• Regulatory Compliance — Advanced
• Portfolio Risk Alignment — Expert
• Commercial Awareness — Expert
• Business Development — Advanced
• Active Listening — Advanced
• Relationship Building — Expert
• Attention to Detail — Advanced
• Client Administration — Advanced
• Wealth Planning Collaboration — Advanced
• Mentoring and Coaching — Advanced
• Professional Integrity — Expert
• Leadership / Team Contribution — Advanced

These expectations are realistic for a senior wealth-management role where high-quality client service, portfolio judgement, and leadership through technical credibility are essential. The CISI Chartered Wealth Manager qualification is positioned as a postgraduate-level specialist qualification for wealth managers, discretionary portfolio managers, and private client managers, covering financial markets, portfolio construction, and applied wealth management.

What success looks like:

You are doing well in this role when you:

• make strong portfolio decisions supported by clear rationale and disciplined judgement
• handle complex client and investment situations calmly and credibly
• build trust through clarity, professionalism, and consistency
• maintain high standards in suitability, documentation, and regulatory discipline
• contribute meaningfully to growth and long-term client value
• raise the quality of thinking and execution around you through your example and support
• help others grow without losing focus on performance and client outcomes

What you are growing toward:

In this role, we are helping you build toward:

• broader team leadership
• deeper commercial and strategic influence
• more complex portfolio and client responsibility
• senior proposition or business leadership over time

This is consistent with the wider progression path in wealth management, where experienced portfolio professionals may move into broader leadership, proposition, or strategic roles after establishing strong technical and client credibility.

Why this role matters for your development:

This role matters because it is where:

• technical expertise becomes trusted senior judgement
• client relationships require stronger leadership and confidence
• portfolio oversight expands into governance and broader influence
• commercial contribution becomes more visible
• mentoring and leadership become part of your expected impact`,
      requiredSkills: [
        { skillName: "Client Relationship Management", proficiency: "Expert" },
        { skillName: "Investment Communication", proficiency: "Expert" },
        { skillName: "Investment Research", proficiency: "Expert" },
        { skillName: "Portfolio Construction", proficiency: "Expert" },
        { skillName: "Portfolio Management", proficiency: "Expert" },
        { skillName: "Suitability & Documentation", proficiency: "Expert" },
        { skillName: "Regulatory Compliance", proficiency: "Advanced" },
        { skillName: "Portfolio Risk Alignment", proficiency: "Expert" },
        { skillName: "Commercial Awareness", proficiency: "Expert" },
        { skillName: "Business Development", proficiency: "Advanced" },
        { skillName: "Active Listening", proficiency: "Advanced" },
        { skillName: "Relationship Building", proficiency: "Expert" },
        { skillName: "Attention to Detail", proficiency: "Advanced" },
        { skillName: "Client Administration", proficiency: "Advanced" },
        { skillName: "Wealth Planning Collaboration", proficiency: "Advanced" },
        { skillName: "Mentoring and Coaching", proficiency: "Advanced" },
        { skillName: "Professional Integrity", proficiency: "Expert" },
        { skillName: "Leadership / Team Contribution", proficiency: "Advanced" },
      ],
    },
  };
}

/**
 * Build a NormalizedAccount from the default mock data.
 */
export function buildDefaultNormalized(id: string): NormalizedAccount {
  const users: User[] = defaultAvailableUsers;

  const usersById: Record<string, AccountUser> = {};
  for (const u of users) {
    usersById[u.id] = {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatarUrl: u.avatarUrl,
      title: u.title,
      canManage: u.canManage,
      linkedEmployeeId: u.id,
    };
  }

  const employeesById: Record<string, import("@/types/account-v2").AccountEmployee> = {};
  const reportsToMap: Record<string, string | null> = {
    u1: null,
    u7: null,
    u6: "u1",
    u8: "u1",
    u10: "u7",
    u11: null,
    u12: "u1",
    u13: "u1",
    u14: "u1",
  };

  for (const u of users) {
    const profile = profileDataByUser[u.id];
    employeesById[u.id] = {
      id: u.id,
      name: u.name,
      email: u.email,
      title: profile?.title || u.title,
      department: profile?.department,
      reportsTo: reportsToMap[u.id] ?? null,
      skills: profile?.roleSkillsCurrent?.map((s) => ({
        skillName: s.skill_name,
        proficiency: s.proficiency,
        assessmentYear: s.assessment_year,
      })),
      avatarUrl: u.avatarUrl,
    };
  }

  // Clara Whitfield: explicit skills and role assignment
  if (employeesById["u12"]) {
    employeesById["u12"].roleId = "role-inv-mgr";
    employeesById["u12"].skills = [
      { skillName: "Client Relationship Management", proficiency: "Advanced", assessmentYear: 2026, source: "core" },
      { skillName: "Investment Communication", proficiency: "Advanced", assessmentYear: 2026, source: "core" },
      { skillName: "Investment Research", proficiency: "Advanced", assessmentYear: 2026, source: "core" },
      { skillName: "Portfolio Construction", proficiency: "Advanced", assessmentYear: 2026, source: "core" },
      { skillName: "Portfolio Management", proficiency: "Advanced", assessmentYear: 2026, source: "core" },
      { skillName: "Suitability and Documentation", proficiency: "Advanced", assessmentYear: 2026, source: "core" },
      { skillName: "Regulatory Compliance", proficiency: "Advanced", assessmentYear: 2026, source: "core" },
      { skillName: "Portfolio Risk Alignment", proficiency: "Advanced", assessmentYear: 2026, source: "core" },
      { skillName: "Commercial Awareness", proficiency: "Advanced", assessmentYear: 2026, source: "core" },
      { skillName: "Business Development", proficiency: "Intermediate", assessmentYear: 2026, source: "core" },
      { skillName: "Relationship Building", proficiency: "Advanced", assessmentYear: 2026, source: "core" },
      { skillName: "Active Listening", proficiency: "Advanced", assessmentYear: 2026, source: "core" },
      { skillName: "Mentoring and Coaching", proficiency: "Intermediate", assessmentYear: 2026, source: "inferred" },
      { skillName: "Stakeholder Management", proficiency: "Intermediate", assessmentYear: 2026, source: "inferred" },
      { skillName: "Process Improvement", proficiency: "Intermediate", assessmentYear: 2026, source: "inferred" },
      { skillName: "Knowledge Sharing", proficiency: "Intermediate", assessmentYear: 2026, source: "inferred" },
    ];
  }

  // Build hierarchy map
  const hierarchyMap: Record<string, string[]> = {};
  for (const emp of Object.values(employeesById)) {
    if (emp.reportsTo && employeesById[emp.reportsTo]) {
      if (!hierarchyMap[emp.reportsTo]) hierarchyMap[emp.reportsTo] = [];
      hierarchyMap[emp.reportsTo].push(emp.id);
    }
  }

  // Projects
  const projectsById: Record<string, AccountProject> = {
    p1: {
      id: "p1",
      name: "Apple Support Program",
      description: "Customer support onboarding for Apple L1 agents.",
      managerIds: ["u1"],
      requiredSkills: profileDataByUser["u6"]?.projectSkillsRequired?.map((s) => ({
        skillName: s.skill_name,
        proficiency: s.proficiency,
      })) || [],
      status: "active",
    },
    p2: {
      id: "p2",
      name: "WFAI Onboarding",
      description: "Building AI-driven workforce onboarding solutions.",
      managerIds: ["u1"],
      requiredSkills: profileDataByUser["u1"]?.projectSkillsRequired?.map((s) => ({
        skillName: s.skill_name,
        proficiency: s.proficiency,
      })) || [],
      status: "active",
    },
  };

  const projectAssignments: ProjectAssignment[] = [
    { employeeId: "u6", projectId: "p1" },
    { employeeId: "u8", projectId: "p1" },
    { employeeId: "u10", projectId: "p1" },
    { employeeId: "u1", projectId: "p2" },
  ];

  return {
    id,
    schemaVersion: "1",
    isDefault: true,
    branding: {
      name: "Cornerstone Demo",
      logo: null,
      accentColor: null,
    },
    proficiencyScale: ["Beginner", "Intermediate", "Advanced", "Expert", "Master"],
    usersById,
    employeesById,
    rolesById: buildDefaultRolesCatalog(),
    projectsById,
    projectAssignments,
    cohortsById: {},
    cohortAssignments: [],
    employeeEntityOverrides: [],
    hierarchyMap,
    skillTargets: mockSkillTargets,
    rolePlays: mockRolePlayBank,
    assessments: mockAssessments,
    learningModules: mockLearningModules,
    newHires: mockNewHires,
    programContexts: mockProgramContexts,
    teamMembers: Object.values(usersById),
    profileData: profileDataByUser,
    prompts: {},
    aiContext: {},
    pageData: {},
    my360: {},
    reflections: buildDefaultReflections(),
    workSignals: buildDefaultWorkSignals(),
    architectureSources: [],
    architectureSignalCounts: [],
    namedEmployees: buildDefaultNamedEmployees(),
    orgOverview: buildDefaultOrgOverview(),
    peopleGraph: buildDefaultPeopleGraph(),
    signals: [],
    showcaseCases: [],
    explainability: [],
    learningAndSkills: buildDefaultLearningAndSkills(),
    performanceAlerts: buildDefaultPerformanceAlerts(),
    recommendedCTAs: buildDefaultRecommendedCTAs(),
    // Demo mode config
    demoMode: true,
    demoScenarios: {
      onboardingLearnerEmployeeId: "u12",        // Clara Whitfield
      risingStarEmployeeId: "u13",               // Elliot Hargreaves
      underperformerEmployeeId: "u14",            // Sophie Langford
      promotionCandidateEmployeeId: "u6",         // Maya Thompson
      managerEmployeeId: "u1",                    // Alex Rivera
      adminEmployeeId: "u11",                     // Sarah Chen
      reflectionTargetEmployeeIds: ["u6", "u8", "u9"],
    },
  };
}

/**
 * Fill missing fields in uploaded JSON with sensible synthetic fallback data.
 */
export function generateFallbackData(partial: Partial<AccountData>): AccountData {
  return {
    employees: partial.employees?.map((e) => ({
      ...e,
      role: e.role || "learner",
      email: e.email || `${e.name?.toLowerCase().replace(/\s/g, ".")}@example.com`,
      reportsTo: e.reportsTo ?? null,
    })) ?? [],
    skillTargets: partial.skillTargets ?? [],
    rolePlays: partial.rolePlays ?? [],
    assessments: partial.assessments ?? [],
    learningModules: partial.learningModules ?? [],
    newHires: partial.newHires ?? [],
    programContexts: partial.programContexts ?? [],
    teamMembers: partial.teamMembers ?? partial.employees?.map((e) => ({
      id: e.id,
      name: e.name,
      email: e.email || "",
      role: e.role || "learner",
    })) ?? [],
    profileData: partial.profileData ?? {},
    aiManagerConfig: partial.aiManagerConfig,
    prompts: partial.prompts,
  };
}
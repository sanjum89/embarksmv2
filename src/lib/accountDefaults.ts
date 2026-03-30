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
      snapshotText: "Owns portfolio decisions for assigned clients, manages client relationships end-to-end, and mentors junior team members.",
      description: "The Investment Manager has full responsibility for managing client portfolios within defined mandates. They make independent buy/sell decisions, conduct client reviews, and are accountable for portfolio performance. They also mentor Assistant Investment Managers and Graduate Trainees, contributing to team development and investment committee discussions.",
      detailedDescription: `The Investment Manager is a fully qualified portfolio manager responsible for independent investment decision-making and comprehensive client relationship management.

RESPONSIBILITIES:
• Full discretionary management of client portfolios (typically £50M–£200M AUM)
• Make independent buy/sell/hold decisions within defined investment mandates and risk parameters
• Conduct quarterly and annual client review meetings independently
• Develop and articulate bespoke investment strategies aligned to client objectives
• Present at the weekly investment committee and contribute to house view formation
• Mentor 1-2 Assistant Investment Managers and Graduate Trainees
• Participate in business development — prospect meetings and pitch presentations
• Ensure all portfolio activity complies with regulatory requirements and internal policies

CLIENT MANAGEMENT:
• Primary relationship manager for 30-60 client accounts
• Handle complex client queries including tax planning considerations, estate planning interface, and philanthropic giving strategies
• Conduct annual suitability reviews and update investment policy statements
• Manage client expectations during periods of market volatility

INVESTMENT PROCESS:
• Maintain deep expertise in 2-3 sectors with comprehensive coverage of 30+ securities
• Generate original investment ideas and present conviction calls to the team
• Conduct due diligence on new investment opportunities including company visits and management meetings
• Contribute to asset allocation decisions at portfolio and model level

TEAM LEADERSHIP:
• Conduct regular 1:1s with direct reports (AIM / Graduate Trainees)
• Review and approve research output from junior team members
• Provide structured feedback through the reflection and skills assessment processes
• Identify development needs and assign appropriate skill targets

PROGRESSION CRITERIA:
• Minimum 4 years as Investment Manager before Director consideration
• Strong and consistent portfolio performance vs benchmarks
• Excellent client retention and satisfaction scores
• Demonstrated leadership and mentoring capability
• CFA Charterholder status (or equivalent)
• Business development contribution — evidence of client acquisition

TYPICAL TENURE: 4–8 years
REPORTS TO: Investment Director`,
      requiredSkills: [
        { skillName: "Financial Analysis", proficiency: "Advanced" },
        { skillName: "Portfolio Management", proficiency: "Advanced" },
        { skillName: "Client Communication", proficiency: "Advanced" },
        { skillName: "Risk Assessment", proficiency: "Intermediate" },
        { skillName: "Strategic Planning", proficiency: "Intermediate" },
      ],
    },
    "role-inv-director": {
      id: "role-inv-director",
      name: "Investment Director",
      snapshotText: "Provides strategic oversight of investment activity, sets firm-level policy, mentors senior staff, and drives business growth.",
      description: "The Investment Director sits at the leadership level of the investment management function. They set strategic direction, oversee multiple Investment Managers, chair or contribute to the investment committee, and represent the firm externally. They are responsible for ensuring the quality and consistency of the investment process across the team and play a key role in talent development and succession planning.",
      detailedDescription: `The Investment Director is a senior leadership role responsible for the strategic direction and oversight of the investment management function.

RESPONSIBILITIES:
• Strategic oversight of investment activity across the team (typically £500M–£2B+ AUM)
• Chair or co-chair the investment committee and drive house view formation
• Set and review firm-level investment policy, asset allocation frameworks, and risk parameters
• Oversee portfolio performance across all managed accounts and intervene where necessary
• Represent the firm at industry conferences, media engagements, and institutional client meetings
• Lead business development strategy for the investment management division
• Participate in executive-level decisions on firm strategy, technology investment, and operational change

TEAM & TALENT:
• Direct management of 3-6 Investment Managers
• Conduct performance reviews and career development planning for senior team members
• Lead succession planning for the investment management function
• Champion the learning and development programme — review skill targets, approve learning cohorts
• Act as escalation point for complex client situations and complaints

INVESTMENT LEADERSHIP:
• Set the tone for research quality and investment rigour across the team
• Review and challenge investment theses from Investment Managers
• Lead the annual strategic asset allocation review
• Maintain high-level market awareness and communicate macroeconomic views to the team
• Approve new investment strategies and product launches

CLIENT & STAKEHOLDER MANAGEMENT:
• Relationship owner for the firm's largest and most complex client accounts
• Conduct strategic reviews with ultra-high-net-worth and institutional clients
• Interface with compliance, risk, and operations teams on investment-related matters
• Represent the investment management perspective at board and executive committee meetings

GOVERNANCE & COMPLIANCE:
• Ensure team adherence to FCA regulations, MiFID II, and internal compliance standards
• Review and approve marketing materials and investment commentaries
• Oversee suitability and best execution monitoring across portfolios
• Participate in regulatory examinations and audits as required

TYPICAL TENURE: 5+ years (often long-term career role)
REPORTS TO: Chief Investment Officer / Managing Director`,
      requiredSkills: [
        { skillName: "Financial Analysis", proficiency: "Expert" },
        { skillName: "Portfolio Management", proficiency: "Expert" },
        { skillName: "Client Communication", proficiency: "Expert" },
        { skillName: "Risk Assessment", proficiency: "Advanced" },
        { skillName: "Strategic Planning", proficiency: "Advanced" },
        { skillName: "Leadership", proficiency: "Advanced" },
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
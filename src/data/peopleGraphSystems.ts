/* ─── People Graph System Definitions & Mock Signal Data ─── */

export interface ConnectedSystem {
  id: string;
  name: string;
  category: "pre-onboarding" | "hris" | "resume" | "manager-validated" | "job-architecture" | "engagement" | "work";
  icon: string; // lucide icon name
  description: string;
  signalCount: number;
  lastSync: string;
  status: "active" | "paused" | "pending";
  signals: SystemSignal[];
}

export interface SystemSignal {
  id: string;
  name: string;
  type: "direct" | "derived";
  description: string;
  frequency?: string;
  unit?: string;
}

export interface EmployeeLabelReasoning {
  label: string;
  severity: "info" | "warning" | "success" | "critical";
  formula: string;
  confidence: number;
  contributingSignals: {
    source: string;
    signal: string;
    value: string | number;
    weight: number;
    direction: "positive" | "negative" | "neutral";
  }[];
  thresholds: { metric: string; threshold: string; actual: string }[];
}

export interface EmployeeReflectionAnalysis {
  id: string;
  date: string;
  summary: string;
  extractedSkills: { skill: string; proficiency: string; confidence: number }[];
  sentiment: "positive" | "neutral" | "negative";
  concerns: { topic: string; severity: "low" | "medium" | "high"; suggestedAction: string }[];
  themes: string[];
}

/* ─── Default IM Systems (Rathbones / Pinnacle) ─── */
export const investmentManagementSystems: ConnectedSystem[] = [
  {
    id: "sys-bloomberg",
    name: "Bloomberg Terminal",
    category: "work",
    icon: "TrendingUp",
    description: "Market data, research, and trading analytics",
    signalCount: 1847,
    lastSync: "2 mins ago",
    status: "active",
    signals: [
      { id: "bb-1", name: "Research queries per day", type: "direct", description: "Number of security lookups and research searches", frequency: "Real-time", unit: "queries/day" },
      { id: "bb-2", name: "Securities analyzed", type: "direct", description: "Unique securities researched via EQUITY, FXIP screens", frequency: "Daily", unit: "securities" },
      { id: "bb-3", name: "News alerts actioned", type: "direct", description: "Market news alerts reviewed and acted upon", frequency: "Real-time", unit: "alerts" },
      { id: "bb-4", name: "Terminal active time", type: "direct", description: "Hours spent on Bloomberg Terminal", frequency: "Daily", unit: "hrs/day" },
      { id: "bb-5", name: "Investment conviction score", type: "derived", description: "Calculated from research depth × decision latency × outcome", frequency: "Weekly" },
      { id: "bb-6", name: "Research breadth index", type: "derived", description: "Diversity of asset classes and geographies researched", frequency: "Monthly" },
    ],
  },
  {
    id: "sys-charles-river",
    name: "Charles River IMS",
    category: "work",
    icon: "Briefcase",
    description: "Order management, portfolio construction, and compliance",
    signalCount: 923,
    lastSync: "5 mins ago",
    status: "active",
    signals: [
      { id: "cr-1", name: "Orders placed", type: "direct", description: "Buy/sell orders submitted through OMS", frequency: "Real-time", unit: "orders/week" },
      { id: "cr-2", name: "Trade accuracy rate", type: "direct", description: "Percentage of orders executed without amendments", frequency: "Daily", unit: "%" },
      { id: "cr-3", name: "Portfolio rebalances", type: "direct", description: "Number of portfolio rebalancing actions taken", frequency: "Weekly", unit: "rebalances" },
      { id: "cr-4", name: "Compliance exceptions", type: "direct", description: "Pre-trade compliance check failures", frequency: "Real-time", unit: "exceptions" },
      { id: "cr-5", name: "Execution efficiency", type: "derived", description: "Speed and cost-effectiveness of order execution vs benchmarks", frequency: "Daily" },
      { id: "cr-6", name: "Portfolio drift score", type: "derived", description: "Degree of deviation from model portfolio targets", frequency: "Weekly" },
    ],
  },
  {
    id: "sys-investcloud",
    name: "InvestCloud CLM",
    category: "work",
    icon: "Users",
    description: "Client lifecycle management and relationship tracking",
    signalCount: 412,
    lastSync: "15 mins ago",
    status: "active",
    signals: [
      { id: "ic-1", name: "Client interactions logged", type: "direct", description: "Meetings, calls, and touchpoints recorded", frequency: "Real-time", unit: "interactions/week" },
      { id: "ic-2", name: "Proposals generated", type: "direct", description: "Investment proposals and reviews created", frequency: "Weekly", unit: "proposals" },
      { id: "ic-3", name: "Client onboarding completions", type: "direct", description: "New client onboarding processes finalized", frequency: "Monthly", unit: "clients" },
      { id: "ic-4", name: "Client relationship health", type: "derived", description: "Composite score from interaction frequency, AUM changes, and satisfaction", frequency: "Monthly" },
      { id: "ic-5", name: "Client retention risk", type: "derived", description: "Probability of client attrition based on engagement patterns", frequency: "Monthly" },
    ],
  },
  {
    id: "sys-salesforce",
    name: "Salesforce Financial Services",
    category: "work",
    icon: "HeartHandshake",
    description: "CRM, pipeline management, and client engagement",
    signalCount: 634,
    lastSync: "8 mins ago",
    status: "active",
    signals: [
      { id: "sf-1", name: "Client meetings per week", type: "direct", description: "Scheduled and completed client meetings", frequency: "Weekly", unit: "meetings" },
      { id: "sf-2", name: "Pipeline value", type: "direct", description: "Total AUM in prospect pipeline", frequency: "Real-time", unit: "£M" },
      { id: "sf-3", name: "Follow-up completion rate", type: "direct", description: "Percentage of action items completed on time", frequency: "Weekly", unit: "%" },
      { id: "sf-4", name: "Relationship depth score", type: "derived", description: "Multi-dimensional scoring of client engagement quality", frequency: "Monthly" },
    ],
  },
  {
    id: "sys-advent",
    name: "Advent Geneva",
    category: "work",
    icon: "Calculator",
    description: "Portfolio accounting, reporting, and reconciliation",
    signalCount: 289,
    lastSync: "1 hr ago",
    status: "active",
    signals: [
      { id: "ag-1", name: "Reports generated", type: "direct", description: "Client and regulatory reports produced", frequency: "Daily", unit: "reports" },
      { id: "ag-2", name: "Reconciliation exceptions", type: "direct", description: "Discrepancies found during position reconciliation", frequency: "Daily", unit: "exceptions" },
      { id: "ag-3", name: "NAV accuracy rate", type: "direct", description: "Accuracy of net asset value calculations", frequency: "Daily", unit: "%" },
      { id: "ag-4", name: "Reporting timeliness", type: "derived", description: "On-time delivery rate for scheduled reports", frequency: "Monthly" },
    ],
  },
  {
    id: "sys-factset",
    name: "FactSet / Morningstar",
    category: "work",
    icon: "Search",
    description: "Quantitative analytics, fund research, and peer comparison",
    signalCount: 156,
    lastSync: "30 mins ago",
    status: "active",
    signals: [
      { id: "fs-1", name: "Models built", type: "direct", description: "Financial models created or updated", frequency: "Weekly", unit: "models" },
      { id: "fs-2", name: "Research reports consumed", type: "direct", description: "Third-party research documents reviewed", frequency: "Daily", unit: "reports" },
      { id: "fs-3", name: "Peer comparisons run", type: "direct", description: "Fund/manager comparisons executed", frequency: "Weekly", unit: "comparisons" },
      { id: "fs-4", name: "Analytical depth score", type: "derived", description: "Complexity and thoroughness of quantitative analysis", frequency: "Monthly" },
    ],
  },
  {
    id: "sys-compliance",
    name: "ComplianceAlpha",
    category: "work",
    icon: "ShieldCheck",
    description: "Regulatory compliance, personal dealing, and audit trail",
    signalCount: 98,
    lastSync: "1 hr ago",
    status: "active",
    signals: [
      { id: "ca-1", name: "Pre-trade checks passed", type: "direct", description: "Automated compliance checks cleared", frequency: "Real-time", unit: "checks" },
      { id: "ca-2", name: "Pre-trade checks failed", type: "direct", description: "Compliance violations flagged pre-execution", frequency: "Real-time", unit: "violations" },
      { id: "ca-3", name: "PA dealing declarations", type: "direct", description: "Personal account dealing declarations submitted", frequency: "Monthly", unit: "declarations" },
      { id: "ca-4", name: "Compliance risk score", type: "derived", description: "Composite risk rating from violation patterns and training gaps", frequency: "Monthly" },
    ],
  },
  {
    id: "sys-teams",
    name: "Microsoft Teams / Outlook",
    category: "work",
    icon: "Mail",
    description: "Collaboration, communications, and meeting analytics",
    signalCount: 2103,
    lastSync: "Real-time",
    status: "active",
    signals: [
      { id: "mt-1", name: "Meeting frequency", type: "direct", description: "Internal and external meetings attended", frequency: "Weekly", unit: "meetings/week" },
      { id: "mt-2", name: "Email response time", type: "direct", description: "Average time to respond to client/internal emails", frequency: "Daily", unit: "hrs" },
      { id: "mt-3", name: "Cross-team interactions", type: "direct", description: "Collaboration touchpoints outside immediate team", frequency: "Weekly", unit: "interactions" },
      { id: "mt-4", name: "Collaboration index", type: "derived", description: "Network centrality and knowledge sharing score", frequency: "Monthly" },
    ],
  },
];

export const foundationalSystems: ConnectedSystem[] = [
  {
    id: "sys-pre-onboarding",
    name: "Pre-Onboarding Systems",
    category: "pre-onboarding",
    icon: "UserPlus",
    description: "Candidate assessment data, interview scores, and psychometric profiles",
    signalCount: 34,
    lastSync: "On hire",
    status: "active",
    signals: [
      { id: "po-1", name: "Interview scores", type: "direct", description: "Structured interview ratings across competencies" },
      { id: "po-2", name: "Psychometric profile", type: "direct", description: "Behavioral and cognitive assessment results" },
      { id: "po-3", name: "Technical assessment score", type: "direct", description: "Pre-hire technical evaluation results" },
      { id: "po-4", name: "Culture fit index", type: "derived", description: "Alignment score against organizational values" },
    ],
  },
  {
    id: "sys-hris",
    name: "HRIS / HCM",
    category: "hris",
    icon: "Building2",
    description: "Core HR data — tenure, grade, department, compensation, and engagement surveys",
    signalCount: 156,
    lastSync: "Daily",
    status: "active",
    signals: [
      { id: "hr-1", name: "Tenure", type: "direct", description: "Length of service in current role and organization", unit: "years" },
      { id: "hr-2", name: "Grade / Level", type: "direct", description: "Current pay grade and career level" },
      { id: "hr-3", name: "Department & function", type: "direct", description: "Organizational placement" },
      { id: "hr-4", name: "Engagement survey score", type: "direct", description: "Latest pulse survey responses", unit: "1-5" },
      { id: "hr-5", name: "Performance rating", type: "direct", description: "Annual or quarterly performance assessment" },
      { id: "hr-6", name: "Attrition probability", type: "derived", description: "ML-predicted likelihood of voluntary departure", unit: "%" },
    ],
  },
  {
    id: "sys-resume",
    name: "Resume / CV Parser",
    category: "resume",
    icon: "FileText",
    description: "Extracted skills, certifications, experience, and education from resumes",
    signalCount: 48,
    lastSync: "On upload",
    status: "active",
    signals: [
      { id: "rs-1", name: "Declared skills", type: "direct", description: "Skills and technologies listed on resume" },
      { id: "rs-2", name: "Certifications", type: "direct", description: "Professional certifications (CFA, IMC, CISI)" },
      { id: "rs-3", name: "Years of experience", type: "direct", description: "Total and domain-specific experience duration" },
      { id: "rs-4", name: "Skill currency score", type: "derived", description: "How recent and relevant declared skills are" },
    ],
  },
  {
    id: "sys-manager",
    name: "Manager Validated Data",
    category: "manager-validated",
    icon: "UserCheck",
    description: "Manager-assessed skills, potential ratings, and career aspirations",
    signalCount: 72,
    lastSync: "Quarterly",
    status: "active",
    signals: [
      { id: "mg-1", name: "Skill proficiency ratings", type: "direct", description: "Manager-assessed proficiency levels per skill" },
      { id: "mg-2", name: "Potential rating", type: "direct", description: "9-box grid placement — potential assessment" },
      { id: "mg-3", name: "Career aspirations", type: "direct", description: "Recorded career goals and interests" },
      { id: "mg-4", name: "Readiness assessment", type: "derived", description: "Manager + data-driven readiness for next role" },
    ],
  },
  {
    id: "sys-job-arch",
    name: "Job Architecture",
    category: "job-architecture",
    icon: "Network",
    description: "Role catalog, skill frameworks, and organizational hierarchy",
    signalCount: 189,
    lastSync: "On change",
    status: "active",
    signals: [
      { id: "ja-1", name: "Role-to-skill mapping", type: "direct", description: "Required skills and proficiency levels per role" },
      { id: "ja-2", name: "Reporting hierarchy", type: "direct", description: "Manager-report relationships" },
      { id: "ja-3", name: "Career pathways", type: "direct", description: "Defined progression routes between roles" },
      { id: "ja-4", name: "Role skill gap", type: "derived", description: "Delta between required and actual skill proficiency" },
      { id: "ja-5", name: "Career readiness score", type: "derived", description: "How close an employee is to next-role requirements" },
    ],
  },
];

export const engagementSystems: ConnectedSystem[] = [
  {
    id: "sys-learning",
    name: "Learning Platform",
    category: "engagement",
    icon: "GraduationCap",
    description: "Course completions, assessment scores, learning velocity",
    signalCount: 534,
    lastSync: "Real-time",
    status: "active",
    signals: [
      { id: "lp-1", name: "Courses completed", type: "direct", description: "Learning modules finished", unit: "courses" },
      { id: "lp-2", name: "Assessment scores", type: "direct", description: "Quiz and assessment results", unit: "%" },
      { id: "lp-3", name: "Time to complete", type: "direct", description: "Duration from start to finish per module", unit: "hrs" },
      { id: "lp-4", name: "Learning velocity", type: "derived", description: "Modules completed per week, trending", unit: "modules/week" },
      { id: "lp-5", name: "Knowledge retention", type: "derived", description: "Score decay rate over time from re-assessments" },
      { id: "lp-6", name: "Course effectiveness", type: "derived", description: "Pre/post score delta correlated with work signal improvement" },
    ],
  },
  {
    id: "sys-reflections",
    name: "Reflections Engine",
    category: "engagement",
    icon: "MessageCircle",
    description: "Employee self-reflections, sentiment analysis, and skill declarations",
    signalCount: 267,
    lastSync: "On submission",
    status: "active",
    signals: [
      { id: "rf-1", name: "Self-declared skills", type: "direct", description: "Skills and proficiency levels declared by employee" },
      { id: "rf-2", name: "Confidence level", type: "direct", description: "Self-reported confidence in current role", unit: "1-5" },
      { id: "rf-3", name: "Workload perception", type: "direct", description: "Self-reported workload level", unit: "1-5" },
      { id: "rf-4", name: "Sentiment trend", type: "derived", description: "NLP-analyzed emotional trajectory over time" },
      { id: "rf-5", name: "Concern flags", type: "derived", description: "Extracted workplace concerns requiring attention" },
      { id: "rf-6", name: "Growth mindset score", type: "derived", description: "Willingness to learn and adapt based on reflection language" },
    ],
  },
  {
    id: "sys-roleplay",
    name: "Role Play Engine",
    category: "engagement",
    icon: "Drama",
    description: "Behavioral simulations, readiness scores, and scenario outcomes",
    signalCount: 89,
    lastSync: "On completion",
    status: "active",
    signals: [
      { id: "rp-1", name: "Scenarios completed", type: "direct", description: "Role play simulations finished", unit: "sessions" },
      { id: "rp-2", name: "Behavioral signals", type: "direct", description: "Communication patterns and decision quality" },
      { id: "rp-3", name: "Readiness score", type: "derived", description: "Composite readiness for real-world application" },
      { id: "rp-4", name: "Improvement trajectory", type: "derived", description: "Performance trend across repeated scenarios" },
    ],
  },
];

/* ─── Mock employee label reasoning ─── */
export function getEmployeeLabelReasoning(employeeId: string, employeeName: string): EmployeeLabelReasoning[] {
  const reasoningMap: Record<string, EmployeeLabelReasoning[]> = {
    // Theo — underperformer / flight risk
    "RAT-E-THEO": [
      {
        label: "Flight Risk",
        severity: "critical",
        formula: "engagement_score < 2.5 AND sentiment_trend = 'declining' AND workload_perception > 4.0",
        confidence: 0.78,
        contributingSignals: [
          { source: "HRIS / HCM", signal: "Engagement survey score", value: 2.1, weight: 0.35, direction: "negative" },
          { source: "Reflections Engine", signal: "Sentiment trend", value: "Declining", weight: 0.25, direction: "negative" },
          { source: "Reflections Engine", signal: "Workload perception", value: 4.3, weight: 0.2, direction: "negative" },
          { source: "Microsoft Teams", signal: "Cross-team interactions", value: "↓ 40%", weight: 0.1, direction: "negative" },
          { source: "Learning Platform", signal: "Learning velocity", value: "0.3 modules/week", weight: 0.1, direction: "negative" },
        ],
        thresholds: [
          { metric: "Engagement Score", threshold: "< 2.5", actual: "2.1" },
          { metric: "Sentiment", threshold: "declining for 3+ weeks", actual: "declining 5 weeks" },
          { metric: "Workload", threshold: "> 4.0", actual: "4.3" },
        ],
      },
      {
        label: "Needs Mentoring",
        severity: "warning",
        formula: "role_skill_gap_count >= 3 AND learning_velocity < 1.0 AND tenure < 2yr",
        confidence: 0.85,
        contributingSignals: [
          { source: "Job Architecture", signal: "Role skill gaps", value: 4, weight: 0.4, direction: "negative" },
          { source: "Learning Platform", signal: "Learning velocity", value: "0.3/week", weight: 0.3, direction: "negative" },
          { source: "Charles River IMS", signal: "Trade accuracy rate", value: "87%", weight: 0.2, direction: "negative" },
          { source: "Manager Validated", signal: "Potential rating", value: "Medium", weight: 0.1, direction: "neutral" },
        ],
        thresholds: [
          { metric: "Skill gaps", threshold: "≥ 3 critical", actual: "4 gaps" },
          { metric: "Learning velocity", threshold: "< 1.0 modules/week", actual: "0.3" },
        ],
      },
    ],
    // Louis — rising star
    "RAT-E-LOUIS": [
      {
        label: "Rising Star",
        severity: "success",
        formula: "learning_velocity > 2.0 AND assessment_avg > 85 AND ramp_up_speed = 'fast' AND manager_potential = 'high'",
        confidence: 0.92,
        contributingSignals: [
          { source: "Learning Platform", signal: "Learning velocity", value: "2.8 modules/week", weight: 0.3, direction: "positive" },
          { source: "Learning Platform", signal: "Assessment average", value: "91%", weight: 0.25, direction: "positive" },
          { source: "Charles River IMS", signal: "Trade accuracy rate", value: "96%", weight: 0.2, direction: "positive" },
          { source: "Bloomberg Terminal", signal: "Research depth", value: "Top 15%", weight: 0.15, direction: "positive" },
          { source: "Manager Validated", signal: "Potential rating", value: "High", weight: 0.1, direction: "positive" },
        ],
        thresholds: [
          { metric: "Learning velocity", threshold: "> 2.0", actual: "2.8" },
          { metric: "Assessment avg", threshold: "> 85%", actual: "91%" },
          { metric: "Ramp-up", threshold: "fast", actual: "top quartile" },
        ],
      },
    ],
    // Amelia — promotion path
    "RAT-E-AMELIA": [
      {
        label: "Promotion Ready",
        severity: "success",
        formula: "career_readiness > 0.85 AND performance_rating >= 'exceeds' AND skill_gap_count <= 1",
        confidence: 0.88,
        contributingSignals: [
          { source: "Job Architecture", signal: "Career readiness score", value: "0.91", weight: 0.35, direction: "positive" },
          { source: "HRIS / HCM", signal: "Performance rating", value: "Exceeds", weight: 0.3, direction: "positive" },
          { source: "Charles River IMS", signal: "Execution efficiency", value: "Top 10%", weight: 0.2, direction: "positive" },
          { source: "InvestCloud CLM", signal: "Client relationship health", value: "94/100", weight: 0.15, direction: "positive" },
        ],
        thresholds: [
          { metric: "Career readiness", threshold: "> 0.85", actual: "0.91" },
          { metric: "Performance", threshold: "≥ exceeds", actual: "exceeds" },
          { metric: "Skill gaps", threshold: "≤ 1", actual: "1" },
        ],
      },
    ],
  };

  // Default reasoning for any employee
  return reasoningMap[employeeId] || [
    {
      label: "On Track",
      severity: "info",
      formula: "no_critical_flags AND engagement >= 3.0 AND learning_velocity >= 1.0",
      confidence: 0.75,
      contributingSignals: [
        { source: "HRIS / HCM", signal: "Engagement score", value: 3.4, weight: 0.3, direction: "positive" },
        { source: "Learning Platform", signal: "Learning velocity", value: "1.2/week", weight: 0.3, direction: "positive" },
        { source: "Reflections Engine", signal: "Sentiment", value: "Stable", weight: 0.2, direction: "neutral" },
        { source: "Manager Validated", signal: "Performance", value: "Meets", weight: 0.2, direction: "neutral" },
      ],
      thresholds: [
        { metric: "Critical flags", threshold: "none", actual: "none" },
        { metric: "Engagement", threshold: "≥ 3.0", actual: "3.4" },
      ],
    },
  ];
}

/* ─── Mock reflection analysis ─── */
export function getEmployeeReflectionAnalysis(employeeId: string): EmployeeReflectionAnalysis[] {
  const analysisMap: Record<string, EmployeeReflectionAnalysis[]> = {
    "RAT-E-THEO": [
      {
        id: "ref-theo-1",
        date: "2025-03-28",
        summary: "Feeling overwhelmed with the volume of client portfolios being assigned. Struggling to keep up with compliance requirements.",
        extractedSkills: [
          { skill: "Portfolio Management", proficiency: "Developing", confidence: 0.6 },
          { skill: "Regulatory Compliance", proficiency: "Foundational", confidence: 0.45 },
        ],
        sentiment: "negative",
        concerns: [
          { topic: "Workload overwhelm", severity: "high", suggestedAction: "Schedule 1-on-1 to discuss portfolio redistribution" },
          { topic: "Compliance confidence gap", severity: "medium", suggestedAction: "Assign compliance mentoring sessions" },
        ],
        themes: ["workload", "compliance", "support-needed"],
      },
      {
        id: "ref-theo-2",
        date: "2025-03-14",
        summary: "The new rebalancing tools are confusing. I've made errors twice this week and I'm worried about client impact.",
        extractedSkills: [
          { skill: "Portfolio Rebalancing", proficiency: "Foundational", confidence: 0.35 },
          { skill: "Risk Management", proficiency: "Developing", confidence: 0.5 },
        ],
        sentiment: "negative",
        concerns: [
          { topic: "Tool proficiency gap", severity: "high", suggestedAction: "Pair with experienced user for shadowing sessions" },
          { topic: "Error anxiety", severity: "medium", suggestedAction: "Provide positive reinforcement and error-recovery training" },
        ],
        themes: ["tools", "errors", "anxiety", "training-needed"],
      },
    ],
    "RAT-E-LOUIS": [
      {
        id: "ref-louis-1",
        date: "2025-04-02",
        summary: "Really enjoying the fixed income module. Applied the duration concepts directly to a client portfolio review yesterday. Feeling confident about the upcoming assessment.",
        extractedSkills: [
          { skill: "Fixed Income Analysis", proficiency: "Proficient", confidence: 0.82 },
          { skill: "Client Communication", proficiency: "Proficient", confidence: 0.78 },
        ],
        sentiment: "positive",
        concerns: [],
        themes: ["application", "confidence", "growth"],
      },
    ],
  };

  return analysisMap[employeeId] || [];
}

/* ─── Derived metric definitions ─── */
export const derivedMetricDefinitions = [
  {
    name: "Learning Velocity",
    formula: "completed_modules / active_weeks",
    inputs: ["Learning Platform: modules completed", "HRIS: active employment weeks"],
    description: "Rate of learning content consumption, normalized by active time",
    thresholds: { low: "< 0.5/week", normal: "0.5-2.0/week", high: "> 2.0/week" },
  },
  {
    name: "Knowledge Retention",
    formula: "(reassessment_score / initial_score) × time_decay_factor",
    inputs: ["Learning Platform: initial assessment score", "Learning Platform: reassessment score", "Time since completion"],
    description: "How well knowledge is retained over time, measured through periodic reassessments",
    thresholds: { low: "< 60%", normal: "60-80%", high: "> 80%" },
  },
  {
    name: "Investment Conviction Score",
    formula: "research_depth × (1 / decision_latency) × outcome_quality",
    inputs: ["Bloomberg: research queries", "Charles River: order timing", "Portfolio performance attribution"],
    description: "Confidence and quality of investment decisions based on research thoroughness and outcomes",
    thresholds: { low: "< 40", normal: "40-75", high: "> 75" },
  },
  {
    name: "Client Relationship Health",
    formula: "interaction_frequency × satisfaction_proxy × AUM_stability",
    inputs: ["InvestCloud: client interactions", "Salesforce: meeting completions", "Advent: AUM changes"],
    description: "Composite health score for client relationships managed by the employee",
    thresholds: { low: "< 50/100", normal: "50-80/100", high: "> 80/100" },
  },
  {
    name: "Ramp-Up Velocity",
    formula: "competency_milestones_achieved / weeks_since_start",
    inputs: ["Learning Platform: milestone completions", "HRIS: start date", "Manager: readiness checks"],
    description: "Speed at which new hires reach competency milestones relative to role expectations",
    thresholds: { low: "> 16 weeks", normal: "8-16 weeks", high: "< 8 weeks" },
  },
  {
    name: "Flight Risk Score",
    formula: "w1×(5-engagement) + w2×sentiment_decline + w3×workload_excess + w4×isolation_index",
    inputs: ["HRIS: engagement survey", "Reflections: sentiment", "Reflections: workload", "Teams: collaboration"],
    description: "Probability of voluntary departure based on multi-source disengagement signals",
    thresholds: { low: "< 30%", normal: "30-60%", high: "> 60%" },
  },
  {
    name: "Course Effectiveness Rating",
    formula: "avg(post_score - pre_score) × work_signal_improvement_correlation",
    inputs: ["Learning Platform: pre/post scores", "Work systems: performance delta post-course"],
    description: "Whether a course actually improves real-world performance, not just test scores",
    thresholds: { low: "< 0.3 correlation", normal: "0.3-0.7", high: "> 0.7" },
  },
  {
    name: "Compliance Risk Score",
    formula: "violation_rate × recency_weight + training_gap_penalty",
    inputs: ["ComplianceAlpha: violations", "ComplianceAlpha: check failures", "Learning Platform: compliance training status"],
    description: "Composite regulatory risk based on compliance history and training gaps",
    thresholds: { low: "< 20", normal: "20-50", high: "> 50" },
  },
];

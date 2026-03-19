/**
 * 50 Manager Skill Targets — assignable to team members
 */

export interface ManagerSkillTargetStep {
  id: string;
  type: "module" | "assessment" | "role_play";
  title: string;
  description: string;
  duration?: string;
  referenceId: string;
  skipCondition?: string;
}

export interface ManagerSkillTarget {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  skills: string[];
  steps: ManagerSkillTargetStep[];
  assignedTo: string[]; // user IDs
}

export interface AssigneeProgress {
  userId: string;
  name: string;
  title: string;
  progress: number; // 0-100
  completedSteps: number;
  totalSteps: number;
  lastActivity: string;
  status: "on_track" | "at_risk" | "completed" | "not_started";
}

const team = {
  u6: { name: "Maya Thompson", title: "L1 Support Executive" },
  u8: { name: "Raj Patel", title: "L1 Support Executive" },
  u9: { name: "Lena Okafor", title: "L1 Support Executive" },
};

export const managerSkillTargets: ManagerSkillTarget[] = [
  // ── Communication Foundations (1-5) ──
  { id: "mst1", title: "Communication Foundations", description: "Build core communication skills for customer interactions across channels.", category: "Communication", difficulty: "Beginner", skills: ["Customer Communication", "Email Etiquette", "Phone Support"], assignedTo: ["u6", "u8", "u9"], steps: [
    { id: "s1-1", type: "module", title: "Introduction to Customer Communication", description: "Principles of professional customer communication.", duration: "20 min", referenceId: "m20" },
    { id: "s1-2", type: "module", title: "Email Etiquette for Customer Support", description: "Professional email writing for support teams.", duration: "15 min", referenceId: "m22" },
    { id: "s1-3", type: "module", title: "Phone Support Fundamentals", description: "Master basics of phone-based support.", duration: "25 min", referenceId: "m23" },
    { id: "s1-4", type: "module", title: "Building Rapport with Customers", description: "Creating genuine connections during interactions.", duration: "20 min", referenceId: "m33" },
    { id: "s1-5", type: "module", title: "Tone and Language Guide", description: "Words and phrases that work in support.", duration: "15 min", referenceId: "m37" },
  ]},
  { id: "mst2", title: "Digital Communication Mastery", description: "Excel at chat, email, and digital channels.", category: "Communication", difficulty: "Intermediate", skills: ["Live Chat", "Digital Communication", "Empathy"], assignedTo: ["u6", "u8"], steps: [
    { id: "s2-1", type: "module", title: "Live Chat Support Basics", description: "Dynamics of live chat support.", duration: "20 min", referenceId: "m24" },
    { id: "s2-2", type: "module", title: "Empathy in Digital Communication", description: "Conveying warmth through text.", duration: "20 min", referenceId: "m52" },
    { id: "s2-3", type: "module", title: "Building and Using Macros", description: "Templates that save time.", duration: "15 min", referenceId: "m67" },
    { id: "s2-4", type: "module", title: "Social Media Customer Support", description: "Public-facing support best practices.", duration: "20 min", referenceId: "m59" },
  ]},
  { id: "mst3", title: "Written Communication Excellence", description: "Master professional writing for all support channels.", category: "Communication", difficulty: "Intermediate", skills: ["Writing", "Documentation", "Knowledge Base"], assignedTo: ["u9"], steps: [
    { id: "s3-1", type: "module", title: "Email Etiquette for Customer Support", description: "Professional email writing.", duration: "15 min", referenceId: "m22" },
    { id: "s3-2", type: "module", title: "Case Documentation Best Practices", description: "Writing clear case notes.", duration: "20 min", referenceId: "m17" },
    { id: "s3-3", type: "module", title: "Knowledge Base Content Creation", description: "Writing effective KB articles.", duration: "20 min", referenceId: "m51" },
    { id: "s3-4", type: "module", title: "Internal Communication", description: "Shift handoffs and team chat.", duration: "15 min", referenceId: "m62" },
    { id: "s3-5", type: "assessment", title: "Written Communication Assessment", description: "Test your writing proficiency.", referenceId: "a1" },
  ]},
  { id: "mst4", title: "Multichannel Support Readiness", description: "Provide consistent service across all channels.", category: "Communication", difficulty: "Intermediate", skills: ["Multichannel", "Cross-Channel", "Consistency"], assignedTo: ["u6", "u8"], steps: [
    { id: "s4-1", type: "module", title: "Multichannel Support Overview", description: "Phone, email, chat, social.", duration: "20 min", referenceId: "m36" },
    { id: "s4-2", type: "module", title: "Cross-Channel Support Operations", description: "Seamless cross-channel support.", duration: "30 min", referenceId: "m46" },
    { id: "s4-3", type: "module", title: "Live Chat Support Basics", description: "Chat-specific dynamics.", duration: "20 min", referenceId: "m24" },
    { id: "s4-4", type: "module", title: "Social Media Customer Support", description: "Public interactions.", duration: "20 min", referenceId: "m59" },
  ]},
  { id: "mst5", title: "Active Listening & Rapport", description: "Develop deep listening skills and connection techniques.", category: "Communication", difficulty: "Advanced", skills: ["Active Listening", "Rapport Building", "Empathy"], assignedTo: ["u6", "u8"], steps: [
    { id: "s5-1", type: "module", title: "Building Rapport with Customers", description: "Foundation of trust.", duration: "20 min", referenceId: "m33" },
    { id: "s5-2", type: "module", title: "Advanced Active Listening", description: "Emotional labeling and strategic silence.", duration: "25 min", referenceId: "m45" },
    { id: "s5-3", type: "assessment", title: "Empathy Baseline Assessment", description: "Test empathy skills.", referenceId: "a5" },
    { id: "s5-4", type: "role_play", title: "Empathetic Response Practice", description: "Practice empathy in live scenarios.", referenceId: "rp1" },
    { id: "s5-5", type: "assessment", title: "Empathy Mastery Assessment", description: "Post-training validation.", referenceId: "a6", skipCondition: "Pre-assessment > 80%" },
  ]},

  // ── De-escalation & Empathy (6-10) ──
  { id: "mst6", title: "De-escalation Fundamentals", description: "Learn to calm upset customers and resolve conflicts.", category: "De-escalation", difficulty: "Beginner", skills: ["De-escalation", "Conflict Resolution", "Empathy"], assignedTo: ["u6", "u8", "u9"], steps: [
    { id: "s6-1", type: "module", title: "Understanding Customer Emotions", description: "Psychology of customer emotions.", duration: "25 min", referenceId: "m21" },
    { id: "s6-2", type: "module", title: "Working with Angry Customers", description: "The HEAR method.", duration: "25 min", referenceId: "m40" },
    { id: "s6-3", type: "module", title: "Conflict Resolution in Customer Service", description: "Finding win-win solutions.", duration: "25 min", referenceId: "m61" },
  ]},
  { id: "mst7", title: "Advanced De-escalation Mastery", description: "Handle the most challenging customer interactions.", category: "De-escalation", difficulty: "Advanced", skills: ["Advanced De-escalation", "Crisis Management", "Emotional Intelligence"], assignedTo: ["u6", "u8"], steps: [
    { id: "s7-1", type: "module", title: "Working with Angry Customers", description: "HEAR method refresher.", duration: "25 min", referenceId: "m40" },
    { id: "s7-2", type: "module", title: "Advanced Active Listening", description: "Emotional labeling.", duration: "25 min", referenceId: "m45" },
    { id: "s7-3", type: "module", title: "Advanced De-escalation Strategies", description: "Psychological anchoring, strategic concessions.", duration: "30 min", referenceId: "m70" },
    { id: "s7-4", type: "module", title: "Crisis Communication for Support", description: "Managing major incidents.", duration: "25 min", referenceId: "m71" },
    { id: "s7-5", type: "role_play", title: "De-escalation Scenario", description: "Practice with a frustrated customer.", referenceId: "rp3" },
  ]},
  { id: "mst8", title: "Emotional Intelligence for Support", description: "Develop EQ skills for better customer outcomes.", category: "De-escalation", difficulty: "Intermediate", skills: ["Emotional Intelligence", "Empathy", "Self-Awareness"], assignedTo: ["u6", "u9"], steps: [
    { id: "s8-1", type: "module", title: "Understanding Customer Emotions", description: "Emotional psychology.", duration: "25 min", referenceId: "m21" },
    { id: "s8-2", type: "module", title: "Empathy in Digital Communication", description: "Warmth through text.", duration: "20 min", referenceId: "m52" },
    { id: "s8-3", type: "module", title: "Managing Customer Expectations", description: "Under-promise, over-deliver.", duration: "20 min", referenceId: "m58" },
    { id: "s8-4", type: "assessment", title: "Empathy Baseline", description: "Assess EQ baseline.", referenceId: "a5" },
  ]},
  { id: "mst9", title: "Customer Expectation Management", description: "Set and manage expectations effectively.", category: "De-escalation", difficulty: "Intermediate", skills: ["Expectation Setting", "Communication", "Trust Building"], assignedTo: ["u8"], steps: [
    { id: "s9-1", type: "module", title: "Managing Customer Expectations", description: "Techniques for setting expectations.", duration: "20 min", referenceId: "m58" },
    { id: "s9-2", type: "module", title: "Building Rapport with Customers", description: "Trust-building foundations.", duration: "20 min", referenceId: "m33" },
    { id: "s9-3", type: "module", title: "Proactive Customer Outreach", description: "Don't wait for issues.", duration: "20 min", referenceId: "m65" },
  ]},
  { id: "mst10", title: "Crisis Communication", description: "Handle major incidents and crisis situations.", category: "De-escalation", difficulty: "Expert", skills: ["Crisis Communication", "Incident Management", "Stakeholder Communication"], assignedTo: ["u6", "u8"], steps: [
    { id: "s10-1", type: "module", title: "Crisis Communication for Support", description: "Major incident management.", duration: "25 min", referenceId: "m71" },
    { id: "s10-2", type: "module", title: "Advanced De-escalation Strategies", description: "Psychological techniques.", duration: "30 min", referenceId: "m70" },
    { id: "s10-3", type: "module", title: "Handling Product Recalls", description: "Front-line during recalls.", duration: "20 min", referenceId: "m54" },
    { id: "s10-4", type: "module", title: "Enterprise Incident Management", description: "Enterprise-grade response.", duration: "30 min", referenceId: "m84" },
    { id: "s10-5", type: "role_play", title: "Crisis Scenario Practice", description: "Simulated crisis situation.", referenceId: "rp3" },
  ]},

  // ── CRM & Tools (11-15) ──
  { id: "mst11", title: "CRM Power User", description: "Master CRM tools for efficient customer management.", category: "CRM & Tools", difficulty: "Intermediate", skills: ["CRM", "Data Management", "Workflow Automation"], assignedTo: ["u6", "u8"], steps: [
    { id: "s11-1", type: "module", title: "Introduction to CRM Tools", description: "CRM overview and basics.", duration: "20 min", referenceId: "m25" },
    { id: "s11-2", type: "module", title: "Advanced CRM Workflows", description: "Custom fields, automation.", duration: "30 min", referenceId: "m53" },
    { id: "s11-3", type: "module", title: "Remote Troubleshooting Techniques", description: "Using tools remotely.", duration: "25 min", referenceId: "m60" },
  ]},
  { id: "mst12", title: "Knowledge Base Management", description: "Create and maintain effective knowledge resources.", category: "CRM & Tools", difficulty: "Intermediate", skills: ["Knowledge Management", "Content Creation", "Search Optimization"], assignedTo: ["u9"], steps: [
    { id: "s12-1", type: "module", title: "Knowledge Base Navigation", description: "Efficient KB navigation.", duration: "15 min", referenceId: "m28" },
    { id: "s12-2", type: "module", title: "Knowledge Base Content Creation", description: "Writing effective articles.", duration: "20 min", referenceId: "m51" },
    { id: "s12-3", type: "module", title: "Self-Service Portal Management", description: "FAQ and help content.", duration: "15 min", referenceId: "m44" },
  ]},
  { id: "mst13", title: "Ticket Triage & Queue Management", description: "Efficiently manage support queues and priorities.", category: "CRM & Tools", difficulty: "Beginner", skills: ["Triage", "Priority Management", "Queue Management"], assignedTo: ["u6", "u8", "u9"], steps: [
    { id: "s13-1", type: "module", title: "Introduction to Ticket Triage", description: "Priority classification.", duration: "20 min", referenceId: "m32" },
    { id: "s13-2", type: "module", title: "Queue Management for Support Agents", description: "Time management between tickets.", duration: "15 min", referenceId: "m39" },
    { id: "s13-3", type: "module", title: "Data-Driven Case Prioritization", description: "Smart triage with data.", duration: "15 min", referenceId: "m66" },
  ]},
  { id: "mst14", title: "Automation & Macros", description: "Leverage automation to boost productivity.", category: "CRM & Tools", difficulty: "Intermediate", skills: ["Automation", "Macros", "Productivity"], assignedTo: ["u6", "u8"], steps: [
    { id: "s14-1", type: "module", title: "Building and Using Macros", description: "Effective macro creation.", duration: "15 min", referenceId: "m67" },
    { id: "s14-2", type: "module", title: "Advanced CRM Workflows", description: "Automation rules and triggers.", duration: "30 min", referenceId: "m53" },
    { id: "s14-3", type: "module", title: "Self-Service Portal Management", description: "Reduce ticket volume.", duration: "15 min", referenceId: "m44" },
  ]},
  { id: "mst15", title: "Support Tools Integration", description: "Connect and optimize your support tool stack.", category: "CRM & Tools", difficulty: "Advanced", skills: ["Tool Integration", "API Basics", "System Configuration"], assignedTo: ["u6", "u8"], steps: [
    { id: "s15-1", type: "module", title: "Advanced CRM Workflows", description: "Custom configurations.", duration: "30 min", referenceId: "m53" },
    { id: "s15-2", type: "module", title: "Remote Troubleshooting Techniques", description: "Diagnostic tools.", duration: "25 min", referenceId: "m60" },
    { id: "s15-3", type: "module", title: "CX Technology Stack Mastery", description: "Full tech stack.", duration: "30 min", referenceId: "m90" },
    { id: "s15-4", type: "module", title: "AI and Automation in CX", description: "AI-powered tools.", duration: "30 min", referenceId: "m91" },
  ]},

  // ── Product Knowledge (16-20) ──
  { id: "mst16", title: "Apple Product Ecosystem", description: "Comprehensive understanding of Apple products.", category: "Product Knowledge", difficulty: "Beginner", skills: ["Apple Products", "Hardware", "Software"], assignedTo: ["u6", "u8", "u9"], steps: [
    { id: "s16-1", type: "module", title: "Apple Product Ecosystem Overview", description: "Full range of Apple products.", duration: "25 min", referenceId: "m6" },
    { id: "s16-2", type: "module", title: "iPhone and iPad Basics", description: "iOS device support.", duration: "25 min", referenceId: "m8" },
    { id: "s16-3", type: "module", title: "Mac Basics for Support", description: "macOS fundamentals.", duration: "20 min", referenceId: "m9" },
    { id: "s16-4", type: "module", title: "Apple Ecosystem Deep Dive", description: "Cross-device features.", duration: "25 min", referenceId: "m18" },
    { id: "s16-5", type: "assessment", title: "Apple Fundamentals Assessment", description: "Test product knowledge.", referenceId: "a7" },
  ]},
  { id: "mst17", title: "Apple ID & iCloud Support", description: "Master Apple ID and iCloud troubleshooting.", category: "Product Knowledge", difficulty: "Intermediate", skills: ["Apple ID", "iCloud", "Account Management"], assignedTo: ["u6", "u8", "u9"], steps: [
    { id: "s17-1", type: "module", title: "Apple ID and iCloud Fundamentals", description: "Apple ID management.", duration: "30 min", referenceId: "m7" },
    { id: "s17-2", type: "module", title: "Customer Verification and Privacy", description: "Identity verification.", duration: "20 min", referenceId: "m15" },
    { id: "s17-3", type: "module", title: "Privacy and Data Protection", description: "GDPR and data handling.", duration: "20 min", referenceId: "m35" },
  ]},
  { id: "mst18", title: "Billing & Subscriptions", description: "Handle all billing and subscription queries.", category: "Product Knowledge", difficulty: "Intermediate", skills: ["Billing", "Subscriptions", "Refunds"], assignedTo: ["u6", "u8"], steps: [
    { id: "s18-1", type: "module", title: "Apple Billing and Subscriptions", description: "App Store, iTunes purchases.", duration: "20 min", referenceId: "m11" },
    { id: "s18-2", type: "module", title: "Subscription Billing Basics", description: "Recurring billing models.", duration: "20 min", referenceId: "m42" },
    { id: "s18-3", type: "module", title: "Handling Complex Billing Disputes", description: "Chargebacks and disputes.", duration: "25 min", referenceId: "m47" },
    { id: "s18-4", type: "module", title: "Handling Refund Requests", description: "Refund processes.", duration: "15 min", referenceId: "m31" },
  ]},
  { id: "mst19", title: "Warranty & Repair Expertise", description: "Expert handling of warranty and repair processes.", category: "Product Knowledge", difficulty: "Intermediate", skills: ["Warranty", "Repair", "AppleCare"], assignedTo: ["u8", "u9"], steps: [
    { id: "s19-1", type: "module", title: "Warranty and Repair Processes", description: "Coverage and repair flow.", duration: "25 min", referenceId: "m12" },
    { id: "s19-2", type: "module", title: "Warranty Claim Assessment", description: "Evaluating claims.", duration: "25 min", referenceId: "m55" },
    { id: "s19-3", type: "module", title: "Product Return Process", description: "Returns and exchanges.", duration: "15 min", referenceId: "m38" },
    { id: "s19-4", type: "module", title: "Apple Service Options", description: "Service channels.", duration: "20 min", referenceId: "m14" },
  ]},
  { id: "mst20", title: "Enterprise Product Deep Dive", description: "Master enterprise-grade product knowledge.", category: "Product Knowledge", difficulty: "Advanced", skills: ["Enterprise Suite", "Competitive Analysis", "Solution Selling"], assignedTo: ["u6", "u8"], steps: [
    { id: "s20-1", type: "module", title: "Enterprise Suite Overview", description: "Core platform capabilities.", duration: "30 min", referenceId: "m3" },
    { id: "s20-2", type: "module", title: "Competitive Positioning", description: "Against key competitors.", duration: "20 min", referenceId: "m4" },
    { id: "s20-3", type: "assessment", title: "Product Basics Assessment", description: "Test product knowledge.", referenceId: "a3" },
    { id: "s20-4", type: "assessment", title: "Product Mastery Assessment", description: "Advanced product test.", referenceId: "a4", skipCondition: "Pre-assessment > 80%" },
  ]},

  // ── Quality Assurance (21-25) ──
  { id: "mst21", title: "Quality Standards Fundamentals", description: "Learn QA standards for customer support.", category: "Quality Assurance", difficulty: "Beginner", skills: ["Quality Assurance", "Standards", "Compliance"], assignedTo: ["u6", "u8", "u9"], steps: [
    { id: "s21-1", type: "module", title: "Understanding SLAs", description: "Response and resolution targets.", duration: "15 min", referenceId: "m29" },
    { id: "s21-2", type: "module", title: "Introduction to CSAT and NPS", description: "Satisfaction metrics.", duration: "15 min", referenceId: "m34" },
    { id: "s21-3", type: "module", title: "Case Documentation Best Practices", description: "Clear case notes.", duration: "20 min", referenceId: "m17" },
  ]},
  { id: "mst22", title: "Performance Metrics Mastery", description: "Understand and optimize all CX metrics.", category: "Quality Assurance", difficulty: "Intermediate", skills: ["Metrics", "Analytics", "Performance"], assignedTo: ["u6", "u8"], steps: [
    { id: "s22-1", type: "module", title: "Introduction to CSAT and NPS", description: "Core metrics.", duration: "15 min", referenceId: "m34" },
    { id: "s22-2", type: "module", title: "Performance Metrics Deep Dive", description: "AHT, FCR, CSAT, NPS.", duration: "20 min", referenceId: "m56" },
    { id: "s22-3", type: "module", title: "Predictive CX Analytics", description: "Data-driven insights.", duration: "30 min", referenceId: "m92" },
  ]},
  { id: "mst23", title: "SLA Management", description: "Master SLA tracking and compliance.", category: "Quality Assurance", difficulty: "Intermediate", skills: ["SLA", "Escalation", "Priority Management"], assignedTo: ["u6"], steps: [
    { id: "s23-1", type: "module", title: "Understanding SLAs", description: "SLA basics.", duration: "15 min", referenceId: "m29" },
    { id: "s23-2", type: "module", title: "SLA Management and Escalation", description: "Breach risk and proactive escalation.", duration: "25 min", referenceId: "m50" },
    { id: "s23-3", type: "module", title: "Escalation Procedures", description: "When and how to escalate.", duration: "15 min", referenceId: "m16" },
  ]},
  { id: "mst24", title: "Privacy & Compliance", description: "Data protection and privacy for support teams.", category: "Quality Assurance", difficulty: "Intermediate", skills: ["Privacy", "GDPR", "Data Protection"], assignedTo: ["u6", "u8", "u9"], steps: [
    { id: "s24-1", type: "module", title: "Privacy and Data Protection", description: "GDPR and data handling.", duration: "20 min", referenceId: "m35" },
    { id: "s24-2", type: "module", title: "Customer Verification Basics", description: "Identity verification.", duration: "15 min", referenceId: "m27" },
    { id: "s24-3", type: "module", title: "Customer Verification and Privacy", description: "Apple privacy protocols.", duration: "20 min", referenceId: "m15" },
  ]},
  { id: "mst25", title: "Accessibility in Support", description: "Ensure support is accessible to all customers.", category: "Quality Assurance", difficulty: "Intermediate", skills: ["Accessibility", "Inclusion", "WCAG"], assignedTo: ["u9"], steps: [
    { id: "s25-1", type: "module", title: "Accessibility in Customer Support", description: "WCAG guidelines.", duration: "20 min", referenceId: "m64" },
    { id: "s25-2", type: "module", title: "Empathy in Digital Communication", description: "Inclusive communication.", duration: "20 min", referenceId: "m52" },
    { id: "s25-3", type: "module", title: "Customer Segmentation for Support", description: "Adjusting approach by need.", duration: "20 min", referenceId: "m63" },
  ]},

  // ── Customer Retention (26-30) ──
  { id: "mst26", title: "Customer Retention Playbook", description: "Strategies to retain customers and reduce churn.", category: "Customer Retention", difficulty: "Advanced", skills: ["Retention", "Churn Prevention", "Customer Loyalty"], assignedTo: ["u6", "u8"], steps: [
    { id: "s26-1", type: "module", title: "Subscription Retention Strategies", description: "Save the relationship.", duration: "25 min", referenceId: "m48" },
    { id: "s26-2", type: "module", title: "Managing Customer Expectations", description: "Set and exceed expectations.", duration: "20 min", referenceId: "m58" },
    { id: "s26-3", type: "module", title: "Customer Loyalty Programs", description: "Design loyalty programs.", duration: "25 min", referenceId: "m82" },
    { id: "s26-4", type: "module", title: "Revenue Impact of CX", description: "CX and business outcomes.", duration: "25 min", referenceId: "m83" },
  ]},
  { id: "mst27", title: "Proactive Customer Care", description: "Move from reactive to proactive support.", category: "Customer Retention", difficulty: "Intermediate", skills: ["Proactive Support", "Customer Outreach", "Prevention"], assignedTo: ["u6", "u8"], steps: [
    { id: "s27-1", type: "module", title: "Proactive Customer Outreach", description: "Monitor and act before issues arise.", duration: "20 min", referenceId: "m65" },
    { id: "s27-2", type: "module", title: "Customer Feedback Loops", description: "Capture actionable insights.", duration: "15 min", referenceId: "m41" },
    { id: "s27-3", type: "module", title: "Customer Education Programs", description: "Educated customers = fewer tickets.", duration: "25 min", referenceId: "m68" },
  ]},
  { id: "mst28", title: "Customer Journey Excellence", description: "Understand and optimize the full customer journey.", category: "Customer Retention", difficulty: "Advanced", skills: ["Journey Mapping", "Touchpoint Optimization", "CX Design"], assignedTo: ["u6", "u8"], steps: [
    { id: "s28-1", type: "module", title: "Customer Journey Mapping", description: "Read and use journey maps.", duration: "20 min", referenceId: "m49" },
    { id: "s28-2", type: "module", title: "Customer Segmentation for Support", description: "VIP vs standard.", duration: "20 min", referenceId: "m63" },
    { id: "s28-3", type: "module", title: "Customer Onboarding Essentials", description: "First experience matters.", duration: "25 min", referenceId: "m30" },
    { id: "s28-4", type: "module", title: "Customer Experience Design Thinking", description: "Design-led CX.", duration: "30 min", referenceId: "m94" },
  ]},
  { id: "mst29", title: "Feedback & Insights", description: "Turn customer feedback into actionable improvements.", category: "Customer Retention", difficulty: "Intermediate", skills: ["Feedback Analysis", "VOC", "Continuous Improvement"], assignedTo: ["u9"], steps: [
    { id: "s29-1", type: "module", title: "Customer Feedback Loops", description: "Feedback collection and routing.", duration: "15 min", referenceId: "m41" },
    { id: "s29-2", type: "module", title: "Introduction to CSAT and NPS", description: "Measuring satisfaction.", duration: "15 min", referenceId: "m34" },
    { id: "s29-3", type: "module", title: "Voice of Customer Program Design", description: "Systematic VOC.", duration: "25 min", referenceId: "m93" },
  ]},
  { id: "mst30", title: "Onboarding Excellence", description: "Create outstanding first-time experiences.", category: "Customer Retention", difficulty: "Beginner", skills: ["Onboarding", "First Impressions", "Setup Support"], assignedTo: ["u6", "u8", "u9"], steps: [
    { id: "s30-1", type: "module", title: "Customer Onboarding Essentials", description: "Welcome flows and setup.", duration: "25 min", referenceId: "m30" },
    { id: "s30-2", type: "module", title: "Customer Education Programs", description: "Tutorial content.", duration: "25 min", referenceId: "m68" },
    { id: "s30-3", type: "module", title: "Building Rapport with Customers", description: "Connection from day one.", duration: "20 min", referenceId: "m33" },
  ]},

  // ── Troubleshooting (31-35) ──
  { id: "mst31", title: "Basic Troubleshooting", description: "Systematic approach to problem-solving.", category: "Troubleshooting", difficulty: "Beginner", skills: ["Troubleshooting", "Problem Solving", "Diagnostics"], assignedTo: ["u6", "u8", "u9"], steps: [
    { id: "s31-1", type: "module", title: "Basic Troubleshooting Methodology", description: "Identify, Isolate, Resolve.", duration: "20 min", referenceId: "m43" },
    { id: "s31-2", type: "module", title: "Guided Troubleshooting Workflows", description: "Decision trees and tools.", duration: "30 min", referenceId: "m13" },
    { id: "s31-3", type: "module", title: "First Call Resolution Principles", description: "Resolve in one contact.", duration: "20 min", referenceId: "m26" },
  ]},
  { id: "mst32", title: "Intermediate Troubleshooting", description: "Handle complex multi-system issues.", category: "Troubleshooting", difficulty: "Intermediate", skills: ["Complex Troubleshooting", "Multi-system", "Diagnostics"], assignedTo: ["u8"], steps: [
    { id: "s32-1", type: "module", title: "Intermediate Troubleshooting Workflows", description: "Multi-system issues.", duration: "30 min", referenceId: "m69" },
    { id: "s32-2", type: "module", title: "Remote Troubleshooting Techniques", description: "Remote diagnostics.", duration: "25 min", referenceId: "m60" },
    { id: "s32-3", type: "module", title: "Collaborative Problem Solving", description: "Cross-team resolution.", duration: "25 min", referenceId: "m57" },
  ]},
  { id: "mst33", title: "Advanced Diagnostics", description: "Expert-level technical problem-solving.", category: "Troubleshooting", difficulty: "Advanced", skills: ["Advanced Diagnostics", "Root Cause Analysis", "Technical Support"], assignedTo: ["u6", "u8"], steps: [
    { id: "s33-1", type: "module", title: "Advanced Troubleshooting Frameworks", description: "Root cause analysis.", duration: "30 min", referenceId: "m73" },
    { id: "s33-2", type: "module", title: "Enterprise Incident Management", description: "Enterprise-grade response.", duration: "30 min", referenceId: "m84" },
    { id: "s33-3", type: "module", title: "Technical Writing for Support", description: "Clear technical docs.", duration: "25 min", referenceId: "m72" },
    { id: "s33-4", type: "module", title: "CX Technology Stack Mastery", description: "Tech stack knowledge.", duration: "30 min", referenceId: "m90" },
  ]},
  { id: "mst34", title: "Device Handling & Repair", description: "Hands-on device handling skills.", category: "Troubleshooting", difficulty: "Intermediate", skills: ["Device Handling", "Hardware", "Diagnostics"], assignedTo: ["u8", "u9"], steps: [
    { id: "s34-1", type: "module", title: "Classroom: Live Device Handling Lab", description: "Hands-on practice.", duration: "60 min", referenceId: "m10" },
    { id: "s34-2", type: "module", title: "iPhone and iPad Basics", description: "iOS device support.", duration: "25 min", referenceId: "m8" },
    { id: "s34-3", type: "module", title: "Mac Basics for Support", description: "macOS fundamentals.", duration: "20 min", referenceId: "m9" },
  ]},
  { id: "mst35", title: "Remote Support Specialist", description: "Excel at remote troubleshooting.", category: "Troubleshooting", difficulty: "Intermediate", skills: ["Remote Support", "Screen Sharing", "Remote Diagnostics"], assignedTo: ["u6"], steps: [
    { id: "s35-1", type: "module", title: "Remote Troubleshooting Techniques", description: "Guiding customers remotely.", duration: "25 min", referenceId: "m60" },
    { id: "s35-2", type: "module", title: "Live Chat Support Basics", description: "Chat-based support.", duration: "20 min", referenceId: "m24" },
    { id: "s35-3", type: "module", title: "Intermediate Troubleshooting Workflows", description: "Complex scenarios.", duration: "30 min", referenceId: "m69" },
  ]},

  // ── Support Operations (36-40) ──
  { id: "mst36", title: "Support Operations Essentials", description: "Core operational skills for support teams.", category: "Operations", difficulty: "Beginner", skills: ["Operations", "Process", "Efficiency"], assignedTo: ["u6", "u8", "u9"], steps: [
    { id: "s36-1", type: "module", title: "Introduction to Ticket Triage", description: "Priority classification.", duration: "20 min", referenceId: "m32" },
    { id: "s36-2", type: "module", title: "Queue Management", description: "Managing your queue.", duration: "15 min", referenceId: "m39" },
    { id: "s36-3", type: "module", title: "Understanding SLAs", description: "Service level agreements.", duration: "15 min", referenceId: "m29" },
    { id: "s36-4", type: "module", title: "Internal Communication", description: "Team coordination.", duration: "15 min", referenceId: "m62" },
  ]},
  { id: "mst37", title: "Escalation & Handoff Mastery", description: "Perfect the art of escalation and transitions.", category: "Operations", difficulty: "Intermediate", skills: ["Escalation", "Handoff", "Cross-team"], assignedTo: ["u6", "u8"], steps: [
    { id: "s37-1", type: "module", title: "Escalation Procedures", description: "When and how to escalate.", duration: "15 min", referenceId: "m16" },
    { id: "s37-2", type: "module", title: "SLA Management and Escalation", description: "Breach risk management.", duration: "25 min", referenceId: "m50" },
    { id: "s37-3", type: "module", title: "Collaborative Problem Solving", description: "Cross-team resolution.", duration: "25 min", referenceId: "m57" },
    { id: "s37-4", type: "module", title: "Internal Communication", description: "Shift handoffs.", duration: "15 min", referenceId: "m62" },
  ]},
  { id: "mst38", title: "Self-Service Strategy", description: "Build and optimize self-service capabilities.", category: "Operations", difficulty: "Intermediate", skills: ["Self-Service", "Portal Management", "Deflection"], assignedTo: ["u6", "u8"], steps: [
    { id: "s38-1", type: "module", title: "Self-Service Portal Management", description: "FAQ and help content.", duration: "15 min", referenceId: "m44" },
    { id: "s38-2", type: "module", title: "Knowledge Base Content Creation", description: "Effective articles.", duration: "20 min", referenceId: "m51" },
    { id: "s38-3", type: "module", title: "Customer Education Programs", description: "Reduce ticket volume.", duration: "25 min", referenceId: "m68" },
  ]},
  { id: "mst39", title: "Refunds & Returns Processing", description: "Handle refunds, returns, and exchanges smoothly.", category: "Operations", difficulty: "Beginner", skills: ["Refunds", "Returns", "Policy"], assignedTo: ["u6", "u8", "u9"], steps: [
    { id: "s39-1", type: "module", title: "Handling Refund Requests", description: "Refund processes.", duration: "15 min", referenceId: "m31" },
    { id: "s39-2", type: "module", title: "Product Return Process", description: "Returns and exchanges.", duration: "15 min", referenceId: "m38" },
    { id: "s39-3", type: "module", title: "Subscription Billing Basics", description: "Proration and billing.", duration: "20 min", referenceId: "m42" },
  ]},
  { id: "mst40", title: "Process Optimization", description: "Identify and implement operational improvements.", category: "Operations", difficulty: "Advanced", skills: ["Process Improvement", "Lean", "Efficiency"], assignedTo: ["u6", "u8"], steps: [
    { id: "s40-1", type: "module", title: "Performance Metrics Deep Dive", description: "Full metric spectrum.", duration: "20 min", referenceId: "m56" },
    { id: "s40-2", type: "module", title: "Data-Driven Case Prioritization", description: "Smart prioritization.", duration: "15 min", referenceId: "m66" },
    { id: "s40-3", type: "module", title: "Operational Excellence Frameworks", description: "Six Sigma and LEAN.", duration: "30 min", referenceId: "m85" },
    { id: "s40-4", type: "module", title: "AI and Automation in CX", description: "AI-powered optimization.", duration: "30 min", referenceId: "m91" },
  ]},

  // ── Leadership & Coaching (41-45) ──
  { id: "mst41", title: "Team Leadership Foundations", description: "Core leadership skills for aspiring team leads.", category: "Leadership", difficulty: "Advanced", skills: ["Leadership", "Coaching", "Team Development"], assignedTo: ["u6", "u8"], steps: [
    { id: "s41-1", type: "module", title: "Support Team Leadership", description: "Leading support teams.", duration: "25 min", referenceId: "m74" },
    { id: "s41-2", type: "module", title: "Coaching and Mentoring in CX", description: "Develop your team.", duration: "25 min", referenceId: "m75" },
    { id: "s41-3", type: "module", title: "Quality Assurance and Calibration", description: "Maintaining standards.", duration: "25 min", referenceId: "m76" },
    { id: "s41-4", type: "role_play", title: "Leadership Scenario", description: "Coaching conversation practice.", referenceId: "rp1" },
  ]},
  { id: "mst42", title: "Performance Coaching", description: "Coach team members to improve performance.", category: "Leadership", difficulty: "Advanced", skills: ["Coaching", "Performance Management", "Feedback"], assignedTo: ["u3", "u4"], steps: [
    { id: "s42-1", type: "module", title: "Coaching and Mentoring in CX", description: "Coaching techniques.", duration: "25 min", referenceId: "m75" },
    { id: "s42-2", type: "module", title: "Quality Assurance and Calibration", description: "Score calibration.", duration: "25 min", referenceId: "m76" },
    { id: "s42-3", type: "module", title: "Performance Metrics Deep Dive", description: "Metrics-driven coaching.", duration: "20 min", referenceId: "m56" },
  ]},
  { id: "mst43", title: "Change Management for CX", description: "Lead teams through organizational change.", category: "Leadership", difficulty: "Expert", skills: ["Change Management", "Communication", "Stakeholder Management"], assignedTo: ["u3"], steps: [
    { id: "s43-1", type: "module", title: "Change Management for CX", description: "Leading through change.", duration: "25 min", referenceId: "m77" },
    { id: "s43-2", type: "module", title: "Support Team Leadership", description: "Team leadership context.", duration: "25 min", referenceId: "m74" },
    { id: "s43-3", type: "module", title: "Strategic CX Consulting", description: "CX strategy skills.", duration: "30 min", referenceId: "m89" },
  ]},
  { id: "mst44", title: "Quality Calibration Expert", description: "Master quality calibration and scoring.", category: "Leadership", difficulty: "Advanced", skills: ["Quality Calibration", "Scoring", "Standards"], assignedTo: ["u3", "u4"], steps: [
    { id: "s44-1", type: "module", title: "Quality Assurance and Calibration", description: "Calibration sessions.", duration: "25 min", referenceId: "m76" },
    { id: "s44-2", type: "module", title: "Performance Metrics Deep Dive", description: "Quality metrics.", duration: "20 min", referenceId: "m56" },
    { id: "s44-3", type: "module", title: "Advanced Reporting and Dashboards", description: "Visualize quality data.", duration: "25 min", referenceId: "m79" },
  ]},
  { id: "mst45", title: "Workforce Planning", description: "Plan and optimize support team capacity.", category: "Leadership", difficulty: "Expert", skills: ["Workforce Planning", "Capacity", "Scheduling"], assignedTo: ["u3"], steps: [
    { id: "s45-1", type: "module", title: "Workforce Planning for CX", description: "Demand forecasting.", duration: "25 min", referenceId: "m78" },
    { id: "s45-2", type: "module", title: "Operational Excellence Frameworks", description: "LEAN principles.", duration: "30 min", referenceId: "m85" },
    { id: "s45-3", type: "module", title: "Predictive CX Analytics", description: "Predictive staffing.", duration: "30 min", referenceId: "m92" },
  ]},

  // ── Analytics & Strategy (46-50) ──
  { id: "mst46", title: "CX Analytics Fundamentals", description: "Data-driven decision making in CX.", category: "Analytics", difficulty: "Intermediate", skills: ["Analytics", "Data Analysis", "Reporting"], assignedTo: ["u2", "u3", "u4"], steps: [
    { id: "s46-1", type: "module", title: "Introduction to CSAT and NPS", description: "Core metrics.", duration: "15 min", referenceId: "m34" },
    { id: "s46-2", type: "module", title: "Performance Metrics Deep Dive", description: "Full metric spectrum.", duration: "20 min", referenceId: "m56" },
    { id: "s46-3", type: "module", title: "Advanced Reporting and Dashboards", description: "Build dashboards.", duration: "25 min", referenceId: "m79" },
  ]},
  { id: "mst47", title: "Predictive Analytics for CX", description: "Use data to predict and prevent issues.", category: "Analytics", difficulty: "Expert", skills: ["Predictive Analytics", "Machine Learning", "Forecasting"], assignedTo: ["u3", "u4"], steps: [
    { id: "s47-1", type: "module", title: "Predictive CX Analytics", description: "AI-driven insights.", duration: "30 min", referenceId: "m92" },
    { id: "s47-2", type: "module", title: "AI and Automation in CX", description: "AI tools.", duration: "30 min", referenceId: "m91" },
    { id: "s47-3", type: "module", title: "Data-Driven Case Prioritization", description: "Smart triage.", duration: "15 min", referenceId: "m66" },
  ]},
  { id: "mst48", title: "CX Strategy & Design Thinking", description: "Strategic CX thinking and design approaches.", category: "Strategy", difficulty: "Expert", skills: ["CX Strategy", "Design Thinking", "Innovation"], assignedTo: ["u3"], steps: [
    { id: "s48-1", type: "module", title: "Customer Experience Design Thinking", description: "Design-led CX.", duration: "30 min", referenceId: "m94" },
    { id: "s48-2", type: "module", title: "Strategic CX Consulting", description: "CX consulting skills.", duration: "30 min", referenceId: "m89" },
    { id: "s48-3", type: "module", title: "Voice of Customer Program Design", description: "VOC programs.", duration: "25 min", referenceId: "m93" },
    { id: "s48-4", type: "module", title: "Global CX Operations", description: "Cross-cultural CX.", duration: "30 min", referenceId: "m88" },
  ]},
  { id: "mst49", title: "Global Support Operations", description: "Manage support across regions and cultures.", category: "Strategy", difficulty: "Expert", skills: ["Global Operations", "Localization", "Cultural Intelligence"], assignedTo: ["u3", "u4"], steps: [
    { id: "s49-1", type: "module", title: "Global CX Operations", description: "Cross-cultural support.", duration: "30 min", referenceId: "m88" },
    { id: "s49-2", type: "module", title: "Strategic CX Consulting", description: "Strategic thinking.", duration: "30 min", referenceId: "m89" },
    { id: "s49-3", type: "module", title: "Workforce Planning for CX", description: "Global capacity.", duration: "25 min", referenceId: "m78" },
  ]},
  { id: "mst50", title: "AI-Powered Support Transformation", description: "Transform support with AI and automation.", category: "Strategy", difficulty: "Expert", skills: ["AI", "Automation", "Digital Transformation"], assignedTo: ["u3", "u4"], steps: [
    { id: "s50-1", type: "module", title: "AI and Automation in CX", description: "AI tools and bots.", duration: "30 min", referenceId: "m91" },
    { id: "s50-2", type: "module", title: "CX Technology Stack Mastery", description: "Full tech stack.", duration: "30 min", referenceId: "m90" },
    { id: "s50-3", type: "module", title: "Predictive CX Analytics", description: "Predictive AI.", duration: "30 min", referenceId: "m92" },
    { id: "s50-4", type: "module", title: "Customer Experience Design Thinking", description: "Redesign with AI.", duration: "30 min", referenceId: "m94" },
  ]},
];

// Generate mock progress for all assignments
function generateProgress(target: ManagerSkillTarget): AssigneeProgress[] {
  return target.assignedTo.map((userId) => {
    const member = team[userId as keyof typeof team];
    if (!member) return null;
    const total = target.steps.length;
    const rand = Math.random();
    let progress: number, completed: number, status: AssigneeProgress["status"], lastActivity: string;

    if (rand < 0.1) {
      progress = 0; completed = 0; status = "not_started"; lastActivity = "—";
    } else if (rand < 0.25) {
      progress = 100; completed = total; status = "completed"; lastActivity = "1 day ago";
    } else if (rand < 0.55) {
      completed = Math.max(1, Math.floor(Math.random() * total));
      progress = Math.round((completed / total) * 100);
      status = "on_track"; lastActivity = `${Math.floor(Math.random() * 3) + 1} days ago`;
    } else {
      completed = Math.max(1, Math.floor(Math.random() * (total - 1)));
      progress = Math.round((completed / total) * 100);
      status = "at_risk"; lastActivity = `${Math.floor(Math.random() * 7) + 4} days ago`;
    }

    return { userId, name: member.name, title: member.title, progress, completedSteps: completed, totalSteps: total, lastActivity, status };
  }).filter(Boolean) as AssigneeProgress[];
}

// Seeded progress (stable across renders)
let _cache: Record<string, AssigneeProgress[]> | null = null;
export function getAssigneeProgress(): Record<string, AssigneeProgress[]> {
  if (_cache) return _cache;
  _cache = {};
  for (const t of managerSkillTargets) {
    _cache[t.id] = generateProgress(t);
  }
  return _cache;
}

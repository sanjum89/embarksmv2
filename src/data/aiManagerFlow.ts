/* AI Manager — scripted flow data & mock content */

export interface FlowStep {
  id: number;
  aiMessage: string;
  /** If set, render a structured card instead of markdown */
  card?: "assessment" | "training" | "roleplay" | "skillTarget" | "progress";
  /** Quick-reply buttons the learner can click */
  replies?: { label: string; nextStep: number }[];
  /** Auto-advance to next step (used after card interactions) */
  autoNext?: number;
}

export const assessmentQuestions = [
  {
    question: "A customer says their iPhone won't charge. What's the first troubleshooting step?",
    options: [
      "Replace the battery",
      "Check the charging cable and port for debris",
      "Perform a factory reset",
      "Escalate to L2 support",
    ],
    correct: 1,
  },
  {
    question: "Which tool do you use to look up a customer's AppleCare coverage?",
    options: [
      "Apple Configurator",
      "GSX (Global Service Exchange)",
      "Xcode",
      "TestFlight",
    ],
    correct: 1,
  },
  {
    question: "A customer is frustrated and raising their voice. What's the best approach?",
    options: [
      "Match their energy to show urgency",
      "Put them on hold immediately",
      "Acknowledge their frustration, empathize, then offer a solution",
      "Transfer to a manager right away",
    ],
    correct: 2,
  },
  {
    question: "What does 'Active Listening' mean in a support context?",
    options: [
      "Waiting silently for the customer to finish",
      "Repeating back what the customer said to confirm understanding",
      "Taking notes without responding",
      "Asking rapid-fire questions",
    ],
    correct: 1,
  },
];

export const trainingModules = [
  { title: "Apple Product Ecosystem Overview", duration: "25 min", icon: "module" as const },
  { title: "Apple ID & iCloud Fundamentals", duration: "20 min", icon: "module" as const },
  { title: "Customer De-escalation Techniques", duration: "15 min", icon: "module" as const },
];

export const rolePlayScenario = {
  title: "Angry Customer — Billing Issue",
  difficulty: "Beginner",
  description: "A customer calls in upset about an unexpected charge on their Apple account. Practice empathy, active listening, and resolution.",
  duration: "10 min",
};

export const generatedSkillTarget = {
  title: "Apple L1 Support — Core Competency",
  modules: [
    { title: "Apple Product Ecosystem Overview", type: "module" as const, status: "completed" as const },
    { title: "Apple ID & iCloud Fundamentals", type: "module" as const, status: "in_progress" as const },
    { title: "Customer De-escalation Techniques", type: "module" as const, status: "available" as const },
  ],
  assessment: { title: "L1 Support Certification Quiz", type: "assessment" as const, status: "locked" as const },
};

export const mockProgress = {
  assessmentScore: 65,
  modulesCompleted: 2,
  modulesTotal: 3,
  rolePlayDone: true,
  skillTargetProgress: 60,
};

export function buildFlowSteps(firstName: string): FlowStep[] {
  return [
    // Step 0: Greeting
    {
      id: 0,
      aiMessage: `👋 Hey ${firstName}! Welcome aboard — I'm your **AI Manager**, and I'll be guiding you through your first 30 days.\n\nI'm here to help you ramp up quickly with assessments, training, role plays, and coaching. Think of me as your personal onboarding companion.\n\nLet's start with a quick question to get to know you better!`,
      replies: [
        { label: "Sounds great, let's go! 🚀", nextStep: 1 },
        { label: "Tell me more about the program first", nextStep: 3 },
      ],
    },
    // Step 1: Onboarding Q1
    {
      id: 1,
      aiMessage: `Great energy! 💪 Quick question — **have you worked in customer support before?**`,
      replies: [
        { label: "Yes, I have some experience", nextStep: 2 },
        { label: "No, this is my first time", nextStep: 2 },
        { label: "A little — internships mostly", nextStep: 2 },
      ],
    },
    // Step 2: Onboarding Q2
    {
      id: 2,
      aiMessage: `Thanks for sharing! That helps me tailor your journey. Here's another one — **what are you most excited about in this role?**`,
      replies: [
        { label: "Helping people solve problems", nextStep: 3 },
        { label: "Learning about Apple products", nextStep: 3 },
        { label: "Growing my career in tech", nextStep: 3 },
      ],
    },
    // Step 3: Training goal
    {
      id: 3,
      aiMessage: `Love it! 🎯 Here's what your **first 30 days** look like:\n\n**Goal:** Become a confident, certified Apple L1 Support agent.\n\n**How we get there:**\n1. ✅ Take a baseline assessment to see where you stand\n2. 📚 Complete targeted training modules based on your gaps\n3. 🎭 Practice with realistic role play scenarios\n4. 🏆 Pass the final certification assessment\n\nReady to see where you stand? Let's take a quick assessment!`,
      replies: [
        { label: "Let's do the assessment!", nextStep: 4 },
        { label: "I'm a bit nervous, but okay", nextStep: 4 },
      ],
    },
    // Step 4: Assessment
    {
      id: 4,
      aiMessage: `Here's your **Baseline Assessment** — 4 quick questions about Apple support fundamentals. Take your time! 📝`,
      card: "assessment",
      // After assessment, flow engine checks score and routes to 6 or 7
    },
    // Step 5: Score < 80% bridge (auto-set by page logic)
    {
      id: 5,
      aiMessage: `You scored **{score}%** — not bad for a start! There are a few areas we can strengthen. I've put together some targeted training modules for you. 📚`,
      card: "training",
      replies: [
        { label: "I'll review these, thanks!", nextStep: 7 },
        { label: "Can I retake the assessment later?", nextStep: 7 },
      ],
    },
    // Step 6: Score >= 80% bridge
    {
      id: 6,
      aiMessage: `🎉 Amazing — you scored **{score}%**! You clearly have strong fundamentals. Let's challenge you with a role play to build practical skills.`,
      autoNext: 7,
    },
    // Step 7: Role Play
    {
      id: 7,
      aiMessage: `Time to put your skills to the test! Here's a beginner role play scenario for you. 🎭`,
      card: "roleplay",
      replies: [
        { label: "That was helpful!", nextStep: 8 },
      ],
    },
    // Step 8: Skill Target generated
    {
      id: 8,
      aiMessage: `Excellent work! Based on your assessment and role play, I've created a personalized **Learning Path** for you. Complete these modules and the final assessment to earn your certification. 🏆\n\nTake your time — I'll be here when you come back!`,
      card: "skillTarget",
      replies: [
        { label: "I'll work on this and come back!", nextStep: 9 },
      ],
    },
    // Step 9: Resume state
    {
      id: 9,
      aiMessage: `Welcome back, ${firstName}! 👋 Great to see you again.\n\nI can see you've been busy — let me pull up your progress...`,
      autoNext: 10,
    },
    // Step 10: Progress card
    {
      id: 10,
      aiMessage: `Here's a summary of where you stand. You're making solid progress! 📊`,
      card: "progress",
      replies: [
        { label: "What should I focus on next?", nextStep: 11 },
        { label: "I have a question about work", nextStep: 11 },
      ],
    },
    // Step 11: Open coaching
    {
      id: 11,
      aiMessage: `You're doing really well, ${firstName}! 🌟\n\nHere's what I'd suggest for this week:\n\n1. **Complete the remaining module** — "Customer De-escalation Techniques" is next\n2. **Practice one more role play** — try the intermediate level this time\n3. **Take the final assessment** once all modules are done\n\nRemember, I'm always here if you need help, have questions about work, or just want to talk through a tricky customer situation. Just type away! 💬`,
    },
  ];
}

/** Simple keyword responder for free-form chat after scripted flow */
export function coachingResponse(input: string, firstName: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("help") || lower.includes("stuck"))
    return `No worries, ${firstName}! Let's break it down. What specifically are you finding challenging? I can walk you through it step by step. 🤝`;
  if (lower.includes("customer") || lower.includes("angry") || lower.includes("upset"))
    return `Great question! When dealing with upset customers, remember the **ACE framework**:\n\n- **A**cknowledge their frustration\n- **C**larify the issue\n- **E**mpathize and offer a path forward\n\nWould you like to practice this in a role play?`;
  if (lower.includes("assessment") || lower.includes("test") || lower.includes("quiz"))
    return `You can retake assessments anytime to track your improvement. Your last score was **65%** — I bet you'll do better after completing the training modules! 📈`;
  if (lower.includes("schedule") || lower.includes("time") || lower.includes("busy"))
    return `I understand, ${firstName}. Here's a tip: try to dedicate just **20 minutes a day** to your learning path. Even small consistent effort adds up fast! ⏰`;
  if (lower.includes("good") || lower.includes("great") || lower.includes("thanks"))
    return `You're welcome! Keep up the amazing work, ${firstName}. You're on track to hit your 30-day goals! 🚀`;
  return `That's a great point, ${firstName}! I'm here to support you throughout your onboarding. You can ask me about:\n\n- 📚 Your training modules\n- 🎭 Role play practice\n- 📊 Your progress and scores\n- 💡 Tips for handling customers\n\nWhat would you like to explore?`;
}

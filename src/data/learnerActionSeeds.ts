import type { ActionFeedItem } from "@/lib/actionCentre/itemKinds";

/**
 * Persona-coherent learner notifications for the Action Centre.
 * Keyed by employeeId. Each persona gets a realistic Now/Today/Week mix
 * so the demo always has something to triage.
 */
export const LEARNER_ACTION_SEEDS: Record<string, ActionFeedItem[]> = {
  // Clara — mid IM, primary onboarding persona
  "rb-l6": [
    {
      id: "clara-overdue-m4",
      kind: "overdue",
      priority: "now",
      category: "learning",
      title: "Module 4 · Reflection is 2 days overdue",
      detail: "Submit your reflection on the IM Code of Ethics to unlock Chapter 5.",
      when: "Due 2d ago",
      ctas: [
        { label: "Open module", variant: "default", href: "/embark" },
        { label: "Snooze 1d", variant: "ghost", onAction: "snooze" },
      ],
    },
    {
      id: "clara-mentor-margaret",
      kind: "mentor_message",
      priority: "now",
      category: "mention",
      title: "Margaret Atherton left feedback on your reflection",
      detail: "“Strong framing on suitability — let’s pressure-test the conflict-of-interest section.”",
      actor: "Margaret Atherton · Mentor",
      when: "1h ago",
      ctas: [
        { label: "Reply", variant: "default", href: "/chat" },
        { label: "Open thread", variant: "outline", href: "/chat" },
      ],
    },
    {
      id: "clara-kudos-mgr",
      kind: "kudos",
      priority: "today",
      category: "recognition",
      title: "Kudos from your manager",
      detail: "“Loved how you turned the discretionary-mandate role play around.”",
      actor: "Manager",
      when: "5h ago",
      ctas: [{ label: "Say thanks", variant: "outline", onAction: "ack" }],
    },
    {
      id: "clara-assessment-80",
      kind: "assessment_result",
      priority: "today",
      category: "learning",
      title: "Suitability assessment · 80%",
      detail: "Two questions on cross-border reporting tripped you up.",
      when: "Today",
      ctas: [{ label: "Review answers", variant: "outline", href: "/embark" }],
    },
    {
      id: "clara-peer-theo",
      kind: "peer_session_request",
      priority: "this_week",
      category: "mention",
      title: "Theo wants a 20-min peer session on portfolio risk",
      actor: "Theo Calder",
      when: "Yesterday",
      ctas: [
        { label: "Accept", variant: "default", onAction: "ack" },
        { label: "Suggest time", variant: "outline", onAction: "ack" },
      ],
    },
    // AI rail
    {
      id: "clara-ai-gap",
      kind: "ai_skill_gap",
      priority: "today",
      category: "ai",
      ai: true,
      title: "Likely gap: cross-border reporting",
      detail: "Based on your last 3 assessment misses, a 15-min top-up would close this.",
      when: "AI suggestion",
      ctas: [{ label: "Build me a 15-min top-up", variant: "default", onAction: "ai-build" }],
    },
    {
      id: "clara-ai-micro",
      kind: "ai_microlearning_offer",
      priority: "this_week",
      category: "ai",
      ai: true,
      title: "Adapted micro-path ready",
      detail: "We tuned Chapter 5 for your 80% score — heavier on case studies, lighter on theory.",
      when: "AI suggestion",
      ctas: [{ label: "Open adapted path", variant: "default", href: "/embark" }],
    },
  ],

  // Theo — early IM
  "rb-l3": [
    {
      id: "theo-due-m3",
      kind: "due_soon",
      priority: "now",
      category: "learning",
      title: "Module 3 · Chapter 6 due in 6h",
      detail: "Finish the listening chapter on client onboarding to stay on plan.",
      when: "Due in 6h",
      ctas: [{ label: "Resume chapter", variant: "default", href: "/embark" }],
    },
    {
      id: "theo-mentor-clara",
      kind: "mentor_message",
      priority: "today",
      category: "mention",
      title: "Clara replied to your portfolio risk question",
      actor: "Clara Wren · Peer mentor",
      when: "3h ago",
      ctas: [{ label: "Open thread", variant: "default", href: "/chat" }],
    },
    {
      id: "theo-shoutout",
      kind: "team_shoutout",
      priority: "today",
      category: "recognition",
      title: "Onboarding cohort shoutout",
      detail: "You and 3 peers crossed the 50% mark this week.",
      when: "Today",
    },
    {
      id: "theo-ai-peer",
      kind: "ai_microlearning_offer",
      priority: "this_week",
      category: "ai",
      ai: true,
      title: "3 peers just finished Chapter 6",
      detail: "Want to schedule a 15-min sync to compare notes?",
      when: "AI suggestion",
      ctas: [{ label: "Find me a peer", variant: "default", onAction: "ai-build" }],
    },
    {
      id: "theo-ai-gap",
      kind: "ai_skill_gap",
      priority: "later",
      category: "ai",
      ai: true,
      title: "Behavioural skill thin spot: client framing",
      detail: "Inferred from your last 2 role plays. A short role play would help.",
      when: "AI suggestion",
      ctas: [{ label: "Try a role play", variant: "default", href: "/role-play" }],
    },
  ],

  // Sophie — early outside-FS, struggling
  "rb-l1": [
    {
      id: "sophie-overdue-m2",
      kind: "overdue",
      priority: "now",
      category: "learning",
      title: "Module 2 is 4 days overdue",
      detail: "You paused mid-chapter. We've kept your progress — pick up where you left off.",
      when: "Due 4d ago",
      ctas: [
        { label: "Resume module", variant: "default", href: "/embark" },
        { label: "Ask for an extension", variant: "outline", onAction: "ack" },
      ],
    },
    {
      id: "sophie-mentor-felix",
      kind: "mentor_message",
      priority: "now",
      category: "mention",
      title: "Felix checked in",
      detail: "“Saw you paused — anything blocking you? Happy to jump on a call.”",
      actor: "Felix Arden · Mentor",
      when: "30m ago",
      ctas: [{ label: "Reply", variant: "default", href: "/chat" }],
    },
    {
      id: "sophie-ai-path",
      kind: "ai_path_adapted",
      priority: "today",
      category: "ai",
      ai: true,
      title: "We re-shaped your path",
      detail: "Switched Module 2 to listening-first format based on your engagement signals.",
      when: "AI suggestion",
      ctas: [{ label: "See what changed", variant: "default", href: "/embark" }],
    },
    {
      id: "sophie-ai-gap",
      kind: "ai_skill_gap",
      priority: "this_week",
      category: "ai",
      ai: true,
      title: "FS vocab is the biggest blocker",
      detail: "Want a 10-min glossary primer before Module 3?",
      when: "AI suggestion",
      ctas: [{ label: "Build the primer", variant: "default", onAction: "ai-build" }],
    },
  ],
};

export function learnerSeedsFor(employeeId: string | undefined | null): ActionFeedItem[] {
  if (!employeeId) return [];
  return LEARNER_ACTION_SEEDS[employeeId] ?? [];
}

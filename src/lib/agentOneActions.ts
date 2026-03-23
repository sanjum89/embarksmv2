/* ─── Agent One Notification Helpers ─── */
import type {
  AgentOneNotification,
  AgentOneGroupedCard,
  ActionCategory,
  ActionStatus,
  CTAType,
  PastelColorToken,
} from "@/types/agentOneActions";
import { CATEGORY_COLOR_MAP, CATEGORY_ICON_MAP } from "@/types/agentOneActions";

/**
 * Group notifications by groupingKey into stacked cards.
 */
export function groupNotifications(items: AgentOneNotification[]): AgentOneGroupedCard[] {
  const groups = new Map<string, AgentOneNotification[]>();

  for (const item of items) {
    const key = item.grouping_key || item.category || item.id || "ungrouped";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }

  const result: AgentOneGroupedCard[] = [];

  for (const [key, groupItems] of groups) {
    const category = groupItems[0].category;
    const count = groupItems.length;
    const summaryLine = count === 1
      ? groupItems[0].title
      : buildGroupSummary(category, count);

    const colorToken = CATEGORY_COLOR_MAP[category] || "sky";
    const icon = CATEGORY_ICON_MAP[category] || "Bell";

    const primaryCta = {
      label: groupItems[0].cta_label,
      type: groupItems[0].cta_action.type,
      path: groupItems[0].cta_action.path,
    };

    result.push({
      groupingKey: key,
      category,
      count,
      summaryLine,
      primaryCta,
      colorToken,
      icon,
      items: groupItems,
    });
  }

  // Sort by priority: high > medium > low
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  result.sort((a, b) => {
    const pa = priorityOrder[a.items[0].priority] ?? 1;
    const pb = priorityOrder[b.items[0].priority] ?? 1;
    return pa - pb;
  });

  return result;
}

function buildGroupSummary(category: ActionCategory, count: number): string {
  const labels: Record<ActionCategory, string> = {
    onboarding_progress: "onboarding updates",
    recognition_kudos: "kudos ready",
    reflection_request: "team members need reflections",
    one_on_one_recommended: "one-on-one actions",
    mentor_action: "mentoring actions",
    promotion_development: "development actions",
  };
  return `${count} ${labels[category] || "notifications"}`;
}

/**
 * Filter notifications by category.
 */
export function filterByCategory(
  items: AgentOneNotification[],
  category: ActionCategory
): AgentOneNotification[] {
  return items.filter((n) => n.category === category);
}

/**
 * Filter notifications by status(es).
 */
export function filterByStatus(
  items: AgentOneNotification[],
  statuses: ActionStatus[]
): AgentOneNotification[] {
  return items.filter((n) => {
    const status = n.viewed ? "seen" : "new";
    return statuses.includes(status as ActionStatus);
  });
}

/**
 * Count actionable (new + seen) notifications.
 */
export function countActionable(items: AgentOneNotification[]): number {
  return items.filter((n) => !n.viewed || n.metadata?.status === "new" || n.metadata?.status === "seen").length;
}

/**
 * Resolve a CTA type to a navigation target.
 */
export function resolveCtaTarget(
  ctaType: CTAType,
  employeeIds?: string[],
  metadata?: Record<string, unknown>
): { path: string; prompt?: string } {
  const empId = employeeIds?.[0];

  switch (ctaType) {
    case "open_employee_summary":
      return { path: empId ? `/admin?employee=${empId}` : "/admin" };
    case "open_action_center":
      return { path: "/inbox" };
    case "send_kudos":
      return { path: "/chat", prompt: empId ? `Send kudos to employee ${empId}` : "Send kudos" };
    case "request_reflection":
      return { path: "/chat", prompt: empId ? `Request a reflection from employee ${empId}` : "Request reflections" };
    case "setup_one_on_one":
      return { path: "/chat", prompt: empId ? `Schedule a 1:1 with employee ${empId}` : "Schedule a 1:1" };
    case "assign_mentor":
      return { path: "/chat", prompt: empId ? `Assign a mentor to employee ${empId}` : "Assign a mentor" };
    case "create_development_plan":
      return { path: empId ? `/admin?employee=${empId}&tab=development` : "/admin" };
    case "open_inbox":
      return { path: "/inbox" };
    case "open_agentone_chat":
      return { path: "/chat", prompt: metadata?.prompt as string };
    default:
      return { path: "/" };
  }
}

/**
 * Get pastel color token for a category.
 */
export function getCategoryColor(category: ActionCategory): PastelColorToken {
  return CATEGORY_COLOR_MAP[category] || "sky";
}

/**
 * Get icon name for a category.
 */
export function getCategoryIcon(category: ActionCategory): string {
  return CATEGORY_ICON_MAP[category] || "Bell";
}

/* ─── Category-First Stacked Card Helpers ─── */

export interface CategoryCard {
  category: ActionCategory;
  count: number;
  title: string;
  subtitle: string;
  colorToken: PastelColorToken;
  icon: string;
  primaryCta: { type: CTAType; path?: string; prompt?: string };
  items: AgentOneNotification[];
}

const MANAGER_CATEGORY_PRIORITY: ActionCategory[] = [
  "onboarding_progress",
  "one_on_one_recommended",
  "promotion_development",
  "recognition_kudos",
  "reflection_request",
  "mentor_action",
];

const LEARNER_CATEGORY_PRIORITY: ActionCategory[] = [
  "onboarding_progress",
  "reflection_request",
  "recognition_kudos",
  "promotion_development",
  "one_on_one_recommended",
  "mentor_action",
];

export type AudienceKey = "manager" | "learner" | "admin";

const MANAGER_LABELS: Record<ActionCategory, { title: string; subtitle: (n: number) => string }> = {
  onboarding_progress: {
    title: "New Hires!",
    subtitle: (n) => `You have ${n} new hire${n !== 1 ? "s" : ""}. Click to view their progress.`,
  },
  reflection_request: {
    title: "Reflections posted!",
    subtitle: (n) => `${n} of your team members have shared reflections. Check them out.`,
  },
  one_on_one_recommended: {
    title: "Actions required!",
    subtitle: (n) => `${n} team member${n !== 1 ? "s" : ""} need${n === 1 ? "s" : ""} immediate attention.`,
  },
  recognition_kudos: {
    title: "Recognition",
    subtitle: (n) => `${n} recognition item${n !== 1 ? "s" : ""} to review.`,
  },
  promotion_development: {
    title: "Promotion & Development",
    subtitle: (n) => `${n} team member${n !== 1 ? "s" : ""} flagged for development.`,
  },
  mentor_action: {
    title: "Mentoring",
    subtitle: (n) => `${n} mentoring action${n !== 1 ? "s" : ""} pending.`,
  },
};

const LEARNER_LABELS: Record<ActionCategory, { title: string; subtitle: (n: number) => string }> = {
  onboarding_progress: {
    title: "Your onboarding journey is ready",
    subtitle: () => "You've been assigned an onboarding journey. Click to begin.",
  },
  reflection_request: {
    title: "Your manager has requested a reflection",
    subtitle: () => "Share how your onboarding experience has been going so far.",
  },
  recognition_kudos: {
    title: "Kudos received!",
    subtitle: () => "You've received recognition from your team.",
  },
  promotion_development: {
    title: "Development plan",
    subtitle: () => "A development plan has been created for you.",
  },
  one_on_one_recommended: {
    title: "1:1 scheduled",
    subtitle: () => "You have a one-on-one meeting coming up.",
  },
  mentor_action: {
    title: "Mentor assigned",
    subtitle: () => "You've been paired with a mentor.",
  },
};

/**
 * Group notifications by category and apply audience-aware labels.
 */
export function groupByCategory(
  notifications: AgentOneNotification[],
  audienceType: AudienceKey
): CategoryCard[] {
  const map = new Map<ActionCategory, AgentOneNotification[]>();

  for (const n of notifications) {
    const cat = n.category;
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(n);
  }

  const labels = audienceType === "learner" ? LEARNER_LABELS : MANAGER_LABELS;
  const priority = audienceType === "learner" ? LEARNER_CATEGORY_PRIORITY : MANAGER_CATEGORY_PRIORITY;

  const cards: CategoryCard[] = [];

  // Audience-aware CTA overrides
  const ctaOverrides: Record<AudienceKey, Partial<Record<ActionCategory, { type: CTAType; path?: string; prompt?: string }>>> = {
    manager: {
      onboarding_progress: { type: "open_action_center", path: "/team-dashboard" },
    },
    learner: {
      onboarding_progress: { type: "open_agentone_chat", prompt: "I'm ready to start my onboarding journey. What should I do first?" },
      reflection_request: { type: "open_agentone_chat", prompt: "My manager has requested a reflection to hear about my onboarding experience. How are you finding things so far?" },
    },
  };

  for (const [cat, items] of map) {
    const label = labels[cat];
    if (!label) continue;

    const firstCta = items[0].cta_action;
    let primaryCta: { type: CTAType; path?: string; prompt?: string } = {
      type: firstCta.type,
      path: firstCta.path,
      prompt: firstCta.prompt,
    };

    // Apply audience-aware override if available
    const override = ctaOverrides[audienceType]?.[cat];
    if (override) {
      primaryCta = override;
    }

    cards.push({
      category: cat,
      count: items.length,
      title: label.title,
      subtitle: label.subtitle(items.length),
      colorToken: CATEGORY_COLOR_MAP[cat] || "sky",
      icon: CATEGORY_ICON_MAP[cat] || "Bell",
      primaryCta,
      items,
    });
  }

  // Sort by priority array
  cards.sort((a, b) => {
    const ia = priority.indexOf(a.category);
    const ib = priority.indexOf(b.category);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  return cards;
}

/**
 * Build a personalized summary line for the top summary card.
 */
export function buildPersonalizedSummary(
  userName: string,
  categoryCards: CategoryCard[],
  audienceType: AudienceKey
): string {
  if (categoryCards.length === 0) return `Hey ${userName}, you're all caught up!`;

  const totalCount = categoryCards.reduce((s, c) => s + c.count, 0);

  if (audienceType === "manager" || audienceType === "admin") {
    const parts: string[] = [];
    for (const c of categoryCards) {
      switch (c.category) {
        case "onboarding_progress":
          parts.push("new hires");
          break;
        case "reflection_request":
          parts.push("reflections from your team");
          break;
        case "one_on_one_recommended":
          parts.push("critical action items");
          break;
        case "recognition_kudos":
          parts.push("recognition updates");
          break;
        case "promotion_development":
          parts.push("development actions");
          break;
        case "mentor_action":
          parts.push("mentoring tasks");
          break;
      }
    }

    if (parts.length === 0) return `Hey ${userName}, you have ${totalCount} updates`;
    if (parts.length === 1) return `Hey ${userName}, you have ${parts[0]}`;
    const last = parts.pop()!;
    return `Hey ${userName}, you have ${parts.join(", ")}, and ${last}`;
  }

  // Learner
  const parts: string[] = [];
  for (const c of categoryCards) {
    switch (c.category) {
      case "onboarding_progress":
        parts.push("an onboarding journey");
        break;
      case "reflection_request":
        parts.push("reflections assigned to you");
        break;
      case "recognition_kudos":
        parts.push("kudos from your team");
        break;
      case "promotion_development":
        parts.push("a development plan");
        break;
      case "one_on_one_recommended":
        parts.push("a scheduled 1:1");
        break;
      case "mentor_action":
        parts.push("a mentor pairing");
        break;
    }
  }

  const hasOnboarding = categoryCards.some((c) => c.category === "onboarding_progress");
  const greeting = hasOnboarding ? `Welcome onboard, ${userName}!` : `Hey ${userName},`;

  if (parts.length === 0) return `${greeting} You have ${totalCount} updates`;
  if (parts.length === 1) return `${greeting} You have ${parts[0]}`;
  const last = parts.pop()!;
  return `${greeting} You have ${parts.join(", ")}, and ${last}`;
}

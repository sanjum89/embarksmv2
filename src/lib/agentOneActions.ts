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

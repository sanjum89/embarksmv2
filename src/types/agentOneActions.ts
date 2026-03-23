/* ─── Agent One Notification/Event Types ─── */

/* ─── Categories ─── */
export type ActionCategory =
  | "onboarding_progress"
  | "recognition_kudos"
  | "reflection_request"
  | "one_on_one_recommended"
  | "mentor_action"
  | "promotion_development";

/* ─── Event Types ─── */
export type EventType =
  | "onboarding_started"
  | "onboarding_midpoint_reached"
  | "onboarding_assigned"
  | "manager_new_hires_present"
  | "assessment_completed"
  | "assessment_passed"
  | "role_play_completed"
  | "kudos_sent"
  | "reflection_requested"
  | "reflection_submitted"
  | "one_on_one_requested"
  | "one_on_one_scheduled"
  | "mentor_assigned"
  | "development_plan_created"
  | "promotion_candidate_flagged"
  | "rising_star_flagged"
  | "underperformance_flagged"
  // Admin summary events
  | "onboarding_summary"
  | "rising_star_summary"
  | "underperformance_summary"
  | "promotion_summary";

/* ─── CTA Types ─── */
export type CTAType =
  | "open_employee_summary"
  | "open_action_center"
  | "send_kudos"
  | "request_reflection"
  | "setup_one_on_one"
  | "assign_mentor"
  | "create_development_plan"
  | "open_inbox"
  | "open_agentone_chat";

/* ─── Audience ─── */
export type AudienceType = "admin" | "manager" | "learner" | "shared";

/* ─── Notification Status ─── */
export type ActionStatus = "new" | "seen" | "completed" | "dismissed";

/* ─── Pastel Color Tokens ─── */
export type PastelColorToken = "sky" | "mint" | "lavender" | "peach" | "lilac" | "sand";

export const CATEGORY_COLOR_MAP: Record<ActionCategory, PastelColorToken> = {
  onboarding_progress: "sky",
  recognition_kudos: "mint",
  reflection_request: "lavender",
  one_on_one_recommended: "peach",
  mentor_action: "lilac",
  promotion_development: "sand",
};

export const PASTEL_TAILWIND_MAP: Record<PastelColorToken, { bg: string; text: string; border: string }> = {
  sky: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
  mint: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  lavender: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
  peach: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  lilac: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  sand: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
};

export const CATEGORY_ICON_MAP: Record<ActionCategory, string> = {
  onboarding_progress: "GraduationCap",
  recognition_kudos: "Award",
  reflection_request: "MessageSquare",
  one_on_one_recommended: "Users",
  mentor_action: "Handshake",
  promotion_development: "TrendingUp",
};

/* ─── Agent One Event (DB shape) ─── */
export interface AgentOneEvent {
  id?: string;
  account_id: string;
  event_type: EventType;
  category: ActionCategory;
  source_user_id?: string;
  source_employee_id?: string;
  target_user_id?: string;
  target_employee_id?: string;
  related_employee_ids: string[];
  related_skill_target_id?: string;
  related_role_play_id?: string;
  related_assessment_id?: string;
  related_mentor_employee_id?: string;
  status: "pending" | "processed" | "failed";
  payload: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

/* ─── Mentor Assignment ─── */
export interface MentorAssignment {
  id?: string;
  account_id: string;
  mentor_employee_id: string;
  mentee_employee_id: string;
  assigned_by_user_id: string;
  reason?: string;
  focus_areas: string[];
  status: "active" | "completed" | "cancelled";
  start_date?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

/* ─── Agent One Notification (extended nudge_card) ─── */
export interface AgentOneNotification {
  id?: string;
  account_id: string;
  target_user_id: string;
  recipient_employee_id?: string;
  audience_type: AudienceType;
  category: ActionCategory;
  grouping_key?: string;
  source_event_id?: string;
  type: string;
  title: string;
  subtitle: string;
  color_theme: string;
  cta_label: string;
  cta_action: { type: CTAType; path?: string; prompt?: string; employeeIds?: string[] };
  priority: "high" | "medium" | "low";
  metadata: Record<string, unknown>;
  viewed: boolean;
  created_by: string;
  secondary_actions?: { label: string; type: CTAType; path?: string }[];
  due_at?: string;
}

/* ─── Grouped Card (for stacked UI) ─── */
export interface AgentOneGroupedCard {
  groupingKey: string;
  category: ActionCategory;
  count: number;
  summaryLine: string;
  primaryCta: { label: string; type: CTAType; path?: string };
  colorToken: PastelColorToken;
  icon: string;
  items: AgentOneNotification[];
}

/* ─── Trigger Output ─── */
export interface TriggerOutput {
  recipientUserId: string;
  recipientEmployeeId?: string;
  audienceType: AudienceType;
  category: ActionCategory;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaType: CTAType;
  ctaPath?: string;
  priority: "high" | "medium" | "low";
  groupingKey: string;
  metadata?: Record<string, unknown>;
  secondaryActions?: { label: string; type: CTAType; path?: string }[];
}

/* ─── Demo Scenarios Config ─── */
export interface DemoScenarios {
  onboardingLearnerEmployeeId: string;
  risingStarEmployeeId: string;
  underperformerEmployeeId: string;
  promotionCandidateEmployeeId: string;
  managerEmployeeId: string;
  adminEmployeeId: string;
  reflectionTargetEmployeeIds: string[];
}

/* ─── Event-to-Category Mapping ─── */
export const EVENT_CATEGORY_MAP: Record<EventType, ActionCategory> = {
  onboarding_started: "onboarding_progress",
  onboarding_midpoint_reached: "onboarding_progress",
  assessment_completed: "onboarding_progress",
  assessment_passed: "onboarding_progress",
  role_play_completed: "onboarding_progress",
  kudos_sent: "recognition_kudos",
  reflection_requested: "reflection_request",
  reflection_submitted: "reflection_request",
  one_on_one_requested: "one_on_one_recommended",
  one_on_one_scheduled: "one_on_one_recommended",
  mentor_assigned: "mentor_action",
  development_plan_created: "promotion_development",
  promotion_candidate_flagged: "promotion_development",
  rising_star_flagged: "recognition_kudos",
  underperformance_flagged: "one_on_one_recommended",
  onboarding_summary: "onboarding_progress",
  rising_star_summary: "recognition_kudos",
  underperformance_summary: "one_on_one_recommended",
  promotion_summary: "promotion_development",
};

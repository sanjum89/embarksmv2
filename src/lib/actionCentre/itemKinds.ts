import {
  AlertTriangle, Clock, MessageSquareReply, Users, Award, Megaphone,
  ClipboardCheck, Hand, FileText, Sparkles, Wand2, Activity, BookOpen,
  type LucideIcon,
} from "lucide-react";

export type ActionKind =
  | "due_soon"
  | "overdue"
  | "mentor_message"
  | "peer_session_request"
  | "kudos"
  | "team_shoutout"
  | "assessment_result"
  | "ai_skill_gap"
  | "ai_microlearning_offer"
  | "ai_path_adapted"
  | "approval_request"
  | "raised_hand"
  | "reflection_review";

export type ActionPriority = "now" | "today" | "this_week" | "later";
export type ActionCategory = "mention" | "approval" | "ai" | "learning" | "recognition";

export interface ActionCTA {
  label: string;
  variant?: "default" | "outline" | "ghost";
  href?: string;
  onAction?: string; // event name, resolved by parent
  payload?: Record<string, unknown>;
}

export interface ActionFeedItem {
  id: string;
  kind: ActionKind;
  priority: ActionPriority;
  category: ActionCategory;
  title: string;
  detail?: string;
  actor?: string; // e.g. mentor name, "Manager"
  when: string;  // human-readable "2h ago", "Due in 6h"
  /** ISO timestamp used for sorting only */
  ts?: string;
  href?: string;
  ctas?: ActionCTA[];
  /** Original source object, kept around for parent handlers (e.g. manager approvals). */
  source?: unknown;
  /** Used by AI suggestions stream. */
  ai?: boolean;
}

interface KindMeta {
  icon: LucideIcon;
  label: string;
  category: ActionCategory;
  /** Tailwind text color token used for icon + accent. */
  tone: string;
  /** Tailwind border color token for the left rail. */
  rail: string;
}

export const KIND_META: Record<ActionKind, KindMeta> = {
  overdue:                { icon: AlertTriangle,    label: "Overdue",          category: "learning",    tone: "text-rose-600",    rail: "border-l-rose-500"  },
  due_soon:               { icon: Clock,            label: "Due soon",         category: "learning",    tone: "text-amber-600",   rail: "border-l-amber-500" },
  mentor_message:         { icon: MessageSquareReply,label: "Mentor",          category: "mention",     tone: "text-blue-600",    rail: "border-l-blue-500"  },
  peer_session_request:   { icon: Users,            label: "Peer request",     category: "mention",     tone: "text-violet-600",  rail: "border-l-violet-500"},
  kudos:                  { icon: Award,            label: "Kudos",            category: "recognition", tone: "text-emerald-600", rail: "border-l-emerald-500"},
  team_shoutout:          { icon: Megaphone,        label: "Team shoutout",    category: "recognition", tone: "text-emerald-600", rail: "border-l-emerald-500"},
  assessment_result:      { icon: Activity,         label: "Assessment",       category: "learning",    tone: "text-indigo-600",  rail: "border-l-indigo-500"},
  ai_skill_gap:           { icon: Sparkles,         label: "AI insight",       category: "ai",          tone: "text-primary",     rail: "border-l-primary"   },
  ai_microlearning_offer: { icon: Wand2,            label: "AI suggestion",    category: "ai",          tone: "text-primary",     rail: "border-l-primary"   },
  ai_path_adapted:        { icon: Sparkles,         label: "Path adapted",     category: "ai",          tone: "text-primary",     rail: "border-l-primary"   },
  approval_request:       { icon: ClipboardCheck,   label: "Approval",         category: "approval",    tone: "text-emerald-700", rail: "border-l-emerald-600"},
  raised_hand:            { icon: Hand,             label: "Raised hand",      category: "mention",     tone: "text-rose-600",    rail: "border-l-rose-500"  },
  reflection_review:      { icon: FileText,         label: "Reflection",       category: "approval",    tone: "text-blue-600",    rail: "border-l-blue-500"  },
};

export const PRIORITY_RANK: Record<ActionPriority, number> = {
  now: 0, today: 1, this_week: 2, later: 3,
};

export const PRIORITY_LABEL: Record<ActionPriority, string> = {
  now: "Now",
  today: "Today",
  this_week: "This week",
  later: "Later",
};

export const CATEGORY_LABEL: Record<ActionCategory, string> = {
  mention: "Mention",
  approval: "Approval",
  ai: "AI",
  learning: "Learning",
  recognition: "Recognition",
};

export type CategoryFilter = "all" | "mentions" | "approvals" | "ai";

export function matchesFilter(item: ActionFeedItem, filter: CategoryFilter): boolean {
  if (filter === "all") return true;
  if (filter === "mentions") return item.category === "mention";
  if (filter === "approvals") return item.category === "approval";
  if (filter === "ai") return item.category === "ai";
  return true;
}

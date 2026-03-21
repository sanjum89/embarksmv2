import { Calendar, Star, MessageSquare, CheckSquare, AlertCircle, Bell, LucideIcon } from "lucide-react";

export type NotificationType = "meeting" | "kudos" | "reflection" | "task_due" | "feedback" | "system";
export type Priority = "high" | "medium" | "low";

export interface InboxNotification {
  id: string;
  type: NotificationType;
  icon: LucideIcon;
  title: string;
  message: string;
  from?: string;
  time: string;
  date: string;
  read: boolean;
  priority: Priority;
  actionLabel?: string;
}

export const inboxNotifications: InboxNotification[] = [
  {
    id: "n1",
    type: "meeting",
    icon: Calendar,
    title: "1:1 Meeting Scheduled",
    message: "Your manager has scheduled a 1:1 for Friday at 2pm to discuss your onboarding progress.",
    time: "2 hours ago",
    date: "2026-03-21T10:00:00Z",
    read: false,
    priority: "high",
    actionLabel: "Join Meeting",
  },
  {
    id: "n2",
    type: "kudos",
    icon: Star,
    title: "Kudos Received! 🌟",
    message: "Great job completing the Introduction to Rathbones ahead of schedule. Keep up the momentum!",
    from: "Marcus Wellington",
    time: "Yesterday",
    date: "2026-03-20T14:30:00Z",
    read: false,
    priority: "medium",
    actionLabel: "View Details",
  },
  {
    id: "n3",
    type: "reflection",
    icon: MessageSquare,
    title: "Reflection Requested",
    message: "Your manager would like to hear how your first week is going. Share your thoughts on what's working and any challenges you're facing.",
    time: "2 days ago",
    date: "2026-03-19T09:00:00Z",
    read: true,
    priority: "medium",
    actionLabel: "Respond",
  },
  {
    id: "n4",
    type: "task_due",
    icon: CheckSquare,
    title: "Compliance Training Due Tomorrow",
    message: "Your 'Anti-Money Laundering Basics' module is due by end of day tomorrow. You're 80% through — finish strong!",
    time: "3 hours ago",
    date: "2026-03-21T09:00:00Z",
    read: false,
    priority: "high",
    actionLabel: "Continue Training",
  },
  {
    id: "n5",
    type: "feedback",
    icon: MessageSquare,
    title: "Peer Feedback Available",
    message: "Sarah Chen has shared feedback on your client onboarding presentation. Review it to see what went well and areas to refine.",
    from: "Sarah Chen",
    time: "Yesterday",
    date: "2026-03-20T11:15:00Z",
    read: false,
    priority: "medium",
    actionLabel: "View Feedback",
  },
  {
    id: "n6",
    type: "system",
    icon: Bell,
    title: "New Learning Path Assigned",
    message: "You've been enrolled in the 'Client Relationship Management' learning path. 6 modules, estimated 4 hours total.",
    time: "3 days ago",
    date: "2026-03-18T08:00:00Z",
    read: true,
    priority: "low",
    actionLabel: "View Path",
  },
  {
    id: "n7",
    type: "kudos",
    icon: Star,
    title: "Team Shoutout 🎉",
    message: "The Wealth Management team recognised your contribution to the Q1 client review deck. Well done!",
    from: "Team Lead",
    time: "4 days ago",
    date: "2026-03-17T16:00:00Z",
    read: true,
    priority: "low",
  },
  {
    id: "n8",
    type: "task_due",
    icon: CheckSquare,
    title: "Goal Check-In Overdue",
    message: "Your monthly goal check-in was due yesterday. Please update your progress on your current skill targets.",
    time: "1 day ago",
    date: "2026-03-20T08:00:00Z",
    read: false,
    priority: "high",
    actionLabel: "Update Goals",
  },
  {
    id: "n9",
    type: "meeting",
    icon: Calendar,
    title: "Team Standup Tomorrow",
    message: "Weekly team standup is scheduled for Monday at 9:30am. Prepare a brief update on your onboarding milestones.",
    time: "5 hours ago",
    date: "2026-03-21T07:00:00Z",
    read: true,
    priority: "low",
    actionLabel: "Add to Calendar",
  },
  {
    id: "n10",
    type: "system",
    icon: AlertCircle,
    title: "Profile Update Required",
    message: "Please complete your emergency contact details and dietary preferences before your first office day.",
    time: "5 days ago",
    date: "2026-03-16T10:00:00Z",
    read: true,
    priority: "medium",
    actionLabel: "Update Profile",
  },
];

export const notificationTypeLabels: Record<NotificationType, string> = {
  meeting: "Meetings",
  kudos: "Kudos",
  reflection: "Reflections",
  task_due: "Tasks",
  feedback: "Feedback",
  system: "System",
};

export const notificationTypeStyles: Record<NotificationType, string> = {
  meeting: "bg-info/10 text-info border-info/20",
  kudos: "bg-accent/10 text-accent border-accent/20",
  reflection: "bg-primary/10 text-primary border-primary/20",
  task_due: "bg-destructive/10 text-destructive border-destructive/20",
  feedback: "bg-secondary text-secondary-foreground border-secondary",
  system: "bg-muted text-muted-foreground border-border",
};

export const priorityStyles: Record<Priority, { dot: string; label: string }> = {
  high: { dot: "bg-destructive", label: "High" },
  medium: { dot: "bg-accent", label: "Medium" },
  low: { dot: "bg-muted-foreground/40", label: "Low" },
};

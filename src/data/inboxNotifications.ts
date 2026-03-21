import { Calendar, Star, MessageSquare, LucideIcon } from "lucide-react";

export interface InboxNotification {
  id: string;
  type: "one_on_one" | "kudos" | "reflection_request";
  icon: LucideIcon;
  title: string;
  message: string;
  from?: string;
  time: string;
  read: boolean;
}

export const inboxNotifications: InboxNotification[] = [
  {
    id: "n1",
    type: "one_on_one",
    icon: Calendar,
    title: "1:1 Meeting Scheduled",
    message: "Your manager has scheduled a 1:1 for Friday at 2pm to discuss your onboarding progress.",
    time: "2 hours ago",
    read: false,
  },
  {
    id: "n2",
    type: "kudos",
    icon: Star,
    title: "Kudos Received! 🌟",
    message: "Great job completing the Introduction to Rathbones ahead of schedule. Keep up the momentum!",
    from: "Marcus Wellington",
    time: "Yesterday",
    read: false,
  },
  {
    id: "n3",
    type: "reflection_request",
    icon: MessageSquare,
    title: "Reflection Requested",
    message: "Your manager would like to hear how your first week is going. Share your thoughts on what's working and any challenges you're facing.",
    time: "2 days ago",
    read: true,
  },
];

export const notificationTypeStyles: Record<InboxNotification["type"], string> = {
  one_on_one: "bg-info/10 text-info border-info/20",
  kudos: "bg-accent/10 text-accent border-accent/20",
  reflection_request: "bg-primary/10 text-primary border-primary/20",
};

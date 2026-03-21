import { Calendar, BookOpen, MessageSquare, ClipboardList, Star, LucideIcon } from "lucide-react";

export type NudgeCTAAction =
  | { type: "navigate"; path: string }
  | { type: "chat"; prompt: string }
  | { type: "navigate-and-chat"; path: string; prompt: string };

export interface ManagerNudge {
  id: string;
  title: string;
  subtitle: string;
  from: string;
  icon: LucideIcon;
  priority: "high" | "medium" | "low";
  /** Tailwind color token prefix — e.g. "blue", "emerald", "amber" */
  colorTheme: "blue" | "emerald" | "amber" | "violet" | "rose";
  ctaLabel: string;
  ctaAction: NudgeCTAAction;
}

export const managerNudges: ManagerNudge[] = [
  {
    id: "mn-1",
    title: "1:1 Meeting with Marcus",
    subtitle: "Scheduled for Friday at 2 pm — prepare your onboarding update.",
    from: "Marcus Wellington",
    icon: Calendar,
    priority: "high",
    colorTheme: "blue",
    ctaLabel: "View",
    ctaAction: { type: "navigate-and-chat", path: "/my-inbox", prompt: "Help me prepare for my 1:1 meeting with Marcus on Friday" },
  },
  {
    id: "mn-2",
    title: "Complete Compliance Training",
    subtitle: "AML Basics is due tomorrow — you're 80% through.",
    from: "Marcus Wellington",
    icon: BookOpen,
    priority: "high",
    colorTheme: "amber",
    ctaLabel: "Continue",
    ctaAction: { type: "navigate", path: "/skill-target/RAT-ST-001" },
  },
  {
    id: "mn-3",
    title: "Share Your Weekly Reflection",
    subtitle: "Your manager wants to hear how your first week went.",
    from: "Marcus Wellington",
    icon: MessageSquare,
    priority: "medium",
    colorTheme: "violet",
    ctaLabel: "Reflect",
    ctaAction: { type: "chat", prompt: "Help me write a reflection on my first week at Rathbones" },
  },
  {
    id: "mn-4",
    title: "Skills Assessment Due",
    subtitle: "Take the adaptive assessment to personalise your learning path.",
    from: "System",
    icon: ClipboardList,
    priority: "medium",
    colorTheme: "emerald",
    ctaLabel: "Start",
    ctaAction: { type: "chat", prompt: "__ASSESSMENT__" },
  },
  {
    id: "mn-5",
    title: "Review Peer Feedback",
    subtitle: "Sarah Chen shared feedback on your client onboarding presentation.",
    from: "Sarah Chen",
    icon: Star,
    priority: "low",
    colorTheme: "rose",
    ctaLabel: "View",
    ctaAction: { type: "navigate", path: "/my-inbox" },
  },
];

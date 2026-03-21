import { LucideIcon } from "lucide-react";

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
  colorTheme: "blue" | "emerald" | "amber" | "violet" | "rose";
  ctaLabel: string;
  ctaAction: NudgeCTAAction;
}

// Hardcoded array removed — nudges now come from the nudge_cards DB table.
// Types kept for backward compatibility with OnboardingNudge and other consumers.
export const managerNudges: ManagerNudge[] = [];

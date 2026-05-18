import { useLocation } from "react-router-dom";
import { useAccount } from "@/contexts/AccountContext";
import type { Crumb } from "./Breadcrumbs";

type Mode = "LEARNER" | "TEAM" | "ADMIN";

function modeForPath(pathname: string): Mode {
  if (pathname.startsWith("/admin")) return "ADMIN";
  if (pathname.startsWith("/team")) return "TEAM";
  return "LEARNER";
}

/**
 * @deprecated The eyebrow has been removed from <PageHeader>. Kept only so
 * existing import sites compile during the standardisation sweep.
 */
export function useModeEyebrow(featureLabel?: string): string {
  const { pathname } = useLocation();
  const { activeAccount } = useAccount();
  const account = (activeAccount?.name || "").toUpperCase();
  const mode = modeForPath(pathname);
  const suffix = featureLabel ? featureLabel.toUpperCase() : mode;
  return account ? `${account} · ${suffix}` : suffix;
}

/**
 * Canonical map: route → breadcrumb trail. The first crumb is the section
 * name as it appears in the sidebar (no generic "Team" prefix). Dynamic
 * routes are handled by the prefix matches below; pages with entity titles
 * (cohort name, skill target name, …) should pass their own breadcrumbs.
 *
 * Adding a new route in the future = add one line here.
 */
const CRUMB_MAP: Record<string, Crumb[]> = {
  // Me mode (learner + manager)
  "/dashboard": [{ label: "Dashboard" }],
  "/chat": [{ label: "Embark Chat" }],
  "/action-centre": [{ label: "Action Centre" }],
  "/my-inbox": [{ label: "Action Centre" }],
  "/my-360": [{ label: "My 360" }],
  "/role-play-bank": [{ label: "Role Play" }],
  "/create-skill-target": [
    { label: "Skill Targets", to: "/manager/skill-targets" },
    { label: "New" },
  ],
  "/cohort": [{ label: "Cohort Hub" }],
  // Team mode
  "/team": [{ label: "Team Dashboard" }],
  "/team-dashboard": [{ label: "Team Dashboard" }],
  "/team-insights": [{ label: "Team Insights" }],
  "/team/deep-research": [{ label: "Deep Research" }],
  // Manager-scoped
  "/manager": [{ label: "Manager" }],
  "/manager/people-graph": [{ label: "People Graph" }],
  "/manager/cohorts": [{ label: "Cohorts" }],
  "/manager/skill-targets": [{ label: "Skill Targets" }],
  "/manager/role-play": [{ label: "Role Play" }],
  "/manager/programs": [{ label: "Programs" }],
  // Admin
  "/admin": [{ label: "Admin Dashboard" }],
};

/**
 * Returns breadcrumb items for the current route. Falls back to empty array.
 * Pages with dynamic segments should pass their own breadcrumbs to <PageHeader>
 * so the trailing crumb shows the resolved entity title.
 */
export function useRouteCrumbs(): Crumb[] {
  const { pathname } = useLocation();
  if (CRUMB_MAP[pathname]) return CRUMB_MAP[pathname];

  // Nested role-play session (from Role Play bank)
  if (pathname.startsWith("/role-play-bank/")) {
    return [{ label: "Role Play", to: "/role-play-bank" }, { label: "Session" }];
  }
  // Skill target detail + nested module/role-play/assessment
  if (pathname.startsWith("/skill-target/")) {
    const base: Crumb[] = [
      { label: "Skill Targets", to: "/manager/skill-targets" },
      { label: "Target" },
    ];
    if (pathname.includes("/module/")) return [...base, { label: "Module" }];
    if (pathname.includes("/role-play/")) return [...base, { label: "Role Play" }];
    if (pathname.includes("/assessment/")) return [...base, { label: "Assessment" }];
    return base;
  }
  // Team — deep research thread
  if (pathname.startsWith("/team/deep-research/")) {
    return [{ label: "Deep Research", to: "/team/deep-research" }, { label: "Thread" }];
  }
  // Manager — cohort / skill target detail
  if (pathname.startsWith("/manager/cohort/")) {
    return [{ label: "Cohorts", to: "/manager/cohorts" }, { label: "Cohort" }];
  }
  if (pathname.startsWith("/manager/skill-target/")) {
    return [
      { label: "Skill Targets", to: "/manager/skill-targets" },
      { label: "Detail" },
    ];
  }
  return [];
}

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
  "/": [{ label: "Dashboard" }],
  "/action-centre": [{ label: "Action Centre" }],
  "/role-plays": [{ label: "Role Play" }],
  "/my-360": [{ label: "My 360" }],
  "/people-graph": [{ label: "People Graph" }],
  "/ai-manager": [{ label: "AI Manager" }],
  "/team": [{ label: "Team Dashboard" }],
  "/team/cohorts": [{ label: "Cohorts" }],
  "/team/skill-targets": [{ label: "Skill Targets" }],
  "/team/insights": [{ label: "Team Insights" }],
  "/team/deep-research": [{ label: "Deep Research" }],
  "/admin": [{ label: "Admin Dashboard" }],
};

/**
 * Returns breadcrumb items for the current route. Falls back to empty array.
 * Pages with dynamic segments should pass their own breadcrumbs to <PageHeader>.
 */
export function useRouteCrumbs(): Crumb[] {
  const { pathname } = useLocation();
  if (CRUMB_MAP[pathname]) return CRUMB_MAP[pathname];
  // Best-effort prefix matches for nested routes
  if (pathname.startsWith("/team/cohort/")) {
    return [{ label: "Cohorts", to: "/team/cohorts" }, { label: "Cohort" }];
  }
  if (pathname.startsWith("/team/skill-target/")) {
    return [
      { label: "Skill Targets", to: "/team/skill-targets" },
      { label: "Detail" },
    ];
  }
  if (pathname.startsWith("/team/deep-research/")) {
    return [{ label: "Deep Research", to: "/team/deep-research" }, { label: "Thread" }];
  }
  if (pathname.startsWith("/role-plays/")) {
    return [{ label: "Role Play", to: "/role-plays" }, { label: "Session" }];
  }
  if (pathname.startsWith("/learning/")) {
    return [{ label: "Learning" }, { label: "Module" }];
  }
  return [];
}

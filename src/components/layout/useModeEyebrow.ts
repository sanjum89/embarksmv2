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
 * Returns a standardised eyebrow string identifying the active account + mode
 * (LEARNER / TEAM / ADMIN), based on the current route prefix. Used by
 * <PageHeader> so manager/admin pages are visually distinguishable from learner
 * pages at a glance.
 */
export function useModeEyebrow(featureLabel?: string): string {
  const { pathname } = useLocation();
  const { activeAccount } = useAccount();
  const account = (activeAccount?.name || "").toUpperCase();
  const mode = modeForPath(pathname);
  const suffix = featureLabel ? featureLabel.toUpperCase() : mode;
  return account ? `${account} · ${suffix}` : suffix;
}

const CRUMB_MAP: Record<string, Crumb[]> = {
  "/": [],
  "/role-plays": [{ label: "Role Play" }],
  "/action-centre": [{ label: "Action Centre" }],
  "/my-360": [{ label: "My 360" }],
  "/people-graph": [{ label: "People Graph" }],
  "/team": [{ label: "Team" }],
  "/team/cohorts": [{ label: "Team", to: "/team" }, { label: "Cohorts" }],
  "/team/skill-targets": [{ label: "Team", to: "/team" }, { label: "Skill Targets" }],
  "/team/insights": [{ label: "Team", to: "/team" }, { label: "Insights" }],
  "/team/deep-research": [{ label: "Team", to: "/team" }, { label: "Deep Research" }],
  "/admin": [{ label: "Admin" }],
};

/**
 * Returns breadcrumb items for the current route. Falls back to empty array.
 * Pages with dynamic segments should pass their own breadcrumbs to <PageHeader>.
 */
export function useRouteCrumbs(): Crumb[] {
  const { pathname } = useLocation();
  if (CRUMB_MAP[pathname]) return CRUMB_MAP[pathname];
  // Best-effort prefix match for nested team routes
  if (pathname.startsWith("/team/cohort/")) {
    return [
      { label: "Team", to: "/team" },
      { label: "Cohorts", to: "/team/cohorts" },
      { label: "Cohort" },
    ];
  }
  if (pathname.startsWith("/team/skill-target/")) {
    return [
      { label: "Team", to: "/team" },
      { label: "Skill Targets", to: "/team/skill-targets" },
      { label: "Detail" },
    ];
  }
  return [];
}

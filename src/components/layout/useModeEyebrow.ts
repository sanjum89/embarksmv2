import { useLocation } from "react-router-dom";
import { useAccount } from "@/contexts/AccountContext";

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

  let mode: "TEAM" | "ADMIN" | "LEARNER";
  if (pathname.startsWith("/admin")) mode = "ADMIN";
  else if (pathname.startsWith("/team")) mode = "TEAM";
  else mode = "LEARNER";

  const suffix = featureLabel ? featureLabel.toUpperCase() : mode;
  return account ? `${account} · ${suffix}` : suffix;
}

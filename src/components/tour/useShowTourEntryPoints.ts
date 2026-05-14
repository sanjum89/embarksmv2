import { useUser } from "@/contexts/UserContext";
import { useAccount } from "@/contexts/AccountContext";

/**
 * Whether the current user should see tour entry points (launch button and
 * first-login banner). Limited to Clara (rb-l6) and Theo (rb-l3) for the demo.
 */
export function useShowTourEntryPoints(): boolean {
  const { user } = useUser();
  const { normalizedAccount } = useAccount();
  const eid = normalizedAccount?.usersById?.[user.id]?.linkedEmployeeId;
  return eid === "rb-l6" || eid === "rb-l3";
}

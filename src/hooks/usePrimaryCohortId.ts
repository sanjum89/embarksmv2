import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/contexts/AccountContext";
import { RATHBONES_COHORT_CODE, RATHBONES_COHORT_ID } from "@/data/managerDemoOverlay";

const cache: Record<string, string> = {};

/**
 * Resolves the primary demo cohort id for the ACTIVE account by cohort_code.
 * Rathbones and its white-label clones (Pinnacle Capital) share the same
 * cohort_code but have different cohort ids, so nothing may key off a
 * hardcoded uuid.
 */
export function usePrimaryCohortId(): string {
  const { activeAccountId } = useAccount();
  const [id, setId] = useState<string>(
    () => (activeAccountId && cache[activeAccountId]) || RATHBONES_COHORT_ID,
  );

  useEffect(() => {
    if (!activeAccountId) return;
    const cached = cache[activeAccountId];
    if (cached) {
      setId(cached);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("cohorts")
        .select("id")
        .eq("account_id", activeAccountId)
        .eq("cohort_code", RATHBONES_COHORT_CODE)
        .maybeSingle();
      const resolved = (data as any)?.id as string | undefined;
      if (resolved) {
        cache[activeAccountId] = resolved;
        if (!cancelled) setId(resolved);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeAccountId]);

  return id;
}

import { useAccount } from "@/contexts/AccountContext";
import { useMemo, useCallback } from "react";

/**
 * Apply name substitutions to content text.
 * Case-preserving: replaces all occurrences of each key with its value.
 */
export function applyContentNames(text: string, nameMap: Record<string, string>): string {
  if (!text || !nameMap || Object.keys(nameMap).length === 0) return text;
  let result = text;
  for (const [oldName, newName] of Object.entries(nameMap)) {
    if (!oldName) continue;
    result = result.replaceAll(oldName, newName);
  }
  return result;
}

/**
 * Hook that returns a `substitute(text)` function.
 * When the active account has a `contentNameMap`, all rendered text
 * will have those substitutions applied. Otherwise it's a no-op passthrough.
 */
export function useContentSubstitution() {
  const { normalizedAccount } = useAccount();
  const nameMap = normalizedAccount?.contentNameMap;

  const substitute = useCallback(
    (text: string | undefined | null): string => {
      if (!text) return text ?? "";
      if (!nameMap || Object.keys(nameMap).length === 0) return text;
      return applyContentNames(text, nameMap);
    },
    [nameMap]
  );

  return { substitute };
}

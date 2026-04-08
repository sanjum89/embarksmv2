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
    result = result.split(oldName).join(newName);
  }
  return result;
}

/**
 * Deep-substitute all string values in a nested object/array.
 * Returns a new structure with all strings transformed.
 */
export function applyContentNamesDeep<T>(value: T, nameMap: Record<string, string> | undefined): T {
  if (!nameMap || Object.keys(nameMap).length === 0) return value;
  if (typeof value === "string") return applyContentNames(value, nameMap) as unknown as T;
  if (Array.isArray(value)) return value.map((item) => applyContentNamesDeep(item, nameMap)) as unknown as T;
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = applyContentNamesDeep(v, nameMap);
    }
    return result as T;
  }
  return value;
}

/**
 * Hook that returns a `substitute(text)` function and a `substituteDeep(obj)` function.
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

  const substituteDeep = useCallback(
    <T>(value: T): T => applyContentNamesDeep(value, nameMap),
    [nameMap]
  );

  return { substitute, substituteDeep };
}

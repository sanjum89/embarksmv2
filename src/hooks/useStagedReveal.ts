import { useEffect, useState } from "react";

/**
 * Returns an array of booleans of length `count`, each flipping true on a
 * staggered timer. Respects prefers-reduced-motion (all true immediately).
 */
export function useStagedReveal(count: number, stepMs = 140, initialDelay = 0) {
  const [revealed, setRevealed] = useState<boolean[]>(() => {
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return Array(count).fill(true);
    }
    return Array(count).fill(false);
  });

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setRevealed(Array(count).fill(true));
      return;
    }
    setRevealed(Array(count).fill(false));
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < count; i++) {
      timers.push(
        setTimeout(() => {
          setRevealed((prev) => {
            const next = [...prev];
            next[i] = true;
            return next;
          });
        }, initialDelay + i * stepMs)
      );
    }
    return () => timers.forEach(clearTimeout);
  }, [count, stepMs, initialDelay]);

  return revealed;
}

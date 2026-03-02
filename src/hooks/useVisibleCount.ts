import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Measures how many children fit in a single row of a flex container.
 * Returns a ref to attach to the container and the count of visible items.
 */
export function useVisibleCount(totalCount: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(totalCount);

  const measure = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    // Temporarily show all children to measure
    const children = Array.from(el.children) as HTMLElement[];
    if (children.length === 0) return;

    const containerTop = children[0]?.offsetTop;
    let count = 0;

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      // Skip the "+N more" pill (last child) when counting
      if (i === children.length - 1 && child.dataset.overflow === "true") continue;
      if (child.offsetTop === containerTop) {
        count++;
      } else {
        break;
      }
    }

    // If not all fit, leave room for the "+N more" pill by removing one
    if (count < totalCount && count > 0) {
      count = Math.max(1, count - 1);
    }

    setVisibleCount(count);
  }, [totalCount]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      // Reset to show all so we can re-measure
      setVisibleCount(totalCount);
      requestAnimationFrame(measure);
    });

    ro.observe(el);
    measure();

    return () => ro.disconnect();
  }, [totalCount, measure]);

  return { containerRef, visibleCount };
}

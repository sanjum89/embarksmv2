import { useState, useRef, useCallback, useEffect, ReactNode } from "react";

interface ResponsivePillRowProps {
  /** Total number of items */
  totalCount: number;
  /** Render a single pill by index */
  renderPill: (index: number) => ReactNode;
  /** Gap between pills in px (should match CSS gap) */
  gap?: number;
  /** Additional className for the container */
  className?: string;
}

/**
 * Renders as many pills as fit in a single row, with a "+N more" summary pill
 * when items overflow. Measures actual rendered widths via a hidden probe row.
 */
export function ResponsivePillRow({
  totalCount,
  renderPill,
  gap = 8,
  className = "",
}: ResponsivePillRowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLDivElement>(null);
  const moreProbeRef = useRef<HTMLSpanElement>(null);
  const [visibleCount, setVisibleCount] = useState(totalCount);

  const measure = useCallback(() => {
    const container = containerRef.current;
    const probe = probeRef.current;
    const moreEl = moreProbeRef.current;
    if (!container || !probe || !moreEl) return;

    const containerWidth = container.getBoundingClientRect().width;
    const children = Array.from(probe.children) as HTMLElement[];
    // Last child in probe is the "+N more" pill
    const morePillWidth = moreEl.getBoundingClientRect().width;

    // Measure each real pill width
    const pillWidths: number[] = [];
    for (let i = 0; i < children.length - 1; i++) {
      pillWidths.push(children[i].getBoundingClientRect().width);
    }

    // Try fitting all pills first
    let usedWidth = 0;
    let fits = 0;
    for (let i = 0; i < pillWidths.length; i++) {
      const added = usedWidth + (i > 0 ? gap : 0) + pillWidths[i];
      if (added <= containerWidth) {
        usedWidth = added;
        fits++;
      } else {
        break;
      }
    }

    // All fit
    if (fits >= totalCount) {
      setVisibleCount(totalCount);
      return;
    }

    // Not all fit — need to reserve space for "+N more"
    // Walk backwards until we have room for the more pill
    let fitWithMore = fits;
    let widthWithMore = usedWidth + gap + morePillWidth;

    while (fitWithMore > 0 && widthWithMore > containerWidth) {
      fitWithMore--;
      // Recalculate width
      widthWithMore = 0;
      for (let i = 0; i < fitWithMore; i++) {
        widthWithMore += (i > 0 ? gap : 0) + pillWidths[i];
      }
      widthWithMore += gap + morePillWidth;
    }

    setVisibleCount(Math.max(0, fitWithMore));
  }, [totalCount, gap]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => {
      requestAnimationFrame(measure);
    });
    ro.observe(container);
    // Initial measure after fonts/layout settle
    requestAnimationFrame(measure);

    return () => ro.disconnect();
  }, [measure]);

  const hiddenCount = totalCount - visibleCount;

  return (
    <div className="relative">
      {/* Hidden probe: renders all pills + more pill offscreen for measurement */}
      <div
        ref={probeRef}
        aria-hidden
        className="absolute top-0 left-0 flex flex-nowrap pointer-events-none opacity-0 h-0 overflow-hidden"
        style={{ gap: `${gap}px`, width: "max-content" }}
      >
        {Array.from({ length: totalCount }, (_, i) => (
          <div key={i} className="shrink-0">{renderPill(i)}</div>
        ))}
        <span
          ref={moreProbeRef}
          className="rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground whitespace-nowrap shrink-0"
        >
          +{Math.max(1, totalCount)} more
        </span>
      </div>

      {/* Visible row */}
      <div
        ref={containerRef}
        className={`flex flex-nowrap overflow-hidden ${className}`}
        style={{ gap: `${gap}px` }}
      >
        {Array.from({ length: visibleCount }, (_, i) => (
          <div key={i} className="shrink-0">{renderPill(i)}</div>
        ))}
        {hiddenCount > 0 && (
          <span className="rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground whitespace-nowrap shrink-0">
            +{hiddenCount} more
          </span>
        )}
      </div>
    </div>
  );
}

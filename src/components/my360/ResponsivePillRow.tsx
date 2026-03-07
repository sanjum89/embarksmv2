import { useState, useRef, useCallback, useEffect, ReactNode } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

interface ResponsivePillRowProps {
  totalCount: number;
  renderPill: (index: number) => ReactNode;
  gap?: number;
  className?: string;
  /** When provided, "+N more" becomes clickable and shows this content in a popover */
  renderExpandedList?: () => ReactNode;
}

export function ResponsivePillRow({
  totalCount,
  renderPill,
  gap = 8,
  className = "",
  renderExpandedList,
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
    const morePillWidth = moreEl.getBoundingClientRect().width;

    const pillWidths: number[] = [];
    for (let i = 0; i < children.length - 1; i++) {
      pillWidths.push(children[i].getBoundingClientRect().width);
    }

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

    if (fits >= totalCount) {
      setVisibleCount(totalCount);
      return;
    }

    let fitWithMore = fits;
    let widthWithMore = usedWidth + gap + morePillWidth;

    while (fitWithMore > 0 && widthWithMore > containerWidth) {
      fitWithMore--;
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
    requestAnimationFrame(measure);

    return () => ro.disconnect();
  }, [measure]);

  const hiddenCount = totalCount - visibleCount;

  const morePill = (
    <span className="rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground whitespace-nowrap shrink-0 cursor-pointer hover:bg-accent/10 transition-colors">
      +{hiddenCount} more
    </span>
  );

  return (
    <div className="relative">
      {/* Hidden probe */}
      <div
        ref={probeRef}
        aria-hidden
        className="absolute -top-[9999px] left-0 flex flex-nowrap pointer-events-none invisible overflow-hidden"
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
          renderExpandedList ? (
            <Popover>
              <PopoverTrigger asChild>
                {morePill}
              </PopoverTrigger>
              <PopoverContent className="w-auto max-w-sm max-h-72 overflow-y-auto p-3" align="start">
                {renderExpandedList()}
              </PopoverContent>
            </Popover>
          ) : (
            <span className="rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground whitespace-nowrap shrink-0">
              +{hiddenCount} more
            </span>
          )
        )}
      </div>
    </div>
  );
}

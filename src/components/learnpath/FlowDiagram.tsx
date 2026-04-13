import { useRef, useLayoutEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

export interface FlowChartData {
  title?: string;
  root: string;
  children: string[];
  bottom?: string;
}

interface Props {
  chart: FlowChartData;
  className?: string;
}

interface Measurements {
  rootBottom: { x: number; y: number };
  childTops: { x: number; y: number }[];
  childBottoms: { x: number; y: number }[];
  bottomTop?: { x: number; y: number };
  junctionY: number;
  mergeY: number;
  svgWidth: number;
  svgHeight: number;
}

export function FlowDiagram({ chart, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const childRefs = useRef<(HTMLDivElement | null)[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [m, setM] = useState<Measurements | null>(null);

  const measure = useCallback(() => {
    const container = containerRef.current;
    const root = rootRef.current;
    if (!container || !root) return;

    const cRect = container.getBoundingClientRect();
    const rRect = root.getBoundingClientRect();

    const rootBottom = {
      x: rRect.left + rRect.width / 2 - cRect.left,
      y: rRect.bottom - cRect.top,
    };

    const childTops: { x: number; y: number }[] = [];
    const childBottoms: { x: number; y: number }[] = [];

    childRefs.current.forEach((el) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      childTops.push({
        x: r.left + r.width / 2 - cRect.left,
        y: r.top - cRect.top,
      });
      childBottoms.push({
        x: r.left + r.width / 2 - cRect.left,
        y: r.bottom - cRect.top,
      });
    });

    let bottomTop: { x: number; y: number } | undefined;
    if (bottomRef.current) {
      const bRect = bottomRef.current.getBoundingClientRect();
      bottomTop = {
        x: bRect.left + bRect.width / 2 - cRect.left,
        y: bRect.top - cRect.top,
      };
    }

    const junctionY = childTops.length > 0
      ? (rootBottom.y + childTops[0].y) / 2
      : rootBottom.y + 24;

    const mergeY = childBottoms.length > 0 && bottomTop
      ? (childBottoms[0].y + bottomTop.y) / 2
      : 0;

    setM({
      rootBottom,
      childTops,
      childBottoms,
      bottomTop,
      junctionY,
      mergeY,
      svgWidth: cRect.width,
      svgHeight: cRect.height,
    });
  }, []);

  useLayoutEffect(() => {
    // Delay to let nodes render
    const frame = requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [measure, chart]);

  const hasChildren = chart.children.length > 0;

  return (
    <div ref={containerRef} className={cn("relative flex flex-col items-center gap-10", className)}>
      {chart.title && (
        <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide self-start">
          {chart.title}
        </h5>
      )}

      {/* SVG connector overlay */}
      {m && hasChildren && (
        <svg
          className="absolute inset-0 pointer-events-none text-muted-foreground/60"
          width={m.svgWidth}
          height={m.svgHeight}
          style={{ zIndex: 0 }}
        >
          <defs>
            <marker
              id="flow-arrow"
              markerWidth="8"
              markerHeight="6"
              refX="4"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L8,3 L0,6 Z" fill="currentColor" />
            </marker>
          </defs>

          {/* Root → junction vertical */}
          <line
            x1={m.rootBottom.x} y1={m.rootBottom.y}
            x2={m.rootBottom.x} y2={m.junctionY}
            stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
          />

          {/* Horizontal bar across children */}
          {m.childTops.length > 1 && (
            <line
              x1={m.childTops[0].x} y1={m.junctionY}
              x2={m.childTops[m.childTops.length - 1].x} y2={m.junctionY}
              stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
            />
          )}

          {/* Junction → each child top */}
          {m.childTops.map((ct, i) => (
            <line
              key={`down-${i}`}
              x1={ct.x} y1={m.junctionY}
              x2={ct.x} y2={ct.y}
              stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
            />
          ))}

          {/* Bottom merge connectors */}
          {m.bottomTop && m.childBottoms.length > 0 && (
            <>
              {/* Each child bottom → merge junction */}
              {m.childBottoms.map((cb, i) => (
                <line
                  key={`merge-${i}`}
                  x1={cb.x} y1={cb.y}
                  x2={cb.x} y2={m.mergeY}
                  stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
                />
              ))}
              {/* Horizontal merge bar */}
              {m.childBottoms.length > 1 && (
                <line
                  x1={m.childBottoms[0].x} y1={m.mergeY}
                  x2={m.childBottoms[m.childBottoms.length - 1].x} y2={m.mergeY}
                  stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
                />
              )}
              {/* Merge → bottom node with arrow */}
              <line
                x1={m.bottomTop.x} y1={m.mergeY}
                x2={m.bottomTop.x} y2={m.bottomTop.y}
                stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
                markerEnd="url(#flow-arrow)"
              />
            </>
          )}
        </svg>
      )}

      {/* Root node */}
      <div
        ref={rootRef}
        className="relative z-10 px-6 py-3 rounded-full border-2 border-primary bg-primary/10 text-center min-w-[180px] shadow-sm"
      >
        <span className="font-bold text-sm text-foreground">{chart.root}</span>
      </div>

      {hasChildren && (
        <>
          {/* Children row */}
          <div className="relative z-10 flex gap-4 flex-wrap justify-center">
            {chart.children.map((child, i) => (
              <div
                key={i}
                ref={(el) => { childRefs.current[i] = el; }}
                className="px-4 py-2.5 border border-border bg-card rounded-lg text-center min-w-[130px] max-w-[180px] shadow-sm"
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
              >
                <span className="text-xs font-medium text-foreground">{child}</span>
              </div>
            ))}
          </div>

          {chart.bottom && (
            <div
              ref={bottomRef}
              className="relative z-10 px-6 py-3 rounded-full border-2 border-accent bg-accent/10 text-center min-w-[180px] shadow-sm"
            >
              <span className="font-bold text-sm text-foreground">{chart.bottom}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

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

export function FlowDiagram({ chart, className }: Props) {
  const hasChildren = chart.children.length > 0;

  return (
    <div className={cn("space-y-0 flex flex-col items-center", className)}>
      {chart.title && (
        <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4 self-start">
          {chart.title}
        </h5>
      )}

      {/* Root node */}
      <div className="px-6 py-3 border-2 border-primary bg-primary/10 rounded-lg text-center min-w-[180px]">
        <span className="font-bold text-sm text-foreground">{chart.root}</span>
      </div>

      {hasChildren && (
        <>
          {/* Vertical connector from root */}
          <div className="w-px h-6 bg-border" />

          {/* Horizontal bar + children */}
          <div className="relative flex items-start">
            {/* Horizontal connector bar */}
            {chart.children.length > 1 && (
              <div
                className="absolute top-0 bg-border"
                style={{
                  height: "2px",
                  left: `calc(100% / ${chart.children.length * 2})`,
                  right: `calc(100% / ${chart.children.length * 2})`,
                }}
              />
            )}

            <div className="flex gap-4">
              {chart.children.map((child, i) => (
                <div key={i} className="flex flex-col items-center">
                  {/* Vertical line down from bar */}
                  <div className="w-px h-6 bg-border" />
                  {/* Child box */}
                  <div className="px-4 py-2.5 border border-border bg-card rounded-lg text-center min-w-[120px] max-w-[180px]">
                    <span className="text-xs font-medium text-foreground">{child}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {chart.bottom && (
            <>
              {/* Merge connector */}
              <div className="w-px h-6 bg-border" />
              {/* Arrow down */}
              <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-border" />
              <div className="w-px h-2 bg-border" />
              {/* Bottom node */}
              <div className="px-6 py-3 border-2 border-accent bg-accent/10 rounded-lg text-center min-w-[180px]">
                <span className="font-bold text-sm text-foreground">{chart.bottom}</span>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

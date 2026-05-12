import type { ModuleAdaptationSegment } from "@/lib/deepResearch/envelope";

const SEGMENT_COLORS: Record<ModuleAdaptationSegment, string> = {
  Full: "hsl(var(--primary))",
  Condensed: "hsl(217 70% 60%)",
  Diagnostic: "hsl(280 60% 60%)",
  "Evidence-only": "hsl(35 85% 55%)",
  "Already covered": "hsl(var(--muted-foreground))",
};

const ORDER: ModuleAdaptationSegment[] = ["Full", "Condensed", "Diagnostic", "Evidence-only", "Already covered"];

interface Props {
  learners: { name: string; segments: { label: ModuleAdaptationSegment; count: number }[] }[];
}

export function ModuleAdaptationStackedBar({ learners }: Props) {
  const totals = learners.map((l) => l.segments.reduce((a, b) => a + b.count, 0));
  const max = Math.max(...totals, 1);

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 space-y-4">
      <div className="text-sm font-medium">Module adaptation breakdown</div>
      <div className="space-y-3">
        {learners.map((learner, idx) => {
          const total = totals[idx];
          const widthPct = (total / max) * 100;
          return (
            <div key={learner.name} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium">{learner.name}</span>
                <span className="text-muted-foreground">{total} modules</span>
              </div>
              <div className="h-7 rounded-md overflow-hidden flex bg-muted/40" style={{ width: `${widthPct}%` }}>
                {ORDER.map((label) => {
                  const seg = learner.segments.find((s) => s.label === label);
                  if (!seg || seg.count === 0) return null;
                  const pct = (seg.count / total) * 100;
                  return (
                    <div
                      key={label}
                      title={`${label}: ${seg.count}`}
                      style={{ width: `${pct}%`, backgroundColor: SEGMENT_COLORS[label] }}
                      className="flex items-center justify-center text-[10px] font-medium text-white"
                    >
                      {pct > 10 ? seg.count : ""}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 pt-1 border-t border-border/40">
        {ORDER.map((label) => (
          <div key={label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: SEGMENT_COLORS[label] }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

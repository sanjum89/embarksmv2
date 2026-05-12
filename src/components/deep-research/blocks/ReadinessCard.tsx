import { cn } from "@/lib/utils";
import type { ReadinessCardData, RagStatus } from "@/lib/deepResearch/envelope";

const toneClasses: Record<RagStatus, string> = {
  green: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-300",
  amber: "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-300",
  red: "bg-rose-500/10 text-rose-700 border-rose-500/30 dark:text-rose-300",
};

export function ReadinessCard({ data }: { data: ReadinessCardData }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 flex flex-col gap-2 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold text-sm">{data.name}</div>
          {data.title && <div className="text-xs text-muted-foreground">{data.title}</div>}
        </div>
        <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap", toneClasses[data.statusTone])}>
          {data.status}
        </span>
      </div>
      <div className="text-xs">
        <div className="text-muted-foreground">Top gap</div>
        <div className="font-medium">{data.topGap}</div>
      </div>
      <div className="text-xs">
        <div className="text-muted-foreground">Next action</div>
        <div className="font-medium">{data.nextAction}</div>
      </div>
    </div>
  );
}

export function ReadinessCardGrid({ learners }: { learners: ReadinessCardData[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {learners.map((l) => (
        <ReadinessCard key={l.name} data={l} />
      ))}
    </div>
  );
}

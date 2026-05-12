import { cn } from "@/lib/utils";
import type { RagStatus } from "@/lib/deepResearch/envelope";

const TONE_BG: Record<RagStatus | "neutral", string> = {
  green: "border-emerald-500/30 bg-emerald-500/5",
  amber: "border-amber-500/30 bg-amber-500/5",
  red: "border-rose-500/30 bg-rose-500/5",
  neutral: "border-border/60 bg-card",
};

interface Item {
  label: string;
  value: string;
  tone?: RagStatus | "neutral";
  sub?: string;
}

export function KpiStrip({ items }: { items: Item[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className={cn("rounded-xl border p-3 flex flex-col gap-0.5", TONE_BG[item.tone ?? "neutral"])}
        >
          <div className="text-xs text-muted-foreground">{item.label}</div>
          <div className="text-xl font-semibold leading-tight">{item.value}</div>
          {item.sub && <div className="text-[11px] text-muted-foreground">{item.sub}</div>}
        </div>
      ))}
    </div>
  );
}

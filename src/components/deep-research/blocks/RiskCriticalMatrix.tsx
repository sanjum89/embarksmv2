import { cn } from "@/lib/utils";
import type { RagStatus } from "@/lib/deepResearch/envelope";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const STATUS_BG: Record<RagStatus, string> = {
  green: "bg-emerald-500/80 hover:bg-emerald-500",
  amber: "bg-amber-500/80 hover:bg-amber-500",
  red: "bg-rose-500/80 hover:bg-rose-500",
};

interface Props {
  competencies: string[];
  learners: { name: string; cells: { competency: string; status: RagStatus; note?: string }[] }[];
}

export function RiskCriticalMatrix({ competencies, learners }: Props) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 overflow-x-auto">
      <div className="text-sm font-medium mb-3">Risk-critical evidence matrix</div>
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-left pb-2 pr-3 font-medium text-muted-foreground sticky left-0 bg-card">Learner</th>
            {competencies.map((c) => (
              <th key={c} className="pb-2 px-1 font-medium text-muted-foreground text-center min-w-[100px]">
                <div className="leading-tight">{c}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {learners.map((l) => (
            <tr key={l.name} className="border-t border-border/40">
              <td className="py-2 pr-3 font-medium sticky left-0 bg-card">{l.name}</td>
              {competencies.map((c) => {
                const cell = l.cells.find((x) => x.competency === c);
                const status = cell?.status ?? "amber";
                return (
                  <td key={c} className="py-2 px-1 text-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "h-7 w-full rounded-md cursor-help transition-colors",
                            STATUS_BG[status]
                          )}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <div className="text-xs font-medium">
                          {l.name} · {c}
                        </div>
                        {cell?.note && <div className="text-[11px] text-muted-foreground">{cell.note}</div>}
                      </TooltipContent>
                    </Tooltip>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-3 mt-3 pt-3 border-t border-border/40 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500/80" />On track</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-500/80" />Evidence pending</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-rose-500/80" />Blocking</div>
      </div>
    </div>
  );
}

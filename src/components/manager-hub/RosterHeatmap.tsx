import { useMemo, useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CohortLearner, CohortModuleCol } from "@/hooks/useManagerCohortData";
import { LearnerStatusBadge } from "./LearnerStatusBadge";

type Filter = "all" | "at_risk" | "adapted" | "awaiting_approval" | "cpd";

interface Props {
  learners: CohortLearner[];
  modules: CohortModuleCol[];
  onSelectLearner: (employeeId: string, moduleCode?: string) => void;
}

const STATUS_GLYPH: Record<string, string> = {
  completed: "✓",
  in_progress: "◐",
  not_started: "·",
  locked: "🔒",
};

const STATUS_TONE: Record<string, string> = {
  completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  in_progress: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  not_started: "bg-muted text-muted-foreground border-border",
  locked: "bg-muted/50 text-muted-foreground border-border",
};

const ADAPT_GLYPH: Record<string, string> = {
  diagnostic_only: "D",
  microlearning: "M",
  skip_after_validation: "S",
  emphasis: "★",
};

export function RosterHeatmap({ learners, modules, onSelectLearner }: Props) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return learners;
    return learners.filter((l) => {
      const o = l.overlay;
      if (!o) return false;
      if (filter === "at_risk") return o.status === "at_risk" || o.status === "needs_check_in";
      if (filter === "adapted") return o.cells.some((c) => c.adaptation);
      if (filter === "awaiting_approval") return o.pathChanges.some((c) => c.needs_approval);
      if (filter === "cpd") return o.cpd.status !== "on_track";
      return true;
    });
  }, [learners, filter]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {([
          ["all", "All"],
          ["at_risk", "At risk"],
          ["adapted", "Adapted by AI"],
          ["awaiting_approval", "Awaiting approval"],
          ["cpd", "CPD off-track"],
        ] as [Filter, string][]).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs",
              filter === k ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted/50"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <TooltipProvider delayDuration={120}>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-muted/30">
                <th className="sticky left-0 z-10 bg-muted/30 px-3 py-2 text-left text-xs font-medium text-muted-foreground min-w-[200px]">
                  Learner
                </th>
                {modules.map((m) => (
                  <th
                    key={m.module_code}
                    className="px-2 py-2 text-center text-[11px] font-medium text-muted-foreground"
                    title={m.module_title}
                  >
                    <div className="mx-auto max-w-[80px] truncate">{m.module_title}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => {
                const o = l.overlay;
                return (
                  <tr key={l.employeeId} className="border-t border-border hover:bg-muted/20">
                    <td
                      className="sticky left-0 z-10 bg-card px-3 py-2 cursor-pointer min-w-[200px]"
                      onClick={() => onSelectLearner(l.employeeId)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{l.name}</p>
                          <p className="truncate text-[11px] text-muted-foreground">{l.title ?? ""}</p>
                        </div>
                        <LearnerStatusBadge status={o?.status} />
                      </div>
                    </td>
                    {modules.map((m, i) => {
                      const cell = o?.cells[i];
                      const status = cell?.status ?? "not_started";
                      return (
                        <td key={m.module_code} className="px-2 py-2 text-center">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => onSelectLearner(l.employeeId, m.module_code)}
                                className={cn(
                                  "relative inline-flex h-9 w-9 items-center justify-center rounded-md border text-[13px] font-medium",
                                  STATUS_TONE[status]
                                )}
                              >
                                <span>{STATUS_GLYPH[status]}</span>
                                {cell?.adaptation && (
                                  <span className="absolute -top-1 -right-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-border bg-card text-[9px] font-bold text-foreground">
                                    {ADAPT_GLYPH[cell.adaptation]}
                                  </span>
                                )}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              <p className="font-medium">{m.module_title}</p>
                              <p className="text-muted-foreground">{l.name}</p>
                              <p className="text-muted-foreground">Status: {status}</p>
                              {cell?.score != null && <p className="text-muted-foreground">Score: {cell.score}%</p>}
                              {cell?.adaptation && (
                                <p className="text-muted-foreground capitalize">Adaptation: {cell.adaptation.replace(/_/g, " ")}</p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={modules.length + 1} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No learners match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </TooltipProvider>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <span className="font-medium text-foreground">Legend:</span>
        <span><Badge variant="outline" className="mr-1">D</Badge>Diagnostic-only</span>
        <span><Badge variant="outline" className="mr-1">M</Badge>Microlearning</span>
        <span><Badge variant="outline" className="mr-1">S</Badge>Skipped</span>
        <span><Badge variant="outline" className="mr-1">★</Badge>Emphasis</span>
        <span>· ✓ complete · ◐ in progress · · not started · 🔒 locked</span>
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { RosterRow, type RosterEntry } from "./RosterRow";
import type { LearnerStatus } from "@/data/managerDemoOverlay";

type FilterKey = "all" | "rising_star" | "at_risk" | "needs_check_in" | "on_track";
type SortKey = "status" | "progress" | "name" | "activity";

const FILTER_LABEL: Record<FilterKey, string> = {
  all: "All",
  rising_star: "Rising",
  at_risk: "At risk",
  needs_check_in: "Check in",
  on_track: "On track",
};

const STATUS_RANK: Record<LearnerStatus, number> = {
  at_risk: 0,
  needs_check_in: 1,
  rising_star: 2,
  on_track: 3,
};

export function TeamRoster({
  entries,
  onOpen,
}: {
  entries: RosterEntry[];
  onOpen: (employeeId: string) => void;
}) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("status");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = {
      all: entries.length,
      rising_star: 0,
      at_risk: 0,
      needs_check_in: 0,
      on_track: 0,
    };
    for (const e of entries) {
      const s = e.overlay.status as FilterKey;
      if (s in c) c[s]++;
    }
    return c;
  }, [entries]);

  const visible = useMemo(() => {
    let v = entries;
    if (filter !== "all") v = v.filter((e) => e.overlay.status === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      v = v.filter((e) => e.name.toLowerCase().includes(q));
    }
    const sorted = [...v];
    sorted.sort((a, b) => {
      switch (sort) {
        case "progress":
          return b.progressPct - a.progressPct;
        case "name":
          return a.name.localeCompare(b.name);
        case "activity":
          return a.lastActivity.localeCompare(b.lastActivity);
        case "status":
        default:
          return STATUS_RANK[a.overlay.status] - STATUS_RANK[b.overlay.status];
      }
    });
    return sorted;
  }, [entries, filter, sort, query]);

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">Direct reports</h2>
          <p className="text-xs text-muted-foreground">
            {entries.length} learners · click any row for the full profile
          </p>
        </div>
        <div className="relative w-full sm:max-w-[200px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name…"
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/20 px-4 py-3">
        {(Object.keys(FILTER_LABEL) as FilterKey[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              filter === k
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-background text-muted-foreground hover:text-foreground"
            )}
          >
            {FILTER_LABEL[k]}
            <span
              className={cn(
                "rounded-full px-1.5 text-[10px] tabular-nums",
                filter === k ? "bg-background/20" : "bg-muted"
              )}
            >
              {counts[k]}
            </span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <label className="text-[11px] uppercase tracking-wide text-muted-foreground">Sort</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-7 rounded-md border border-border bg-background px-2 text-xs text-foreground"
          >
            <option value="status">Status</option>
            <option value="progress">Progress</option>
            <option value="name">Name</option>
            <option value="activity">Last activity</option>
          </select>
        </div>
      </div>

      <div className="divide-y divide-border">
        {visible.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No learners match.</p>
        ) : (
          <div className="space-y-2 p-3">
            {visible.map((e) => (
              <RosterRow key={e.employeeId} entry={e} onOpen={onOpen} />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

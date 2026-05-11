import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GitBranch,
  Sparkles,
  X,
  Plus,
  Check,
  FastForward,
  Zap,
  Flame,
  ArrowLeftRight,
  ChevronDown,
  ChevronRight,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import type { LearnerOverlay, AiPathChange } from "@/data/managerDemoOverlay";
import { AdaptivePathDrawer } from "./AdaptivePathDrawer";

interface ModuleSpine {
  module_code: string;
  module_title: string;
  progression_stage: string;
}

interface LearnerInput {
  employeeId: string;
  name: string;
  overlay: LearnerOverlay;
}

interface Props {
  learners: LearnerInput[];
  modules: ModuleSpine[];
  onOpenLearner?: (id: string) => void;
  dense?: boolean;
}

type CompareMode = "stack" | "side" | "baseline";
type Filter = "all" | "skipped" | "microlearning" | "reordered";

type Kind =
  | "completed"
  | "skipped"
  | "microlearning"
  | "emphasis"
  | "reordered"
  | "in_progress"
  | "not_started";

interface Segment {
  status: "completed" | "in_progress" | "not_started" | "locked";
  adaptation?: "diagnostic_only" | "microlearning" | "skip_after_validation" | "emphasis" | null;
  pathChange?: AiPathChange;
  module: ModuleSpine;
}

const PALETTE = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--warning))",
  "hsl(var(--success))",
];

// Adaptation kind → visual treatment. Color carries meaning, icon backs it up.
const KIND_META: Record<Kind, { label: string; tone: string; icon: typeof Check; tokenBg: string; tokenText: string }> = {
  completed:     { label: "Completed",     tone: "hsl(var(--success))",          icon: Check,          tokenBg: "bg-emerald-500/15",  tokenText: "text-emerald-700 dark:text-emerald-300" },
  skipped:       { label: "Skipped",       tone: "hsl(var(--warning))",          icon: FastForward,    tokenBg: "bg-amber-500/15",    tokenText: "text-amber-700 dark:text-amber-300" },
  microlearning: { label: "Microlearning", tone: "hsl(var(--accent))",           icon: Zap,            tokenBg: "bg-sky-500/15",      tokenText: "text-sky-700 dark:text-sky-300" },
  emphasis:      { label: "Emphasis",      tone: "hsl(var(--primary))",          icon: Flame,          tokenBg: "bg-primary/15",      tokenText: "text-primary" },
  reordered:     { label: "Reordered",     tone: "hsl(var(--muted-foreground))", icon: ArrowLeftRight, tokenBg: "bg-muted",           tokenText: "text-muted-foreground" },
  in_progress:   { label: "In progress",   tone: "hsl(var(--primary))",          icon: ChevronRight,   tokenBg: "bg-primary/10",      tokenText: "text-primary" },
  not_started:   { label: "Not yet reached", tone: "hsl(var(--muted-foreground))", icon: ChevronRight, tokenBg: "bg-muted/50",        tokenText: "text-muted-foreground/70" },
};

function kindFor(seg: Segment): Kind {
  if (seg.pathChange?.kind === "skipped") return "skipped";
  if (seg.pathChange?.kind === "microlearning") return "microlearning";
  if (seg.pathChange?.kind === "emphasis") return "emphasis";
  if (seg.pathChange?.kind === "reordered") return "reordered";
  if (seg.status === "completed") return "completed";
  if (seg.status === "in_progress") return "in_progress";
  return "not_started";
}

function adaptationCount(o: LearnerOverlay) {
  return o.pathChanges.length;
}

// ───────────────────── Learner picker ─────────────────────
function LearnerPicker({
  learners,
  selected,
  onToggle,
  onClear,
  onSelectMostAdapted,
  max,
}: {
  learners: LearnerInput[];
  selected: string[];
  onToggle: (id: string) => void;
  onClear: () => void;
  onSelectMostAdapted: () => void;
  max: number;
}) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"adapted" | "az">("adapted");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = learners.filter((l) => !needle || l.name.toLowerCase().includes(needle));
    if (sort === "adapted") {
      list = [...list].sort((a, b) => adaptationCount(b.overlay) - adaptationCount(a.overlay));
    } else {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [learners, q, sort]);

  const atCap = selected.length >= max;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 gap-1 px-2 text-[11px]">
          <Plus className="h-3 w-3" />
          Add learner
          <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">
            {learners.length}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="flex items-center gap-2 border-b border-border p-2">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search learners…"
            className="h-7 border-0 px-0 text-xs shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="flex items-center justify-between gap-1 border-b border-border bg-secondary/20 px-2 py-1.5 text-[10px]">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSort("adapted")}
              className={cn(
                "rounded px-1.5 py-0.5",
                sort === "adapted" ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Most adapted
            </button>
            <button
              type="button"
              onClick={() => setSort("az")}
              className={cn(
                "rounded px-1.5 py-0.5",
                sort === "az" ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              A–Z
            </button>
          </div>
          <span className="text-muted-foreground">
            {selected.length}/{max}
          </span>
        </div>
        <ScrollArea className="max-h-64">
          <div className="p-1">
            {filtered.map((l) => {
              const checked = selected.includes(l.employeeId);
              const disabled = !checked && atCap;
              return (
                <button
                  key={l.employeeId}
                  type="button"
                  disabled={disabled}
                  onClick={() => onToggle(l.employeeId)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-xs",
                    checked ? "bg-primary/10 text-foreground" : "hover:bg-secondary/40",
                    disabled && "opacity-40"
                  )}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span
                      className={cn(
                        "flex h-3.5 w-3.5 items-center justify-center rounded-sm border",
                        checked ? "border-primary bg-primary text-primary-foreground" : "border-border"
                      )}
                    >
                      {checked && <Check className="h-2.5 w-2.5" />}
                    </span>
                    <span className="truncate">{l.name}</span>
                  </span>
                  <Badge variant="outline" className="h-4 px-1 text-[9px]">
                    {adaptationCount(l.overlay)} adapt.
                  </Badge>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="p-3 text-center text-xs text-muted-foreground">No learners match.</p>
            )}
          </div>
        </ScrollArea>
        <div className="flex items-center justify-between border-t border-border bg-secondary/20 p-2">
          <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={onClear}>
            Clear
          </Button>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={onSelectMostAdapted}>
            Top {Math.min(max, learners.length)} most adapted
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ───────────────────── Stage roll-up cell ─────────────────────
function StageRollupCell({
  segments,
  color,
  onSegmentClick,
  learnerName,
  filter,
}: {
  segments: Segment[];
  color: string;
  onSegmentClick: (seg: Segment) => void;
  learnerName: string;
  filter: Filter;
}) {
  const counts = useMemo(() => {
    const c: Record<Kind, number> = {
      completed: 0, skipped: 0, microlearning: 0, emphasis: 0,
      reordered: 0, in_progress: 0, not_started: 0,
    };
    for (const s of segments) c[kindFor(s)]++;
    return c;
  }, [segments]);

  const total = segments.length || 1;
  const order: Kind[] = ["completed", "in_progress", "skipped", "microlearning", "emphasis", "reordered", "not_started"];

  // Tooltip body listing adaptations
  const tipLines = order
    .filter((k) => counts[k] > 0)
    .map((k) => `${KIND_META[k].label}: ${counts[k]}`);

  // Adaptation icons strip (only non-zero, non-baseline kinds)
  const badges: Kind[] = (["skipped", "microlearning", "emphasis", "reordered"] as Kind[]).filter((k) => counts[k] > 0);

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="group flex flex-col gap-1.5">
            {/* learner-color rail with stacked stage segments */}
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted/40 ring-1 ring-border">
              {order.map((k) => {
                if (counts[k] === 0) return null;
                const w = (counts[k] / total) * 100;
                const muted = filter !== "all" && filter !== (k as string);
                const seg = segments.find((s) => kindFor(s) === k);
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => seg && seg.pathChange && onSegmentClick(seg)}
                    aria-label={`${KIND_META[k].label}: ${counts[k]}`}
                    className={cn(
                      "h-full transition-opacity",
                      seg?.pathChange ? "cursor-pointer hover:opacity-90" : "cursor-default",
                      muted && "opacity-25"
                    )}
                    style={{
                      width: `${w}%`,
                      background:
                        k === "completed" || k === "in_progress"
                          ? color
                          : KIND_META[k].tone,
                      opacity: k === "in_progress" ? 0.6 : k === "not_started" ? 0.18 : 1,
                    }}
                  />
                );
              })}
            </div>
            {/* numeric summary */}
            <div className="flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground">
              <span className="font-medium text-foreground">{counts.completed}</span>
              <span>/{segments.length} done</span>
              {badges.map((k) => {
                const Icon = KIND_META[k].icon;
                return (
                  <span
                    key={k}
                    className={cn(
                      "ml-0.5 inline-flex items-center gap-0.5 rounded px-1 py-px",
                      KIND_META[k].tokenBg,
                      KIND_META[k].tokenText
                    )}
                  >
                    <Icon className="h-2.5 w-2.5" />
                    {counts[k]}
                  </span>
                );
              })}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[260px] text-xs">
          <div className="font-medium">{learnerName}</div>
          <div className="mt-1 space-y-0.5">
            {tipLines.map((l) => (
              <div key={l}>{l}</div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ───────────────────── Per-module cell (expanded view) ─────────────────────
function ModuleCell({
  segment,
  color,
  onClick,
  filter,
  learnerName,
}: {
  segment: Segment;
  color: string;
  onClick: () => void;
  filter: Filter;
  learnerName: string;
}) {
  const k = kindFor(segment);
  const meta = KIND_META[k];
  const Icon = meta.icon;
  const interactive = !!segment.pathChange;
  const muted =
    filter !== "all" &&
    !(filter === "skipped" && k === "skipped") &&
    !(filter === "microlearning" && k === "microlearning") &&
    !(filter === "reordered" && k === "reordered");

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            disabled={!interactive}
            onClick={onClick}
            className={cn(
              "flex h-9 w-full items-center justify-center gap-1 rounded border text-[10px] font-medium transition-all",
              meta.tokenBg,
              meta.tokenText,
              "border-transparent",
              interactive && "hover:scale-[1.03] hover:shadow-sm cursor-pointer",
              !interactive && "cursor-default",
              muted && "opacity-25"
            )}
            style={{
              borderColor:
                k === "completed" || k === "in_progress" ? `${color}` : undefined,
              borderWidth: k === "completed" || k === "in_progress" ? 1 : undefined,
            }}
          >
            <Icon className="h-3 w-3" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[260px] text-xs">
          <div className="font-medium">{learnerName}</div>
          <div className="mt-0.5 text-muted-foreground">{segment.module.module_title}</div>
          <div className="mt-1">
            <span className="font-medium">{meta.label}</span>
            {segment.pathChange?.reason && (
              <div className="mt-0.5 text-muted-foreground">{segment.pathChange.reason}</div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ───────────────────── Main component ─────────────────────
export function AdaptivePathsSankey({ learners, modules, onOpenLearner, dense = false }: Props) {
  const MAX_SELECTED = dense ? 4 : 6;

  const defaults = useMemo(
    () =>
      [...learners]
        .sort((a, b) => adaptationCount(b.overlay) - adaptationCount(a.overlay))
        .slice(0, 3)
        .map((l) => l.employeeId),
    [learners]
  );

  const [selected, setSelected] = useState<string[]>(defaults);
  const [compare, setCompare] = useState<CompareMode>("stack");
  const [filter, setFilter] = useState<Filter>("all");
  const [drawerChange, setDrawerChange] = useState<{ change: AiPathChange; learnerName: string } | null>(null);
  const [decisions, setDecisions] = useState<Record<string, "approved" | "reverted">>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleLearner = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_SELECTED) return prev;
      return [...prev, id];
    });
  };

  // Stage groups (preserve order of first occurrence)
  const stageGroups = useMemo(() => {
    const groups: { stage: string; modules: ModuleSpine[]; startIndex: number }[] = [];
    const map = new Map<string, { stage: string; modules: ModuleSpine[]; startIndex: number }>();
    modules.forEach((m, idx) => {
      const stage = m.progression_stage || "core";
      let g = map.get(stage);
      if (!g) {
        g = { stage, modules: [], startIndex: idx };
        map.set(stage, g);
        groups.push(g);
      }
      g.modules.push(m);
    });
    return groups;
  }, [modules]);

  // Build per-learner segments aligned to module index
  const rows = useMemo(() => {
    return selected
      .map((id) => learners.find((l) => l.employeeId === id))
      .filter((x): x is LearnerInput => !!x)
      .map((l) => {
        const overlayIdx = new Map(l.overlay.cells.map((c, idx) => [c.module_code, idx]));
        const changeByCode = new Map<string, AiPathChange>(l.overlay.pathChanges.map((p) => [p.module_code, p]));
        const segments: Segment[] = modules.map((m, i) => {
          const cellIdx = overlayIdx.get(m.module_code) ?? i;
          const cell = l.overlay.cells[cellIdx];
          return {
            status: cell?.status ?? "not_started",
            adaptation: cell?.adaptation,
            pathChange: changeByCode.get(m.module_code),
            module: m,
          };
        });
        return { learner: l, segments };
      });
  }, [selected, learners, modules]);

  const visibleRows = compare === "side" ? rows.slice(0, 2) : compare === "baseline" ? rows.slice(0, 1) : rows;
  const colorForLearner = (idx: number) => PALETTE[idx % PALETTE.length];
  const decide = (id: string, kind: "approved" | "reverted") => setDecisions((p) => ({ ...p, [id]: kind }));

  const allExpanded = stageGroups.every((g) => expanded[g.stage]);
  const toggleAll = () => {
    if (allExpanded) setExpanded({});
    else setExpanded(Object.fromEntries(stageGroups.map((g) => [g.stage, true])));
  };

  // Grid template: name col + one fr per stage; expanded stages get a sub-grid inside
  const gridTemplate = `minmax(140px, 180px) ${stageGroups
    .map((g) => (expanded[g.stage] ? `minmax(${g.modules.length * 56}px, ${g.modules.length}fr)` : "minmax(140px, 1fr)"))
    .join(" ")}`;

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="min-w-0 flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-primary" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">Adaptive paths</h2>
            <p className="text-xs text-muted-foreground">How the AI tailored the cohort path per learner</p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1 text-[10px]">
          <Sparkles className="h-3 w-3" /> Embark AI
        </Badge>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-secondary/20 px-4 py-3">
        {/* Selected learner chips */}
        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-1 text-[10px] uppercase tracking-wide text-muted-foreground">Learners</span>
          {selected.length === 0 && (
            <span className="text-[11px] text-muted-foreground/70">None selected</span>
          )}
          {selected.map((id, idx) => {
            const l = learners.find((x) => x.employeeId === id);
            if (!l) return null;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[11px]"
              >
                <span className="h-2 w-2 rounded-full" style={{ background: colorForLearner(idx) }} />
                {l.name}
                <button
                  type="button"
                  onClick={() => toggleLearner(id)}
                  className="ml-0.5 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={`Remove ${l.name}`}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            );
          })}
          <LearnerPicker
            learners={learners}
            selected={selected}
            onToggle={toggleLearner}
            onClear={() => setSelected([])}
            onSelectMostAdapted={() => setSelected(defaults.slice(0, MAX_SELECTED))}
            max={MAX_SELECTED}
          />
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="h-7 px-2 text-[11px]" onClick={toggleAll}>
            {allExpanded ? "Collapse all" : "Expand all"}
          </Button>
          {/* Compare */}
          <div className="flex items-center gap-0.5 rounded-md border border-border bg-background p-0.5">
            {([
              { id: "stack", label: "Stack" },
              { id: "side", label: "Side-by-side" },
              { id: "baseline", label: "vs Baseline" },
            ] as const).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setCompare(m.id)}
                className={cn(
                  "rounded px-2 py-0.5 text-[11px]",
                  compare === m.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary/50"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
          {/* Filter */}
          <div className="flex items-center gap-0.5 rounded-md border border-border bg-background p-0.5">
            {([
              { id: "all", label: "All" },
              { id: "skipped", label: "Skips" },
              { id: "microlearning", label: "Micro" },
              { id: "reordered", label: "Reorders" },
            ] as const).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  "rounded px-2 py-0.5 text-[11px]",
                  filter === f.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary/50"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto p-4">
        <div className="min-w-[640px]">
          {/* Stage header row */}
          <div className="grid items-end gap-2 pb-2" style={{ gridTemplateColumns: gridTemplate }}>
            <div />
            {stageGroups.map((g) => {
              const isOpen = !!expanded[g.stage];
              return (
                <button
                  key={g.stage}
                  type="button"
                  onClick={() => setExpanded((p) => ({ ...p, [g.stage]: !p[g.stage] }))}
                  className="group flex flex-col items-start gap-1 rounded-md border border-transparent px-2 py-1 text-left hover:border-border hover:bg-secondary/30"
                >
                  <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    {g.stage}
                  </span>
                  <span className="text-[10px] text-muted-foreground/70">
                    {g.modules.length} {g.modules.length === 1 ? "module" : "modules"}
                  </span>
                  {isOpen && (
                    <div
                      className="mt-1 grid w-full gap-1 text-[9px] text-muted-foreground"
                      style={{ gridTemplateColumns: `repeat(${g.modules.length}, minmax(0, 1fr))` }}
                    >
                      {g.modules.map((m) => (
                        <div key={m.module_code} className="truncate" title={m.module_title}>
                          {m.module_title}
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Baseline ribbon */}
          {compare === "baseline" && (
            <div
              className="grid items-center gap-2 border-b border-dashed border-border py-2"
              style={{ gridTemplateColumns: gridTemplate }}
            >
              <div className="text-[10px] text-muted-foreground">Baseline path</div>
              {stageGroups.map((g) => (
                <div key={g.stage} className="h-1.5 rounded-full bg-muted/60" />
              ))}
            </div>
          )}

          {/* Learner rows */}
          {visibleRows.map((row) => {
            const idx = rows.indexOf(row);
            const color = colorForLearner(idx);
            return (
              <div
                key={row.learner.employeeId}
                className="grid items-center gap-2 border-b border-border/50 py-3 last:border-b-0"
                style={{ gridTemplateColumns: gridTemplate }}
              >
                {/* Learner label */}
                <div className="flex items-center gap-2 pr-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                  <button
                    type="button"
                    onClick={() => onOpenLearner?.(row.learner.employeeId)}
                    className="truncate text-xs font-medium text-foreground hover:underline"
                  >
                    {row.learner.name}
                  </button>
                </div>

                {stageGroups.map((g) => {
                  const segs = row.segments.slice(g.startIndex, g.startIndex + g.modules.length);
                  const isOpen = !!expanded[g.stage];

                  if (!isOpen) {
                    return (
                      <StageRollupCell
                        key={g.stage}
                        segments={segs}
                        color={color}
                        learnerName={row.learner.name}
                        filter={filter}
                        onSegmentClick={(seg) => {
                          if (seg.pathChange) setDrawerChange({ change: seg.pathChange, learnerName: row.learner.name });
                        }}
                      />
                    );
                  }

                  return (
                    <div
                      key={g.stage}
                      className="grid gap-1"
                      style={{ gridTemplateColumns: `repeat(${g.modules.length}, minmax(0, 1fr))` }}
                    >
                      {segs.map((seg) => (
                        <ModuleCell
                          key={seg.module.module_code}
                          segment={seg}
                          color={color}
                          learnerName={row.learner.name}
                          filter={filter}
                          onClick={() => {
                            if (seg.pathChange) setDrawerChange({ change: seg.pathChange, learnerName: row.learner.name });
                          }}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {visibleRows.length === 0 && (
            <p className="py-6 text-center text-xs text-muted-foreground">
              Select learners above to chart their adaptive paths.
            </p>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 border-t border-border bg-secondary/10 px-4 py-2 text-[10px] text-muted-foreground">
        {(["completed", "skipped", "microlearning", "emphasis", "reordered", "not_started"] as Kind[]).map((k) => {
          const m = KIND_META[k];
          const Icon = m.icon;
          return (
            <span key={k} className="inline-flex items-center gap-1">
              <span
                className={cn("inline-flex h-3.5 w-3.5 items-center justify-center rounded-sm", m.tokenBg, m.tokenText)}
              >
                <Icon className="h-2.5 w-2.5" />
              </span>
              {m.label}
            </span>
          );
        })}
        <span className="ml-auto text-muted-foreground/70">Click a stage header to expand · click an AI-changed step for details</span>
      </div>

      {drawerChange && (
        <AdaptivePathDrawer
          open={!!drawerChange}
          onOpenChange={(o) => !o && setDrawerChange(null)}
          change={drawerChange.change}
          learnerName={drawerChange.learnerName}
          decision={decisions[drawerChange.change.id]}
          onDecide={(kind) => decide(drawerChange.change.id, kind)}
          onOpenLearner={onOpenLearner ? () => {
            const id = rows.find((r) => r.learner.name === drawerChange.learnerName)?.learner.employeeId;
            if (id) onOpenLearner(id);
            setDrawerChange(null);
          } : undefined}
        />
      )}
    </Card>
  );
}

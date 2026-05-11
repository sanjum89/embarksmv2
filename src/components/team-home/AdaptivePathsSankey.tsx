import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GitBranch, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
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

const PALETTE = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--warning))",
  "hsl(var(--success))",
];

interface Segment {
  status: "completed" | "in_progress" | "not_started" | "locked";
  adaptation?: "diagnostic_only" | "microlearning" | "skip_after_validation" | "emphasis" | null;
  pathChange?: AiPathChange;
  module: ModuleSpine;
}

function adaptationCount(o: LearnerOverlay) {
  return o.pathChanges.length;
}

export function AdaptivePathsSankey({ learners, modules, onOpenLearner, dense = false }: Props) {
  const MAX_SELECTED = dense ? 4 : 6;
  // Default selection: top 3 most-adapted learners
  const defaults = useMemo(() => {
    return [...learners]
      .sort((a, b) => adaptationCount(b.overlay) - adaptationCount(a.overlay))
      .slice(0, 3)
      .map((l) => l.employeeId);
  }, [learners]);

  const [selected, setSelected] = useState<string[]>(defaults);
  const [compare, setCompare] = useState<CompareMode>("stack");
  const [filter, setFilter] = useState<Filter>("all");
  const [hoverLearner, setHoverLearner] = useState<string | null>(null);
  const [drawerChange, setDrawerChange] = useState<{ change: AiPathChange; learnerName: string } | null>(null);
  const [decisions, setDecisions] = useState<Record<string, "approved" | "reverted">>({});

  const toggleLearner = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_SELECTED) return prev;
      return [...prev, id];
    });
  };

  // Cap the spine to overlay length so we don't render trailing empty columns
  const overlayLen = Math.max(
    0,
    ...selected
      .map((id) => learners.find((l) => l.employeeId === id)?.overlay.cells.length ?? 0)
  );
  const spineLen = overlayLen > 0 ? Math.min(modules.length, overlayLen) : modules.length;
  const spineModules = useMemo(() => modules.slice(0, spineLen), [modules, spineLen]);
  const truncated = modules.length > spineLen;

  // Build per-learner segments aligned to spine by INDEX (matches RosterHeatmap)
  const rows = useMemo(() => {
    return selected
      .map((id) => learners.find((l) => l.employeeId === id))
      .filter((x): x is LearnerInput => !!x)
      .map((l) => {
        // overlay pathChanges keyed to overlay's own cell index
        const overlayCellIndexByCode = new Map(
          l.overlay.cells.map((c, idx) => [c.module_code, idx])
        );
        const changeByIndex = new Map<number, AiPathChange>();
        for (const pc of l.overlay.pathChanges) {
          const idx = overlayCellIndexByCode.get(pc.module_code);
          if (idx != null) changeByIndex.set(idx, pc);
        }
        const segments: Segment[] = spineModules.map((m, i) => {
          const cell = l.overlay.cells[i];
          return {
            status: cell?.status ?? "not_started",
            adaptation: cell?.adaptation,
            pathChange: changeByIndex.get(i),
            module: m,
          };
        });
        return { learner: l, segments };
      });
  }, [selected, learners, spineModules]);

  const baselineRow = useMemo(() => ({
    segments: modules.map<Segment>((m) => ({ status: "completed", adaptation: null, module: m })),
  }), [modules]);

  const visibleRows = compare === "side" ? rows.slice(0, 2) : compare === "baseline" ? rows.slice(0, 1) : rows;

  // Geometry
  const COL_W = dense ? 120 : 160;
  const ROW_H = dense ? 56 : 72;
  const PADDING_X = dense ? 16 : 24;
  const PADDING_TOP = dense ? 36 : 44;
  const NODE_W = 14;
  const totalWidth = PADDING_X * 2 + modules.length * COL_W;
  const headerOffset = compare === "baseline" ? ROW_H : 0;
  const totalHeight = PADDING_TOP + headerOffset + visibleRows.length * ROW_H + 16;

  const segmentStyle = (seg: Segment, color: string) => {
    if (seg.pathChange?.kind === "skipped") return { stroke: color, strokeDasharray: "4 3", opacity: 0.7, strokeWidth: 3 };
    if (seg.pathChange?.kind === "microlearning") return { stroke: color, opacity: 1, strokeWidth: 4 };
    if (seg.pathChange?.kind === "emphasis") return { stroke: color, opacity: 1, strokeWidth: 6 };
    if (seg.pathChange?.kind === "reordered") return { stroke: color, opacity: 1, strokeWidth: 4, strokeDasharray: "8 2 2 2" };
    if (seg.status === "completed") return { stroke: color, opacity: 1, strokeWidth: 4 };
    if (seg.status === "in_progress") return { stroke: color, opacity: 0.85, strokeWidth: 4 };
    return { stroke: color, opacity: 0.18, strokeWidth: 3 };
  };

  const passesFilter = (seg: Segment) => {
    if (filter === "all") return true;
    if (!seg.pathChange) return false;
    if (filter === "skipped") return seg.pathChange.kind === "skipped";
    if (filter === "microlearning") return seg.pathChange.kind === "microlearning";
    if (filter === "reordered") return seg.pathChange.kind === "reordered";
    return true;
  };

  const colorForLearner = (idx: number) => PALETTE[idx % PALETTE.length];

  const decide = (id: string, kind: "approved" | "reverted") => {
    setDecisions((prev) => ({ ...prev, [id]: kind }));
  };

  return (
    <Card className="overflow-hidden">
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
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-secondary/20 px-4 py-3">
        {/* Learner chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground mr-1">Learners</span>
          {learners.map((l) => {
            const idx = selected.indexOf(l.employeeId);
            const active = idx !== -1;
            const color = active ? colorForLearner(idx) : undefined;
            return (
              <button
                key={l.employeeId}
                type="button"
                onClick={() => toggleLearner(l.employeeId)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition-colors",
                  active ? "border-foreground/20 bg-background text-foreground" : "border-border bg-background/50 text-muted-foreground hover:border-foreground/40"
                )}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: color ?? "hsl(var(--muted-foreground) / 0.4)" }} />
                {l.name}
              </button>
            );
          })}
          <span className="ml-1 text-[10px] text-muted-foreground">{selected.length}/{MAX_SELECTED}</span>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
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

      {/* Diagram */}
      <div className="overflow-x-auto p-4">
        <svg width={totalWidth} height={totalHeight} className="block">
          {/* Spine column headers + nodes */}
          {modules.map((m, ci) => {
            const x = PADDING_X + ci * COL_W + COL_W / 2;
            return (
              <g key={m.module_code}>
                <text
                  x={x}
                  y={14}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[10px]"
                >
                  {m.module_title.length > 18 ? m.module_title.slice(0, 16) + "…" : m.module_title}
                </text>
                <text
                  x={x}
                  y={26}
                  textAnchor="middle"
                  className="fill-muted-foreground/60 text-[9px] uppercase tracking-wide"
                >
                  {m.progression_stage}
                </text>
                {/* Spine node */}
                <rect
                  x={x - NODE_W / 2}
                  y={PADDING_TOP - 4}
                  width={NODE_W}
                  height={4}
                  rx={2}
                  className="fill-border"
                />
              </g>
            );
          })}

          {/* Baseline ribbon when in baseline mode */}
          {compare === "baseline" && (
            <g opacity={0.5}>
              <text x={PADDING_X} y={PADDING_TOP + 14} className="fill-muted-foreground text-[10px]">
                Baseline path
              </text>
              {modules.slice(0, -1).map((_, i) => {
                const x1 = PADDING_X + i * COL_W + COL_W / 2 + NODE_W / 2;
                const x2 = PADDING_X + (i + 1) * COL_W + COL_W / 2 - NODE_W / 2;
                const y = PADDING_TOP + 24;
                return (
                  <line
                    key={i}
                    x1={x1}
                    x2={x2}
                    y1={y}
                    y2={y}
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={3}
                    strokeDasharray="2 4"
                  />
                );
              })}
            </g>
          )}

          {/* Per-learner ribbons */}
          {visibleRows.map((row, ri) => {
            const color = colorForLearner(rows.indexOf(row));
            const yBase = PADDING_TOP + headerOffset + ri * ROW_H + ROW_H / 2;
            const isHovered = hoverLearner === row.learner.employeeId;
            const dim = hoverLearner && !isHovered;
            return (
              <g
                key={row.learner.employeeId}
                opacity={dim ? 0.15 : 1}
                onMouseEnter={() => setHoverLearner(row.learner.employeeId)}
                onMouseLeave={() => setHoverLearner(null)}
              >
                {/* Learner label */}
                <text x={PADDING_X} y={yBase - ROW_H / 2 + 12} className="fill-foreground text-[11px] font-medium">
                  {row.learner.name}
                </text>
                {/* Segments */}
                {row.segments.slice(0, -1).map((seg, i) => {
                  const next = row.segments[i + 1];
                  const x1 = PADDING_X + i * COL_W + COL_W / 2 + NODE_W / 2;
                  const x2 = PADDING_X + (i + 1) * COL_W + COL_W / 2 - NODE_W / 2;
                  const style = segmentStyle(seg, color);
                  const muted = !passesFilter(seg) && filter !== "all";
                  return (
                    <line
                      key={i}
                      x1={x1}
                      x2={x2}
                      y1={yBase}
                      y2={yBase}
                      stroke={style.stroke}
                      strokeWidth={style.strokeWidth}
                      strokeDasharray={style.strokeDasharray}
                      strokeLinecap="round"
                      opacity={muted ? 0.1 : style.opacity}
                    />
                  );
                  void next;
                })}
                {/* Nodes per cell */}
                {row.segments.map((seg, i) => {
                  const x = PADDING_X + i * COL_W + COL_W / 2;
                  const isMicro = seg.pathChange?.kind === "microlearning";
                  const isSkip = seg.pathChange?.kind === "skipped";
                  const decision = seg.pathChange ? decisions[seg.pathChange.id] : undefined;
                  const r = isMicro ? 6 : isSkip ? 3 : 5;
                  const fill =
                    decision === "reverted"
                      ? "hsl(var(--muted))"
                      : seg.status === "completed"
                      ? color
                      : seg.status === "in_progress"
                      ? color
                      : "hsl(var(--background))";
                  const stroke = color;
                  const interactive = !!seg.pathChange;
                  return (
                    <g
                      key={`n-${i}`}
                      transform={`translate(${x}, ${yBase})`}
                      style={{ cursor: interactive ? "pointer" : "default" }}
                      onClick={() => {
                        if (seg.pathChange) {
                          setDrawerChange({ change: seg.pathChange, learnerName: row.learner.name });
                        }
                      }}
                    >
                      <circle r={r + 4} fill="transparent" />
                      <circle r={r} fill={fill} stroke={stroke} strokeWidth={1.5} />
                      {seg.pathChange && (
                        <title>
                          {row.learner.name} · {seg.module.module_title}
                          {"\n"}
                          {seg.pathChange.kind} — {seg.pathChange.reason}
                        </title>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 border-t border-border bg-secondary/10 px-4 py-2 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <svg width="20" height="6"><line x1="0" x2="20" y1="3" y2="3" stroke="currentColor" strokeWidth="3" /></svg>
          Completed
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg width="20" height="6"><line x1="0" x2="20" y1="3" y2="3" stroke="currentColor" strokeWidth="3" strokeDasharray="3 3" /></svg>
          Skipped
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg width="20" height="8"><line x1="0" x2="20" y1="4" y2="4" stroke="currentColor" strokeWidth="4" /><circle cx="10" cy="4" r="3" fill="currentColor" /></svg>
          Microlearning
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg width="20" height="8"><line x1="0" x2="20" y1="4" y2="4" stroke="currentColor" strokeWidth="6" /></svg>
          Emphasis
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg width="20" height="6"><line x1="0" x2="20" y1="3" y2="3" stroke="currentColor" strokeWidth="3" opacity={0.18} /></svg>
          Not yet reached
        </span>
        <span className="ml-auto text-muted-foreground/70">Click any AI-changed step for details</span>
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
      {/* unused icon-import suppression */}
      <span className="hidden"><X /></span>
    </Card>
  );
}

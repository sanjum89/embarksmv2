import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LearnerOverlay, AiPathChange } from "@/data/managerDemoOverlay";
import { AdaptivePathDrawer } from "./AdaptivePathDrawer";
import { deriveStageBuckets } from "@/lib/cohortStageBuckets";

interface ModuleSpine {
  module_code: string;
  module_title: string;
  progression_stage: string;
  display_order?: number | null;
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

const LEARNER_PALETTE = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
];

// State encoding — color + shape carries the meaning, not the learner.
type StateKind =
  | "completed"
  | "in_progress"
  | "not_reached"
  | "skipped"
  | "microlearning"
  | "emphasis"
  | "reordered";

const STATE_STYLE: Record<StateKind, { stroke: string; width: number; dash?: string; opacity: number; label: string }> = {
  completed:     { stroke: "hsl(var(--success))",          width: 4, opacity: 1,    label: "Completed" },
  in_progress:   { stroke: "hsl(var(--primary))",          width: 4, opacity: 0.9,  label: "In progress" },
  not_reached:   { stroke: "hsl(var(--muted-foreground))", width: 2, dash: "2 4", opacity: 0.35, label: "Not yet reached" },
  skipped:       { stroke: "hsl(var(--muted-foreground))", width: 3, dash: "5 4", opacity: 0.7, label: "Skipped by AI" },
  microlearning: { stroke: "hsl(var(--accent))",           width: 4, opacity: 1,    label: "Microlearning added" },
  emphasis:      { stroke: "hsl(var(--primary))",          width: 7, opacity: 1,    label: "Emphasis (deeper coverage)" },
  reordered:     { stroke: "hsl(var(--primary))",          width: 4, dash: "9 2 2 2", opacity: 1, label: "Reordered" },
};

interface Segment {
  status: "completed" | "in_progress" | "not_started" | "locked";
  adaptation?: "diagnostic_only" | "microlearning" | "skip_after_validation" | "emphasis" | null;
  pathChange?: AiPathChange;
  module: ModuleSpine;
}

function segmentState(seg: Segment): StateKind {
  if (seg.pathChange) {
    if (seg.pathChange.kind === "skipped") return "skipped";
    if (seg.pathChange.kind === "microlearning") return "microlearning";
    if (seg.pathChange.kind === "emphasis") return "emphasis";
    if (seg.pathChange.kind === "reordered") return "reordered";
  }
  if (seg.status === "completed") return "completed";
  if (seg.status === "in_progress") return "in_progress";
  return "not_reached";
}

function adaptationCount(o: LearnerOverlay) {
  return o.pathChanges.length;
}

function prettyStage(s: string) {
  return s
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function NodeGlyph({ state, color }: { state: StateKind; color: string }) {
  // color = learner accent on left chip; nodes themselves use state color
  const stateColor = STATE_STYLE[state].stroke;
  switch (state) {
    case "completed":
      return <circle r={5} fill={stateColor} />;
    case "in_progress":
      return <circle r={5} fill="hsl(var(--background))" stroke={stateColor} strokeWidth={2} />;
    case "not_reached":
      return <circle r={3.5} fill="hsl(var(--background))" stroke="hsl(var(--muted-foreground))" strokeWidth={1} opacity={0.5} />;
    case "skipped":
      return (
        <g>
          <circle r={5} fill="hsl(var(--background))" stroke={stateColor} strokeWidth={1.5} />
          <line x1={-3.5} y1={3.5} x2={3.5} y2={-3.5} stroke={stateColor} strokeWidth={1.5} />
        </g>
      );
    case "microlearning":
      return (
        <g>
          <rect x={-5} y={-5} width={10} height={10} transform="rotate(45)" fill={stateColor} />
          <text x={0} y={2.5} textAnchor="middle" fontSize={8} fontWeight={700} fill="hsl(var(--accent-foreground))">+</text>
        </g>
      );
    case "emphasis":
      return (
        <g>
          <circle r={7} fill="none" stroke={stateColor} strokeWidth={2} />
          <circle r={3} fill={stateColor} />
        </g>
      );
    case "reordered":
      return (
        <g>
          <circle r={5} fill="hsl(var(--background))" stroke={stateColor} strokeWidth={1.5} />
          <path d="M -2.5 -1 A 2.5 2.5 0 1 1 -2.5 1 L -3.5 0 M -2.5 1 L -1.5 0" fill="none" stroke={stateColor} strokeWidth={1.2} />
        </g>
      );
  }
  // fallback to satisfy ts
  return <circle r={4} fill={color} />;
}

export function AdaptivePathsSankey({ learners, modules, onOpenLearner, dense = false }: Props) {
  const MAX_SELECTED = dense ? 4 : 6;
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

  // Spine = full live module list (overlay cells now always align to it).
  const spineModules = modules;
  const truncated = false;
  const spineLen = spineModules.length;

  const rows = useMemo(() => {
    return selected
      .map((id) => learners.find((l) => l.employeeId === id))
      .filter((x): x is LearnerInput => !!x)
      .map((l) => {
        const cellByCode = new Map(l.overlay.cells.map((c) => [c.module_code, c]));
        const changeByCode = new Map(l.overlay.pathChanges.map((pc) => [pc.module_code, pc]));
        const segments: Segment[] = spineModules.map((m) => {
          const cell = cellByCode.get(m.module_code);
          return {
            status: cell?.status ?? "not_started",
            adaptation: cell?.adaptation,
            pathChange: changeByCode.get(m.module_code),
            module: m,
          };
        });
        return { learner: l, segments };
      });
  }, [selected, learners, spineModules]);

  const visibleRows = compare === "side" ? rows.slice(0, 2) : compare === "baseline" ? rows.slice(0, 1) : rows;

  // Real stage groups derived from display_order decade buckets.
  // If everything collapses to one bucket the band carries no signal — hide it.
  const stageGroups = useMemo(() => deriveStageBuckets(spineModules), [spineModules]);
  const showStageBand = stageGroups.length > 1;

  // Geometry — horizontal two-line titles, no rotation.
  const COL_W = dense ? 150 : 210;
  const ROW_H = dense ? 56 : 72;
  const PADDING_X = dense ? 100 : 140;
  const STAGE_BAND_Y = 8;
  const STAGE_BAND_H = showStageBand ? 18 : 0;
  const TITLES_Y = STAGE_BAND_Y + STAGE_BAND_H + (showStageBand ? 18 : 6); // first title baseline
  const TITLE_LINE_H = 13;
  const PADDING_TOP = TITLES_Y + TITLE_LINE_H + 22;
  const NODE_W = 14;
  const totalWidth = PADDING_X + spineModules.length * COL_W + 24;
  const headerOffset = compare === "baseline" ? ROW_H : 0;
  const totalHeight = PADDING_TOP + headerOffset + visibleRows.length * ROW_H + 16;

  // Wrap a title onto two lines, breaking on the nearest space past `softMax`.
  // Line 2 is truncated with an ellipsis if needed.
  const wrapTitle = (title: string, softMax = 22, hardMax = 26): [string, string?] => {
    if (title.length <= softMax) return [title];
    const breakAt = title.indexOf(" ", softMax - 6);
    const cut = breakAt > 0 && breakAt < softMax + 8 ? breakAt : softMax;
    const line1 = title.slice(0, cut).trim();
    let line2 = title.slice(cut).trim();
    if (line2.length > hardMax) line2 = line2.slice(0, hardMax - 1) + "…";
    return [line1, line2];
  };

  const passesFilter = (seg: Segment) => {
    if (filter === "all") return true;
    if (!seg.pathChange) return false;
    if (filter === "skipped") return seg.pathChange.kind === "skipped";
    if (filter === "microlearning") return seg.pathChange.kind === "microlearning";
    if (filter === "reordered") return seg.pathChange.kind === "reordered";
    return true;
  };

  const colorForLearner = (idx: number) => LEARNER_PALETTE[idx % LEARNER_PALETTE.length];

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
          {truncated && (
            <span className="ml-2 text-[10px] text-muted-foreground/80">
              Showing first {spineLen} of {modules.length} modules
            </span>
          )}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
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
          {/* Stage bands */}
          {stageGroups.map((g, i) => {
            const x = PADDING_X + g.startIdx * COL_W + 4;
            const w = g.span * COL_W - 8;
            return (
              <g key={`stage-${i}`}>
                <rect
                  x={x}
                  y={STAGE_BAND_Y}
                  width={w}
                  height={STAGE_BAND_H}
                  rx={9}
                  className="fill-secondary"
                />
                <text
                  x={x + w / 2}
                  y={STAGE_BAND_Y + 12}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[10px] font-medium uppercase tracking-wide"
                >
                  {prettyStage(g.stage)} · {g.span} {g.span === 1 ? "module" : "modules"}
                </text>
              </g>
            );
          })}

          {/* Module titles (angled) + index chip + spine node */}
          {spineModules.map((m, ci) => {
            const x = PADDING_X + ci * COL_W + COL_W / 2;
            const title = m.module_title.length > 18 ? m.module_title.slice(0, 17) + "…" : m.module_title;
            return (
              <g key={m.module_code}>
                <text
                  x={x}
                  y={TITLES_Y}
                  textAnchor="end"
                  transform={`rotate(-22 ${x} ${TITLES_Y})`}
                  className="fill-foreground text-[11px] font-medium"
                >
                  {title}
                  <title>{m.module_title}</title>
                </text>
                <text
                  x={x}
                  y={PADDING_TOP - 12}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[9px] uppercase tracking-wider"
                >
                  M{ci + 1}
                </text>
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

          {/* Baseline ribbon */}
          {compare === "baseline" && (
            <g opacity={0.5}>
              <text x={8} y={PADDING_TOP + 14} className="fill-muted-foreground text-[10px]">
                Baseline path
              </text>
              {spineModules.slice(0, -1).map((_, i) => {
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
            const learnerIdx = rows.indexOf(row);
            const learnerColor = colorForLearner(learnerIdx);
            const yBase = PADDING_TOP + headerOffset + ri * ROW_H + ROW_H / 2;
            const isHovered = hoverLearner === row.learner.employeeId;
            const dim = hoverLearner && !isHovered;
            return (
              <g
                key={row.learner.employeeId}
                opacity={dim ? 0.2 : 1}
                onMouseEnter={() => setHoverLearner(row.learner.employeeId)}
                onMouseLeave={() => setHoverLearner(null)}
              >
                {/* Learner left label */}
                <g transform={`translate(8 ${yBase})`}>
                  <circle r={4} cx={4} cy={0} fill={learnerColor} />
                  <text x={14} y={4} className="fill-foreground text-[12px] font-medium">
                    {row.learner.name}
                  </text>
                </g>
                {/* Faint baseline rail */}
                <line
                  x1={PADDING_X + COL_W / 2}
                  x2={PADDING_X + (spineModules.length - 1) * COL_W + COL_W / 2}
                  y1={yBase}
                  y2={yBase}
                  stroke="hsl(var(--border))"
                  strokeWidth={1}
                  opacity={0.6}
                />
                {/* Segments */}
                {row.segments.slice(0, -1).map((seg, i) => {
                  const next = row.segments[i + 1];
                  const x1 = PADDING_X + i * COL_W + COL_W / 2 + NODE_W / 2;
                  const x2 = PADDING_X + (i + 1) * COL_W + COL_W / 2 - NODE_W / 2;
                  // Use the "downstream" state for the segment to next node, but
                  // if either side is an AI change show that. Simpler: use seg's own state.
                  const state = segmentState(seg);
                  const nextState = segmentState(next);
                  // If current is reached but next is not yet, treat segment as not_reached
                  const useState: StateKind =
                    state === "not_reached" ? "not_reached" : nextState === "not_reached" && state !== "skipped" && state !== "microlearning" && state !== "emphasis" && state !== "reordered" ? "not_reached" : state;
                  const style = STATE_STYLE[useState];
                  const muted = !passesFilter(seg) && filter !== "all";
                  return (
                    <line
                      key={i}
                      x1={x1}
                      x2={x2}
                      y1={yBase}
                      y2={yBase}
                      stroke={style.stroke}
                      strokeWidth={style.width}
                      strokeDasharray={style.dash}
                      strokeLinecap="round"
                      opacity={muted ? 0.1 : style.opacity}
                    />
                  );
                })}
                {/* Nodes per cell */}
                {row.segments.map((seg, i) => {
                  const x = PADDING_X + i * COL_W + COL_W / 2;
                  const state = segmentState(seg);
                  const decision = seg.pathChange ? decisions[seg.pathChange.id] : undefined;
                  const interactive = !!seg.pathChange;
                  return (
                    <g
                      key={`n-${i}`}
                      transform={`translate(${x}, ${yBase})`}
                      style={{ cursor: interactive ? "pointer" : "default" }}
                      opacity={decision === "reverted" ? 0.4 : 1}
                      onClick={() => {
                        if (seg.pathChange) {
                          setDrawerChange({ change: seg.pathChange, learnerName: row.learner.name });
                        }
                      }}
                    >
                      <circle r={10} fill="transparent" />
                      <NodeGlyph state={state} color={learnerColor} />
                      {seg.pathChange && (
                        <title>
                          {row.learner.name} · {seg.module.module_title}
                          {"\n"}
                          {STATE_STYLE[state].label} — {seg.pathChange.reason}
                        </title>
                      )}
                      {!seg.pathChange && (
                        <title>
                          {row.learner.name} · {seg.module.module_title}
                          {"\n"}
                          {STATE_STYLE[state].label}
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
      <div className="space-y-2 border-t border-border bg-secondary/10 px-4 py-3 text-[11px] text-muted-foreground">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <span className="text-[10px] uppercase tracking-wide font-semibold text-foreground/70">On plan</span>
          <LegendItem state="completed" />
          <LegendItem state="in_progress" />
          <LegendItem state="not_reached" />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <span className="text-[10px] uppercase tracking-wide font-semibold text-foreground/70">AI changes</span>
          <LegendItem state="skipped" />
          <LegendItem state="microlearning" />
          <LegendItem state="emphasis" />
          <LegendItem state="reordered" />
          <span className="ml-auto text-muted-foreground/70">Click any AI-changed step for details</span>
        </div>
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

function LegendItem({ state }: { state: StateKind }) {
  const s = STATE_STYLE[state];
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg width="34" height="14" className="overflow-visible">
        <line x1="0" x2="22" y1="7" y2="7" stroke={s.stroke} strokeWidth={s.width} strokeDasharray={s.dash} strokeLinecap="round" opacity={s.opacity} />
        <g transform="translate(28 7)">
          <NodeGlyph state={state} color={s.stroke} />
        </g>
      </svg>
      <span>{s.label}</span>
    </span>
  );
}

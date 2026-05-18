import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { GitBranch, Sparkles, Plus, X, Check, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LearnerOverlay, AiPathChange, LearnerStatus } from "@/data/managerDemoOverlay";
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

type CompareMode = "stack" | "baseline";
type Filter = "all" | "skipped" | "microlearning" | "reordered";

const LEARNER_PALETTE = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
  "hsl(var(--primary) / 0.6)",
  "hsl(var(--accent) / 0.6)",
];

const MAX_SELECTED = 7;

// Status meta — color-coded tag for each learner status.
const STATUS_META: Record<LearnerStatus, { label: string; cls: string; dot: string }> = {
  rising_star:    { label: "Rising star",    cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30", dot: "bg-emerald-500" },
  on_track:       { label: "On track",       cls: "bg-blue-500/15    text-blue-700    dark:text-blue-300    border-blue-500/30",    dot: "bg-blue-500" },
  needs_check_in: { label: "Needs check-in", cls: "bg-amber-500/15   text-amber-700   dark:text-amber-300   border-amber-500/30",   dot: "bg-amber-500" },
  at_risk:        { label: "At risk",        cls: "bg-red-500/15     text-red-700     dark:text-red-300     border-red-500/30",     dot: "bg-red-500" },
};

function StatusTag({ status, className }: { status: LearnerStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-1.5 py-0 text-[10px] font-medium leading-4",
        meta.cls,
        className
      )}
    >
      {meta.label}
    </span>
  );
}

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
  return <circle r={4} fill={color} />;
}

const ALL_TRACKS = "__all__";

export function AdaptivePathsSankey({ learners, modules, onOpenLearner, dense = false }: Props) {
  const defaults = useMemo(() => {
    return [...learners]
      .sort((a, b) => adaptationCount(b.overlay) - adaptationCount(a.overlay))
      .slice(0, 3)
      .map((l) => l.employeeId);
  }, [learners]);

  const [selected, setSelected] = useState<string[]>(defaults);
  const [compare, setCompare] = useState<CompareMode>("stack");
  const [filter, setFilter] = useState<Filter>("all");
  const [activeTrack, setActiveTrack] = useState<string>(ALL_TRACKS);
  const [pickerOpen, setPickerOpen] = useState(false);
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

  const removeLearner = (id: string) =>
    setSelected((prev) => prev.filter((x) => x !== id));

  const overlayLen = Math.max(
    0,
    ...selected.map((id) => learners.find((l) => l.employeeId === id)?.overlay.cells.length ?? 0)
  );
  const fullSpineLen = overlayLen > 0 ? Math.min(modules.length, overlayLen) : modules.length;
  const fullSpine = useMemo(() => modules.slice(0, fullSpineLen), [modules, fullSpineLen]);
  const truncated = modules.length > fullSpineLen;

  // Track tabs derived from the full spine
  const allTrackGroups = useMemo(() => {
    const out: { stage: string; startIdx: number; span: number }[] = [];
    fullSpine.forEach((m, i) => {
      const last = out[out.length - 1];
      if (last && last.stage === m.progression_stage) last.span += 1;
      else out.push({ stage: m.progression_stage, startIdx: i, span: 1 });
    });
    return out;
  }, [fullSpine]);

  // Apply active track filter to the spine
  const spineModules = useMemo(() => {
    if (activeTrack === ALL_TRACKS) return fullSpine;
    const g = allTrackGroups.find((x) => x.stage === activeTrack);
    if (!g) return fullSpine;
    return fullSpine.slice(g.startIdx, g.startIdx + g.span);
  }, [fullSpine, allTrackGroups, activeTrack]);

  const trackOffset = useMemo(() => {
    if (activeTrack === ALL_TRACKS) return 0;
    const g = allTrackGroups.find((x) => x.stage === activeTrack);
    return g?.startIdx ?? 0;
  }, [allTrackGroups, activeTrack]);

  const rows = useMemo(() => {
    return selected
      .map((id) => learners.find((l) => l.employeeId === id))
      .filter((x): x is LearnerInput => !!x)
      .map((l) => {
        const overlayCellIndexByCode = new Map(
          l.overlay.cells.map((c, idx) => [c.module_code, idx])
        );
        const changeByIndex = new Map<number, AiPathChange>();
        for (const pc of l.overlay.pathChanges) {
          const idx = overlayCellIndexByCode.get(pc.module_code);
          if (idx != null) changeByIndex.set(idx, pc);
        }
        const segments: Segment[] = spineModules.map((m, i) => {
          const overlayIdx = i + trackOffset;
          const cell = l.overlay.cells[overlayIdx];
          return {
            status: cell?.status ?? "not_started",
            adaptation: cell?.adaptation,
            pathChange: changeByIndex.get(overlayIdx),
            module: m,
          };
        });
        return { learner: l, segments };
      });
  }, [selected, learners, spineModules, trackOffset]);

  const visibleRows = compare === "baseline" ? rows.slice(0, 1) : rows;

  // Per-track adaptation counts across currently selected learners
  const trackAdaptationCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const g of allTrackGroups) counts.set(g.stage, 0);
    let allCount = 0;
    for (const id of selected) {
      const l = learners.find((x) => x.employeeId === id);
      if (!l) continue;
      const codeToStage = new Map(fullSpine.map((m) => [m.module_code, m.progression_stage]));
      for (const pc of l.overlay.pathChanges) {
        const stage = codeToStage.get(pc.module_code);
        if (!stage) continue;
        counts.set(stage, (counts.get(stage) ?? 0) + 1);
        allCount += 1;
      }
    }
    return { perStage: counts, all: allCount };
  }, [allTrackGroups, selected, learners, fullSpine]);

  // Stage groups within the *currently rendered* spine (for the in-SVG band header)
  const stageGroups = useMemo(() => {
    const out: { stage: string; startIdx: number; span: number }[] = [];
    spineModules.forEach((m, i) => {
      const last = out[out.length - 1];
      if (last && last.stage === m.progression_stage) last.span += 1;
      else out.push({ stage: m.progression_stage, startIdx: i, span: 1 });
    });
    return out;
  }, [spineModules]);

  // Geometry — when zoomed into a track, give each module more horizontal room.
  const zoomed = activeTrack !== ALL_TRACKS;
  const COL_W = zoomed ? (dense ? 220 : 280) : (dense ? 168 : 210);
  const ROW_H = dense ? 56 : 72;
  const PADDING_X = dense ? 110 : 160; // extra room for name + status tag
  const STAGE_BAND_Y = 8;
  const STAGE_BAND_H = 18;
  const TITLES_Y = STAGE_BAND_Y + STAGE_BAND_H + 18;
  const TITLE_LINE_H = 13;
  const PADDING_TOP = TITLES_Y + TITLE_LINE_H * 2 + 18;
  const NODE_W = 14;
  const totalWidth = PADDING_X + Math.max(spineModules.length, 1) * COL_W + 24;
  const headerOffset = compare === "baseline" ? ROW_H : 0;
  const totalHeight = PADDING_TOP + headerOffset + Math.max(visibleRows.length, 1) * ROW_H + 16;

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

      {/* Toolbar Row 1: Learner picker + compare mode */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-secondary/20 px-4 py-3">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground mr-1">Learners</span>

        {/* Selected chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {selected.map((id, idx) => {
            const l = learners.find((x) => x.employeeId === id);
            if (!l) return null;
            const color = colorForLearner(idx);
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-foreground"
              >
                <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                <span className="font-medium">{l.name}</span>
                <StatusTag status={l.overlay.status} />
                <button
                  type="button"
                  onClick={() => removeLearner(id)}
                  className="ml-0.5 rounded-full p-0.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  aria-label={`Remove ${l.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}

          {/* Add picker */}
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 rounded-full border-dashed px-2 text-[11px]"
                disabled={selected.length >= MAX_SELECTED && learners.every((l) => selected.includes(l.employeeId))}
              >
                <Plus className="h-3 w-3" />
                Add learners
                <span className="text-muted-foreground">({selected.length}/{MAX_SELECTED})</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search learners..." />
                <CommandList>
                  <CommandEmpty>No learners found.</CommandEmpty>
                  <CommandGroup>
                    {learners.map((l) => {
                      const isSelected = selected.includes(l.employeeId);
                      const atCap = !isSelected && selected.length >= MAX_SELECTED;
                      return (
                        <CommandItem
                          key={l.employeeId}
                          value={`${l.name} ${l.overlay.role_title ?? ""}`}
                          disabled={atCap}
                          onSelect={() => {
                            if (atCap) return;
                            toggleLearner(l.employeeId);
                          }}
                          className={cn("flex items-center gap-2", atCap && "opacity-50")}
                        >
                          <span className={cn("flex h-4 w-4 items-center justify-center rounded border", isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                            {isSelected && <Check className="h-3 w-3" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[12px] font-medium">{l.name}</span>
                            {l.overlay.role_title && (
                              <span className="block truncate text-[10px] text-muted-foreground">{l.overlay.role_title}</span>
                            )}
                          </span>
                          <StatusTag status={l.overlay.status} />
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {truncated && (
            <span className="ml-2 text-[10px] text-muted-foreground/80">
              Showing first {fullSpineLen} of {modules.length} modules
            </span>
          )}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-md border border-border bg-background p-0.5">
            {([
              { id: "stack", label: "Stack" },
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

      {/* Toolbar Row 2: Track tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border bg-background px-4 py-2">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground mr-1">Track</span>
        <button
          type="button"
          onClick={() => setActiveTrack(ALL_TRACKS)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] transition-colors",
            activeTrack === ALL_TRACKS
              ? "border-primary bg-primary/10 text-foreground"
              : "border-border bg-background text-muted-foreground hover:border-foreground/40"
          )}
        >
          All tracks
          <span className="text-muted-foreground">· {fullSpine.length} mod</span>
          {trackAdaptationCounts.all > 0 && (
            <span className="rounded-full bg-accent/20 px-1.5 text-[10px] font-medium text-accent-foreground">
              {trackAdaptationCounts.all}
            </span>
          )}
        </button>
        {allTrackGroups.map((g) => {
          const active = activeTrack === g.stage;
          const count = trackAdaptationCounts.perStage.get(g.stage) ?? 0;
          return (
            <button
              key={g.stage}
              type="button"
              onClick={() => setActiveTrack(g.stage)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] transition-colors",
                active
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-foreground/40"
              )}
            >
              <span className="font-medium text-foreground">{prettyStage(g.stage)}</span>
              <span className="text-muted-foreground">· {g.span} mod</span>
              {count > 0 && (
                <span className="rounded-full bg-accent/20 px-1.5 text-[10px] font-medium text-accent-foreground">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Diagram */}
      <div className="overflow-x-auto p-4">
        {selected.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <Users className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium text-foreground">No learners selected</p>
            <p className="text-xs text-muted-foreground">Add learners to see how the AI tailored their path.</p>
          </div>
        ) : (
          <svg width={totalWidth} height={totalHeight} className="block">
            {/* Stage bands (clickable to zoom into that track) */}
            {stageGroups.map((g, i) => {
              const x = PADDING_X + g.startIdx * COL_W + 4;
              const w = g.span * COL_W - 8;
              const isActive = activeTrack === g.stage;
              return (
                <g key={`stage-${i}`} style={{ cursor: "pointer" }} onClick={() => setActiveTrack(activeTrack === g.stage ? ALL_TRACKS : g.stage)}>
                  <rect
                    x={x}
                    y={STAGE_BAND_Y}
                    width={w}
                    height={STAGE_BAND_H}
                    rx={9}
                    className={isActive ? "fill-primary/15" : "fill-secondary"}
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

            {/* Module titles */}
            {spineModules.map((m, ci) => {
              const x = PADDING_X + ci * COL_W + COL_W / 2;
              const MAX_PER_LINE = Math.max(14, Math.floor(COL_W / 8));
              const words = m.module_title.split(/\s+/);
              let line1 = "";
              let line2 = "";
              for (const w of words) {
                if ((line1 + " " + w).trim().length <= MAX_PER_LINE) {
                  line1 = (line1 + " " + w).trim();
                } else {
                  line2 = (line2 + " " + w).trim();
                }
              }
              if (line2.length > MAX_PER_LINE) {
                line2 = line2.slice(0, MAX_PER_LINE - 1).trimEnd() + "…";
              }
              const moduleNum = trackOffset + ci + 1;
              return (
                <g key={m.module_code}>
                  <text
                    x={x}
                    y={TITLES_Y}
                    textAnchor="middle"
                    className="fill-foreground text-[11px] font-medium"
                  >
                    <tspan x={x} dy={0}>{line1}</tspan>
                    {line2 && <tspan x={x} dy={TITLE_LINE_H}>{line2}</tspan>}
                    <title>{m.module_title}</title>
                  </text>
                  <text
                    x={x}
                    y={PADDING_TOP - 12}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[9px] uppercase tracking-wider"
                  >
                    M{moduleNum}
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
            {compare === "baseline" && spineModules.length > 1 && (
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
              const status = row.learner.overlay.status;
              const statusMeta = STATUS_META[status];
              return (
                <g
                  key={row.learner.employeeId}
                  opacity={dim ? 0.2 : 1}
                  onMouseEnter={() => setHoverLearner(row.learner.employeeId)}
                  onMouseLeave={() => setHoverLearner(null)}
                >
                  {/* Learner left label with status */}
                  <g transform={`translate(8 ${yBase})`}>
                    <circle r={4} cx={4} cy={0} fill={learnerColor} />
                    <text x={14} y={-3} className="fill-foreground text-[12px] font-medium">
                      {row.learner.name}
                    </text>
                    <foreignObject x={14} y={4} width={PADDING_X - 22} height={16}>
                      <div className="flex">
                        <span className={cn("inline-flex items-center rounded-full border px-1.5 text-[9px] font-medium leading-[14px]", statusMeta.cls)}>
                          {statusMeta.label}
                        </span>
                      </div>
                    </foreignObject>
                  </g>
                  {/* Faint baseline rail */}
                  {spineModules.length > 1 && (
                    <line
                      x1={PADDING_X + COL_W / 2}
                      x2={PADDING_X + (spineModules.length - 1) * COL_W + COL_W / 2}
                      y1={yBase}
                      y2={yBase}
                      stroke="hsl(var(--border))"
                      strokeWidth={1}
                      opacity={0.6}
                    />
                  )}
                  {/* Segments */}
                  {row.segments.slice(0, -1).map((seg, i) => {
                    const next = row.segments[i + 1];
                    const x1 = PADDING_X + i * COL_W + COL_W / 2 + NODE_W / 2;
                    const x2 = PADDING_X + (i + 1) * COL_W + COL_W / 2 - NODE_W / 2;
                    const state = segmentState(seg);
                    const nextState = segmentState(next);
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
        )}
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
          <span className="ml-auto text-muted-foreground/70">Click any AI-changed step for details · Click a stage band to zoom into that track</span>
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

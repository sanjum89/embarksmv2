import { useMemo, useState } from "react";
import { CheckCircle2, User, Clock, Sparkles, ChevronDown, ChevronRight } from "lucide-react";
import type { My360Data, CapabilityRow } from "@/hooks/useMy360Data";
import { humanizeCode } from "@/lib/my360v2/bucketing";

interface Props {
  data: My360Data;
}

const SOURCE_CONFIG = {
  validated: { label: "Validated", icon: CheckCircle2, accent: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", rail: "bg-emerald-500" },
  self_claimed: { label: "Self-claimed", icon: User, accent: "text-primary", bg: "bg-primary/10 border-primary/30", rail: "bg-primary" },
  pending: { label: "Pending review", icon: Clock, accent: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", rail: "bg-amber-500" },
  ai_inferred: { label: "AI-inferred", icon: Sparkles, accent: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/10 border-violet-500/30", rail: "bg-violet-500" },
} as const;

type SourceKey = keyof typeof SOURCE_CONFIG;

export function SkillsTab({ data }: Props) {
  // Group proficiency rows by parent competency_id (top-level rows + sub-skills via metadata.parent_competency_id)
  // capability_code uses competency_id for top-level, "{competency_id}::{slug}" for sub-skills.
  const topLevel = data.proficiency.filter((p) => !p.capability_code.includes("::"));
  const subByParent = useMemo(() => {
    const m: Record<string, CapabilityRow[]> = {};
    for (const p of data.proficiency) {
      if (p.capability_code.includes("::")) {
        const parent = p.capability_code.split("::")[0];
        (m[parent] ||= []).push(p);
      }
    }
    return m;
  }, [data.proficiency]);

  const counts = useMemo(() => {
    const c: Record<SourceKey, number> = { validated: 0, self_claimed: 0, pending: 0, ai_inferred: 0 };
    for (const p of topLevel) {
      const s = (p.source as SourceKey) ?? "self_claimed";
      if (s in c) c[s]++;
    }
    return c;
  }, [topLevel]);

  const catalogByCode = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of data.competencyCatalog) m[c.competency_id] = c.competency_name;
    return m;
  }, [data.competencyCatalog]);

  const [filter, setFilter] = useState<SourceKey | "all">("all");
  const [levelBucket, setLevelBucket] = useState<"all" | "strengths" | "growing" | "gaps">("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (code: string) =>
    setExpanded((s) => {
      const n = new Set(s);
      n.has(code) ? n.delete(code) : n.add(code);
      return n;
    });

  const matchesBucket = (lvl: number) =>
    levelBucket === "all" ||
    (levelBucket === "strengths" && lvl >= 4) ||
    (levelBucket === "growing" && lvl === 3) ||
    (levelBucket === "gaps" && lvl <= 2);

  const visible = topLevel
    .filter((p) => filter === "all" || p.source === filter)
    .filter((p) => matchesBucket(p.current_level))
    .sort((a, b) => b.current_level - a.current_level);

  // Auto-expand top 3 strengths + top 3 gaps on first render so sub-skills are visible.
  const autoExpanded = useMemo(() => {
    const sorted = [...topLevel].sort((a, b) => b.current_level - a.current_level);
    const strengths = sorted.slice(0, 3).map((r) => r.capability_code);
    const gaps = [...topLevel].sort((a, b) => a.current_level - b.current_level).slice(0, 3).map((r) => r.capability_code);
    return new Set([...strengths, ...gaps]);
  }, [topLevel]);

  const isExpanded = (code: string) => expanded.has(code) || (autoExpanded.has(code) && expanded.size === 0);


  return (
    <div className="space-y-5">
      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(Object.entries(SOURCE_CONFIG) as Array<[SourceKey, typeof SOURCE_CONFIG[SourceKey]]>).map(([key, cfg]) => {
          const Icon = cfg.icon;
          const active = filter === key;
          return (
            <button
              key={key}
              onClick={() => setFilter(active ? "all" : key)}
              className={`relative rounded-xl border bg-card p-4 text-left overflow-hidden transition-all hover:border-foreground/30 ${active ? "ring-2 ring-foreground/20" : "border-border"}`}
            >
              <span className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.rail}`} aria-hidden />
              <div className="flex items-center justify-between mb-2">
                <Icon className={`h-4 w-4 ${cfg.accent}`} />
                <span className="text-2xl font-semibold tabular-nums">{counts[key]}</span>
              </div>
              <div className="text-xs font-medium">{cfg.label}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{cfg.label === "Validated" ? "Manager-confirmed" : cfg.label === "Self-claimed" ? "By the learner" : cfg.label === "Pending review" ? "Awaiting sign-off" : "From signals"}</div>
            </button>
          );
        })}
      </div>

      {/* Skill list */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80 font-medium">Capabilities</div>
            <div className="text-sm font-semibold">{filter === "all" ? `All ${visible.length}` : `${SOURCE_CONFIG[filter].label} (${visible.length})`}</div>
          </div>
          {filter !== "all" && (
            <button onClick={() => setFilter("all")} className="text-xs text-muted-foreground hover:text-foreground underline">
              Clear filter
            </button>
          )}
        </div>
        <div className="divide-y divide-border">
          {visible.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground italic">No skills in this bucket.</div>
          )}
          {visible.map((row) => {
            const src = (row.source as SourceKey) ?? "self_claimed";
            const cfg = SOURCE_CONFIG[src] ?? SOURCE_CONFIG.self_claimed;
            const Icon = cfg.icon;
            const name = catalogByCode[row.capability_code] ?? humanizeCode(row.capability_code);
            const subs = subByParent[row.capability_code] ?? [];
            const isOpen = expanded.has(row.capability_code);
            const pct = (row.current_level / 5) * 100;
            return (
              <div key={row.capability_code}>
                <div className="px-4 py-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => subs.length && toggle(row.capability_code)}
                      className={`h-5 w-5 flex items-center justify-center rounded text-muted-foreground ${subs.length ? "hover:bg-muted" : "invisible"}`}
                    >
                      {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm font-medium truncate">{name}</span>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] border ${cfg.bg} ${cfg.accent} flex-shrink-0`}>
                          <Icon className="h-2.5 w-2.5" />
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full ${cfg.rail} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-medium tabular-nums text-muted-foreground w-10 text-right">{row.current_level}/5</span>
                      </div>
                      {row.short_rationale && <div className="text-[11px] text-muted-foreground mt-1.5 italic">{row.short_rationale}</div>}
                    </div>
                  </div>
                </div>
                {isOpen && subs.length > 0 && (
                  <div className="bg-muted/20 px-4 py-3 pl-12 space-y-2 border-t border-border/60">
                    {subs.map((s) => {
                      const subName = humanizeCode(s.capability_code.split("::")[1]);
                      const sp = (s.current_level / 5) * 100;
                      return (
                        <div key={s.capability_code} className="flex items-center gap-3">
                          <span className="text-[11px] flex-1 truncate text-muted-foreground">{subName}</span>
                          <div className="h-1 w-24 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full ${cfg.rail} opacity-70 rounded-full`} style={{ width: `${sp}%` }} />
                          </div>
                          <span className="text-[10px] tabular-nums text-muted-foreground w-8 text-right">{s.current_level}/5</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

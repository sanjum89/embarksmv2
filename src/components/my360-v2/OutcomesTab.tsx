import { TrendingUp, Heart, Briefcase, Cpu, Crown, Layers } from "lucide-react";
import type { My360Data } from "@/hooks/useMy360Data";

interface Props {
  data: My360Data;
}

function Card({ eyebrow, title, icon: Icon, accent = "primary", children }: { eyebrow: string; title: string; icon: React.ElementType; accent?: "primary" | "emerald" | "violet" | "amber" | "rose"; children: React.ReactNode }) {
  const map = {
    primary: "text-primary border-primary/30 bg-primary/5",
    emerald: "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
    violet: "text-violet-600 dark:text-violet-400 border-violet-500/30 bg-violet-500/5",
    amber: "text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/5",
    rose: "text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/5",
  };
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full border ${map[accent]}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80 font-medium leading-none">{eyebrow}</div>
          <div className="text-sm font-semibold mt-0.5">{title}</div>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function OutcomesTab({ data }: Props) {
  const s = data.succession;
  const fitTone = (pct: number) => (pct >= 75 ? "bg-emerald-500" : pct >= 60 ? "bg-primary" : "bg-amber-500");
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card eyebrow="Closed loop" title="Skills → outcomes" icon={TrendingUp} accent="emerald">
        <p className="text-sm text-muted-foreground leading-relaxed">{s?.closed_loop_summary ?? "No closed-loop summary yet."}</p>
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="rounded-lg bg-muted/40 p-2.5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Validated</div>
            <div className="text-lg font-semibold tabular-nums">{data.proficiency.filter((p) => p.source === "validated" && !p.capability_code.includes("::")).length}</div>
          </div>
          <div className="rounded-lg bg-muted/40 p-2.5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">In progress</div>
            <div className="text-lg font-semibold tabular-nums">{data.progress.filter((p) => p.status === "in_progress").length}</div>
          </div>
          <div className="rounded-lg bg-muted/40 p-2.5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Completed</div>
            <div className="text-lg font-semibold tabular-nums">{data.progress.filter((p) => p.status === "completed").length}</div>
          </div>
        </div>
      </Card>

      <Card eyebrow="Engagement" title={`Score: ${s?.engagement_score ?? "—"}`} icon={Heart} accent="rose">
        <div className="space-y-3">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-rose-500" style={{ width: `${s?.engagement_score ?? 0}%` }} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg bg-muted/40 p-2.5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Human + AI fit</div>
              <div className="text-base font-semibold">{s?.human_ai_fit ?? "—"}</div>
            </div>
            <div className="rounded-lg bg-muted/40 p-2.5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Pulse trend</div>
              <div className="text-base font-semibold">Stable</div>
            </div>
          </div>
        </div>
      </Card>

      <Card eyebrow="Potential roles" title={`${data.potentialRoles.length} candidate next moves`} icon={Briefcase} accent="primary">
        <div className="space-y-2.5">
          {data.potentialRoles.length === 0 && <div className="text-sm text-muted-foreground italic">No candidate roles mapped yet.</div>}
          {data.potentialRoles.map((r, i) => (
            <div key={i} className="rounded-lg border border-border/60 bg-muted/20 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium">{r.role_title}</span>
                <span className="text-xs tabular-nums font-semibold">{r.fit_percent}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-1.5">
                <div className={`h-full ${fitTone(r.fit_percent)} rounded-full`} style={{ width: `${r.fit_percent}%` }} />
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{r.horizon_months ? `${r.horizon_months}-month horizon` : ""}</span>
              </div>
              {r.rationale && <div className="text-[11px] text-muted-foreground mt-1.5 italic">{r.rationale}</div>}
            </div>
          ))}
        </div>
      </Card>

      <Card eyebrow="Workforce of the future" title="What this looks like for the firm" icon={Cpu} accent="violet">
        <p className="text-sm text-muted-foreground leading-relaxed">{s?.workforce_of_the_future ?? "—"}</p>
      </Card>

      {(s?.successor_for?.length || s?.potential_successors?.length) ? (
        <Card eyebrow="Succession" title="Bench" icon={Crown} accent="amber">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground/80 mb-1.5">Successor for</div>
              <ul className="space-y-1">
                {(s?.successor_for ?? []).map((r) => <li key={r} className="text-foreground">• {r}</li>)}
                {(s?.successor_for ?? []).length === 0 && <li className="italic text-muted-foreground">—</li>}
              </ul>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground/80 mb-1.5">Potential successors</div>
              <ul className="space-y-1">
                {(s?.potential_successors ?? []).map((r) => <li key={r} className="text-foreground">• {r}</li>)}
                {(s?.potential_successors ?? []).length === 0 && <li className="italic text-muted-foreground">—</li>}
              </ul>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

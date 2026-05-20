import { Link } from "react-router-dom";
import { Compass, Users, Sparkles, Target, MessageSquare, ArrowUpRight, CircleDot } from "lucide-react";
import type { My360Data } from "@/hooks/useMy360Data";

interface Props {
  data: My360Data;
}

function Card({ eyebrow, title, icon: Icon, children, action }: { eyebrow: string; title: string; icon: React.ElementType; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80 font-medium leading-none">{eyebrow}</div>
            <div className="text-sm font-semibold mt-0.5">{title}</div>
          </div>
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function GrowthTab({ data }: Props) {
  const stretchInProgress = data.stretchTasks.filter((t) => t.status === "in_progress");
  const stretchTodo = data.stretchTasks.filter((t) => t.status === "todo");
  const recentFeedback = data.managerFeedback.slice(0, 3);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <Card
          eyebrow="Embark AI"
          title="Your personalised path"
          icon={Compass}
          action={
            <Link to="/" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              Open Embark <ArrowUpRight className="h-3 w-3" />
            </Link>
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Based on your skill profile, role target, and progress, Embark adapts your modules and recommends the next best step each session.
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-muted/40 p-2.5">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Modules</div>
                <div className="text-lg font-semibold tabular-nums">{data.modules.length}</div>
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
          </div>
        </Card>

        <Card eyebrow="Stretch tasks" title={`${stretchInProgress.length + stretchTodo.length} on your plate`} icon={Target}>
          <div className="space-y-2.5">
            {data.stretchTasks.length === 0 && <div className="text-sm text-muted-foreground italic">No stretch tasks yet.</div>}
            {data.stretchTasks.map((t, i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-muted/20 p-3">
                <CircleDot className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${t.status === "in_progress" ? "text-primary" : "text-muted-foreground"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{t.title}</span>
                    <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full ${t.status === "in_progress" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {t.status.replace("_", " ")}
                    </span>
                  </div>
                  {t.detail && <div className="text-xs text-muted-foreground mt-1">{t.detail}</div>}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card eyebrow="Recent manager feedback" title="Latest reflections" icon={MessageSquare}>
          <div className="space-y-3">
            {recentFeedback.length === 0 && <div className="text-sm text-muted-foreground italic">No feedback recorded yet.</div>}
            {recentFeedback.map((f, i) => {
              const tone = f.sentiment === "positive" ? "border-l-emerald-500" : f.sentiment === "constructive" ? "border-l-amber-500" : "border-l-primary";
              return (
                <div key={i} className={`border-l-2 ${tone} pl-3 py-1`}>
                  <div className="text-sm leading-relaxed">{f.body}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {f.author_label} · {new Date(f.feedback_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card eyebrow="IDP + Mentor" title="Development partnerships" icon={Users}>
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground/80 mb-1">Mentor</div>
              <div className="text-foreground">{data.basics?.manager_label?.includes("Head") ? "Pairing pending — request from your manager" : "Assigned through mentor programme"}</div>
            </div>
            <div className="pt-3 border-t border-border/60">
              <div className="text-xs uppercase tracking-wider text-muted-foreground/80 mb-1">IDP horizon</div>
              <div className="text-foreground">{data.aspiration?.horizon_months ?? 12} months</div>
            </div>
            <div className="pt-3 border-t border-border/60">
              <div className="text-xs uppercase tracking-wider text-muted-foreground/80 mb-1">Next move</div>
              <div className="text-foreground font-medium">{data.aspiration?.next_move ?? "—"}</div>
            </div>
          </div>
        </Card>

        <Card eyebrow="Mentoring others" title="Pay it forward" icon={Sparkles}>
          <div className="space-y-2 text-sm">
            <div className="text-muted-foreground text-xs">When you're ready to mentor, your profile becomes discoverable to early-career colleagues looking for the skills you've validated.</div>
            <div className="mt-2 flex items-center justify-between rounded-lg bg-muted/40 p-2.5">
              <span className="text-xs">Validated skills available to mentor on</span>
              <span className="text-lg font-semibold tabular-nums">{data.proficiency.filter((p) => p.source === "validated" && !p.capability_code.includes("::")).length}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

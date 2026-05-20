import { MapPin, Briefcase, Languages, Clock, GraduationCap, Building2, Award, Compass, Target, Sparkles } from "lucide-react";
import type { My360Data } from "@/hooks/useMy360Data";

interface Props {
  data: My360Data;
}

function SectionCard({
  eyebrow,
  title,
  icon: Icon,
  children,
  accent = "primary",
}: {
  eyebrow: string;
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  accent?: "primary" | "emerald" | "violet" | "amber";
}) {
  const accentMap = {
    primary: "text-primary border-primary/30 bg-primary/5",
    emerald: "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
    violet: "text-violet-600 dark:text-violet-400 border-violet-500/30 bg-violet-500/5",
    amber: "text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/5",
  };
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full border ${accentMap[accent]}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80 font-medium leading-none">{eyebrow}</div>
          <div className="text-sm font-semibold mt-0.5">{title}</div>
        </div>
      </div>
      <div className="p-4 text-sm">{children}</div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b border-border/60 last:border-b-0">
      <div className="text-xs uppercase tracking-wider text-muted-foreground/80">{label}</div>
      <div className="text-sm text-right">{value}</div>
    </div>
  );
}

export function OverviewTab({ data }: Props) {
  const b = data.basics;
  const c = data.careerHere;
  const a = data.aspiration;
  const latest = data.managerFeedback[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <SectionCard eyebrow="Basics" title="At a glance" icon={MapPin}>
        <Detail label="Location" value={b?.location} />
        <Detail label="Office" value={b?.office} />
        <Detail label="Work pattern" value={b?.work_pattern} />
        <Detail label="Languages" value={b?.languages?.join(" · ")} />
        <Detail label="Pronouns" value={b?.pronouns} />
        <Detail label="Manager" value={b?.manager_label} />
      </SectionCard>

      <SectionCard eyebrow="Background" title="Before this firm" icon={Briefcase} accent="violet">
        <Detail label="Prior employer" value={b?.prior_employer} />
        <Detail label="Prior industry" value={b?.prior_industry} />
        <Detail label="Years experience" value={b?.years_experience != null ? `${b.years_experience} yr` : undefined} />
        <Detail label="Education" value={b?.education?.join(" · ")} />
        {b?.certifications && b.certifications.length > 0 && (
          <div className="pt-2 mt-2 border-t border-border/60">
            <div className="text-xs uppercase tracking-wider text-muted-foreground/80 mb-2">Certifications</div>
            <div className="flex flex-wrap gap-1.5">
              {b.certifications.map((cert) => {
                const tone = cert.status === "passed"
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                  : cert.status === "in_progress"
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                  : "bg-muted text-muted-foreground border-border";
                return (
                  <span key={cert.name} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border ${tone}`}>
                    <Award className="h-3 w-3" />
                    {cert.name}
                    {cert.target && <span className="opacity-70">· {cert.target}</span>}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard eyebrow="Career here" title={c?.current_role ?? "Current role"} icon={Building2} accent="emerald">
        <Detail label="Team" value={c?.team} />
        <Detail label="Tenure" value={c?.tenure_label} />
        {c?.timeline && c.timeline.length > 0 && (
          <div className="pt-3 mt-2 border-t border-border/60">
            <div className="text-xs uppercase tracking-wider text-muted-foreground/80 mb-2">Timeline</div>
            <ol className="space-y-2">
              {c.timeline.map((t, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{t.role}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {t.since ? `Since ${t.since}` : `${t.from} – ${t.to}`}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </SectionCard>

      <SectionCard eyebrow="Aspiration" title="North star" icon={Compass} accent="amber">
        {a?.north_star && <div className="text-sm leading-relaxed mb-3 italic text-foreground/90">"{a.north_star}"</div>}
        <Detail label="Next move" value={a?.next_move} />
        <Detail label="Horizon" value={a?.horizon_months ? `${a.horizon_months} months` : undefined} />
        {a?.interests && a.interests.length > 0 && (
          <div className="pt-2 mt-2 border-t border-border/60">
            <div className="text-xs uppercase tracking-wider text-muted-foreground/80 mb-2">Interests</div>
            <div className="flex flex-wrap gap-1.5">
              {a.interests.map((i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                  <Sparkles className="h-2.5 w-2.5" /> {i}
                </span>
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      {latest && (
        <div className="lg:col-span-2 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-4">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
              <Target className="h-4 w-4" />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80 font-medium">Latest reflection</div>
              <div className="text-sm mt-1 leading-relaxed">{latest.body}</div>
              <div className="text-[11px] text-muted-foreground mt-2">
                {latest.author_label} · {new Date(latest.feedback_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

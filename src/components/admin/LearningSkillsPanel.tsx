import type { NormalizedAccount } from "@/types/account-v2";
import { getLearningAndSkillsData } from "@/lib/accountSelectors";
import { BookOpen, TrendingUp, AlertTriangle, Award } from "lucide-react";

interface Props {
  account: NormalizedAccount;
}

export default function LearningSkillsPanel({ account }: Props) {
  const data = getLearningAndSkillsData(account);

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        No learning & skills data available. Upload an account with a <code className="bg-muted px-1 rounded">learning</code> section.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Key insights */}
      {data.keyInsights?.length ? (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Key Insights</h3>
          </div>
          <ul className="space-y-1.5">
            {data.keyInsights.map((insight, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                {insight}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Category totals & completion */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.categoryTotals && Object.keys(data.categoryTotals).length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-3">Category Totals</h3>
            <div className="space-y-2">
              {Object.entries(data.categoryTotals).map(([cat, count]) => (
                <div key={cat} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{cat}</span>
                  <span className="font-medium text-foreground">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.completionCounts && Object.keys(data.completionCounts).length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-3">Completion Counts</h3>
            <div className="space-y-2">
              {Object.entries(data.completionCounts).map(([cat, count]) => (
                <div key={cat} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{cat}</span>
                  <span className="font-medium text-foreground">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Licenses */}
      {(data.licenses != null || data.expiringLicenses != null) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {data.licenses != null && <MetricCard icon={<Award className="h-4 w-4" />} label="Licenses" value={data.licenses} />}
          {data.expiringLicenses != null && <MetricCard icon={<AlertTriangle className="h-4 w-4" />} label="Expiring" value={data.expiringLicenses} />}
          {data.expiredLicenses != null && <MetricCard icon={<AlertTriangle className="h-4 w-4" />} label="Expired" value={data.expiredLicenses} />}
          {data.coverage != null && <MetricCard icon={<BookOpen className="h-4 w-4" />} label="Coverage" value={`${data.coverage}%`} />}
        </div>
      )}

      {/* Top skill gaps */}
      {data.topSkillGaps?.length ? (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-3">Top Skill Gaps</h3>
          <div className="space-y-2">
            {data.topSkillGaps.map((gap, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                <span className="text-sm text-foreground">{gap.skill}</span>
                <span className="text-xs text-muted-foreground">{gap.gap}{gap.count != null ? ` (${gap.count} affected)` : ""}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Critical gaps */}
      {data.criticalGaps?.length ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h3 className="text-sm font-semibold text-foreground">Critical Gaps</h3>
          </div>
          <div className="space-y-2">
            {data.criticalGaps.map((gap, i) => (
              <div key={i} className="rounded-lg bg-card border border-border px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{gap.skill}</span>
                  <span className="text-[10px] font-medium rounded-full px-2 py-0.5 bg-destructive/10 text-destructive">{gap.urgency}</span>
                </div>
                {gap.affected != null && <p className="text-xs text-muted-foreground mt-0.5">{gap.affected} employees affected</p>}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Proficiency distribution */}
      {data.proficiencyDistribution && Object.keys(data.proficiencyDistribution).length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-3">Proficiency Distribution</h3>
          <div className="space-y-2">
            {Object.entries(data.proficiencyDistribution).map(([level, count]) => {
              const total = Object.values(data.proficiencyDistribution!).reduce((s, v) => s + v, 0) || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={level}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{level}</span>
                    <span className="text-foreground font-medium">{count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-1 text-muted-foreground">{icon}<span className="text-[10px] uppercase tracking-wider">{label}</span></div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

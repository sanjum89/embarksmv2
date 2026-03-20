import type { NormalizedAccount } from "@/types/account-v2";
import { getOrgOverviewData, getPerformanceAlerts, getRecommendedCTAs } from "@/lib/accountSelectors";
import { Users, UserCheck, TrendingUp, AlertTriangle, ArrowRight } from "lucide-react";

interface Props {
  account: NormalizedAccount;
}

export default function OrgOverviewPanel({ account }: Props) {
  const org = getOrgOverviewData(account);
  const alerts = getPerformanceAlerts(account);
  const ctas = getRecommendedCTAs(account);

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<Users className="h-4 w-4" />} label="Total Employees" value={org.totalEmployees ?? 0} />
        <StatCard icon={<UserCheck className="h-4 w-4" />} label="Managers" value={org.managers ?? 0} />
        <StatCard icon={<Users className="h-4 w-4" />} label="Individual Contributors" value={org.individualContributors ?? 0} />
        {org.avgTenure != null && (
          <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Avg Tenure" value={`${org.avgTenure} yrs`} />
        )}
      </div>

      {/* Functions breakdown */}
      {org.functions && Object.keys(org.functions).length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-3">Functions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(org.functions).map(([fn, count]) => (
              <div key={fn} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                <span className="text-xs text-muted-foreground">{fn}</span>
                <span className="text-sm font-semibold text-foreground">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Role distribution */}
      {org.roleDistribution && Object.keys(org.roleDistribution).length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-3">Role Distribution</h3>
          <div className="space-y-2">
            {Object.entries(org.roleDistribution).map(([role, count]) => {
              const total = org.totalEmployees || 1;
              const pct = Math.round(((count as number) / total) * 100);
              return (
                <div key={role}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{role}</span>
                    <span className="text-foreground font-medium">{count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tenure / Risk bands */}
      {(org.tenureBands || org.riskBands) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {org.tenureBands && Object.keys(org.tenureBands).length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-3">Tenure Bands</h3>
              <div className="space-y-1.5">
                {Object.entries(org.tenureBands).map(([band, count]) => (
                  <div key={band} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{band}</span>
                    <span className="font-medium text-foreground">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {org.riskBands && Object.keys(org.riskBands).length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-3">Risk Distribution</h3>
              <div className="space-y-1.5">
                {Object.entries(org.riskBands).map(([band, count]) => (
                  <div key={band} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{band}</span>
                    <span className="font-medium text-foreground">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary blocks */}
      {org.summaryBlocks?.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {org.summaryBlocks.map((block, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 shadow-sm text-center">
              <p className="text-2xl font-bold text-foreground">{block.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{block.label}</p>
              {block.description && <p className="text-[10px] text-muted-foreground mt-0.5">{block.description}</p>}
            </div>
          ))}
        </div>
      ) : null}

      {/* Performance Alerts */}
      {alerts.length > 0 && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h3 className="text-sm font-semibold text-foreground">Needs Attention</h3>
          </div>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div key={alert.id} className="rounded-lg bg-card border border-border px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${
                    alert.severity === "high" || alert.severity === "critical"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-warning/10 text-warning"
                  }`}>
                    {alert.severity || "info"}
                  </span>
                  <span className="text-xs text-foreground">{alert.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended CTAs */}
      {ctas.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-3">Recommended Actions</h3>
          <div className="space-y-2">
            {ctas.map((cta) => (
              <div key={cta.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-foreground">{cta.title}</p>
                  {cta.description && <p className="text-xs text-muted-foreground mt-0.5">{cta.description}</p>}
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-1 text-muted-foreground">{icon}<span className="text-[10px] uppercase tracking-wider">{label}</span></div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

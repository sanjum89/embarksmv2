import type { NormalizedAccount } from "@/types/account-v2";
import { getWorkSignalsData } from "@/lib/accountSelectors";
import { Activity, AlertTriangle } from "lucide-react";

interface Props {
  account: NormalizedAccount;
}

export default function WorkSignalsPanel({ account }: Props) {
  const signals = getWorkSignalsData(account);

  if (!signals.length) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        No work signals data available. Upload an account with a <code className="bg-muted px-1 rounded">workSignals</code> section.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {signals.map((card, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">{card.title || card.category}</h3>
          </div>

          {card.summary && (
            <p className="text-xs text-muted-foreground mb-3">{card.summary}</p>
          )}

          {/* Metrics */}
          {card.metrics?.length ? (
            <div className="space-y-2 mb-3">
              {card.metrics.map((m, mi) => (
                <div key={mi} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{m.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{m.value}{m.unit ? ` ${m.unit}` : ""}</span>
                    {m.trend && (
                      <span className={`text-[0.65rem] ${m.trend === "up" ? "text-success" : m.trend === "down" ? "text-destructive" : "text-muted-foreground"}`}>
                        {m.trend === "up" ? "↑" : m.trend === "down" ? "↓" : "→"}
                      </span>
                    )}
                    {m.benchmark != null && (
                      <span className="text-[0.65rem] text-muted-foreground">(bench: {m.benchmark})</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {/* Flags */}
          {card.flags?.length ? (
            <div className="space-y-1.5">
              {card.flags.map((f, fi) => (
                <div key={fi} className="flex items-start gap-2 rounded-lg bg-muted/50 px-2.5 py-1.5">
                  <AlertTriangle className={`h-3 w-3 shrink-0 mt-0.5 ${
                    f.severity === "high" || f.severity === "critical" ? "text-destructive" : "text-warning"
                  }`} />
                  <div>
                    <p className="text-xs font-medium text-foreground">{f.label}</p>
                    {f.description && <p className="text-[0.65rem] text-muted-foreground">{f.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

import type { NormalizedAccount } from "@/types/account-v2";
import { getReflectionSummary, getReflections } from "@/lib/accountSelectors";
import { MessageCircle, TrendingUp, Brain } from "lucide-react";

interface Props {
  account: NormalizedAccount;
}

export default function ReflectionsPanel({ account }: Props) {
  const entries = getReflections(account);
  const summary = getReflectionSummary(account);

  if (!entries.length) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        No reflections data available. Upload an account with a <code className="bg-muted px-1 rounded">reflections</code> section.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Aggregate summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summary.avgConfidence != null && (
          <SummaryCard icon={<TrendingUp className="h-4 w-4" />} label="Avg Confidence" value={summary.avgConfidence.toFixed(1)} />
        )}
        {summary.avgWorkload != null && (
          <SummaryCard icon={<Brain className="h-4 w-4" />} label="Avg Workload" value={summary.avgWorkload.toFixed(1)} />
        )}
        {summary.sentimentTrend && (
          <SummaryCard icon={<MessageCircle className="h-4 w-4" />} label="Sentiment" value={summary.sentimentTrend} />
        )}
        <SummaryCard icon={<MessageCircle className="h-4 w-4" />} label="Total Entries" value={entries.length} />
      </div>

      {/* Top themes */}
      {summary.topThemes?.length ? (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-3">Top Themes</h3>
          <div className="flex flex-wrap gap-2">
            {summary.topThemes.map((theme, i) => (
              <span key={i} className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground">
                {theme}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {/* Individual entries */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground mb-3">Reflection Entries</h3>
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {entries.map((entry) => (
            <div key={entry.id} className="rounded-lg bg-muted/30 border border-border p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-foreground">
                  {account.employeesById[entry.employeeId]?.name || entry.employeeId}
                </span>
                {entry.date && <span className="text-[0.65rem] text-muted-foreground">{entry.date}</span>}
              </div>
              {entry.content && <p className="text-xs text-muted-foreground">{entry.content}</p>}
              <div className="flex items-center gap-3 mt-2 text-[0.65rem] text-muted-foreground">
                {entry.confidence != null && <span>Confidence: {entry.confidence}</span>}
                {entry.workload != null && <span>Workload: {entry.workload}</span>}
                {entry.sentiment && <span>Sentiment: {entry.sentiment}</span>}
              </div>
              {entry.themes?.length ? (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {entry.themes.map((t, i) => (
                    <span key={i} className="rounded-full bg-primary/10 text-primary text-[0.65rem] px-2 py-0.5">{t}</span>
                  ))}
                </div>
              ) : null}
              {entry.managerFeedback && (
                <p className="mt-1.5 text-xs text-foreground/80 italic border-l-2 border-accent pl-2">{entry.managerFeedback}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-1 text-muted-foreground">{icon}<span className="text-[0.65rem] uppercase tracking-wider">{label}</span></div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

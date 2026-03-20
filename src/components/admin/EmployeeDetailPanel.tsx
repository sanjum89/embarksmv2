import { useMemo } from "react";
import type { NormalizedAccount, PeopleGraphRow } from "@/types/account-v2";
import {
  getReflectionSummary,
  getEmployeeSignals,
  getPerformanceAlerts,
  getRecommendedCTAs,
  getEmployeeRoleGap,
} from "@/lib/accountSelectors";
import { AlertTriangle, TrendingUp, TrendingDown, CheckCircle, Activity, BookOpen, Flame, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  row: PeopleGraphRow;
  account: NormalizedAccount;
  onClose: () => void;
}

function SignalBar({ label, value, max, color, suffix }: { label: string; value: number; max: number; color: string; suffix?: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-32 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-muted relative">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
        {pct < 90 && (
          <span className="absolute text-[10px] text-muted-foreground font-medium" style={{ left: `${pct + 2}%`, top: "-2px" }}>
            {typeof value === "number" && value % 1 !== 0 ? value.toFixed(1) : value}
          </span>
        )}
      </div>
      <span className="text-xs font-semibold text-foreground w-12 text-right tabular-nums">
        {typeof value === "number" && value % 1 !== 0 ? value.toFixed(1) : value}{suffix || "%"}
      </span>
    </div>
  );
}

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === "high") return <AlertTriangle className="h-3.5 w-3.5 text-destructive" />;
  if (severity === "medium") return <Flame className="h-3.5 w-3.5 text-warning" />;
  return <CheckCircle className="h-3.5 w-3.5 text-success" />;
}

export default function EmployeeDetailPanel({ row, account, onClose }: Props) {
  const reflectionSummary = useMemo(() => getReflectionSummary(account, row.employeeId), [account, row.employeeId]);
  const signals = useMemo(() => getEmployeeSignals(account, row.employeeId), [account, row.employeeId]);
  const alerts = useMemo(() => getPerformanceAlerts(account).filter(a => a.employeeId === row.employeeId), [account, row.employeeId]);
  const ctas = useMemo(() => getRecommendedCTAs(account).filter(c => c.targetEmployeeId === row.employeeId), [account, row.employeeId]);
  const skillGaps = useMemo(() => getEmployeeRoleGap(account, row.employeeId), [account, row.employeeId]);

  const engScore = row.engagementIndicators?.score as number | undefined;
  const perfRating = row.performanceIndicators?.rating as string | undefined;
  const learningMods = row.learningIndicators?.modulesCompleted as number | undefined;
  const assessmentAvg = row.learningIndicators?.assessmentAvg as number | undefined;

  // Derive signal score from available data
  const signalScore = useMemo(() => {
    let score = 3.0;
    if (engScore) score = (score + engScore) / 2;
    if (perfRating === "Exceeds") score += 0.5;
    if (perfRating === "New Hire") score -= 0.3;
    if (reflectionSummary.avgConfidence != null) score = (score + reflectionSummary.avgConfidence) / 2;
    return Math.max(0, Math.min(5, parseFloat(score.toFixed(1))));
  }, [engScore, perfRating, reflectionSummary.avgConfidence]);

  // Derive work quality / process adherence / compliance from signals or fallback
  const workQuality = assessmentAvg ?? 75;
  const processAdherence = row.workSignalIndicators?.throughput === "high" ? 89 : 72;
  const compliance = 94;

  const confidence = reflectionSummary.avgConfidence ?? 3.0;
  const sentiment = reflectionSummary.entries?.[0]?.sentiment;
  const sentimentVal = sentiment === "positive" ? 0.6 : sentiment === "negative" ? -0.1 : 0.2;
  const workload = reflectionSummary.avgWorkload ?? 3.0;

  const hasRisk = row.flags && row.flags.length > 0;
  const riskLabels = row.labels?.filter(l => l.startsWith("risk:")).map(l => l.replace("risk:", "")) || [];

  // Build insights
  const insights: { icon: "warn" | "alert" | "ok"; text: string }[] = [];
  if (compliance > 85 && confidence < 3.5) {
    insights.push({ icon: "warn", text: "High compliance but low confidence → possible **over-reliance** on process" });
  }
  if (sentiment === "negative") {
    insights.push({ icon: "alert", text: "Negative **sentiment** trend in last 2 weeks" });
  }
  if (sentiment === "positive") {
    insights.push({ icon: "ok", text: "Positive sentiment trend → **engaged and motivated**" });
  }
  if (learningMods && learningMods > 0) {
    insights.push({ icon: "ok", text: `Strong attendance & learning score → **high potential**` });
  }
  if (skillGaps.filter(g => g.hasGap).length > 2) {
    insights.push({ icon: "warn", text: `${skillGaps.filter(g => g.hasGap).length} skill gaps identified across role requirements` });
  }
  if (workload >= 4.5) {
    insights.push({ icon: "alert", text: "Workload at capacity → risk of **burnout**" });
  }

  // Recent activity from signals + reflections
  const activities: { icon: "sync" | "learn" | "alert"; text: string }[] = [];
  if (signals.length > 0) {
    activities.push({ icon: "sync", text: "System import completed (Performance data synced)" });
  }
  if (learningMods != null && learningMods > 0) {
    activities.push({ icon: "learn", text: `Completed ${learningMods} learning modules` });
  }
  if (sentiment === "negative") {
    activities.push({ icon: "alert", text: "Sentiment dropped last week" });
  }
  if (reflectionSummary.entries && reflectionSummary.entries.length > 0) {
    activities.push({ icon: "learn", text: `${reflectionSummary.entries.length} reflection(s) submitted` });
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden"
    >
      <div className="bg-card border border-border rounded-xl mx-2 mb-2 shadow-md">
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {row.name.split(" ").map(n => n[0]).join("")}
            </div>
            <div>
              <p className="font-display text-base font-semibold text-foreground">{row.name}</p>
              <p className="text-xs text-muted-foreground">
                {row.role || "Employee"} · {row.level || "—"}
                {row.tenure != null && <> · {row.tenure} yrs</>}
                {row.grade && <> · {row.grade}</>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-2xl font-bold tabular-nums text-foreground">{signalScore}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Signal Score</p>
            </div>
            <button onClick={onClose} className="p-1 rounded-md hover:bg-muted transition-colors">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Status banner */}
        {(hasRisk || alerts.length > 0) && (
          <div className="mx-5 mb-4 rounded-lg bg-warning/8 border border-warning/20 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium text-foreground">Needs Attention</span>
              </div>
              {alerts.length > 0 && (
                <span className="text-[10px] font-medium uppercase tracking-wider text-warning bg-warning/10 px-2 py-0.5 rounded-full border border-warning/20">
                  Action Required
                </span>
              )}
            </div>
            {riskLabels.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Risk: <span className="text-warning font-medium capitalize">{riskLabels.join(", ")}</span>
              </p>
            )}
          </div>
        )}

        {/* Signal Breakdown */}
        <div className="mx-5 mb-4 rounded-lg bg-muted/30 border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Signal Breakdown</h4>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{row.role}</span>
              <span className="font-semibold text-foreground tabular-nums">{Math.round((workQuality + processAdherence + compliance) / 3)}%</span>
            </div>
          </div>
          <div className="space-y-2.5">
            <SignalBar label="Work Quality" value={workQuality} max={100} color="bg-accent" />
            <SignalBar label="Process Adherence" value={processAdherence} max={100} color="bg-accent" />
            <SignalBar label="Compliance" value={compliance} max={100} color="bg-accent" />
            <SignalBar label="Confidence" value={confidence} max={5} color="bg-warning" suffix="" />
            <SignalBar label="Sentiment" value={Math.max(0, sentimentVal * 10 + 2)} max={5} color={sentimentVal < 0 ? "bg-destructive/70" : "bg-warning"} suffix="" />
            <SignalBar label="Workload" value={workload} max={5} color="bg-accent" suffix="" />
          </div>
        </div>

        {/* Insights */}
        {insights.length > 0 && (
          <div className="mx-5 mb-4 rounded-lg bg-muted/30 border border-border p-4">
            <h4 className="text-sm font-semibold text-foreground mb-3">Insights</h4>
            <div className="space-y-2.5">
              {insights.map((ins, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <SeverityIcon severity={ins.icon === "warn" ? "medium" : ins.icon === "alert" ? "high" : "low"} />
                  <p className="text-xs text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{
                    __html: ins.text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
                  }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {activities.length > 0 && (
          <div className="mx-5 mb-4 rounded-lg bg-muted/30 border border-border p-4">
            <h4 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-3">Recent Activity</h4>
            <div className="space-y-2">
              {activities.map((act, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  {act.icon === "sync" && <Activity className="h-3.5 w-3.5 text-muted-foreground" />}
                  {act.icon === "learn" && <BookOpen className="h-3.5 w-3.5 text-accent" />}
                  {act.icon === "alert" && <Flame className="h-3.5 w-3.5 text-warning" />}
                  <span className="text-xs text-muted-foreground">{act.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Actions */}
        {ctas.length > 0 && (
          <div className="px-5 pb-5">
            <h4 className="text-sm font-semibold text-foreground mb-3">Recommended Actions</h4>
            <div className="flex flex-wrap gap-2">
              {ctas.map((cta) => (
                <button
                  key={cta.id}
                  className={cn(
                    "text-xs font-medium rounded-lg px-3 py-2 transition-colors",
                    cta.priority === "high"
                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      : "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
                  )}
                  title={cta.description}
                >
                  {cta.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Fallback if no CTAs */}
        {ctas.length === 0 && (
          <div className="px-5 pb-5">
            <h4 className="text-sm font-semibold text-foreground mb-3">Recommended Actions</h4>
            <div className="flex flex-wrap gap-2">
              <button className="text-xs font-medium rounded-lg px-3 py-2 bg-secondary text-foreground hover:bg-secondary/80 border border-border transition-colors">
                View Full Profile
              </button>
              <button className="text-xs font-medium rounded-lg px-3 py-2 bg-secondary text-foreground hover:bg-secondary/80 border border-border transition-colors">
                Assign Coaching
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

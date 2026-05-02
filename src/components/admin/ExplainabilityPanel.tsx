import { useState } from "react";
import type { NormalizedAccount } from "@/types/account-v2";
import {
  getShowcaseCases,
  getExplainabilityTrace,
  getArchitectureSources,
  getArchitectureSignalCounts,
  getAllEmployees,
} from "@/lib/accountSelectors";
import { Brain, ChevronDown, ChevronRight, Database, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  account: NormalizedAccount;
}

export default function ExplainabilityPanel({ account }: Props) {
  const sources = getArchitectureSources(account);
  const signalCounts = getArchitectureSignalCounts(account);
  const cases = getShowcaseCases(account);
  const allTraces = getExplainabilityTrace(account);
  const employees = getAllEmployees(account);

  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");

  const employeeTrace = selectedEmployee
    ? getExplainabilityTrace(account, selectedEmployee)
    : [];

  const hasData = sources.length > 0 || cases.length > 0 || allTraces.length > 0;

  if (!hasData) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        No explainability data available. Upload an account with <code className="bg-muted px-1 rounded">architectureSources</code>, <code className="bg-muted px-1 rounded">showcaseCases</code>, or <code className="bg-muted px-1 rounded">explainability</code> sections.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Architecture Sources */}
      {sources.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Database className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Architecture Sources</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sources.map((src) => (
              <div key={src.id} className="rounded-lg bg-muted/50 px-3 py-2.5">
                <p className="text-sm font-medium text-foreground">{src.name}</p>
                {src.type && <p className="text-[0.65rem] text-muted-foreground mt-0.5">{src.type}</p>}
                {src.description && <p className="text-xs text-muted-foreground mt-1">{src.description}</p>}
                {src.signalTypes?.length ? (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {src.signalTypes.map((st, i) => (
                      <span key={i} className="rounded-full bg-primary/10 text-primary text-[0.65rem] px-2 py-0.5">{st}</span>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Signal Counts */}
      {signalCounts.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-3">Signal Counts</h3>
          <div className="space-y-1.5">
            {signalCounts.map((sc, i) => (
              <div key={i} className="flex items-center justify-between text-xs rounded-lg bg-muted/30 px-3 py-2">
                <span className="text-muted-foreground">{sc.source || sc.sourceId} — {sc.signalType}</span>
                <span className="font-medium text-foreground">{sc.count}{sc.period ? ` / ${sc.period}` : ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Showcase Cases */}
      {cases.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-foreground">Showcase Cases</h3>
          </div>
          <div className="space-y-2">
            {cases.map((c) => {
              const isExpanded = expandedCase === c.id;
              return (
                <div key={c.id} className="rounded-lg border border-border overflow-hidden">
                  <button
                    onClick={() => setExpandedCase(isExpanded ? null : c.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-foreground">{c.title}</span>
                      {c.riskLabel && (
                        <span className="rounded-full bg-warning/10 text-warning text-[0.65rem] font-medium px-2 py-0.5">
                          {c.riskLabel}
                        </span>
                      )}
                    </div>
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                      {c.employeeName && (
                        <p className="text-xs text-muted-foreground">Employee: <span className="text-foreground font-medium">{c.employeeName}</span></p>
                      )}

                      {/* Input signals */}
                      {c.inputSignals?.length ? (
                        <div>
                          <p className="text-[0.65rem] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Input Signals</p>
                          <div className="space-y-1">
                            {c.inputSignals.map((sig: any, i: number) => (
                              <div key={i} className="rounded bg-muted/50 px-2.5 py-1.5 text-xs text-muted-foreground">
                                {typeof sig === "string" ? sig : JSON.stringify(sig)}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {/* Reasoning chain */}
                      {c.reasoningChain?.length ? (
                        <div>
                          <p className="text-[0.65rem] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Reasoning Chain</p>
                          <div className="space-y-1.5">
                            {c.reasoningChain.map((step, i) => (
                              <div key={i} className="flex gap-3 items-start">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[0.65rem] font-bold shrink-0 mt-0.5">
                                  {step.stepNumber || i + 1}
                                </span>
                                <div className="text-xs">
                                  {step.source && <span className="text-muted-foreground">[{step.source}] </span>}
                                  {step.signal && <span className="text-foreground">{step.signal}</span>}
                                  {step.interpretation && <p className="text-muted-foreground mt-0.5">{step.interpretation}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {/* Synthesis */}
                      {c.synthesis && (
                        <div className="rounded-lg bg-accent/5 border border-accent/20 p-3">
                          <p className="text-[0.65rem] font-medium text-accent uppercase tracking-wider mb-1">Synthesis</p>
                          <p className="text-xs text-foreground">{c.synthesis}</p>
                        </div>
                      )}

                      {/* Recommended actions */}
                      {c.recommendedActions?.length ? (
                        <div>
                          <p className="text-[0.65rem] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Recommended Actions</p>
                          <ul className="space-y-1 list-disc list-inside text-xs text-muted-foreground">
                            {c.recommendedActions.map((action, i) => (
                              <li key={i}>{action}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Trace an Employee */}
      {(allTraces.length > 0 || employees.length > 0) && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Search className="h-4 w-4 text-info" />
            <h3 className="text-sm font-semibold text-foreground">Trace an Employee</h3>
          </div>
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground mb-3"
          >
            <option value="">Select an employee...</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>

          {selectedEmployee && employeeTrace.length === 0 && (
            <p className="text-xs text-muted-foreground">No explainability trace available for this employee.</p>
          )}

          {employeeTrace.map((trace, ti) => (
            <div key={ti} className="rounded-lg border border-border p-4 space-y-3 mb-3">
              {trace.inputSignals?.length ? (
                <div>
                  <p className="text-[0.65rem] font-medium text-muted-foreground uppercase tracking-wider mb-1">Input Signals</p>
                  <div className="space-y-1">
                    {trace.inputSignals.map((sig: any, i: number) => (
                      <div key={i} className="rounded bg-muted/50 px-2.5 py-1.5 text-xs text-muted-foreground">
                        {typeof sig === "string" ? sig : JSON.stringify(sig)}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {trace.reasoningSteps?.length ? (
                <div>
                  <p className="text-[0.65rem] font-medium text-muted-foreground uppercase tracking-wider mb-1">Reasoning Steps</p>
                  <div className="space-y-1.5">
                    {trace.reasoningSteps.map((step, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-info/10 text-info text-[0.65rem] font-bold shrink-0 mt-0.5">
                          {step.stepNumber || i + 1}
                        </span>
                        <div className="text-xs">
                          {step.source && <span className="text-muted-foreground">[{step.source}] </span>}
                          {step.signal && <span className="text-foreground">{step.signal}</span>}
                          {step.interpretation && <p className="text-muted-foreground mt-0.5">{step.interpretation}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {trace.synthesizedOutput && (
                <div className="rounded-lg bg-info/5 border border-info/20 p-3">
                  <p className="text-[0.65rem] font-medium text-info uppercase tracking-wider mb-1">Synthesized Output</p>
                  <p className="text-xs text-foreground">{trace.synthesizedOutput}</p>
                </div>
              )}

              {trace.confidence != null && (
                <p className="text-xs text-muted-foreground">Confidence: {(trace.confidence * 100).toFixed(0)}%</p>
              )}

              {trace.recommendedCTAs?.length ? (
                <div>
                  <p className="text-[0.65rem] font-medium text-muted-foreground uppercase tracking-wider mb-1">Recommended CTAs</p>
                  <ul className="list-disc list-inside text-xs text-muted-foreground">
                    {trace.recommendedCTAs.map((cta, i) => <li key={i}>{cta}</li>)}
                  </ul>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

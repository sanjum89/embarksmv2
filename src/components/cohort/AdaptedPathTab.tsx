import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useUser } from "@/contexts/UserContext";
import { useAccount } from "@/contexts/AccountContext";
import { useLearnerJourney } from "@/hooks/useLearnerJourney";
import { formatAdaptationLabel, adaptationExplanation, adaptationBadgeTone } from "@/lib/embarkAdaptation";
import { classifyAssessment, assessmentKindLabel, assessmentKindToneClass, summariseAdaptations, isRolePlay } from "@/lib/adaptedPath";
import { BookOpen, ClipboardCheck, MessageSquare, Sparkles, Info, CheckCircle2, Clock, Lock } from "lucide-react";

function toneClass(tone: ReturnType<typeof adaptationBadgeTone>): string {
  switch (tone) {
    case "neutral":    return "border-border text-muted-foreground bg-muted/40";
    case "condensed":  return "border-primary/30 text-primary bg-primary/10";
    case "diagnostic": return "border-accent/40 text-accent-foreground bg-accent/15";
    case "evidence":   return "border-amber-500/30 text-amber-700 dark:text-amber-300 bg-amber-500/10";
    case "covered":    return "border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10";
  }
}

function statusIcon(status: string) {
  if (status === "completed") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (status === "in_progress") return <Clock className="h-4 w-4 text-primary" />;
  if (status === "locked") return <Lock className="h-4 w-4 text-muted-foreground" />;
  return <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />;
}

export function AdaptedPathTab() {
  const { user } = useUser();
  const { activeAccount } = useAccount();
  const accountId = activeAccount?.id ?? null;
  const employeeId = user?.id ?? null;
  const { journey, isLoading, error } = useLearnerJourney(accountId, employeeId);

  const summary = useMemo(() => journey ? summariseAdaptations(journey) : null, [journey]);

  if (isLoading) return <p className="p-6 text-sm text-muted-foreground">Loading your adapted path…</p>;
  if (error) return <p className="p-6 text-sm text-destructive">Couldn't load your path: {error}</p>;
  if (!journey || !summary) return <p className="p-6 text-sm text-muted-foreground">No active learning journey yet.</p>;

  return (
    <div className="space-y-6">
      {/* Header summary */}
      <Card className="overflow-hidden">
        <div className="flex items-start gap-3 border-b bg-primary/5 px-5 py-4">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">How your path is adapted</div>
            <p className="mt-1 text-sm leading-snug text-foreground">{summary.sentence}</p>
          </div>
        </div>
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 px-5 py-3 text-[11px]">
          <span className="font-semibold uppercase tracking-wider text-muted-foreground">Delivery:</span>
          {(["full_module", "microlearning", "diagnostic_only", "evidence_required", "skip_after_validation"] as const).map((t) => (
            <span key={t} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${toneClass(adaptationBadgeTone(t))}`}>
              {formatAdaptationLabel(t)}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-4 border-t px-5 py-3 text-[11px]">
          <span className="font-semibold uppercase tracking-wider text-muted-foreground">Checkpoints:</span>
          {(["baseline", "diagnostic", "chapter", "adhoc", "final", "roleplay"] as const).map((k) => (
            <span key={k} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${assessmentKindToneClass(k)}`}>
              {assessmentKindLabel(k)} · {summary.assessmentsByKind[k]}
            </span>
          ))}
        </div>
      </Card>

      {/* Per-track timeline */}
      {journey.tracks.map((track) => (
        <Card key={track.code} className="p-6">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display text-lg font-bold">{track.name}</h3>
            <span className="text-xs text-muted-foreground">
              {track.completedModules}/{track.totalModules} modules · {track.pct}%
            </span>
          </div>

          <ol className="mt-5 space-y-4">
            {track.modules.map((m) => {
              const adaptType = m.adaptation?.adaptationType ?? "full_module";
              const tone = adaptationBadgeTone(adaptType);
              const reason = m.adaptation?.reason;

              return (
                <li key={m.code} className="relative pl-8">
                  {/* Rail dot + line */}
                  <span className="absolute left-0 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border bg-card">
                    {statusIcon(m.status)}
                  </span>
                  <span className="absolute left-[11px] top-8 h-[calc(100%-1rem)] w-px bg-border" />

                  <div className="flex flex-wrap items-start gap-2">
                    <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold">{m.title}</span>
                        <Badge variant="outline" className={`text-[10px] uppercase tracking-wide ${toneClass(tone)}`}>
                          {formatAdaptationLabel(adaptType)}
                        </Badge>
                        {m.adaptation?.riskCritical && (
                          <Badge variant="outline" className="text-[10px] uppercase border-destructive/30 text-destructive">Risk critical</Badge>
                        )}
                        {m.adaptation && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="inline-flex items-center text-muted-foreground hover:text-foreground" aria-label="Why this?">
                                <Info className="h-3.5 w-3.5" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 text-xs">
                              <div className="font-semibold mb-1">Why this delivery?</div>
                              <p className="text-muted-foreground">{adaptationExplanation(adaptType)}</p>
                              {(m.adaptation.competencyName || m.adaptation.currentLevel != null) && (
                                <div className="mt-2 border-t pt-2 space-y-1">
                                  {m.adaptation.competencyName && (
                                    <div><span className="text-muted-foreground">Competency:</span> <span className="font-medium">{m.adaptation.competencyName}</span></div>
                                  )}
                                  {m.adaptation.currentLevel != null && m.adaptation.requiredLevel != null && (
                                    <div><span className="text-muted-foreground">Level:</span> <span className="font-medium">{m.adaptation.currentLevel} of {m.adaptation.requiredLevel} required</span></div>
                                  )}
                                  {m.adaptation.validationNeeded && (
                                    <div className="text-amber-600 dark:text-amber-400">Needs validation evidence</div>
                                  )}
                                </div>
                              )}
                              {m.adaptation.managerNote && (
                                <div className="mt-2 border-t pt-2 italic text-muted-foreground">"{m.adaptation.managerNote}"</div>
                              )}
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                      {reason && <p className="mt-1 text-xs text-muted-foreground">{reason}</p>}

                      {/* Chapters: only show assessment/role-play sub-rows for clarity */}
                      <div className="mt-2 space-y-1">
                        {m.chapters.map((c) => {
                          const kind = classifyAssessment(c, m);
                          if (!kind) return null;
                          const role = isRolePlay(c);
                          return (
                            <div key={c.code} className="flex flex-wrap items-center gap-2 text-xs">
                              {role ? <MessageSquare className="h-3 w-3 text-muted-foreground" /> : <ClipboardCheck className="h-3 w-3 text-muted-foreground" />}
                              <span className="text-muted-foreground">▸</span>
                              <span className="font-medium">{c.title}</span>
                              <Badge variant="outline" className={`text-[9px] uppercase ${assessmentKindToneClass(kind)}`}>
                                {assessmentKindLabel(kind)}
                              </Badge>
                              {c.minutes > 0 && <span className="text-[11px] text-muted-foreground">{c.minutes}m</span>}
                              {c.assessmentScore != null && (
                                <span className={`text-[11px] font-medium ${c.assessmentPassed ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                                  {c.assessmentScore}% {c.assessmentPassed ? "passed" : "below threshold"}
                                </span>
                              )}
                              {c.status === "locked" && <span className="text-[11px] text-muted-foreground">locked</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
            {track.modules.length === 0 && <p className="text-sm text-muted-foreground">No modules in this track.</p>}
          </ol>
        </Card>
      ))}
    </div>
  );
}

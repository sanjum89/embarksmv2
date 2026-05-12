import { motion } from "framer-motion";
import { MessageCircle, AlertCircle, Calendar, ThumbsUp, ThumbsDown, Minus, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getEmployeeReflectionAnalysis, type EmployeeReflectionAnalysis } from "@/data/peopleGraphSystems";

const sentimentIcon = {
  positive: { icon: ThumbsUp, color: "text-emerald-600", bg: "bg-emerald-500/15" },
  neutral: { icon: Minus, color: "text-slate-500", bg: "bg-slate-500/15" },
  negative: { icon: ThumbsDown, color: "text-red-600", bg: "bg-red-500/15" },
};

const severityColors = {
  low: "border-slate-400/40 text-slate-600",
  medium: "border-amber-500/40 text-amber-600",
  high: "border-red-500/40 text-red-600",
};

interface Props {
  employeeId: string;
  employeeName: string;
  reflectionsOverride?: EmployeeReflectionAnalysis[];
}

export function ReflectionsAnalysis({ employeeId, employeeName, reflectionsOverride }: Props) {
  const reflections = reflectionsOverride ?? getEmployeeReflectionAnalysis(employeeId);

  if (reflections.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageCircle className="h-4 w-4" /> Reflections Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-xs text-muted-foreground">No reflections submitted yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <MessageCircle className="h-4 w-4" /> Reflections Analysis
      </h4>
      <div className="space-y-4">
        {reflections.map((ref, i) => {
          const sent = sentimentIcon[ref.sentiment];
          const SentIcon = sent.icon;

          return (
            <motion.div
              key={ref.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="border-border/50 overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{ref.date}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${sent.bg}`}>
                      <SentIcon className={`h-3 w-3 ${sent.color}`} />
                      <span className={`text-[0.65rem] font-medium ${sent.color}`}>{ref.sentiment}</span>
                    </div>
                  </div>

                  {/* Summary */}
                  <p className="text-sm text-foreground/85 leading-relaxed">{ref.summary}</p>

                  {/* Themes */}
                  <div className="flex flex-wrap gap-1.5">
                    {ref.themes.map(t => (
                      <Badge key={t} variant="secondary" className="text-[0.65rem]">{t}</Badge>
                    ))}
                  </div>

                  {/* Extracted Skills */}
                  {ref.extractedSkills.length > 0 && (
                    <div>
                      <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mb-1.5">Extracted Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {ref.extractedSkills.map((sk, j) => (
                          <div key={j} className="flex items-center gap-1.5 rounded-md bg-background/80 px-2 py-1">
                            <span className="text-xs text-foreground/80">{sk.skill}</span>
                            <Badge variant="outline" className="text-[0.6rem]">{sk.proficiency}</Badge>
                            <span className="text-[0.6rem] text-muted-foreground">({Math.round(sk.confidence * 100)}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Concerns */}
                  {ref.concerns.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Flagged Concerns
                      </p>
                      {ref.concerns.map((c, j) => (
                        <div key={j} className="flex items-center justify-between rounded-lg bg-background/60 p-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`text-[0.6rem] ${severityColors[c.severity]}`}>
                              {c.severity}
                            </Badge>
                            <span className="text-xs text-foreground/80">{c.topic}</span>
                          </div>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
                            <Lightbulb className="h-3 w-3" />
                            {c.suggestedAction.includes("1-on-1") ? "Schedule 1-on-1" : "Take Action"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

import { useState } from "react";
import { ChevronDown, ChevronRight, Cpu, FlaskConical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { derivedMetricDefinitions } from "@/data/peopleGraphSystems";

export function ComputationDetails() {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <FlaskConical className="h-4 w-4" /> Derived Metric Computations
      </h4>
      <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
        {derivedMetricDefinitions.map((metric, i) => {
          const isOpen = expandedIdx === i;
          return (
            <Collapsible key={i} open={isOpen} onOpenChange={() => setExpandedIdx(isOpen ? null : i)}>
              <Card className="border-border/50 transition-all hover:shadow-sm">
                <CollapsibleTrigger className="w-full text-left">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-purple-500" />
                        <span className="text-sm font-medium text-foreground">{metric.name}</span>
                      </div>
                      {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{metric.description}</p>
                  </CardContent>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-3">
                    {/* Formula */}
                    <div className="rounded-lg bg-slate-900/5 dark:bg-slate-100/5 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Formula</p>
                      <code className="text-xs font-mono text-foreground/80 break-all">{metric.formula}</code>
                    </div>

                    {/* Inputs */}
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Input Sources</p>
                      <div className="flex flex-wrap gap-1.5">
                        {metric.inputs.map((inp, j) => (
                          <Badge key={j} variant="secondary" className="text-[10px]">{inp}</Badge>
                        ))}
                      </div>
                    </div>

                    {/* Thresholds */}
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Thresholds</p>
                      <div className="flex gap-2 flex-wrap">
                        {Object.entries(metric.thresholds).map(([level, val]) => (
                          <div key={level} className={`rounded-md px-2.5 py-1.5 text-xs ${
                            level === "low" ? "bg-red-500/10 text-red-600" :
                            level === "normal" ? "bg-blue-500/10 text-blue-600" :
                            "bg-emerald-500/10 text-emerald-600"
                          }`}>
                            <span className="font-medium capitalize">{level}:</span> {val}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}

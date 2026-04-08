import { useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle } from "lucide-react";
import type { ScenarioOption } from "@/data/handsOnScenarios";

interface Props {
  index: number;
  title: string;
  context: string;
  options: ScenarioOption[];
}

export function ScenarioQuestion({ index, title, context, options }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="bg-orange-50 dark:bg-orange-950/20 px-4 py-3 border-b border-border">
        <h4 className="text-sm font-semibold text-foreground">
          Scenario {index + 1}: {title}
        </h4>
      </div>
      <div className="p-4 space-y-3">
        <p className="text-sm text-muted-foreground">{context}</p>
        <div className="space-y-2">
          {options.map((opt, oi) => {
            const isSelected = selected === oi;
            const showResult = selected !== null;
            return (
              <button
                key={oi}
                onClick={() => selected === null && setSelected(oi)}
                disabled={selected !== null}
                className={cn(
                  "w-full text-left rounded-lg border px-4 py-3 text-sm transition-colors",
                  !showResult && "border-border hover:bg-accent/5 hover:border-accent/30",
                  showResult && opt.correct && "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20",
                  showResult && isSelected && !opt.correct && "border-destructive bg-destructive/5",
                  showResult && !isSelected && !opt.correct && "opacity-50"
                )}
              >
                <div className="flex items-start gap-2">
                  {showResult && opt.correct && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  )}
                  {showResult && isSelected && !opt.correct && (
                    <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-medium text-foreground">
                      {String.fromCharCode(65 + oi)}.
                    </span>{" "}
                    <span className={cn(showResult && !opt.correct && !isSelected ? "text-muted-foreground" : "text-foreground")}>
                      {opt.text}
                    </span>
                    {showResult && (isSelected || opt.correct) && (
                      <p className="text-xs mt-1 text-muted-foreground">{opt.feedback}</p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

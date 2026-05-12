import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import type { ActionBoardCard, ActionPriority } from "@/lib/deepResearch/envelope";

const COLUMN_TONE: Record<ActionPriority, string> = {
  High: "border-rose-500/40 bg-rose-500/5",
  Medium: "border-amber-500/40 bg-amber-500/5",
  Low: "border-muted bg-muted/30",
};

const PILL_TONE: Record<ActionPriority, string> = {
  High: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  Medium: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  Low: "bg-muted text-muted-foreground",
};

interface Props {
  columns: { title: ActionPriority; cards: ActionBoardCard[] }[];
  onExecute?: (card: ActionBoardCard) => void;
}

export function ManagerActionBoard({ columns, onExecute }: Props) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {columns.map((col) => (
        <div key={col.title} className={cn("rounded-xl border p-3 space-y-2 min-h-[180px]", COLUMN_TONE[col.title])}>
          <div className="flex items-center justify-between">
            <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full", PILL_TONE[col.title])}>
              {col.title} priority
            </span>
            <span className="text-xs text-muted-foreground">{col.cards.length}</span>
          </div>
          <div className="space-y-2">
            {col.cards.map((card, i) => (
              <div key={i} className="rounded-lg bg-card border border-border/60 p-3 space-y-1.5 shadow-sm">
                <div className="text-xs text-muted-foreground">{card.learner}</div>
                <div className="text-sm font-medium leading-snug">{card.action}</div>
                <div className="text-[11px] text-muted-foreground">{card.why}</div>
                {card.actionId && onExecute && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 -ml-2 text-xs"
                    onClick={() => onExecute(card)}
                  >
                    Execute <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

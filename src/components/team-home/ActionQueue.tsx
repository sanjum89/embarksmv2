import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActionQueueItem {
  id: string;
  employeeId: string;
  learnerName: string;
  title: string;
  detail: string;
  severity: "high" | "medium" | "low";
  kind?: string;
}

const RAIL: Record<ActionQueueItem["severity"], string> = {
  high: "bg-rose-500",
  medium: "bg-amber-500",
  low: "bg-muted-foreground/40",
};

export function ActionQueue({
  items,
  onOpen,
}: {
  items: ActionQueueItem[];
  onOpen: (employeeId: string, item?: ActionQueueItem) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">Action queue</h2>
          <p className="text-xs text-muted-foreground">Top items needing your attention</p>
        </div>
        <Sparkles className="h-4 w-4 text-primary" />
      </div>

      <div className="divide-y divide-border">
        {items.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Nothing pressing right now.</p>
        ) : (
          items.slice(0, 5).map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onOpen(a.employeeId, a)}
              className="relative flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted/40"
            >
              <span className={cn("absolute left-0 top-3 bottom-3 w-1 rounded-r", RAIL[a.severity])} />
              <div className="min-w-0 flex-1 pl-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-foreground">{a.title}</p>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  <span className="text-foreground/70">{a.learnerName}</span> · {a.detail}
                </p>
              </div>
            </button>
          ))
        )}
      </div>

      <div className="border-t border-border p-2">
        <Button asChild size="sm" variant="ghost" className="w-full justify-between">
          <Link to="/action-centre">
            Open Action Centre
            <ChevronRight className="h-3 w-3" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}

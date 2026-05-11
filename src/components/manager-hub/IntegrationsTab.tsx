import { useState, type ComponentType } from "react";
import { Card } from "@/components/ui/card";
import { Plug } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CohortLearner } from "@/hooks/useManagerCohortData";
import { CpdPanel } from "./CpdPanel";

interface PanelProps {
  learners: CohortLearner[];
  onOpenLearner: (id: string) => void;
}

interface IntegrationDef {
  id: string;
  label: string;
  heading: string;
  description: string;
  Panel: ComponentType<PanelProps>;
}

const INTEGRATIONS: IntegrationDef[] = [
  {
    id: "cisi",
    label: "CISI",
    heading: "CPD · via CISI",
    description: "Continuing Professional Development hours synced from the CISI member portal.",
    Panel: CpdPanel,
  },
];

export function IntegrationsTab({ learners, onOpenLearner }: PanelProps) {
  const [activeId, setActiveId] = useState(INTEGRATIONS[0]?.id ?? "");
  const active = INTEGRATIONS.find((i) => i.id === activeId) ?? INTEGRATIONS[0];

  if (!active) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        No integrations connected for this cohort yet.
      </Card>
    );
  }

  const ActivePanel = active.Panel;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
          <Plug className="h-3 w-3" />
          Connected systems
        </span>
        <div className="flex items-center gap-0.5 rounded-md border border-border bg-background p-0.5">
          {INTEGRATIONS.map((i) => (
            <button
              key={i.id}
              type="button"
              onClick={() => setActiveId(i.id)}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                activeId === i.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary/50",
              )}
            >
              {i.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2">
          <h3 className="text-sm font-semibold text-foreground">{active.heading}</h3>
          <p className="text-xs text-muted-foreground">{active.description}</p>
        </div>
        <ActivePanel learners={learners} onOpenLearner={onOpenLearner} />
      </div>
    </div>
  );
}

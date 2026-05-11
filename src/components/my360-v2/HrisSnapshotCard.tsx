import { Card } from "@/components/ui/card";
import type { HrisData } from "@/hooks/useMy360Data";
import { GraduationCap, Building2, Calendar, AlertTriangle } from "lucide-react";

export function HrisSnapshotCard({ hris }: { hris?: HrisData }) {
  if (!hris) return null;
  const rows: Array<{ icon: React.ElementType; label: string; value?: string | number }> = [
    { icon: Calendar, label: "Hire date", value: hris.hireDate },
    { icon: Building2, label: "Prior employer", value: `${hris.priorEmployer ?? "—"}${hris.priorIndustry ? ` · ${hris.priorIndustry}` : ""}` },
    { icon: GraduationCap, label: "Education", value: hris.education?.[0] },
    { icon: Calendar, label: "Work pattern", value: hris.workPattern },
    { icon: Calendar, label: "Experience", value: hris.yearsExperience ? `${hris.yearsExperience} yrs` : undefined },
  ];

  const riskHigh = hris.attritionRiskFlag && hris.attritionRiskFlag !== "low";

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold">HRIS snapshot</h2>
        {riskHigh && (
          <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
            <AlertTriangle className="h-3 w-3" /> Attrition risk: {hris.attritionRiskFlag}
          </span>
        )}
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
        {rows.filter((r) => r.value).map((r) => (
          <div key={r.label} className="flex items-start gap-2.5">
            <r.icon className="h-3.5 w-3.5 mt-1 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">{r.label}</dt>
              <dd className="text-sm font-medium truncate">{r.value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </Card>
  );
}

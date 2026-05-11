import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useChartColors } from "@/hooks/useChartColors";
import type { CompetencyRow, PersonaCompetency, RoleCompetencyReq, CapabilityRow, RoleRequirementRow } from "@/hooks/useMy360Data";
import { humanizeCode } from "@/lib/my360v2/bucketing";

interface Props {
  catalog: CompetencyRow[];
  current: PersonaCompetency[];
  required: RoleCompetencyReq[];
  proficiency: CapabilityRow[];
  requirements: RoleRequirementRow[];
}

const TRACK_LABEL: Record<string, string> = {
  business_knowledge: "Business",
  technical_knowledge: "Technical",
  behavioural_skills: "Behavioural",
  certification_professional_standards: "Certification",
  other_enablers: "Enablers",
};

function shortName(name: string): string {
  // first 3 words max
  return name.split(/[,&\-/]/)[0].split(" ").slice(0, 3).join(" ");
}

export function CompetencyRadarPanel({ catalog, current, required, proficiency, requirements }: Props) {
  const colors = useChartColors();
  const [mode, setMode] = useState<"radar" | "bar">("radar");
  const [drawerCompetencyId, setDrawerCompetencyId] = useState<string | null>(null);

  const data = useMemo(() => {
    const curMap = new Map(current.map((c) => [c.competency_id, c.current_level]));
    const reqMap = new Map(required.map((r) => [r.competency_id, r.required_level]));
    return catalog.map((c) => ({
      key: c.competency_id,
      label: shortName(c.competency_name),
      fullLabel: c.competency_name,
      track: TRACK_LABEL[c.track_code] ?? c.track_code,
      Current: curMap.get(c.competency_id) ?? 0,
      Required: reqMap.get(c.competency_id) ?? 0,
    }));
  }, [catalog, current, required]);

  const drawer = useMemo(() => {
    if (!drawerCompetencyId) return null;
    const comp = catalog.find((c) => c.competency_id === drawerCompetencyId);
    if (!comp) return null;
    const supporting = new Set(comp.supporting_skills);
    const profMap = new Map(proficiency.map((p) => [p.capability_code, p.current_level]));
    const reqMap = new Map(requirements.map((r) => [r.capability_code, r]));
    const rows = comp.supporting_skills.map((code) => {
      const req = reqMap.get(code);
      return {
        code,
        label: humanizeCode(code),
        current: profMap.get(code) ?? 0,
        required: req?.required_level ?? 0,
        criticality: req?.criticality ?? "standard",
      };
    });
    return { comp, rows };
  }, [drawerCompetencyId, catalog, proficiency, requirements]);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold">Competency profile</h2>
          <p className="text-xs text-muted-foreground">16 sub-competencies across 5 tracks · current vs role target</p>
        </div>
        <div className="flex gap-1 p-1 bg-muted rounded-md text-xs">
          <button onClick={() => setMode("radar")} className={`px-2.5 py-1 rounded ${mode === "radar" ? "bg-card shadow-sm font-medium" : "text-muted-foreground"}`}>Radar</button>
          <button onClick={() => setMode("bar")} className={`px-2.5 py-1 rounded ${mode === "bar" ? "bg-card shadow-sm font-medium" : "text-muted-foreground"}`}>Bar</button>
        </div>
      </div>

      <div className="h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          {mode === "radar" ? (
            <RadarChart data={data} outerRadius="78%">
              <PolarGrid stroke={colors.grid} />
              <PolarAngleAxis dataKey="label" tick={{ fontSize: 10, fill: colors.tickFill }} />
              <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 10, fill: colors.tickFill }} />
              <Radar name="Required" dataKey="Required" stroke={colors.radarTargetStroke} fill={colors.radarTargetFill} fillOpacity={0.4} />
              <Radar name="Current" dataKey="Current" stroke={colors.radarCurrentStroke} fill={colors.radarCurrentFill} fillOpacity={0.45} />
              <Tooltip contentStyle={{ background: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}`, borderRadius: 6, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </RadarChart>
          ) : (
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid stroke={colors.grid} horizontal={false} />
              <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 10, fill: colors.tickFill }} />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fill: colors.tickFill }} width={140} />
              <Tooltip contentStyle={{ background: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}`, borderRadius: 6, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Required" fill={colors.radarTargetStroke} radius={[0, 2, 2, 0]} />
              <Bar dataKey="Current" fill={colors.radarCurrentStroke} radius={[0, 2, 2, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
        {data.map((d) => (
          <button
            key={d.key}
            onClick={() => setDrawerCompetencyId(d.key)}
            className="text-left px-3 py-2 rounded-md border border-border hover:bg-muted/50 transition-colors"
          >
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{d.track}</div>
            <div className="text-xs font-medium truncate">{d.label}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {d.Current} / {d.Required}
            </div>
          </button>
        ))}
      </div>

      <Sheet open={!!drawerCompetencyId} onOpenChange={(o) => !o && setDrawerCompetencyId(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          {drawer && (
            <>
              <SheetHeader>
                <SheetTitle className="text-base">{drawer.comp.competency_name}</SheetTitle>
                <SheetDescription>{TRACK_LABEL[drawer.comp.track_code] ?? drawer.comp.track_code} · supporting capabilities</SheetDescription>
              </SheetHeader>
              <div className="mt-5 space-y-2">
                {drawer.rows.map((r) => (
                  <div key={r.code} className="flex items-center justify-between gap-3 p-2.5 rounded-md border border-border">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{r.label}</div>
                      <div className="text-xs text-muted-foreground">
                        Current {r.current} · Target {r.required}
                        {r.criticality !== "standard" && <span className="ml-2 text-amber-600 dark:text-amber-400">· {r.criticality.replace("_", " ")}</span>}
                      </div>
                    </div>
                    <MiniBar current={r.current} required={r.required} />
                  </div>
                ))}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </Card>
  );
}

function MiniBar({ current, required }: { current: number; required: number }) {
  const total = 5;
  return (
    <div className="flex gap-0.5 shrink-0">
      {Array.from({ length: total }).map((_, i) => {
        const filled = i < current;
        const target = i < required;
        return (
          <span
            key={i}
            className={`h-4 w-1.5 rounded-sm ${filled ? "bg-primary" : target ? "bg-muted-foreground/30" : "bg-muted"}`}
          />
        );
      })}
    </div>
  );
}

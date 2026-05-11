import { useMemo, useState } from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useChartColors } from "@/hooks/useChartColors";
import type { CompetencyRow, PersonaCompetency, RoleCompetencyReq, CapabilityRow, RoleRequirementRow } from "@/hooks/useMy360Data";
import { humanizeCode } from "@/lib/my360v2/bucketing";
import { AskEmbarkButton } from "./AskEmbarkButton";

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
  certification_professional_standards: "Conduct",
  other_enablers: "Enablers",
};

export function CompetencyRadarHero({ catalog, current, required, proficiency, requirements }: Props) {
  const colors = useChartColors();
  const [drawerTrack, setDrawerTrack] = useState<string | null>(null);

  // Track-level averages (5 tracks for clean radar)
  const trackData = useMemo(() => {
    const curMap = new Map(current.map((c) => [c.competency_id, c.current_level]));
    const reqMap = new Map(required.map((r) => [r.competency_id, r.required_level]));
    const byTrack = new Map<string, { cur: number[]; req: number[] }>();
    for (const c of catalog) {
      if (!byTrack.has(c.track_code)) byTrack.set(c.track_code, { cur: [], req: [] });
      byTrack.get(c.track_code)!.cur.push(curMap.get(c.competency_id) ?? 0);
      byTrack.get(c.track_code)!.req.push(reqMap.get(c.competency_id) ?? 0);
    }
    return Array.from(byTrack.entries()).map(([track, v]) => ({
      track,
      label: TRACK_LABEL[track] ?? track,
      Current: +(v.cur.reduce((a, b) => a + b, 0) / v.cur.length).toFixed(1),
      Required: +(v.req.reduce((a, b) => a + b, 0) / v.req.length).toFixed(1),
    }));
  }, [catalog, current, required]);

  const drawer = useMemo(() => {
    if (!drawerTrack) return null;
    const comps = catalog.filter((c) => c.track_code === drawerTrack);
    const curMap = new Map(current.map((c) => [c.competency_id, c.current_level]));
    const reqMap = new Map(required.map((r) => [r.competency_id, r.required_level]));
    const profMap = new Map(proficiency.map((p) => [p.capability_code, p.current_level]));
    const capReqMap = new Map(requirements.map((r) => [r.capability_code, r]));
    return {
      trackLabel: TRACK_LABEL[drawerTrack] ?? drawerTrack,
      competencies: comps.map((c) => ({
        comp: c,
        current: curMap.get(c.competency_id) ?? 0,
        required: reqMap.get(c.competency_id) ?? 0,
        skills: c.supporting_skills.map((code) => ({
          code,
          label: humanizeCode(code),
          current: profMap.get(code) ?? 0,
          required: capReqMap.get(code)?.required_level ?? 0,
          criticality: capReqMap.get(code)?.criticality ?? "standard",
        })),
      })),
    };
  }, [drawerTrack, catalog, current, required, proficiency, requirements]);

  return (
    <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80 mb-1 font-medium">Where she stands</div>
          <h2 className="text-xl font-semibold tracking-tight">Competency profile</h2>
          <p className="text-sm text-muted-foreground mt-0.5">5 tracks · 16 sub-competencies · click a track to dive in</p>
        </div>
        <AskEmbarkButton
          context="My 360 › Radar"
          prompt="Looking at my competency radar, where are the most strategic gaps to close against Associate IM, and where am I already ahead? Give me a one-paragraph read."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-center">
        <div className="lg:col-span-3 h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={trackData} outerRadius="78%">
              <PolarGrid stroke={colors.grid} />
              <PolarAngleAxis dataKey="label" tick={{ fontSize: 12, fill: colors.tickFill }} />
              <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 10, fill: colors.tickFill }} />
              <Radar name="Role target" dataKey="Required" stroke={colors.radarTargetStroke} fill={colors.radarTargetFill} fillOpacity={0.35} />
              <Radar name="You" dataKey="Current" stroke={colors.radarCurrentStroke} fill={colors.radarCurrentFill} fillOpacity={0.5} />
              <Tooltip contentStyle={{ background: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}`, borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 space-y-2">
          {trackData.map((t) => {
            const gap = +(t.Current - t.Required).toFixed(1);
            const tone = gap >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400";
            const railTone = gap >= 0 ? "bg-emerald-500" : "bg-rose-500";
            return (
              <button
                key={t.track}
                onClick={() => setDrawerTrack(t.track)}
                className="group w-full text-left flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/40 transition-colors"
              >
                <span className={`h-10 w-0.5 rounded-full ${railTone}`} aria-hidden />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{t.label}</div>
                  <div className="text-xs text-muted-foreground">You {t.Current} · Target {t.Required}</div>
                </div>
                <div className={`text-sm font-semibold tabular-nums ${tone}`}>{gap >= 0 ? "+" : ""}{gap}</div>
              </button>
            );
          })}
        </div>
      </div>

      <Sheet open={!!drawerTrack} onOpenChange={(o) => !o && setDrawerTrack(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {drawer && (
            <>
              <SheetHeader>
                <SheetTitle className="text-lg">{drawer.trackLabel} track</SheetTitle>
                <SheetDescription>{drawer.competencies.length} sub-competencies and supporting capabilities.</SheetDescription>
              </SheetHeader>
              <div className="mt-5 space-y-5">
                {drawer.competencies.map((c) => (
                  <div key={c.comp.competency_id}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold">{c.comp.competency_name}</div>
                      <div className="text-xs text-muted-foreground tabular-nums">L{c.current} / L{c.required}</div>
                    </div>
                    <div className="space-y-1">
                      {c.skills.map((s) => (
                        <div key={s.code} className="flex items-center justify-between gap-2 text-xs px-2.5 py-1.5 rounded border border-border/60">
                          <span className="truncate">{s.label}</span>
                          <span className="flex items-center gap-2 shrink-0">
                            <span className="text-muted-foreground tabular-nums">L{s.current}→L{s.required}</span>
                            <MiniBar current={s.current} required={s.required} />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </section>
  );
}

function MiniBar({ current, required }: { current: number; required: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`h-3 w-1 rounded-sm ${i < current ? "bg-primary" : i < required ? "bg-muted-foreground/30" : "bg-muted"}`}
        />
      ))}
    </span>
  );
}

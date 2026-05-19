import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, ChevronRight, AlertTriangle, Star, TrendingUp,
  Info, ArrowRight, Scale, Sparkles, UserMinus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import type { AccountEmployee, AccountRole, AccountProject, SkillGapEntry } from "@/types/account-v2";
import type { EmployeeLabelReasoning } from "@/data/peopleGraphSystems";
import { getEmployeeLabelReasoning } from "@/data/peopleGraphSystems";
import { useRathbonesPersonaOverlays } from "@/hooks/useRathbonesPersonaOverlays";
import { buildOverlayLabels, buildOverlayReflections } from "@/data/peopleGraphFromOverlay";
import { ReflectionsAnalysis } from "./ReflectionsAnalysis";
import { ComputationDetails } from "./ComputationDetails";

const STATUS_PILL: Record<string, { label: string; cls: string }> = {
  rising_star: { label: "Rising star", cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" },
  on_track: { label: "On track", cls: "bg-blue-500/15 text-blue-700 border-blue-500/30" },
  needs_check_in: { label: "Needs check-in", cls: "bg-amber-500/15 text-amber-700 border-amber-500/30" },
  at_risk: { label: "At risk", cls: "bg-red-500/15 text-red-700 border-red-500/30" },
};

const severityConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  critical: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-500/15 border-red-500/30" },
  warning: { icon: UserMinus, color: "text-amber-600", bg: "bg-amber-500/15 border-amber-500/30" },
  success: { icon: Star, color: "text-emerald-600", bg: "bg-emerald-500/15 border-emerald-500/30" },
  info: { icon: Info, color: "text-blue-600", bg: "bg-blue-500/15 border-blue-500/30" },
};

interface Props {
  employees: AccountEmployee[];
  rolesById: Record<string, AccountRole>;
  projectsById: Record<string, AccountProject>;
  getSkillGaps: (empId: string) => { roleGaps: SkillGapEntry[]; projectGaps: SkillGapEntry[] };
}

export function EmployeeSignalExplorer({ employees, rolesById, projectsById, getSkillGaps }: Props) {
  const [selectedId, setSelectedId] = useState<string>("");
  const [expandedLabel, setExpandedLabel] = useState<string | null>(null);

  const { byId } = useRathbonesPersonaOverlays();
  const employee = employees.find(e => e.id === selectedId);
  const overlay = employee ? (byId[employee.id] ?? null) : null;
  const labels = employee
    ? overlay
      ? buildOverlayLabels(overlay)
      : getEmployeeLabelReasoning(employee.id, employee.name)
    : [];
  const overlayReflections = overlay ? buildOverlayReflections(overlay) : undefined;
  const gaps = employee ? getSkillGaps(employee.id) : { roleGaps: [], projectGaps: [] };
  const role = employee?.roleId ? rolesById[employee.roleId] : null;
  const statusPill = overlay ? STATUS_PILL[overlay.status] : null;

  return (
    <div className="space-y-6">
      {/* Employee Selector */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[240px]">
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select a team member to explore…" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      <div className="flex items-center gap-2">
                        <span>{emp.name}</span>
                        {emp.title && <span className="text-muted-foreground text-xs">· {emp.title}</span>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {employee && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                {role && <Badge variant="outline">{role.name}</Badge>}
                {employee.department && <span>{employee.department}</span>}
                {employee.tenure && <span>Tenure: {employee.tenure}y</span>}
                {overlay && (
                  <Badge variant="outline" className="border-accent/40 text-accent-foreground bg-accent/10">
                    Investment Management Readiness · Jan 2026
                  </Badge>
                )}
                {statusPill && (
                  <Badge variant="outline" className={statusPill.cls}>
                    {statusPill.label}
                  </Badge>
                )}
              </div>
            )}
          </div>
          {overlay && (
            <p className="mt-3 text-sm text-foreground/80 leading-relaxed border-l-2 border-accent/40 pl-3">
              {overlay.headline}
            </p>
          )}
        </CardContent>
      </Card>

      {!employee && (
        <div className="text-center py-16 text-muted-foreground">
          <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Select a team member to explore their signal pipeline and label reasoning</p>
        </div>
      )}

      {employee && (
        <AnimatePresence mode="wait">
          <motion.div
            key={employee.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Labels */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Computed Labels</h4>
              <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                {labels.map((lr) => {
                  const cfg = severityConfig[lr.severity] || severityConfig.info;
                  const LabelIcon = cfg.icon;
                  const isExpanded = expandedLabel === lr.label;

                  return (
                    <Collapsible key={lr.label} open={isExpanded} onOpenChange={() => setExpandedLabel(isExpanded ? null : lr.label)}>
                      <Card className={`border ${cfg.bg} transition-all`}>
                        <CollapsibleTrigger className="w-full text-left">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <LabelIcon className={`h-5 w-5 ${cfg.color}`} />
                                <div>
                                  <p className="text-sm font-semibold text-foreground">{lr.label}</p>
                                  <p className="text-xs text-muted-foreground">Confidence: {Math.round(lr.confidence * 100)}%</p>
                                </div>
                              </div>
                              {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                            </div>
                          </CardContent>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div className="px-4 pb-4 space-y-4">
                            {/* Formula */}
                            <div className="rounded-lg bg-background/80 p-3">
                              <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mb-1">Formula</p>
                              <code className="text-xs font-mono text-foreground/80">{lr.formula}</code>
                            </div>

                            {/* Contributing Signals */}
                            <div>
                              <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mb-2">Contributing Signals</p>
                              <div className="space-y-2">
                                {lr.contributingSignals.map((cs, i) => (
                                  <div key={i} className="flex items-center gap-3 text-xs">
                                    <div className="flex items-center gap-1.5 min-w-[140px]">
                                      <span className="text-muted-foreground">{cs.source}</span>
                                    </div>
                                    <ArrowRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                                    <span className="text-foreground/80 flex-1">{cs.signal}</span>
                                    <span className="font-mono font-medium text-foreground">{cs.value}</span>
                                    <div className="w-12">
                                      <Progress value={cs.weight * 100} className="h-1.5" />
                                    </div>
                                    <Badge
                                      variant="outline"
                                      className={`text-[0.6rem] ${
                                        cs.direction === "positive" ? "text-emerald-600 border-emerald-500/40" :
                                        cs.direction === "negative" ? "text-red-600 border-red-500/40" :
                                        "text-slate-500 border-slate-400/40"
                                      }`}
                                    >
                                      {cs.direction === "positive" ? "↑" : cs.direction === "negative" ? "↓" : "–"} {Math.round(cs.weight * 100)}%
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Thresholds */}
                            <div>
                              <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mb-2">Thresholds</p>
                              <div className="grid gap-2 grid-cols-1 sm:grid-cols-3">
                                {lr.thresholds.map((th, i) => (
                                  <div key={i} className="rounded-md bg-background/60 p-2 text-center">
                                    <p className="text-[0.65rem] text-muted-foreground">{th.metric}</p>
                                    <p className="text-xs font-mono">{th.threshold}</p>
                                    <p className="text-xs font-semibold text-foreground">{th.actual}</p>
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

            {/* Skill Gaps */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Skill Gaps</h4>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <SkillGapCard title="Role Gaps" gaps={gaps.roleGaps} emptyText="No role skill gaps" accentColor="text-blue-600" />
                <SkillGapCard title="Project Gaps" gaps={gaps.projectGaps} emptyText="No project skill gaps" accentColor="text-purple-600" />
              </div>
            </div>

            {/* Reflections */}
            <ReflectionsAnalysis employeeId={employee.id} employeeName={employee.name} reflectionsOverride={overlayReflections} />

            {/* Computation Details */}
            <ComputationDetails />
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

function SkillGapCard({ title, gaps, emptyText, accentColor }: {
  title: string;
  gaps: SkillGapEntry[];
  emptyText: string;
  accentColor: string;
}) {
  const activeGaps = gaps.filter(g => g.hasGap);
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2 p-4">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {activeGaps.length === 0 ? (
          <p className="text-xs text-muted-foreground">{emptyText}</p>
        ) : (
          <div className="space-y-2">
            {activeGaps.map((gap, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-foreground/80">{gap.skillName}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[0.65rem]">{gap.currentProficiency}</Badge>
                  <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
                  <Badge variant="outline" className={`text-[0.65rem] ${accentColor}`}>{gap.targetProficiency}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

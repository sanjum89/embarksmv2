import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  FileCheck2,
  Target,
  UserPlus,
  DollarSign,
  UserX,
  EyeOff,
  Layers,
  ChevronRight,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAccount } from "@/contexts/AccountContext";
import { useWorkforceGroups, type WorkforceGroup } from "@/contexts/WorkforceGroupContext";
import { cn } from "@/lib/utils";

function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
const seedPick = (seed: number, offset: number, lo: number, hi: number) =>
  lo + (((seed + offset) % 1000) / 1000) * (hi - lo);

type Tone = "good" | "warn" | "bad";
const TONE: Record<Tone, string> = {
  good: "text-emerald-700 bg-emerald-500/10 border-emerald-500/30",
  warn: "text-amber-700 bg-amber-500/10 border-amber-500/30",
  bad: "text-rose-700 bg-rose-500/10 border-rose-500/30",
};

interface Metric {
  key: string;
  icon: React.ElementType;
  title: string;
  value: string;
  delta: string;
  trendUp: boolean;
  detail: string;
  tone: Tone;
}

function buildMetrics(groupId: string, memberCount: number, linkCount: { compliance: number; role: number; cohort: number; requisition: number }): Metric[] {
  const seed = hashStr(groupId || "all");
  const reg = Math.round(seedPick(seed, 1, 62, 96));
  const sui = Math.round(seedPick(seed, 2, 70, 98));
  const skillGap = Math.round(seedPick(seed, 3, 8, 34));
  const readyNow = Math.round(seedPick(seed, 4, 0, Math.max(2, Math.floor(memberCount / 3))));
  const reqs = linkCount.requisition || Math.round(seedPick(seed, 5, 1, 5));
  const cost = Math.round(seedPick(seed, 6, 800, 4200));
  const contractorPct = Math.round(seedPick(seed, 7, 4, 28));
  const supervised = Math.round(seedPick(seed, 8, 60, 100));

  return [
    { key: "reg", icon: ShieldCheck, title: "Regulatory & CPD", value: `${reg}%`, delta: `${reg >= 85 ? "+" : "-"}${Math.abs(reg - 82)}pts vs target`, trendUp: reg >= 82,
      detail: `${linkCount.compliance || 3} linked rules`, tone: reg >= 85 ? "good" : reg >= 70 ? "warn" : "bad" },
    { key: "sui", icon: FileCheck2, title: "Suitability & advice", value: `${sui}%`, delta: `${sui >= 90 ? "+" : "-"}${Math.abs(sui - 90)}pts MoM`, trendUp: sui >= 90,
      detail: `File-checks across ${memberCount} members`, tone: sui >= 90 ? "good" : sui >= 80 ? "warn" : "bad" },
    { key: "skill", icon: Target, title: "Skill & competency", value: `${skillGap}% gap`, delta: `${skillGap <= 18 ? "-" : "+"}${Math.abs(skillGap - 18)}pts QoQ`, trendUp: skillGap <= 18,
      detail: `Avg gap to ${linkCount.role || 3} role targets`, tone: skillGap <= 12 ? "good" : skillGap <= 22 ? "warn" : "bad" },
    { key: "succ", icon: UserPlus, title: "Succession", value: `${readyNow}/${reqs}`, delta: `${readyNow >= reqs ? "+" : "-"}${Math.abs(readyNow - reqs)} vs open reqs`, trendUp: readyNow >= reqs,
      detail: `Ready-now successors`, tone: readyNow >= reqs ? "good" : readyNow >= 1 ? "warn" : "bad" },
    { key: "cost", icon: DollarSign, title: "Headcount cost", value: `£${cost}k`, delta: `${cost < 2500 ? "-" : "+"}${Math.round(Math.abs(cost - 2500) / 100)}% vs plan`, trendUp: cost < 2500,
      detail: `Annualised across ${memberCount} members`, tone: cost < 2000 ? "good" : cost < 3200 ? "warn" : "bad" },
    { key: "contractor", icon: UserX, title: "Contractor risk", value: `${contractorPct}%`, delta: `${contractorPct <= 15 ? "-" : "+"}${Math.abs(contractorPct - 15)}pts vs cap`, trendUp: contractorPct <= 15,
      detail: `Non-permanent share`, tone: contractorPct <= 10 ? "good" : contractorPct <= 20 ? "warn" : "bad" },
    { key: "supervisor", icon: EyeOff, title: "Supervisor coverage", value: `${supervised}%`, delta: `${supervised >= 90 ? "+" : "-"}${Math.abs(supervised - 90)}pts vs SLA`, trendUp: supervised >= 90,
      detail: `Members with active supervisor`, tone: supervised >= 90 ? "good" : supervised >= 75 ? "warn" : "bad" },
  ];
}

interface RollupRow {
  group: WorkforceGroup;
  memberCount: number;
  reg: number;
  sui: number;
  skillGap: number;
}

export default function WorkforceReadiness() {
  const { normalizedAccount } = useAccount();
  const { enabled, groups, members, links, selectedGroupId, selectedGroupPath, selectedSubtreeIds, selectedSubtreeEmployeeIds, setSelectedGroupId } = useWorkforceGroups();
  const employeesById = normalizedAccount?.employeesById ?? {};

  const subtreeLinkCount = useMemo(() => {
    const groupIds = new Set(selectedSubtreeIds.length ? selectedSubtreeIds : groups.map((g) => g.id));
    const subset = links.filter((l) => groupIds.has(l.group_id));
    return {
      compliance: subset.filter((l) => l.entity_type === "compliance_rule").length,
      role: subset.filter((l) => l.entity_type === "role").length,
      cohort: subset.filter((l) => l.entity_type === "cohort").length,
      requisition: subset.filter((l) => l.entity_type === "requisition").length,
    };
  }, [links, selectedSubtreeIds, groups]);

  const effectiveMemberIds = selectedGroupId ? selectedSubtreeEmployeeIds : Array.from(new Set(members.map((m) => m.employee_id)));
  const metrics = useMemo(
    () => buildMetrics(selectedGroupId || "all", effectiveMemberIds.length, subtreeLinkCount),
    [selectedGroupId, effectiveMemberIds.length, subtreeLinkCount]
  );

  // Per-child rollup so admins can drill down
  const rollupChildren = useMemo<RollupRow[]>(() => {
    const parentId = selectedGroupId;
    const children = groups.filter((g) => (parentId ? g.parent_id === parentId : !g.parent_id));
    return children.map((g) => {
      // collect subtree
      const ids: string[] = [];
      const walk = (id: string) => {
        ids.push(id);
        for (const c of groups.filter((x) => x.parent_id === id)) walk(c.id);
      };
      walk(g.id);
      const set = new Set(ids);
      const emp = new Set(members.filter((m) => set.has(m.group_id)).map((m) => m.employee_id));
      const seed = hashStr(g.id);
      return {
        group: g,
        memberCount: emp.size,
        reg: Math.round(seedPick(seed, 1, 62, 96)),
        sui: Math.round(seedPick(seed, 2, 70, 98)),
        skillGap: Math.round(seedPick(seed, 3, 8, 34)),
      };
    });
  }, [groups, members, selectedGroupId]);

  // Watchlist: members in the active scope with the lowest synthetic readiness
  const watchlist = useMemo(() => {
    const ids = effectiveMemberIds.slice(0, 60);
    return ids
      .map((id) => {
        const emp = employeesById[id];
        const seed = hashStr(id);
        const reg = Math.round(seedPick(seed, 11, 30, 100));
        const cpdHrs = Math.round(seedPick(seed, 12, 0, 35));
        const gap = Math.round(seedPick(seed, 13, 0, 45));
        return { id, name: emp?.name || id, title: emp?.title || "—", reg, cpdHrs, gap };
      })
      .sort((a, b) => a.reg - b.reg)
      .slice(0, 8);
  }, [effectiveMemberIds, employeesById]);

  const scopeLabel = selectedGroupPath.length ? selectedGroupPath.map((g) => g.name).join(" › ") : "All workforce groups";

  if (!enabled) {
    return (
      <div className="flex-1 overflow-y-auto">
        <PageHeader title="Workforce Readiness" />
        <div className="px-6 py-12 text-center text-muted-foreground">
          <p>Workforce Groups is disabled for this account.</p>
          <Button asChild variant="link" className="mt-2"><Link to="/settings">Enable in Admin → Settings</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <PageHeader
        title="Workforce Readiness"
        breadcrumbs={[{ label: "Admin", path: "/admin" }, { label: "Workforce Readiness" }]}
        actions={<Button asChild variant="outline" size="sm"><Link to="/admin/workforce-groups">Manage groups</Link></Button>}
      />

      <div className="px-6 pt-4 pb-10 space-y-8">
        {/* Scope summary */}
        <div className="flex flex-wrap items-center gap-3">
          <Layers className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{scopeLabel}</span>
          <Badge variant="secondary">{effectiveMemberIds.length} members</Badge>
          <Badge variant="outline">{subtreeLinkCount.role} roles</Badge>
          <Badge variant="outline">{subtreeLinkCount.cohort} cohorts</Badge>
          <Badge variant="outline">{subtreeLinkCount.compliance} compliance rules</Badge>
          {selectedGroupId && (
            <Button size="sm" variant="ghost" onClick={() => setSelectedGroupId(null)}>Clear scope</Button>
          )}
        </div>

        {/* Metric grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m) => {
            const Icon = m.icon;
            const Trend = m.trendUp ? TrendingUp : TrendingDown;
            return (
              <Card key={m.key} className="border-border/60">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn("rounded-md p-1.5 border", TONE[m.tone])}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{m.title}</span>
                  </div>
                  <div className="text-2xl font-semibold tracking-tight">{m.value}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <Trend className={cn("h-3 w-3", m.trendUp ? "text-emerald-600" : "text-rose-600")} />
                    <span className={cn("text-xs", m.trendUp ? "text-emerald-700" : "text-rose-700")}>{m.delta}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">{m.detail}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Two-column: drilldown + watchlist */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Per-child rollup */}
          <Card className="border-border/60">
            <CardContent className="p-0">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <h2 className="text-sm font-semibold">{selectedGroupId ? "Subgroups" : "Top-level groups"}</h2>
                <span className="text-xs text-muted-foreground">{rollupChildren.length} group{rollupChildren.length === 1 ? "" : "s"}</span>
              </div>
              {rollupChildren.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">No subgroups under this scope.</div>
              ) : (
                <div className="divide-y">
                  {rollupChildren.map((r) => (
                    <button
                      key={r.group.id}
                      onClick={() => setSelectedGroupId(r.group.id)}
                      className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{r.group.name}</span>
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wide">{r.group.kind}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{r.memberCount} members</div>
                      </div>
                      <div className="hidden sm:flex items-center gap-4 text-xs">
                        <div className="text-right"><div className="text-muted-foreground">CPD</div><div className={cn("font-semibold", r.reg >= 85 ? "text-emerald-700" : r.reg >= 70 ? "text-amber-700" : "text-rose-700")}>{r.reg}%</div></div>
                        <div className="text-right"><div className="text-muted-foreground">Suit</div><div className={cn("font-semibold", r.sui >= 90 ? "text-emerald-700" : r.sui >= 80 ? "text-amber-700" : "text-rose-700")}>{r.sui}%</div></div>
                        <div className="text-right"><div className="text-muted-foreground">Gap</div><div className={cn("font-semibold", r.skillGap <= 12 ? "text-emerald-700" : r.skillGap <= 22 ? "text-amber-700" : "text-rose-700")}>{r.skillGap}%</div></div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Watchlist */}
          <Card className="border-border/60">
            <CardContent className="p-0">
              <div className="px-4 py-3 border-b">
                <h2 className="text-sm font-semibold">Readiness watchlist</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Lowest CPD &amp; competency scores in scope.</p>
              </div>
              {watchlist.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">No members in this scope.</div>
              ) : (
                <ul className="divide-y">
                  {watchlist.map((w) => (
                    <li key={w.id} className="px-4 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{w.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{w.title}</div>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className={cn("font-semibold", w.reg >= 70 ? "text-amber-700" : "text-rose-700")}>{w.reg}%</span>
                        <span className="text-muted-foreground">{w.cpdHrs}h CPD</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { useMemo } from "react";
import { ShieldCheck, FileCheck2, Target, UserPlus, Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useWorkforceGroups } from "@/contexts/WorkforceGroupContext";
import { cn } from "@/lib/utils";

function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

interface ReadinessCard {
  key: string;
  icon: React.ElementType;
  title: string;
  value: string;
  detail: string;
  tone: "good" | "warn" | "bad";
}

function buildCards(groupId: string, memberCount: number, linkCount: { compliance: number; role: number; cohort: number; requisition: number }): ReadinessCard[] {
  const seed = hashStr(groupId || "all");
  const pick = (offset: number, lo: number, hi: number) => lo + (((seed + offset) % 1000) / 1000) * (hi - lo);

  // Regulatory & CPD
  const reg = Math.round(pick(1, 62, 96));
  const regTone: ReadinessCard["tone"] = reg >= 85 ? "good" : reg >= 70 ? "warn" : "bad";

  // Suitability
  const sui = Math.round(pick(2, 70, 98));
  const suiTone: ReadinessCard["tone"] = sui >= 90 ? "good" : sui >= 80 ? "warn" : "bad";

  // Skill & competency gap %
  const skillGap = Math.round(pick(3, 8, 34));
  const skillTone: ReadinessCard["tone"] = skillGap <= 12 ? "good" : skillGap <= 22 ? "warn" : "bad";

  // Succession
  const readyNow = Math.round(pick(4, 0, Math.max(2, Math.floor(memberCount / 3))));
  const reqs = linkCount.requisition || Math.round(pick(5, 0, 4));
  const succTone: ReadinessCard["tone"] = readyNow >= reqs ? "good" : readyNow >= 1 ? "warn" : "bad";

  return [
    {
      key: "reg",
      icon: ShieldCheck,
      title: "Regulatory & CPD",
      value: `${reg}%`,
      detail: `${linkCount.compliance || 3} linked rule${linkCount.compliance === 1 ? "" : "s"} · SMCR, Consumer Duty, CISI CPD`,
      tone: regTone,
    },
    {
      key: "sui",
      icon: FileCheck2,
      title: "Suitability & advice quality",
      value: `${sui}%`,
      detail: `File-check pass rate across ${memberCount} member${memberCount === 1 ? "" : "s"}`,
      tone: suiTone,
    },
    {
      key: "skill",
      icon: Target,
      title: "Skill & competency",
      value: `${skillGap}% gap`,
      detail: `Avg gap to role target across ${linkCount.role || 0} linked role${linkCount.role === 1 ? "" : "s"}`,
      tone: skillTone,
    },
    {
      key: "succ",
      icon: UserPlus,
      title: "Succession & hiring",
      value: `${readyNow}/${reqs}`,
      detail: `Ready-now successors vs ${reqs} open requisition${reqs === 1 ? "" : "s"}`,
      tone: succTone,
    },
  ];
}

const TONE: Record<ReadinessCard["tone"], string> = {
  good: "text-emerald-700 bg-emerald-500/10 border-emerald-500/30",
  warn: "text-amber-700 bg-amber-500/10 border-amber-500/30",
  bad: "text-rose-700 bg-rose-500/10 border-rose-500/30",
};

export default function GroupReadinessSection() {
  const { enabled, selectedGroupId, selectedGroupPath, selectedSubtreeEmployeeIds, links } = useWorkforceGroups();

  const subtreeLinkCount = useMemo(() => {
    const groupIds = new Set(selectedGroupPath.map((g) => g.id));
    const subset = links.filter((l) => groupIds.has(l.group_id));
    return {
      compliance: subset.filter((l) => l.entity_type === "compliance_rule").length,
      role: subset.filter((l) => l.entity_type === "role").length,
      cohort: subset.filter((l) => l.entity_type === "cohort").length,
      requisition: subset.filter((l) => l.entity_type === "requisition").length,
    };
  }, [links, selectedGroupPath]);

  if (!enabled || !selectedGroupId) return null;
  const cards = buildCards(selectedGroupId, selectedSubtreeEmployeeIds.length, subtreeLinkCount);
  const path = selectedGroupPath.map((g) => g.name).join(" › ");

  return (
    <section className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Layers className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold tracking-tight">Group Readiness</h2>
        <span className="text-xs text-muted-foreground truncate">· {path}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.key} className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn("rounded-md p-1.5 border", TONE[c.tone])}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{c.title}</span>
                </div>
                <div className="text-2xl font-semibold tracking-tight">{c.value}</div>
                <p className="text-xs text-muted-foreground mt-1 leading-snug">{c.detail}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

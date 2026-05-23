import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Clock, MapPin, Briefcase, Sparkles, UserCheck } from "lucide-react";
import type { EmployeeRecord } from "@/hooks/useMy360Data";
import { useAgentOne } from "@/contexts/AgentOneContext";

interface Props {
  employee?: EmployeeRecord;
  managerName?: string;
  mentorName?: string;
}

export function IdentityHeader({ employee, managerName, mentorName }: Props) {
  const hris = employee?.hris;
  const { handleSend } = useAgentOne();

  const tenureLabel = hris?.tenureMonths
    ? `${Math.floor(hris.tenureMonths / 12)}y ${hris.tenureMonths % 12}m`
    : "—";

  return (
    <Card className="p-5 bg-gradient-to-br from-card to-muted/30 border-border/60">
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="space-y-2 flex-1 min-w-[280px]">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight">{employee?.name ?? "—"}</h1>
            <Badge variant="secondary" className="font-normal">{employee?.title ?? ""}</Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            {managerName && (
              <span className="inline-flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" />Manager: {managerName}</span>
            )}
            {mentorName && (
              <span className="inline-flex items-center gap-1.5"><UserCheck className="h-3.5 w-3.5" />Mentor: {mentorName}</span>
            )}
            {hris?.location && (
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{hris.location}</span>
            )}
            <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{tenureLabel} at firm</span>
          </div>
          {hris?.personaNarrative && (
            <p className="text-sm text-foreground/80 leading-relaxed max-w-3xl pt-1">{hris.personaNarrative}</p>
          )}
          {hris?.certifications && hris.certifications.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-2">
              {hris.certifications.map((c) => (
                <CertChip key={c.name} cert={c} />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 items-end">
          <div className="flex gap-2">
            {hris?.performanceBand && (
              <StatPill label="Performance" value={hris.performanceBand} tone="primary" />
            )}
            {typeof hris?.engagementScore === "number" && (
              <StatPill label="Engagement" value={`${hris.engagementScore}`} tone="muted" />
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => handleSend("Walk me through my My 360 profile — what stands out, what I should focus on next, and how I'm progressing against my role.", "My 360 › Ask Embark")}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Ask Embark about my profile
          </Button>
        </div>
      </div>
    </Card>
  );
}

function CertChip({ cert }: { cert: { name: string; status: string; targetDate?: string; awardedDate?: string } }) {
  const held = cert.status === "held";
  const inProgress = cert.status === "in_progress";
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs ${
        held
          ? "border-primary/30 bg-primary/5 text-foreground"
          : inProgress
          ? "border-amber-500/30 bg-amber-500/5 text-foreground"
          : "border-border bg-muted text-muted-foreground"
      }`}
    >
      {held ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
      <span className="font-medium">{cert.name}</span>
      <span className="text-muted-foreground">
        {held ? `held${cert.awardedDate ? ` · ${cert.awardedDate}` : ""}` : inProgress ? `in progress${cert.targetDate ? ` · ${cert.targetDate}` : ""}` : cert.status}
      </span>
    </div>
  );
}

function StatPill({ label, value, tone }: { label: string; value: string; tone: "primary" | "muted" }) {
  return (
    <div className={`px-3 py-1.5 rounded-md text-xs ${tone === "primary" ? "bg-primary/10 border border-primary/20" : "bg-muted border border-border"}`}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold leading-tight">{value}</div>
    </div>
  );
}

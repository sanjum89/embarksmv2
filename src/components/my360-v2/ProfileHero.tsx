import type { EmployeeRecord } from "@/hooks/useMy360Data";
import { AskEmbarkButton } from "./AskEmbarkButton";
import { MapPin, Briefcase, Clock, GraduationCap, Award } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

interface Props {
  employee?: EmployeeRecord;
  managerName?: string;
}

function initials(name?: string) {
  if (!name) return "—";
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export function ProfileHero({ employee, managerName }: Props) {
  const hris = employee?.hris;
  const [certsOpen, setCertsOpen] = useState(false);

  const tenureLabel = hris?.tenureMonths
    ? `${Math.floor(hris.tenureMonths / 12)}y ${hris.tenureMonths % 12}m at firm`
    : null;

  const inProgCert = hris?.certifications?.find((c) => c.status === "in_progress");
  const heldCertCount = hris?.certifications?.filter((c) => c.status === "held").length ?? 0;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card">
      {/* decorative orbs */}
      <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-primary/20 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-20 left-1/3 h-64 w-64 rounded-full bg-accent/10 blur-3xl" aria-hidden />

      <div className="relative p-8 md:p-10 flex flex-col md:flex-row gap-8 items-start">
        {/* monogram */}
        <div className="shrink-0">
          <div className="h-20 w-20 md:h-24 md:w-24 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-3xl md:text-4xl font-semibold text-primary tracking-tight">
            {initials(employee?.name)}
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80 mb-1.5 font-medium">
              My 360 · Profile
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight leading-tight">
              {employee?.name ?? "—"}
            </h1>
            <p className="text-base text-muted-foreground mt-1">{employee?.title ?? ""}</p>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
            {managerName && (
              <span className="inline-flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" />{managerName}</span>
            )}
            {hris?.location && (
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{hris.location}</span>
            )}
            {tenureLabel && (
              <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{tenureLabel}</span>
            )}
            {hris?.workPattern && <span className="inline-flex items-center gap-1.5">·{hris.workPattern}</span>}
          </div>

          {hris?.personaNarrative && (
            <blockquote className="relative pl-4 border-l-2 border-primary/40 text-[15px] leading-relaxed text-foreground/85 italic max-w-2xl">
              "{hris.personaNarrative}"
            </blockquote>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-2">
            {hris?.performanceBand && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-medium">
                <span className="text-muted-foreground">Performance</span>
                <span className="text-foreground">{hris.performanceBand}</span>
              </span>
            )}
            {typeof hris?.engagementScore === "number" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted border border-border px-3 py-1 text-xs font-medium">
                <span className="text-muted-foreground">Engagement</span>
                <span className="text-foreground">{hris.engagementScore}</span>
              </span>
            )}
            {(heldCertCount > 0 || inProgCert) && (
              <button
                onClick={() => setCertsOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-muted border border-border hover:border-primary/40 px-3 py-1 text-xs font-medium transition-colors"
              >
                <Award className="h-3 w-3 text-primary" />
                <span>{heldCertCount} held{inProgCert ? ` · ${inProgCert.name} in progress` : ""}</span>
              </button>
            )}
            <AskEmbarkButton
              className="ml-auto"
              context="My 360 › Hero"
              prompt={`Walk me through my My 360 profile — what stands out about ${employee?.name ?? "me"}, what should be the focus right now, and how am I tracking against the Associate IM target role?`}
              label="Ask Embark about my profile"
            />
          </div>
        </div>
      </div>

      <Sheet open={certsOpen} onOpenChange={setCertsOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Certifications & education</SheetTitle>
            <SheetDescription>Held, in-progress, and academic background.</SheetDescription>
          </SheetHeader>
          <div className="mt-5 space-y-2.5">
            {hris?.certifications?.map((c) => (
              <div key={c.name} className="flex items-center justify-between gap-3 p-3 rounded-md border border-border">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {c.status.replace("_", " ")}
                    {c.awardedDate && ` · ${c.awardedDate}`}
                    {c.targetDate && ` · target ${c.targetDate}`}
                  </div>
                </div>
                <Award className={`h-4 w-4 shrink-0 ${c.status === "held" ? "text-primary" : "text-muted-foreground"}`} />
              </div>
            ))}
            {hris?.education && hris.education.length > 0 && (
              <div className="pt-4">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Education</div>
                {hris.education.map((e) => (
                  <div key={e} className="flex items-start gap-2 text-sm py-1">
                    <GraduationCap className="h-3.5 w-3.5 mt-0.5 text-muted-foreground" />
                    <span>{e}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}

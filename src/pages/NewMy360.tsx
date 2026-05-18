import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useMy360Data } from "@/hooks/useMy360Data";
import { bucketCapabilities } from "@/lib/my360v2/bucketing";
import { useAccount } from "@/contexts/AccountContext";
import { ProfileHero } from "@/components/my360-v2/ProfileHero";
import { StatStrip } from "@/components/my360-v2/StatStrip";
import { CompetencyRadarHero } from "@/components/my360-v2/CompetencyRadarHero";
import { CapabilityStrip } from "@/components/my360-v2/CapabilityStrip";
import { CohortPreviewCard } from "@/components/my360-v2/CohortPreviewCard";
import { CohortJourneyTab } from "@/components/my360-v2/CohortJourneyTab";
import { GrowthPathTab } from "@/components/my360-v2/GrowthPathTab";
import { Loader2 } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import PageBody from "@/components/layout/PageBody";
import { useModeEyebrow } from "@/components/layout/useModeEyebrow";

const allTabs = ["Profile", "Cohort Journey", "Growth Path"] as const;
type Tab = (typeof allTabs)[number];

export default function NewMy360() {
  const data = useMy360Data();
  const { activeAccount } = useAccount();
  const [tab, setTab] = useState<Tab>("Profile");
  const eyebrow = useModeEyebrow();

  const buckets = useMemo(
    () => bucketCapabilities(data.proficiency, data.requirements),
    [data.proficiency, data.requirements],
  );

  if (data.loading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading your profile…
      </div>
    );
  }

  if (!data.eligible) {
    return <Navigate to="/my-360-legacy" replace />;
  }

  const employees = ((activeAccount as any)?.data?.employees ?? []) as Array<{ id: string; name: string }>;
  const managerName = data.employee?.reportsTo
    ? employees.find((e) => e.id === data.employee?.reportsTo)?.name
    : undefined;

  const tenureLabel = data.employee?.hris?.tenureMonths
    ? `${Math.floor(data.employee.hris.tenureMonths / 12)}y ${data.employee.hris.tenureMonths % 12}m`
    : "—";

  const hasCohortData = !!data.cohort || data.modules.length > 0;
  const tabs = hasCohortData ? allTabs : (["Profile"] as const);

  return (
    <div className="flex-1 overflow-y-auto" data-tour="my360">
      <PageHeader
        eyebrow={eyebrow}
        title="My 360"
        subtitle="Your profile, competencies and growth path."
        back
      />
      <PageBody>
      <ProfileHero employee={data.employee} managerName={managerName} />

      {/* Pill tab switcher */}
      <div className="flex items-center gap-1 p-1 rounded-full bg-muted border border-border w-fit">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
              tab === t
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Profile" && (
        <>
          <StatStrip
            eyebrow="At a glance"
            stats={[
              { label: "Tenure", value: tenureLabel, hint: "at firm" },
              { label: "Strengths", value: buckets.strengths.length, tone: "emerald", hint: "above target" },
              { label: "At level", value: buckets.atLevel.length, tone: "primary", hint: "meeting target" },
              { label: "Gaps", value: buckets.gaps.length, tone: "rose", hint: "to close" },
              { label: "Stretch", value: buckets.stretch.length, tone: "violet", hint: "push beyond" },
            ]}
          />

          <CompetencyRadarHero
            catalog={data.competencyCatalog}
            current={data.personaCompetencies}
            required={data.roleCompetencyReqs}
            proficiency={data.proficiency}
            requirements={data.requirements}
          />

          <CapabilityStrip buckets={buckets} />

          {hasCohortData && (
            <CohortPreviewCard
              cohort={data.cohort}
              modules={data.modules}
              adaptations={data.adaptations}
              progress={data.progress}
              onJumpToTab={() => setTab("Cohort Journey")}
            />
          )}
        </>
      )}

      {tab === "Cohort Journey" && (
        <CohortJourneyTab
          cohort={data.cohort}
          modules={data.modules}
          adaptations={data.adaptations}
          progress={data.progress}
        />
      )}

      {tab === "Growth Path" && (
        <GrowthPathTab
          buckets={buckets}
          proficiency={data.proficiency}
          hris={data.employee?.hris}
          employeeName={data.employee?.name}
          onRefresh={data.refresh}
        />
      )}
      </PageBody>
    </div>
  );
}

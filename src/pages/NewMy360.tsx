import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useMy360Data } from "@/hooks/useMy360Data";
import { bucketCapabilities } from "@/lib/my360v2/bucketing";
import { useAccount } from "@/contexts/AccountContext";
import { IdentityHeader } from "@/components/my360-v2/IdentityHeader";
import { HrisSnapshotCard } from "@/components/my360-v2/HrisSnapshotCard";
import { CompetencyRadarPanel } from "@/components/my360-v2/CompetencyRadarPanel";
import { CapabilityBuckets } from "@/components/my360-v2/CapabilityBuckets";
import { CohortJourneyTab } from "@/components/my360-v2/CohortJourneyTab";
import { GrowthPathTab } from "@/components/my360-v2/GrowthPathTab";
import { Loader2 } from "lucide-react";

const tabs = ["Role & Strengths", "Cohort Journey", "Growth Path"] as const;

export default function NewMy360() {
  const data = useMy360Data();
  const { activeAccount } = useAccount();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Role & Strengths");

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

  // Resolve manager name from account employees jsonb
  const employees = ((activeAccount as any)?.data?.employees ?? []) as Array<{ id: string; name: string }>;
  const managerName = data.employee?.reportsTo
    ? employees.find((e) => e.id === data.employee?.reportsTo)?.name
    : undefined;

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">
      <IdentityHeader employee={data.employee} managerName={managerName} />

      <div className="flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Role & Strengths" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1"><HrisSnapshotCard hris={data.employee?.hris} /></div>
            <div className="lg:col-span-2">
              <CompetencyRadarPanel
                catalog={data.competencyCatalog}
                current={data.personaCompetencies}
                required={data.roleCompetencyReqs}
                proficiency={data.proficiency}
                requirements={data.requirements}
              />
            </div>
          </div>
          <div>
            <div className="mb-3">
              <h2 className="text-base font-semibold">Capabilities vs role</h2>
              <p className="text-xs text-muted-foreground">All {data.proficiency.length} capabilities sorted into where you stand against Associate IM.</p>
            </div>
            <CapabilityBuckets buckets={buckets} />
          </div>
        </div>
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
    </div>
  );
}

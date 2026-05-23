import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useMy360Data } from "@/hooks/useMy360Data";
import { bucketCapabilities } from "@/lib/my360v2/bucketing";
import { ProfileHero } from "@/components/my360-v2/ProfileHero";
import { OverviewTab } from "@/components/my360-v2/OverviewTab";
import { SkillsTab } from "@/components/my360-v2/SkillsTab";
import { GrowthTab } from "@/components/my360-v2/GrowthTab";
import { OutcomesTab } from "@/components/my360-v2/OutcomesTab";
import { CohortJourneyTab } from "@/components/my360-v2/CohortJourneyTab";
import { useAccount } from "@/contexts/AccountContext";
import { Loader2 } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import PageBody from "@/components/layout/PageBody";

const allTabs = ["Overview", "Skills", "Growth", "Cohort Journey", "Outcomes"] as const;
type Tab = (typeof allTabs)[number];

export default function NewMy360() {
  const data = useMy360Data();
  const { activeAccount } = useAccount();
  const [tab, setTab] = useState<Tab>("Overview");

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
  const mentorName = data.mentor?.name;

  const hasCohortData = !!data.cohort || data.modules.length > 0;
  const tabs = hasCohortData ? allTabs : (allTabs.filter((t) => t !== "Cohort Journey") as readonly Tab[]);

  return (
    <div className="flex-1 overflow-y-auto" data-tour="my360">
      <PageHeader title="My 360" subtitle="Your profile, skills, growth and outcomes." />
      <PageBody>
        <ProfileHero employee={data.employee} managerName={managerName} mentorName={mentorName} />

        <div className="flex items-center gap-1 p-1 rounded-full bg-muted border border-border w-fit overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all whitespace-nowrap ${
                tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "Overview" && <OverviewTab data={data} />}
        {tab === "Skills" && <SkillsTab data={data} />}
        {tab === "Growth" && <GrowthTab data={data} />}
        {tab === "Cohort Journey" && hasCohortData && (
          <CohortJourneyTab cohort={data.cohort} modules={data.modules} adaptations={data.adaptations} progress={data.progress} />
        )}
        {tab === "Outcomes" && <OutcomesTab data={data} />}
      </PageBody>
    </div>
  );
}


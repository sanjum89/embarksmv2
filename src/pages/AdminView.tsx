import { useAccount } from "@/contexts/AccountContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CompanyProfilePanel from "@/components/admin/CompanyProfilePanel";
import OrgOverviewPanel from "@/components/admin/OrgOverviewPanel";
import PeopleGraphPanel from "@/components/admin/PeopleGraphPanel";
import LearningSkillsPanel from "@/components/admin/LearningSkillsPanel";
import WorkSignalsPanel from "@/components/admin/WorkSignalsPanel";
import ReflectionsPanel from "@/components/admin/ReflectionsPanel";
import ExplainabilityPanel from "@/components/admin/ExplainabilityPanel";
import PageHeader from "@/components/layout/PageHeader";
import PageBody from "@/components/layout/PageBody";
import { useModeEyebrow } from "@/components/layout/useModeEyebrow";

export default function AdminView() {
  const { normalizedAccount } = useAccount();
  const eyebrow = useModeEyebrow();

  if (!normalizedAccount) {
    return (
      <div className="flex-1 overflow-y-auto">
        <PageHeader title="Admin Dashboard" />
        <PageBody>
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-muted-foreground">No account loaded.</p>
          </div>
        </PageBody>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <PageHeader
        title="Admin Dashboard"
        subtitle={`${normalizedAccount.branding.name} — Organisation overview and analytics`}
      />
      <PageBody>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="people">People Graph</TabsTrigger>
            <TabsTrigger value="learning">Learning & Skills</TabsTrigger>
            <TabsTrigger value="signals">Work Signals</TabsTrigger>
            <TabsTrigger value="reflections">Reflections</TabsTrigger>
            <TabsTrigger value="explainability">AI Explainability</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <CompanyProfilePanel account={normalizedAccount} />
            <OrgOverviewPanel account={normalizedAccount} />
          </TabsContent>

          <TabsContent value="people">
            <PeopleGraphPanel account={normalizedAccount} />
          </TabsContent>

          <TabsContent value="learning">
            <LearningSkillsPanel account={normalizedAccount} />
          </TabsContent>

          <TabsContent value="signals">
            <WorkSignalsPanel account={normalizedAccount} />
          </TabsContent>

          <TabsContent value="reflections">
            <ReflectionsPanel account={normalizedAccount} />
          </TabsContent>

          <TabsContent value="explainability">
            <ExplainabilityPanel account={normalizedAccount} />
          </TabsContent>
        </Tabs>
      </PageBody>
    </div>
  );
}

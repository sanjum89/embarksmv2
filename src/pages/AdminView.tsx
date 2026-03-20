import { useAccount } from "@/contexts/AccountContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CompanyProfilePanel from "@/components/admin/CompanyProfilePanel";
import OrgOverviewPanel from "@/components/admin/OrgOverviewPanel";
import PeopleGraphPanel from "@/components/admin/PeopleGraphPanel";
import LearningSkillsPanel from "@/components/admin/LearningSkillsPanel";
import WorkSignalsPanel from "@/components/admin/WorkSignalsPanel";
import ReflectionsPanel from "@/components/admin/ReflectionsPanel";
import ExplainabilityPanel from "@/components/admin/ExplainabilityPanel";

export default function AdminView() {
  const { normalizedAccount } = useAccount();

  if (!normalizedAccount) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-muted-foreground">No account loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {normalizedAccount.branding.name} — Organisation overview and analytics
        </p>
      </div>

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
    </div>
  );
}

import { useMemo } from "react";
import { useAccount } from "@/contexts/AccountContext";
import { useUser } from "@/contexts/UserContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import OrgOverviewPanel from "@/components/admin/OrgOverviewPanel";
import PeopleGraphPanel from "@/components/admin/PeopleGraphPanel";
import LearningSkillsPanel from "@/components/admin/LearningSkillsPanel";
import WorkSignalsPanel from "@/components/admin/WorkSignalsPanel";
import ReflectionsPanel from "@/components/admin/ReflectionsPanel";
import { getScopedAccount } from "@/lib/accountSelectors";
import PageHeader from "@/components/layout/PageHeader";
import PageBody from "@/components/layout/PageBody";
import { useModeEyebrow } from "@/components/layout/useModeEyebrow";

export default function TeamDashboard() {
  const { normalizedAccount } = useAccount();
  const { user } = useUser();
  const eyebrow = useModeEyebrow();

  const scopedAccount = useMemo(() => {
    if (!normalizedAccount) return null;
    return getScopedAccount(normalizedAccount, user.id);
  }, [normalizedAccount, user.id]);

  if (!scopedAccount) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-muted-foreground">No account loaded.</p>
        </div>
      </div>
    );
  }

  const memberCount = Object.keys(scopedAccount.employeesById).length;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <BackButton />
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Team Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {user.name}'s Team — {memberCount} member{memberCount !== 1 ? "s" : ""}
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6 flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="people">People Graph</TabsTrigger>
          <TabsTrigger value="learning">Learning & Skills</TabsTrigger>
          <TabsTrigger value="signals">Work Signals</TabsTrigger>
          <TabsTrigger value="reflections">Reflections</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OrgOverviewPanel account={scopedAccount} />
        </TabsContent>

        <TabsContent value="people">
          <PeopleGraphPanel account={scopedAccount} />
        </TabsContent>

        <TabsContent value="learning">
          <LearningSkillsPanel account={scopedAccount} />
        </TabsContent>

        <TabsContent value="signals">
          <WorkSignalsPanel account={scopedAccount} />
        </TabsContent>

        <TabsContent value="reflections">
          <ReflectionsPanel account={scopedAccount} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AccountProvider } from "@/contexts/AccountContext";
import { UserProvider } from "@/contexts/UserContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import { SkillTargetsProvider } from "@/contexts/SkillTargetsContext";
import { RolePlayProvider } from "@/contexts/RolePlayContext";
import { AgentOneProvider } from "@/contexts/AgentOneContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import SkillTargetBuilder from "./pages/SkillTargetBuilder";
import SkillTargetDetail from "./pages/SkillTargetDetail";
import AssessmentPage from "./pages/AssessmentPage";
import RolePlaySession from "./pages/RolePlaySession";
import LearningModulePage from "./pages/LearningModulePage";
import RolePlayBank from "./pages/RolePlayBank";
import TeamInsights from "./pages/TeamInsights";
import TeamDashboard from "./pages/TeamDashboard";
import My360 from "./pages/My360";
import NewMy360 from "./pages/NewMy360";
import ManagerView from "./pages/ManagerView";
import LearnerChat from "./pages/LearnerChat";
import MyInbox from "./pages/MyInbox";

import ManagerSkillTargets from "./pages/ManagerSkillTargets";
import ManagerSkillTargetDetail from "./pages/ManagerSkillTargetDetail";

import ProgramContextPage from "./pages/ProgramContextPage";
import AdminView from "./pages/AdminView";
import EmbarkAI from "./pages/LearnPath";
import EmbarkAIv2 from "./pages/LearnPathV2";
import UnifiedChat from "./pages/UnifiedChat";
import NotFound from "./pages/NotFound";
import PeopleGraphIntelligence from "./pages/PeopleGraphIntelligence";
import TeamMode from "./pages/TeamMode";
import ManagerCohortHub from "./pages/ManagerCohortHub";
import ActionCentre from "./pages/ActionCentre";
import ManagerCohortPicker from "./pages/ManagerCohortPicker";
import DeepResearch from "./pages/DeepResearch";
import CohortHub from "./pages/CohortHub";
import DevTools from "./pages/DevTools";
import Settings from "./pages/Settings";
import { SupportiveToastBridge } from "@/components/SupportiveToastBridge";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <AccessibilityProvider>
    <AccountProvider>
    <UserProvider>
      <SkillTargetsProvider>
      <RolePlayProvider>
      <SidebarProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SupportiveToastBridge />
        <BrowserRouter>
          <AgentOneProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<EmbarkAI />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/chat" element={<LearnerChat />} />
              
              <Route path="/create-skill-target" element={<SkillTargetBuilder />} />
              <Route path="/skill-target/:id" element={<SkillTargetDetail />} />
              <Route path="/skill-target/:id/assessment/:aid" element={<AssessmentPage />} />
              <Route path="/skill-target/:id/role-play/:rid" element={<RolePlaySession />} />
              <Route path="/skill-target/:id/module/:mid" element={<LearningModulePage />} />
              <Route path="/role-play-bank" element={<RolePlayBank />} />
              <Route path="/role-play-bank/:rid" element={<RolePlaySession />} />
              <Route path="/my-360" element={<NewMy360 />} />
              <Route path="/my-360-legacy" element={<My360 />} />
              <Route path="/my-inbox" element={<MyInbox />} />
              <Route path="/team-insights" element={<TeamInsights />} />
              <Route path="/manager" element={<ManagerView />} />
              <Route path="/team-dashboard" element={<TeamDashboard />} />
              <Route path="/manager/role-play" element={<RolePlayBank />} />
              <Route path="/manager/skill-targets" element={<ManagerSkillTargets />} />
              <Route path="/manager/skill-target/:id" element={<ManagerSkillTargetDetail />} />
              <Route path="/manager/cohorts" element={<ManagerCohortPicker />} />
              <Route path="/manager/programs" element={<ProgramContextPage />} />
              <Route path="/embark" element={<EmbarkAI />} />
              <Route path="/embark-v2" element={<EmbarkAIv2 />} />
              <Route path="/manager/people-graph" element={<PeopleGraphIntelligence />} />
              <Route path="/team" element={<TeamMode />} />
              <Route path="/team/deep-research" element={<DeepResearch />} />
              <Route path="/team/deep-research/:threadId" element={<DeepResearch />} />
              <Route path="/manager/cohort/:cohortId" element={<ManagerCohortHub />} />
              <Route path="/cohort" element={<CohortHub />} />
              <Route path="/action-centre" element={<ActionCentre />} />
              <Route path="/admin" element={<AdminView />} />
              <Route path="/dev-tools" element={<DevTools />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          </AgentOneProvider>
        </BrowserRouter>
      </TooltipProvider>
      </SidebarProvider>
      </RolePlayProvider>
      </SkillTargetsProvider>
    </UserProvider>
    </AccountProvider>
    </AccessibilityProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

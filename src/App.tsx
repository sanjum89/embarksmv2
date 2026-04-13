import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AccountProvider } from "@/contexts/AccountContext";
import { UserProvider } from "@/contexts/UserContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
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
import ManagerView from "./pages/ManagerView";
import LearnerChat from "./pages/LearnerChat";
import MyInbox from "./pages/MyInbox";

import ManagerSkillTargets from "./pages/ManagerSkillTargets";
import ManagerSkillTargetDetail from "./pages/ManagerSkillTargetDetail";

import ProgramContextPage from "./pages/ProgramContextPage";
import AdminView from "./pages/AdminView";
import LearnPath from "./pages/LearnPath";
import UnifiedChat from "./pages/UnifiedChat";
import NotFound from "./pages/NotFound";
import PeopleGraphIntelligence from "./pages/PeopleGraphIntelligence";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <AccountProvider>
    <UserProvider>
      <SkillTargetsProvider>
      <RolePlayProvider>
      <SidebarProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AgentOneProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/chat" element={<LearnerChat />} />
              <Route path="/unified" element={<UnifiedChat />} />
              
              <Route path="/create-skill-target" element={<SkillTargetBuilder />} />
              <Route path="/skill-target/:id" element={<SkillTargetDetail />} />
              <Route path="/skill-target/:id/assessment/:aid" element={<AssessmentPage />} />
              <Route path="/skill-target/:id/role-play/:rid" element={<RolePlaySession />} />
              <Route path="/skill-target/:id/module/:mid" element={<LearningModulePage />} />
              <Route path="/role-play-bank" element={<RolePlayBank />} />
              <Route path="/role-play-bank/:rid" element={<RolePlaySession />} />
              <Route path="/my-360" element={<My360 />} />
              <Route path="/my-inbox" element={<MyInbox />} />
              <Route path="/team-insights" element={<TeamInsights />} />
              <Route path="/manager" element={<ManagerView />} />
              <Route path="/team-dashboard" element={<TeamDashboard />} />
              <Route path="/manager/role-play" element={<RolePlayBank />} />
              <Route path="/manager/skill-targets" element={<ManagerSkillTargets />} />
              <Route path="/manager/skill-target/:id" element={<ManagerSkillTargetDetail />} />
              <Route path="/manager/programs" element={<ProgramContextPage />} />
              <Route path="/learnpath" element={<LearnPath />} />
              <Route path="/manager/people-graph" element={<PeopleGraphIntelligence />} />
              <Route path="/admin" element={<AdminView />} />
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
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "@/contexts/UserContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SkillTargetsProvider } from "@/contexts/SkillTargetsContext";
import { RolePlayProvider } from "@/contexts/RolePlayContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import SkillTargetDetail from "./pages/SkillTargetDetail";
import AssessmentPage from "./pages/AssessmentPage";
import RolePlaySession from "./pages/RolePlaySession";
import LearningModulePage from "./pages/LearningModulePage";
import RolePlayBank from "./pages/RolePlayBank";
import TeamInsights from "./pages/TeamInsights";
import My360 from "./pages/My360";
import ManagerView from "./pages/ManagerView";

import ProgramContextPage from "./pages/ProgramContextPage";
import AdminView from "./pages/AdminView";
import NotFound from "./pages/NotFound";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <UserProvider>
      <SkillTargetsProvider>
      <RolePlayProvider>
      <SidebarProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/skill-target/:id" element={<SkillTargetDetail />} />
              <Route path="/skill-target/:id/assessment/:aid" element={<AssessmentPage />} />
              <Route path="/skill-target/:id/role-play/:rid" element={<RolePlaySession />} />
              <Route path="/skill-target/:id/module/:mid" element={<LearningModulePage />} />
              <Route path="/role-play-bank" element={<RolePlayBank />} />
              <Route path="/role-play-bank/:rid" element={<RolePlaySession />} />
              <Route path="/my-360" element={<My360 />} />
              <Route path="/team-insights" element={<TeamInsights />} />
              <Route path="/manager" element={<ManagerView />} />
              <Route path="/manager/role-play" element={<RolePlayBank />} />
              <Route path="/manager/programs" element={<ProgramContextPage />} />
              <Route path="/admin" element={<AdminView />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </SidebarProvider>
      </RolePlayProvider>
      </SkillTargetsProvider>
    </UserProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

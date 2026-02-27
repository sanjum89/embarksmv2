import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "@/contexts/UserContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import SkillTargetDetail from "./pages/SkillTargetDetail";
import AssessmentPage from "./pages/AssessmentPage";
import RolePlaySession from "./pages/RolePlaySession";
import LearningModulePage from "./pages/LearningModulePage";
import RolePlayBank from "./pages/RolePlayBank";
import PeopleGraph from "./pages/PeopleGraph";
import ManagerView from "./pages/ManagerView";
import AdminView from "./pages/AdminView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UserProvider>
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
              <Route path="/people-graph" element={<PeopleGraph />} />
              <Route path="/manager" element={<ManagerView />} />
              <Route path="/admin" element={<AdminView />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </UserProvider>
  </QueryClientProvider>
);

export default App;

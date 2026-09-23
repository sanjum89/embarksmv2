import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { LoginPage } from "./LoginPage";
import { AIChatWrapper } from "@/components/chat/AIChatWrapper";
import { useSidebarState } from "@/contexts/SidebarContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useUser } from "@/contexts/UserContext";
import { useAccount } from "@/contexts/AccountContext";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { useBrandColors } from "@/hooks/useBrandColors";
import { cn } from "@/lib/utils";
import { TourProvider } from "@/contexts/TourContext";
import { EmbarkTour } from "@/components/tour/EmbarkTour";

import { TourWelcomeBanner } from "@/components/tour/TourWelcomeBanner";
import { PageTransition } from "@/components/motion/Motion";
import { WorkforceGroupPicker } from "@/components/workforce-groups/WorkforceGroupPicker";


export function AppLayout() {
  const { expanded } = useSidebarState();
  const { styleTheme, setStyleTheme, setSuperLight } = useTheme();
  const { signedInUserIds, loginUser, availableUsers } = useUser();
  const { switching, activeAccountId, loading: accountsLoading } = useAccount();
  const { authUser, authLoading } = useAuth();
  const location = useLocation();
  const isTraditional = styleTheme === "traditional";

  // Apply brand colors from active account
  useBrandColors();

  // Once auth is established and accounts have loaded, auto-select the default persona.
  // This fires on every login so the user lands in the app without a manual persona pick.
  useEffect(() => {
    if (!authUser || accountsLoading || signedInUserIds.length > 0 || availableUsers.length === 0 || !activeAccountId) return;
    const lastId = (() => {
      try { return localStorage.getItem(`lastActiveUser_${activeAccountId}`); } catch { return null; }
    })();
    const storedUser = lastId ? availableUsers.find((u) => u.id === lastId) : null;
    const hasLearners = availableUsers.some((u) => u.role === "learner");
    // Respect the stored preference only when it's a learner or manager.
    // If the stored preference is the admin persona and learners exist, override with a learner
    // so the demo lands on an investment manager view (new My360 design, rich data) by default.
    // The admin persona can always be accessed via the profile switcher.
    const preferred = storedUser && (storedUser.role !== "admin" || !hasLearners) ? storedUser : null;
    const target = preferred
      || availableUsers.find((u) => u.role === "learner")
      || availableUsers.find((u) => u.role === "admin")
      || availableUsers[0];
    if (target) {
      loginUser(target.id);
      setStyleTheme("new");
      setSuperLight(true);
    }
  }, [authUser, accountsLoading, signedInUserIds.length, availableUsers, activeAccountId]);

  // Show a full-page spinner while auth or accounts are loading
  if (authLoading || (authUser && accountsLoading)) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not authenticated — show the email/password login form
  if (!authUser) {
    return <LoginPage />;
  }

  // Authenticated but persona not yet selected — spinner while useEffect above resolves
  if (signedInUserIds.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Use only the pathname (not search/hash) so in-page tab/query changes
  // don't re-trigger the page entrance animation.
  const routeKey = location.pathname;

  return (
    <TourProvider>
      <div className="h-screen overflow-hidden bg-background flex flex-col">
        {switching && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground">Switching accounts…</p>
            </div>
          </div>
        )}
        <AppSidebar />
        <main className={cn("flex-1 flex flex-col min-h-0 transition-all duration-200", expanded ? (isTraditional ? "ml-[248px]" : "ml-56") : (isTraditional ? "ml-[82px]" : "ml-16"), isTraditional && "pt-14")}>
          <div className="absolute right-4 top-2 z-30">
            <WorkforceGroupPicker />
          </div>
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <PageTransition transitionKey={routeKey} className="flex-1 flex flex-col min-h-0">
              <Outlet />
            </PageTransition>
          </div>
        </main>
        <AIChatWrapper />
        
        <TourWelcomeBanner />
        <EmbarkTour />
      </div>
    </TourProvider>
  );
}


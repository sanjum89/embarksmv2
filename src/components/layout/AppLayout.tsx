import { Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { LoginPage } from "./LoginPage";
import { AIChatWrapper } from "@/components/chat/AIChatWrapper";
import { useSidebarState } from "@/contexts/SidebarContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useUser } from "@/contexts/UserContext";
import { useAccount } from "@/contexts/AccountContext";
import { Loader2 } from "lucide-react";
import { useBrandColors } from "@/hooks/useBrandColors";
import { cn } from "@/lib/utils";
import { TourProvider } from "@/contexts/TourContext";
import { EmbarkTour } from "@/components/tour/EmbarkTour";
import { TourLaunchButton } from "@/components/tour/TourLaunchButton";
import { TourWelcomeBanner } from "@/components/tour/TourWelcomeBanner";
import { PageTransition } from "@/components/motion/Motion";


export function AppLayout() {
  const { expanded } = useSidebarState();
  const { styleTheme } = useTheme();
  const { signedInUserIds } = useUser();
  const { switching } = useAccount();
  const location = useLocation();
  const isTraditional = styleTheme === "traditional";

  // Apply brand colors from active account
  useBrandColors();

  // When no users are signed in, show login page
  if (signedInUserIds.length === 0) {
    return <LoginPage />;
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
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <PageTransition transitionKey={routeKey} className="flex-1 flex flex-col min-h-0 overflow-auto">
              <Outlet />
            </PageTransition>
          </div>
        </main>
        <AIChatWrapper />
        <TourLaunchButton />
        <TourWelcomeBanner />
        <EmbarkTour />
      </div>
    </TourProvider>
  );
}


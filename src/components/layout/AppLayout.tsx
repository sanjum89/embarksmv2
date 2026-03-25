import { Outlet } from "react-router-dom";
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

export function AppLayout() {
  const { expanded } = useSidebarState();
  const { styleTheme } = useTheme();
  const { signedInUserIds } = useUser();
  const isTraditional = styleTheme === "traditional";

  // Apply brand colors from active account
  useBrandColors();

  // When no users are signed in, show login page
  if (signedInUserIds.length === 0) {
    return <LoginPage />;
  }

  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col">
      <AppSidebar />
      <main className={cn("flex-1 flex flex-col min-h-0 transition-all duration-200", expanded ? (isTraditional ? "ml-[248px]" : "ml-56") : (isTraditional ? "ml-[82px]" : "ml-16"), isTraditional && "pt-14")}>
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <Outlet />
        </div>
      </main>
      <AIChatWrapper />
    </div>
  );
}

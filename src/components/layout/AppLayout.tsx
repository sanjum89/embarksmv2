import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { useSidebarState } from "@/contexts/SidebarContext";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

export function AppLayout() {
  const { expanded } = useSidebarState();
  const { styleTheme } = useTheme();
  const isTraditional = styleTheme === "traditional";
  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col">
      <AppSidebar />
      <main className={cn("flex-1 flex flex-col transition-all duration-200", expanded ? (isTraditional ? "ml-[248px]" : "ml-56") : (isTraditional ? "ml-[82px]" : "ml-16"), isTraditional && "pt-14")}>
        <div className="flex-1 flex flex-col min-h-0 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

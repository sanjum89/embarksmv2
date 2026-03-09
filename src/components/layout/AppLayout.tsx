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
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className={cn("transition-all duration-200", expanded ? (isTraditional ? "ml-[248px]" : "ml-56") : (isTraditional ? "ml-[82px]" : "ml-16"), isTraditional && "pt-14")}>
        <Outlet />
      </main>
    </div>
  );
}

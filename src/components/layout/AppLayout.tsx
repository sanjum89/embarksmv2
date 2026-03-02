import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { useSidebarState } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";

export function AppLayout() {
  const { expanded } = useSidebarState();
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className={cn("transition-all duration-200", expanded ? "ml-56" : "ml-16")}>
        <Outlet />
      </main>
    </div>
  );
}

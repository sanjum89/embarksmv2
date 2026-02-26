import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Target,
  MessageSquare,
  BookOpen,
  Users,
  Shield,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  roles: Array<"learner" | "manager" | "admin">;
}

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard, roles: ["learner", "manager", "admin"] },
  { label: "Role Play Bank", path: "/role-play-bank", icon: MessageSquare, roles: ["learner", "manager", "admin"] },
  { label: "People Graph", path: "/people-graph", icon: BarChart3, roles: ["manager", "admin"] },
  { label: "Manager", path: "/manager", icon: Users, roles: ["manager", "admin"] },
  { label: "Admin", path: "/admin", icon: Shield, roles: ["admin"] },
];

export function AppSidebar() {
  const { user } = useUser();
  const location = useLocation();
  const filteredItems = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-accent">
          <Sparkles className="h-5 w-5 text-accent-foreground" />
        </div>
        <div>
          <h1 className="font-display text-base font-bold text-sidebar-accent-foreground">
            WFAI
          </h1>
          <p className="text-xs text-sidebar-foreground/60">Learning Spaces</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== "/" && location.pathname.startsWith(item.path));
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className={cn("h-4.5 w-4.5", isActive && "text-sidebar-primary")} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* User info */}
      <div className="border-t border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-bold text-sidebar-accent-foreground">
            {user.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-sidebar-accent-foreground">{user.name}</p>
            <p className="truncate text-xs text-sidebar-foreground/50 capitalize">{user.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

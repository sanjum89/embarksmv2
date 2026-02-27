import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Target,
  MessageSquare,
  Users,
  Shield,
  BarChart3,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  roles: Array<"learner" | "manager" | "admin">;
  children?: { label: string; path: string; icon: React.ElementType }[];
}

const navItems: NavItem[] = [
  {
    label: "Learning Spaces",
    path: "/",
    icon: LayoutDashboard,
    roles: ["learner", "manager", "admin"],
    children: [
      { label: "Skill Targets", path: "/", icon: Target },
      { label: "Role Play", path: "/role-play-bank", icon: MessageSquare },
    ],
  },
  { label: "People Graph", path: "/people-graph", icon: BarChart3, roles: ["manager", "admin"] },
  { label: "Manager", path: "/manager", icon: Users, roles: ["manager", "admin"] },
  { label: "Admin", path: "/admin", icon: Shield, roles: ["admin"] },
];

export function AppSidebar() {
  const { user } = useUser();
  const location = useLocation();
  const filteredItems = navItems.filter((item) => item.roles.includes(user.role));
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({ "Learning Spaces": true });

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isPathActive = (path: string) =>
    location.pathname === path || (path !== "/" && location.pathname.startsWith(path));

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
          if (item.children) {
            const isOpen = openMenus[item.label] ?? false;
            const isChildActive = item.children.some((c) => isPathActive(c.path));

            return (
              <div key={item.label} className="space-y-0.5">
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isChildActive
                      ? "text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className={cn("h-4.5 w-4.5", isChildActive && "text-sidebar-primary")} />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>

                {isOpen && (
                  <div className="ml-4 space-y-0.5 border-l border-sidebar-border pl-3">
                    {item.children.map((child) => {
                      const active = isPathActive(child.path);
                      return (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                            active
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                          )}
                        >
                          <child.icon className={cn("h-4 w-4", active && "text-sidebar-primary")} />
                          {child.label}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const isActive = isPathActive(item.path);
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

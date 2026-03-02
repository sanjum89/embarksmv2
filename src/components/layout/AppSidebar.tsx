import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Target,
  MessageSquare,
  Users,
  Shield,
  BarChart3,
  Sparkles,
  CircleUser,
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  { label: "My 360", path: "/my-360", icon: CircleUser, roles: ["learner", "manager", "admin"] },
  { label: "People Graph", path: "/people-graph", icon: BarChart3, roles: ["manager", "admin"] },
  { label: "Manager", path: "/manager", icon: Users, roles: ["manager", "admin"] },
  { label: "Admin", path: "/admin", icon: Shield, roles: ["admin"] },
];

export function AppSidebar() {
  const { user } = useUser();
  const location = useLocation();
  const filteredItems = navItems.filter((item) => item.roles.includes(user.role));

  const isPathActive = (path: string) =>
    location.pathname === path || (path !== "/" && location.pathname.startsWith(path));

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-16 flex-col items-center bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Brand */}
      <div className="flex items-center justify-center py-4 border-b border-sidebar-border w-full">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-accent">
          <Sparkles className="h-5 w-5 text-accent-foreground" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col items-center gap-1 py-4 w-full px-2">
        {filteredItems.map((item) => {
          if (item.children) {
            return item.children.map((child) => {
              const active = isPathActive(child.path);
              return (
                <Tooltip key={child.path} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <NavLink
                      to={child.path}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <child.icon className={cn("h-4.5 w-4.5", active && "text-sidebar-primary")} />
                    </NavLink>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {child.label}
                  </TooltipContent>
                </Tooltip>
              );
            });
          }

          const isActive = isPathActive(item.path);
          return (
            <Tooltip key={item.path} delayDuration={0}>
              <TooltipTrigger asChild>
                <NavLink
                  to={item.path}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className={cn("h-4.5 w-4.5", isActive && "text-sidebar-primary")} />
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      {/* User info */}
      <div className="border-t border-sidebar-border py-4 w-full flex justify-center">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-bold text-sidebar-accent-foreground cursor-default">
              {user.name.split(" ").map((n) => n[0]).join("")}
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            <p className="font-medium">{user.name}</p>
            <p className="text-xs capitalize text-muted-foreground">{user.role}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}

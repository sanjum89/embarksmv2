import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Target,
  MessageSquare,
  Users,
  Shield,
  BarChart3,
  CircleUser,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useSidebarState } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Building2 } from "lucide-react";

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
  const { expanded, toggle } = useSidebarState();
  const location = useLocation();
  const filteredItems = navItems.filter((item) => item.roles.includes(user.role));
  const [learningSpacesOpen, setLearningSpacesOpen] = useState(true);
  const [brandHovered, setBrandHovered] = useState(false);

  const isPathActive = (path: string) =>
    location.pathname === path || (path !== "/" && location.pathname.startsWith(path));

  const renderLink = (path: string, icon: React.ElementType, label: string, indented = false) => {
    const Icon = icon;
    const active = isPathActive(path);
    const link = (
      <NavLink
        to={path}
        className={cn(
          "flex items-center rounded-lg transition-all duration-200",
          expanded ? "h-9 gap-3 w-full" : "h-10 w-10 justify-center",
          expanded && indented ? "pl-9 pr-3" : expanded ? "px-3" : "",
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
        )}
      >
        <Icon className={cn("h-4 w-4 shrink-0", active && "text-sidebar-primary")} />
        {expanded && <span className="text-sm font-medium truncate">{label}</span>}
      </NavLink>
    );

    if (expanded) return link;

    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>{label}</TooltipContent>
      </Tooltip>
    );
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-200",
        expanded ? "w-56" : "w-16",
        expanded ? "items-stretch" : "items-center"
      )}
    >
      {/* Brand + toggle */}
      <div className={cn("flex items-center border-b border-sidebar-border w-full py-4", expanded ? "justify-between px-4" : "justify-center")}>
        {expanded ? (
          <>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shrink-0">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-sm text-sidebar-foreground">ABC Company</span>
            </div>
            <button onClick={toggle} className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-colors">
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </>
        ) : (
          <div
            className="relative flex h-9 w-9 items-center justify-center cursor-pointer"
            onMouseEnter={() => setBrandHovered(true)}
            onMouseLeave={() => setBrandHovered(false)}
            onClick={toggle}
          >
            {brandHovered ? (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-accent transition-colors">
                <PanelLeftOpen className="h-4.5 w-4.5 text-sidebar-foreground" />
              </div>
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 flex flex-col gap-0.5 py-4 w-full", expanded ? "px-3" : "px-2 items-center")}>
        {filteredItems.map((item) => {
          if (item.children) {
            if (expanded) {
              return (
                <div key={item.label} className="mb-1">
                  <button
                    onClick={() => setLearningSpacesOpen(!learningSpacesOpen)}
                    className="flex items-center gap-3 w-full rounded-lg px-3 h-9 text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-colors"
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="text-sm font-medium truncate flex-1 text-left">{item.label}</span>
                    {learningSpacesOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                    )}
                  </button>
                  {learningSpacesOpen && (
                    <div className="mt-0.5 space-y-0.5">
                      {item.children.map((child) => (
                        <div key={child.path}>{renderLink(child.path, child.icon, child.label, true)}</div>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return item.children.map((child) => (
              <div key={child.path}>{renderLink(child.path, child.icon, child.label)}</div>
            ));
          }
          return <div key={item.path}>{renderLink(item.path, item.icon, item.label)}</div>;
        })}
      </nav>

      {/* User info */}
      <div className={cn("border-t border-sidebar-border py-4 w-full", expanded ? "px-3" : "flex justify-center")}>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div className={cn("flex items-center gap-3", expanded ? "px-1" : "justify-center")}>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-bold text-sidebar-accent-foreground cursor-default shrink-0">
                {user.name.split(" ").map((n) => n[0]).join("")}
              </div>
              {expanded && (
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs capitalize text-muted-foreground">{user.role}</p>
                </div>
              )}
            </div>
          </TooltipTrigger>
          {!expanded && (
            <TooltipContent side="right" sideOffset={8}>
              <p className="font-medium">{user.name}</p>
              <p className="text-xs capitalize text-muted-foreground">{user.role}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    </aside>
  );
}

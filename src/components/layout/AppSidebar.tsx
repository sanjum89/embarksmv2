import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
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
  Check,
  Palette,
  Moon,
  Sun,
  Building2,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useSidebarState } from "@/contexts/SidebarContext";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import cornerstoneLogo from "@/assets/cornerstone-logo.svg";

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
  const { user, switchUser, availableUsers } = useUser();
  const { expanded, toggle } = useSidebarState();
  const { theme, toggleTheme, styleTheme, setStyleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const filteredItems = navItems.filter((item) => item.roles.includes(user.role));
  const [learningSpacesOpen, setLearningSpacesOpen] = useState(true);
  const [brandHovered, setBrandHovered] = useState(false);
  const [viewMode, setViewMode] = useState<"me" | "team">("me");

  const isTraditional = styleTheme === "traditional";

  const isPathActive = (path: string) =>
    location.pathname === path || (path !== "/" && location.pathname.startsWith(path));

  /* ── Traditional theme sidebar ── */
  if (isTraditional) {
    return (
      <div className="fixed left-0 top-0 z-40 h-screen flex flex-col">
        {/* Logo — outside the nav bar */}
        <div className={cn(
          "flex items-center gap-2 px-4 py-4 bg-background",
          expanded ? "w-56" : "w-16 justify-center"
        )}>
          {expanded ? (
            <div className="flex items-center gap-2 w-full justify-between">
              <div className="flex items-center gap-2">
                <img src={cornerstoneLogo} alt="Cornerstone" className="h-6 w-6 object-contain" />
                <span className="font-display font-bold text-sm text-foreground">Cornerstone</span>
              </div>
              <button onClick={toggle} className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition-colors">
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div
              className="relative flex h-9 w-9 items-center justify-center cursor-pointer"
              onMouseEnter={() => setBrandHovered(true)}
              onMouseLeave={() => setBrandHovered(false)}
              onClick={toggle}
            >
              {brandHovered ? (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted transition-colors">
                  <PanelLeftOpen className="h-4.5 w-4.5 text-foreground" />
                </div>
              ) : (
                <img src={cornerstoneLogo} alt="Cornerstone" className="h-7 w-7 object-contain" />
              )}
            </div>
          )}
        </div>

        {/* Nav bar strip */}
        <aside className={cn(
          "flex-1 flex flex-col bg-card border-r border-border/30 rounded-tr-3xl transition-all duration-200",
          expanded ? "w-56 items-stretch" : "w-16 items-center"
        )}>
          {/* Me / Team toggle */}
          {expanded ? (
            <div className="px-4 pt-4 pb-2">
              <div className="flex bg-muted rounded-full p-0.5">
                <button
                  onClick={() => setViewMode("me")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 flex-1 rounded-full py-1.5 text-xs font-medium transition-all",
                    viewMode === "me"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <UserRound className="h-3.5 w-3.5" />
                  Me
                </button>
                <button
                  onClick={() => setViewMode("team")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 flex-1 rounded-full py-1.5 text-xs font-medium transition-all",
                    viewMode === "team"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <UsersRound className="h-3.5 w-3.5" />
                  Team
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-4 pb-2 flex flex-col items-center gap-1">
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setViewMode(viewMode === "me" ? "team" : "me")}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                      viewMode === "team"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {viewMode === "team" ? <UsersRound className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>{viewMode === "me" ? "Switch to Team" : "Switch to Me"}</TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Navigation */}
          <nav className={cn("flex-1 flex flex-col gap-2.5 py-4 w-full", expanded ? "px-3" : "px-2.5 items-center")}>
            {filteredItems.map((item) => {
              if (item.children) {
                if (expanded) {
                  return (
                    <div key={item.label} className="mb-1">
                      <button
                        onClick={() => setLearningSpacesOpen(!learningSpacesOpen)}
                        className="flex items-center gap-3 w-full px-3 h-9 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="text-sm font-medium truncate flex-1 text-left">{item.label}</span>
                        {learningSpacesOpen ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                      </button>
                      {learningSpacesOpen && (
                        <div className="mt-0.5 space-y-0.5">
                          {item.children.map((child) => {
                            const active = isPathActive(child.path);
                            const childLabel = child.label === "Skill Targets" ? "Spaces" : child.label;
                            return (
                              <NavLink
                                key={child.path}
                                to={child.path}
                                className={cn(
                                  "flex items-center gap-3 h-9 pl-9 pr-3 rounded-lg transition-all duration-200 text-sm font-medium",
                                  active
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                )}
                              >
                                <child.icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
                                <span className="truncate">{childLabel}</span>
                              </NavLink>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }
                return item.children.map((child) => {
                  const active = isPathActive(child.path);
                  const link = (
                    <NavLink
                      key={child.path}
                      to={child.path}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200",
                        active
                          ? "bg-foreground/[0.05] text-foreground"
                          : "text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground"
                      )}
                    >
                      <child.icon className="h-[18px] w-[18px]" />
                    </NavLink>
                  );
                  return (
                    <Tooltip key={child.path} delayDuration={0}>
                      <TooltipTrigger asChild>{link}</TooltipTrigger>
                      <TooltipContent side="right" sideOffset={8}>{child.label}</TooltipContent>
                    </Tooltip>
                  );
                });
              }

              const active = isPathActive(item.path);
              if (expanded) {
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 h-9 px-3 rounded-lg transition-all duration-200 text-sm font-medium",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              }

              const link = (
                <NavLink
                  to={item.path}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200",
                      active
                        ? "bg-foreground/[0.05] text-foreground"
                        : "text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground"
                    )}
                >
                  <item.icon className="h-[18px] w-[18px]" />
                </NavLink>
              );
              return (
                <Tooltip key={item.path} delayDuration={0}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>{item.label}</TooltipContent>
                </Tooltip>
              );
            })}
          </nav>

          {/* Bottom section */}
          <div className={cn("w-full pb-3", expanded ? "px-3" : "flex flex-col items-center gap-1")}>
            {/* Dark mode toggle */}
            {expanded ? (
              <button
                onClick={toggleTheme}
                className="flex items-center gap-3 w-full px-3 h-9 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors text-sm font-medium"
              >
                {theme === "dark" ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
                <span>Dark mode</span>
              </button>
            ) : (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleTheme}
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground transition-colors"
                  >
                    {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>Dark mode</TooltipContent>
              </Tooltip>
            )}

            {/* Theme style switcher */}
            <Popover>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <button className={cn(
                      "flex items-center rounded-lg transition-all duration-200 text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                      expanded ? "h-9 gap-3 w-full px-3" : "h-10 w-10 justify-center"
                    )}>
                      <Palette className="h-4 w-4 shrink-0" />
                      {expanded && <span className="text-sm font-medium">Theme</span>}
                    </button>
                  </PopoverTrigger>
                </TooltipTrigger>
                {!expanded && <TooltipContent side="right" sideOffset={8}>Theme</TooltipContent>}
              </Tooltip>
              <PopoverContent side={expanded ? "top" : "right"} align="start" sideOffset={8} className="w-48 p-2">
                <p className="text-xs font-medium text-muted-foreground px-2 pb-1.5">UI Style</p>
                <button
                  onClick={() => setStyleTheme("new")}
                  className={cn("flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm transition-colors", !isTraditional ? "bg-primary/10 font-medium" : "hover:bg-secondary")}
                >
                  <span className="flex-1 text-left">New UI</span>
                  {!isTraditional && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                </button>
                <button
                  onClick={() => setStyleTheme("traditional")}
                  className={cn("flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm transition-colors", isTraditional ? "bg-primary/10 font-medium" : "hover:bg-secondary")}
                >
                  <span className="flex-1 text-left">Traditional UI</span>
                  {isTraditional && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                </button>
              </PopoverContent>
            </Popover>
          </div>

          {/* User info */}
          <div className={cn("border-t border-border/30 py-3 w-full", expanded ? "px-3" : "flex justify-center")}>
            <Popover>
              <PopoverTrigger asChild>
                <button className={cn("flex items-center gap-3 w-full rounded-lg hover:bg-muted/50 transition-colors p-1", expanded ? "" : "justify-center")}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground cursor-pointer shrink-0">
                    {user.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  {expanded && (
                    <div className="min-w-0 text-left">
                      <p className="text-sm font-medium truncate text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.role}</p>
                    </div>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent side={expanded ? "top" : "right"} align="start" sideOffset={8} className="w-56 p-2">
                <p className="text-xs font-medium text-muted-foreground px-2 pb-2">Logged in as</p>
                {availableUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => { switchUser(u.id); navigate("/"); }}
                    className={cn(
                      "flex items-center gap-2.5 w-full rounded-md px-2 py-2 text-sm transition-colors text-left",
                      u.id === user.id ? "bg-primary/10 text-foreground font-medium" : "text-foreground hover:bg-secondary"
                    )}
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shrink-0">
                      {u.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <span className="truncate flex-1">{u.name}</span>
                    {u.id === user.id && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          </div>
        </aside>
      </div>
    );
  }

  /* ── New theme sidebar (unchanged) ── */
  const renderLink = (path: string, icon: React.ElementType, label: string, indented = false) => {
    const Icon = icon;
    const active = isPathActive(path);
    const link = (
      <NavLink
        to={path}
        className={cn(
          "flex items-center transition-all duration-200 rounded-lg",
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
              <div className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0">
                <img src={cornerstoneLogo} alt="Cornerstone" className="h-6 w-6 object-contain" />
              </div>
              <span className="font-display font-bold text-sm text-sidebar-foreground">Cornerstone</span>
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
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
                <img src={cornerstoneLogo} alt="Cornerstone" className="h-6 w-6 object-contain" />
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
                    className="flex items-center gap-3 w-full px-3 h-9 text-sidebar-foreground/70 hover:bg-sidebar-accent/50 rounded-lg transition-colors"
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="text-sm font-medium truncate flex-1 text-left">{item.label}</span>
                    {learningSpacesOpen ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
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

      {/* Theme selector */}
      <div className={cn("w-full", expanded ? "px-3" : "flex justify-center")}>
        <Popover>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "flex items-center rounded-lg transition-all duration-200 text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                    expanded ? "h-9 gap-3 w-full px-3" : "h-10 w-10 justify-center"
                  )}
                >
                  <Palette className="h-4 w-4 shrink-0" />
                  {expanded && <span className="text-sm font-medium">Theme</span>}
                </button>
              </PopoverTrigger>
            </TooltipTrigger>
            {!expanded && <TooltipContent side="right" sideOffset={8}>Theme</TooltipContent>}
          </Tooltip>
          <PopoverContent side={expanded ? "top" : "right"} align="start" sideOffset={8} className="w-48 p-2">
            <p className="text-xs font-medium text-muted-foreground px-2 pb-1.5">UI Style</p>
            <button
              onClick={() => setStyleTheme("new")}
              className={cn("flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm transition-colors", !isTraditional ? "bg-accent/10 font-medium" : "hover:bg-secondary")}
            >
              <span className="flex-1 text-left">New UI</span>
              {!isTraditional && <Check className="h-3.5 w-3.5 text-accent shrink-0" />}
            </button>
            <button
              onClick={() => setStyleTheme("traditional")}
              className={cn("flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm transition-colors", isTraditional ? "bg-accent/10 font-medium" : "hover:bg-secondary")}
            >
              <span className="flex-1 text-left">Traditional UI</span>
              {isTraditional && <Check className="h-3.5 w-3.5 text-accent shrink-0" />}
            </button>
            <Separator className="my-1.5" />
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm hover:bg-secondary transition-colors"
            >
              {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </button>
          </PopoverContent>
        </Popover>
      </div>

      {/* User info */}
      <div className={cn("border-t border-sidebar-border py-4 w-full", expanded ? "px-3" : "flex justify-center")}>
        <Popover>
          <PopoverTrigger asChild>
            <button className={cn("flex items-center gap-3 w-full rounded-lg hover:bg-sidebar-accent/50 transition-colors p-1", expanded ? "" : "justify-center")}>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-bold text-sidebar-accent-foreground cursor-pointer shrink-0">
                {user.name.split(" ").map((n) => n[0]).join("")}
              </div>
              {expanded && (
                <div className="min-w-0 text-left">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs capitalize text-muted-foreground">{user.role}</p>
                </div>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent side={expanded ? "top" : "right"} align="start" sideOffset={8} className="w-56 p-2">
            <p className="text-xs font-medium text-muted-foreground px-2 pb-2">Logged in as</p>
            {availableUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => { switchUser(u.id); navigate("/"); }}
                className={cn(
                  "flex items-center gap-2.5 w-full rounded-md px-2 py-2 text-sm transition-colors text-left",
                  u.id === user.id ? "bg-accent/10 text-foreground font-medium" : "text-foreground hover:bg-secondary"
                )}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sidebar-accent text-[10px] font-bold text-sidebar-accent-foreground shrink-0">
                  {u.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <span className="truncate flex-1">{u.name}</span>
                {u.id === user.id && <Check className="h-3.5 w-3.5 text-accent shrink-0" />}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      </div>
    </aside>
  );
}

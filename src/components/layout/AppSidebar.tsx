import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Target,
  MessageSquare,
  Drama,
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
  Layers,
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
import learningSpacesIcon from "@/assets/learning-spaces.svg";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  roles: Array<"learner" | "manager" | "admin">;
  children?: { label: string; path: string; icon: React.ElementType }[];
}

const navItems: NavItem[] = [
  {
    label: "New Chat",
    path: "/manager",
    icon: Building2,
    roles: ["manager", "admin"],
    children: [
      { label: "Chat", path: "/manager", icon: MessageSquare },
      { label: "Role Play", path: "/manager/role-play", icon: Drama },
      { label: "Learning Paths", path: "/manager/skill-targets", icon: Target },
      { label: "Programs", path: "/manager/programs", icon: Layers },
      { label: "Team Insights", path: "/team-insights", icon: BarChart3 },
    ],
  },
  {
    label: "Learning Spaces",
    path: "/",
    icon: LayoutDashboard,
    roles: ["learner", "manager", "admin"],
    children: [
      { label: "Skill Targets", path: "/", icon: Target },
      { label: "Role Play", path: "/role-play-bank", icon: Drama },
    ],
  },
  { label: "My 360", path: "/my-360", icon: CircleUser, roles: ["learner", "admin"] },
  { label: "Admin", path: "/admin", icon: Shield, roles: ["admin"] },
];

export function AppSidebar() {
  const { user, switchUser, setRole, availableUsers } = useUser();
  const { expanded, toggle } = useSidebarState();
  const { theme, toggleTheme, styleTheme, setStyleTheme, superLight, setSuperLight } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [learningSpacesOpen, setLearningSpacesOpen] = useState(true);
  const [managerOpen, setManagerOpen] = useState(true);
  const [brandHovered, setBrandHovered] = useState(false);
  const [viewMode, setViewMode] = useState<"me" | "team">("me");

  const filteredItems = navItems.filter((item) => {
    if (!item.roles.includes(user.role)) return false;
    // Hide Learning Spaces in team/manager mode
    if (item.label === "Learning Spaces" && viewMode === "team") return false;
    return true;
  });

  const isTraditional = styleTheme === "traditional";

  const isPathActive = (path: string) => {
    if (path === "/" || path === "/manager") return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  /* ── Traditional theme sidebar ── */
  if (isTraditional) {
    return (
      <div className="fixed left-0 top-0 z-40 h-screen flex flex-col pl-3 pt-3 pb-3">
        {/* Logo — outside the nav bar */}
        <div className={cn(
          "flex items-center gap-2 px-3 py-3",
          expanded ? "w-56" : "w-[58px] justify-center"
        )}>
          {expanded ? (
            <div className="flex items-center gap-2 w-full justify-between">
              <div className="flex items-center gap-2">
                <img src={cornerstoneLogo} alt="Cornerstone" className="h-6 w-6 object-contain" />
                <span className="font-display font-bold text-sm text-foreground">cornerstone</span>
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

        {/* Nav bar strip — floating with border */}
        <aside className={cn(
          "flex-1 flex flex-col bg-[hsl(260_30%_97%)] border border-border/60 shadow-sm rounded-2xl transition-all duration-200 overflow-hidden",
          expanded ? "w-56 items-stretch" : "w-[58px] items-center"
        )}>
          {/* Me / Team toggle */}
          {user.canManage && (
            expanded ? (
              <div className="px-4 pt-4 pb-2">
                <div className="flex bg-muted rounded-full p-0.5">
                  <button
                    onClick={() => { setViewMode("me"); setRole("learner"); navigate("/"); }}
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
                    onClick={() => { setViewMode("team"); setRole("manager"); navigate("/manager"); }}
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
                      onClick={() => {
                        if (viewMode === "me") { setViewMode("team"); setRole("manager"); navigate("/manager"); }
                        else { setViewMode("me"); setRole("learner"); navigate("/"); }
                      }}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                        viewMode === "team"
                          ? "bg-primary text-primary-foreground"
                          : "bg-white/60 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {viewMode === "team" ? <UsersRound className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>{viewMode === "me" ? "Switch to Team" : "Switch to Me"}</TooltipContent>
                </Tooltip>
              </div>
            )
          )}

          {/* Navigation */}
          <nav className={cn("flex-1 flex flex-col gap-1.5 py-4 w-full", expanded ? "px-3" : "px-2 items-center")}>
            {filteredItems.map((item) => {
              if (item.children) {
                const isLearningSpaces = item.label === "Learning Spaces";
                const groupOpen = isLearningSpaces ? learningSpacesOpen : managerOpen;
                const toggleGroup = () => isLearningSpaces ? setLearningSpacesOpen(!learningSpacesOpen) : setManagerOpen(!managerOpen);

                if (expanded) {
                  return (
                    <div key={item.label} className="mb-1">
                      <button
                        onClick={toggleGroup}
                        className="flex items-center gap-3 w-full px-3 h-9 text-muted-foreground hover:text-foreground hover:bg-white/60 rounded-lg transition-colors"
                      >
                        {isLearningSpaces ? (
                          <img src={learningSpacesIcon} alt="" className="h-4 w-4 shrink-0 opacity-60" />
                        ) : (
                          <item.icon className="h-4 w-4 shrink-0 opacity-60" />
                        )}
                        <span className="text-sm font-medium truncate flex-1 text-left">{item.label}</span>
                        {groupOpen ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                      </button>
                      {groupOpen && (
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
                                    ? "bg-white/70 text-primary shadow-sm"
                                    : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
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
                // Collapsed: show parent icon
                const anyChildActive = item.children.some((c) => isPathActive(c.path));
                const parentLink = (
                  <button
                    key={item.label}
                    onClick={() => { navigate(item.children![0].path); }}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200",
                      anyChildActive
                        ? "bg-white/70 text-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
                    )}
                  >
                    {isLearningSpaces ? (
                      <img src={learningSpacesIcon} alt="" className="h-[18px] w-[18px] opacity-70" />
                    ) : (
                      <item.icon className="h-[18px] w-[18px] opacity-70" />
                    )}
                  </button>
                );
                return (
                  <Tooltip key={item.label} delayDuration={0}>
                    <TooltipTrigger asChild>{parentLink}</TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>{item.label}</TooltipContent>
                  </Tooltip>
                );
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
                        ? "bg-white/70 text-primary shadow-sm"
                        : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
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
                      "flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200",
                      active
                        ? "bg-white/70 text-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
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
                className="flex items-center gap-3 w-full px-3 h-9 rounded-lg text-muted-foreground hover:bg-white/50 hover:text-foreground transition-colors text-sm font-medium"
              >
                {theme === "dark" ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
                <span>Dark mode</span>
              </button>
            ) : (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleTheme}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-white/50 hover:text-foreground transition-colors"
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
                      "flex items-center rounded-lg transition-all duration-200 text-muted-foreground hover:bg-white/50 hover:text-foreground",
                      expanded ? "h-9 gap-3 w-full px-3" : "h-9 w-9 justify-center rounded-full"
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
                      <p className="text-xs text-muted-foreground truncate">{user.title || user.role}</p>
                    </div>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent side={expanded ? "top" : "right"} align="start" sideOffset={8} className="w-64 p-2">
                <p className="text-xs font-medium text-muted-foreground px-2 pb-2">Switch profile</p>
                {availableUsers.map((u) => {
                  const isActive = u.id === user.id;
                  return (
                    <button
                      key={u.id}
onClick={() => { switchUser(u.id); if (u.canManage && viewMode === "team") { setRole("manager"); navigate("/manager"); } else { setRole("learner"); setViewMode("me"); navigate("/"); } }}
                      className={cn(
                        "flex items-center gap-2.5 w-full rounded-md px-2 py-2 text-sm transition-colors text-left",
                        isActive ? "bg-primary/10 text-foreground font-medium" : "text-foreground hover:bg-secondary"
                      )}
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shrink-0">
                        {u.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm truncate">{u.name}</p>
                          {u.canManage && <Shield className="h-3 w-3 text-primary shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{u.title}</p>
                      </div>
                      {isActive && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                    </button>
                  );
                })}
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
      <div className={cn("flex items-center border-b border-sidebar-border w-full min-h-[72px] py-5", expanded ? "justify-between px-4" : "justify-center")}>
        {expanded ? (
          <>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0">
                <img src={cornerstoneLogo} alt="Cornerstone" className="h-6 w-6 object-contain" />
              </div>
              <span className="font-display font-bold text-sm text-sidebar-foreground">cornerstone</span>
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
              <div className="flex h-9 w-9 items-center justify-center rounded-lg">
                <img src={cornerstoneLogo} alt="Cornerstone" className="h-6 w-6 object-contain" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Me / Team toggle for New UI */}
      {user.canManage && (
        <div className={cn("w-full pt-3", expanded ? "px-3 pb-2" : "flex justify-center pb-2")}>
          {expanded ? (
            <div className="flex bg-sidebar-accent/50 rounded-full p-0.5">
              <button
                onClick={() => { setViewMode("me"); setRole("learner"); navigate("/"); }}
                className={cn(
                  "flex items-center justify-center gap-1.5 flex-1 rounded-full py-1.5 text-xs font-medium transition-all",
                  viewMode === "me"
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
                )}
              >
                <UserRound className="h-3.5 w-3.5" />
                Me
              </button>
              <button
                onClick={() => { setViewMode("team"); setRole("manager"); navigate("/manager"); }}
                className={cn(
                  "flex items-center justify-center gap-1.5 flex-1 rounded-full py-1.5 text-xs font-medium transition-all",
                  viewMode === "team"
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
                )}
              >
                <UsersRound className="h-3.5 w-3.5" />
                Team
              </button>
            </div>
          ) : (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    if (viewMode === "me") { setViewMode("team"); setRole("manager"); navigate("/manager"); }
                    else { setViewMode("me"); setRole("learner"); navigate("/"); }
                  }}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                    viewMode === "team"
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "bg-sidebar-accent/50 text-sidebar-foreground/60 hover:text-sidebar-foreground"
                  )}
                >
                  {viewMode === "team" ? <UsersRound className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>{viewMode === "me" ? "Switch to Team" : "Switch to Me"}</TooltipContent>
            </Tooltip>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className={cn("flex-1 flex flex-col gap-0.5 py-4 w-full", expanded ? "px-3" : "px-2 items-center")}>
        {filteredItems.map((item) => {
          if (item.children) {
            const isLearningSpaces = item.label === "Learning Spaces";
            const groupOpen = isLearningSpaces ? learningSpacesOpen : managerOpen;
            const toggleGroup = () => isLearningSpaces ? setLearningSpacesOpen(!learningSpacesOpen) : setManagerOpen(!managerOpen);

            if (expanded) {
              return (
                <div key={item.label} className="mb-1">
                  <button
                    onClick={toggleGroup}
                    className="flex items-center gap-3 w-full px-3 h-9 text-sidebar-foreground/70 hover:bg-sidebar-accent/50 rounded-lg transition-colors"
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="text-sm font-medium truncate flex-1 text-left">{item.label}</span>
                    {groupOpen ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                  {groupOpen && (
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
            {!isTraditional ? (
              <>
                <button
                  onClick={() => { if (theme === "dark") toggleTheme(); setSuperLight(true); }}
                  className={cn("flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm transition-colors", theme !== "dark" && superLight ? "bg-accent/10 font-medium" : "hover:bg-secondary")}
                >
                  <Sun className="h-3.5 w-3.5" />
                  <span className="flex-1 text-left">Super Light</span>
                  {theme !== "dark" && superLight && <Check className="h-3.5 w-3.5 text-accent shrink-0" />}
                </button>
                <button
                  onClick={() => { if (theme === "dark") toggleTheme(); setSuperLight(false); }}
                  className={cn("flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm transition-colors", theme !== "dark" && !superLight ? "bg-accent/10 font-medium" : "hover:bg-secondary")}
                >
                  <Sun className="h-3.5 w-3.5" />
                  <span className="flex-1 text-left">Light</span>
                  {theme !== "dark" && !superLight && <Check className="h-3.5 w-3.5 text-accent shrink-0" />}
                </button>
                <button
                  onClick={() => { if (theme !== "dark") toggleTheme(); }}
                  className={cn("flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm transition-colors", theme === "dark" ? "bg-accent/10 font-medium" : "hover:bg-secondary")}
                >
                  <Moon className="h-3.5 w-3.5" />
                  <span className="flex-1 text-left">Dark</span>
                  {theme === "dark" && <Check className="h-3.5 w-3.5 text-accent shrink-0" />}
                </button>
              </>
            ) : (
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm hover:bg-secondary transition-colors"
              >
                {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
              </button>
            )}
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
                  <p className="text-xs text-muted-foreground truncate">{user.title || user.role}</p>
                </div>
              )}
            </button>
          </PopoverTrigger>
           <PopoverContent side={expanded ? "top" : "right"} align="start" sideOffset={8} className="w-64 p-2">
            <p className="text-xs font-medium text-muted-foreground px-2 pb-2">Switch profile</p>
            {availableUsers.map((u) => {
              const isActive = u.id === user.id;
              return (
                <button
                  key={u.id}
                  onClick={() => { switchUser(u.id); if (u.canManage && viewMode === "team") { setRole("manager"); navigate("/manager"); } else { setRole("learner"); setViewMode("me"); navigate("/"); } }}
                  className={cn(
                    "flex items-center gap-2.5 w-full rounded-md px-2 py-2 text-sm transition-colors text-left",
                    isActive ? "bg-accent/10 text-foreground font-medium" : "text-foreground hover:bg-secondary"
                  )}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sidebar-accent text-[10px] font-bold text-sidebar-accent-foreground shrink-0">
                    {u.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm truncate">{u.name}</p>
                      {u.canManage && <Shield className="h-3 w-3 text-accent shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{u.title}</p>
                  </div>
                  {isActive && <Check className="h-3.5 w-3.5 text-accent shrink-0" />}
                </button>
              );
            })}
          </PopoverContent>
        </Popover>
      </div>
    </aside>
  );
}

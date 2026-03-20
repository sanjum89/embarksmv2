import { useState, useCallback } from "react";
import { Loader2, LogOut, LogIn } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Target,
  MessageSquare,
  Drama,
  Shield,
  BarChart3,
  Bot,
  CircleUser,
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
import { useAccount } from "@/contexts/AccountContext";
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
import { AccountSwitcher } from "@/components/account/AccountSwitcher";
import { LoginDialog } from "@/components/layout/LoginDialog";

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
    path: "/chat",
    icon: MessageSquare,
    roles: ["learner"],
  },
  {
    label: "AI Manager",
    path: "/ai-manager",
    icon: Bot,
    roles: ["learner"],
  },
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
  const { user, switchUser, setRole, availableUsers, signedInUserIds, loginUser, logoutUser } = useUser();
  const { activeAccount } = useAccount();
  const { expanded, toggle } = useSidebarState();
  const { theme, toggleTheme, styleTheme, setStyleTheme, superLight, setSuperLight } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [learningSpacesOpen, setLearningSpacesOpen] = useState(true);
  const [managerOpen, setManagerOpen] = useState(true);
  
  // Store the user's original base role so team mode doesn't overwrite admin → manager
  const baseRole = availableUsers.find((u) => u.id === user.id)?.role ?? user.role;
  const teamRole = baseRole === "admin" ? "admin" : "manager";

  const [viewMode, setViewMode] = useState<"me" | "team">("me");
  const [switchingProfile, setSwitchingProfile] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  const handleLogin = (userId: string) => {
    setSwitchingProfile(true);
    setTimeout(() => {
      loginUser(userId);
      const u = availableUsers.find((x) => x.id === userId);
      if (u?.canManage && viewMode === "team") {
        const loginTeamRole = u.role === "admin" ? "admin" : "manager";
        setRole(loginTeamRole);
        navigate("/manager");
      } else {
        setRole("learner");
        setViewMode("me");
        navigate("/");
      }
      setSwitchingProfile(false);
    }, 1000);
  };

  const handleLogout = (userId: string) => {
    logoutUser(userId);
  };

  const effectiveRole = viewMode === "me" ? "learner" : user.role === "admin" ? "admin" : "manager";

  const filteredItems = navItems.filter((item) => {
    if (!item.roles.includes(effectiveRole)) return false;
    // Hide Learning Spaces in team/manager mode
    if (item.label === "Learning Spaces" && viewMode === "team") return false;
    // Hide learner New Chat in team mode (it has no children and path=/chat)
    if (item.path === "/chat" && viewMode === "team") return false;
    if (item.path === "/ai-manager" && viewMode === "team") return false;
    // Hide manager New Chat in me mode
    if (item.path === "/manager" && viewMode === "me") return false;
    return true;
  });

  const isTraditional = styleTheme === "traditional";

  const isPathActive = (path: string) => {
    if (path === "/" || path === "/manager" || path === "/chat") return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  /* ── Traditional theme sidebar ── */
  if (isTraditional) {
    return (
      <>
      <div className="fixed left-0 top-0 z-40 h-screen flex flex-col pl-3 pt-3 pb-3">
        {/* Logo + Account Switcher — outside the nav bar */}
        <div className={cn(
          "flex flex-col px-3 py-3",
          expanded ? "w-56" : "w-[58px]"
        )}>
          <AccountSwitcher expanded={expanded} onToggleSidebar={toggle} variant="traditional" />
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
                            const childLabel = child.label;
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
                {theme === "light" ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
                <span>{theme === "light" ? "Light mode" : "Dark mode"}</span>
              </button>
            ) : (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleTheme}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-white/50 hover:text-foreground transition-colors"
                  >
                    {theme === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>{theme === "light" ? "Switch to dark mode" : "Switch to light mode"}</TooltipContent>
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
                {availableUsers
                  .filter((u) => signedInUserIds.includes(u.id))
                  .map((u) => {
                  const isActive = u.id === user.id;
                  const isSignedIn = signedInUserIds.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        if (!isSignedIn || isActive || switchingProfile) return;
                        setSwitchingProfile(true);
                        setTimeout(() => {
                          switchUser(u.id);
                          if (u.canManage && viewMode === "team") { setRole("manager"); navigate("/manager"); }
                          else { setRole("learner"); setViewMode("me"); navigate("/"); }
                          setSwitchingProfile(false);
                        }, 1000);
                      }}
                      className={cn(
                        "flex items-center gap-2.5 w-full rounded-md px-2 py-2 text-sm transition-colors text-left",
                        isActive ? "bg-primary/10 text-foreground font-medium" : isSignedIn ? "text-foreground hover:bg-secondary" : "text-muted-foreground/50 cursor-default"
                      )}
                    >
                      <div className={cn("flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold shrink-0", isSignedIn ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                        {u.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm truncate">{u.name}</p>
                          {u.canManage && <Shield className={cn("h-3 w-3 shrink-0", isSignedIn ? "text-primary" : "text-muted-foreground/40")} />}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{u.title}</p>
                        {isSignedIn && (
                          <p className="text-[10px] text-emerald-500 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                            Signed in
                          </p>
                        )}
                      </div>
                      {isActive && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                      {isSignedIn && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleLogout(u.id); }}
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title="Sign out"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </button>
                  );
                })}
                <Separator className="my-1.5" />
                <button
                  onClick={() => setLoginDialogOpen(true)}
                  className="flex items-center gap-2 w-full rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Login as different user
                </button>
              </PopoverContent>
            </Popover>
          </div>
        </aside>
      </div>
      {switchingProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">Switching profile…</p>
          </div>
        </div>
      )}
      <LoginDialog
        open={loginDialogOpen}
        onOpenChange={setLoginDialogOpen}
        availableUsers={availableUsers}
        signedInUserIds={signedInUserIds}
        onLogin={handleLogin}
      />
      </>
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
    <>
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-200",
        expanded ? "w-56" : "w-16",
        expanded ? "items-stretch" : "items-center"
      )}
    >
      {/* Brand + toggle */}
      <div className={cn("flex flex-col border-b border-sidebar-border w-full", expanded ? "px-4 py-4" : "items-center py-4")}>
        <AccountSwitcher expanded={expanded} onToggleSidebar={toggle} variant="new" />
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

      {/* Mode toggle — Super Light / Light / Dark */}
      <div className={cn("w-full", expanded ? "px-3" : "flex flex-col items-center gap-1")}>
        {expanded ? (
          <button
            onClick={() => {
              // Cycle: Super Light → Light → Dark → Super Light
              if (theme !== "dark" && superLight) { setSuperLight(false); }
              else if (theme !== "dark" && !superLight) { toggleTheme(); }
              else { toggleTheme(); setSuperLight(true); }
            }}
            className="flex items-center gap-2 w-full px-3 h-9 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors text-sm font-medium mb-1"
          >
            {theme === "dark" ? <Moon className="h-4 w-4 shrink-0" /> : <Sun className="h-4 w-4 shrink-0" />}
            <span>{theme === "dark" ? "Dark mode" : superLight ? "Super Light" : "Light mode"}</span>
          </button>
        ) : (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  // Cycle: Super Light → Light → Dark → Super Light
                  if (theme !== "dark" && superLight) { setSuperLight(false); }
                  else if (theme !== "dark" && !superLight) { toggleTheme(); }
                  else { toggleTheme(); setSuperLight(true); }
                }}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors"
              >
                {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {theme === "dark" ? "Dark mode" : superLight ? "Super Light mode" : "Light mode"}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Theme style switcher (UI only) */}
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
            {availableUsers
              .filter((u) => signedInUserIds.includes(u.id))
              .map((u) => {
              const isActive = u.id === user.id;
              const isSignedIn = signedInUserIds.includes(u.id);
              return (
                <button
                  key={u.id}
                  onClick={() => {
                    if (!isSignedIn || isActive || switchingProfile) return;
                    setSwitchingProfile(true);
                    setTimeout(() => {
                      switchUser(u.id);
                      if (u.canManage && viewMode === "team") { setRole("manager"); navigate("/manager"); }
                      else { setRole("learner"); setViewMode("me"); navigate("/"); }
                      setSwitchingProfile(false);
                    }, 1000);
                  }}
                  className={cn(
                    "flex items-center gap-2.5 w-full rounded-md px-2 py-2 text-sm transition-colors text-left",
                    isActive ? "bg-accent/10 text-foreground font-medium" : isSignedIn ? "text-foreground hover:bg-secondary" : "text-muted-foreground/50 cursor-default"
                  )}
                >
                  <div className={cn("flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold shrink-0", isSignedIn ? "bg-sidebar-accent text-sidebar-accent-foreground" : "bg-muted text-muted-foreground")}>
                    {u.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm truncate">{u.name}</p>
                      {u.canManage && <Shield className={cn("h-3 w-3 shrink-0", isSignedIn ? "text-accent" : "text-muted-foreground/40")} />}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{u.title}</p>
                    {isSignedIn && (
                      <p className="text-[10px] text-emerald-500 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                        Signed in
                      </p>
                    )}
                  </div>
                  {isActive && <Check className="h-3.5 w-3.5 text-accent shrink-0" />}
                  {isSignedIn && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleLogout(u.id); }}
                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      title="Sign out"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                    </button>
                  )}
                </button>
              );
            })}
            <Separator className="my-1.5" />
            <button
              onClick={() => setLoginDialogOpen(true)}
              className="flex items-center gap-2 w-full rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <LogIn className="h-3.5 w-3.5" />
              Login as different user
            </button>
          </PopoverContent>
        </Popover>
      </div>
    </aside>
    {switchingProfile && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-foreground">Switching profile…</p>
        </div>
      </div>
    )}
    <LoginDialog
      open={loginDialogOpen}
      onOpenChange={setLoginDialogOpen}
      availableUsers={availableUsers}
      signedInUserIds={signedInUserIds}
      onLogin={handleLogin}
    />
    </>
  );
}



## Fix Menu Structure & Move Dev Toggle

### Issues Found
1. **Team Mode**: People Graph is currently inside "Manage Learning" group — user wants it as a standalone top-level item between "Team Insights" and "New Chat"
2. **Dev toggle position**: Currently renders above Branding in the bottom settings area — should be below Branding in both themes

### Changes to `src/components/layout/AppSidebar.tsx`

**1. Update `teamNavItems` array (line 67-85)**

Move People Graph out of the Manage Learning children to be a standalone item:

```tsx
const teamNavItems: NavItem[] = [
  { label: "Admin", path: "/admin", icon: Shield },
  { label: "Team Dashboard", path: "/team-dashboard", icon: LayoutDashboard, dev: true },
  { label: "Team Insights", path: "/team-insights", icon: BarChart3, dev: true },
  { label: "People Graph", path: "/manager/people-graph", icon: GitGraph },
  { label: "New Chat", path: "/chat", icon: MessageSquare },
  {
    label: "Manage Learning",
    path: "/manager/skill-targets",
    icon: Building2,
    children: [
      { label: "Skill Targets", path: "/manager/skill-targets", icon: Target },
      { label: "Role Play", path: "/manager/role-play", icon: Drama },
      { label: "Cohorts", path: "/manager/cohorts", icon: Layers },
    ],
  },
  { label: "Action Centre", path: "/my-inbox", icon: Inbox },
  { label: "My 360", path: "/my-360", icon: CircleUser },
];
```

**2. Move Dev toggle below Branding** in both Traditional and New theme bottom sections — swap the order so it renders after the Branding panel.


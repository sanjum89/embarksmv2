import { useMemo, useState } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { Palette, Layout, Paintbrush, Code, Info, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/layout/PageHeader";
import { useTheme } from "@/contexts/ThemeContext";
import { useUser } from "@/contexts/UserContext";
import { useAgentOne } from "@/contexts/AgentOneContext";
import { BrandingPanelContent } from "@/components/account/BrandingPanel";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type SectionKey = "appearance" | "workspace" | "branding" | "developer" | "about";

interface SectionDef {
  key: SectionKey;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const SECTIONS: SectionDef[] = [
  { key: "appearance", label: "Appearance", icon: Palette },
  { key: "workspace", label: "Workspace", icon: Layout },
  { key: "branding", label: "Branding", icon: Paintbrush },
  { key: "developer", label: "Developer", icon: Code, adminOnly: true },
  { key: "about", label: "About", icon: Info },
];

export default function Settings() {
  const [params, setParams] = useSearchParams();
  const { user } = useUser();
  const isAdmin = user.role === "admin";

  const requested = (params.get("section") as SectionKey) || "appearance";
  const validKeys = SECTIONS.filter((s) => !s.adminOnly || isAdmin).map((s) => s.key);
  const active: SectionKey = (validKeys as string[]).includes(requested) ? requested : "appearance";

  // If a non-admin lands on developer directly, redirect to 404.
  if (requested === "developer" && !isAdmin) {
    return <Navigate to="/404" replace />;
  }

  const setActive = (key: SectionKey) => {
    const next = new URLSearchParams(params);
    next.set("section", key);
    setParams(next, { replace: true });
  };

  const visibleSections = useMemo(
    () => SECTIONS.filter((s) => !s.adminOnly || isAdmin),
    [isAdmin]
  );

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title="Settings"
        breadcrumbs={[
          { label: "Settings" },
          { label: visibleSections.find((s) => s.key === active)?.label ?? "" },
        ]}
      />
      <div className="flex-1 container mx-auto px-4 py-6 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
          {/* Section list */}
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible md:sticky md:top-20 md:self-start">
            {visibleSections.map((s) => {
              const Icon = s.icon;
              const isActive = s.key === active;
              return (
                <button
                  key={s.key}
                  onClick={() => setActive(s.key)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap text-left",
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {s.label}
                </button>
              );
            })}
          </nav>

          {/* Active section */}
          <div className="space-y-6 min-w-0">
            {active === "appearance" && <AppearanceSection />}
            {active === "workspace" && <WorkspaceSection />}
            {active === "branding" && <BrandingSection />}
            {active === "developer" && isAdmin && <DeveloperSection />}
            {active === "about" && <AboutSection />}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Sections ---------------- */

function AppearanceSection() {
  const { theme, toggleTheme, superLight, setSuperLight, styleTheme, setStyleTheme } = useTheme();

  type Mode = "light" | "dark" | "super-light";
  const current: Mode = theme === "dark" ? "dark" : superLight ? "super-light" : "light";

  const setMode = (m: Mode) => {
    if (m === "dark") {
      if (theme !== "dark") toggleTheme();
    } else if (m === "light") {
      if (theme === "dark") toggleTheme();
      setSuperLight(false);
    } else {
      if (theme === "dark") toggleTheme();
      setSuperLight(true);
    }
  };

  const modes: { id: Mode; label: string; desc: string }[] = [
    { id: "light", label: "Light", desc: "Standard light theme" },
    { id: "dark", label: "Dark", desc: "Reduced glare in low light" },
    { id: "super-light", label: "Super Light", desc: "Maximum brightness, minimal chrome" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme</CardTitle>
        <CardDescription>Choose how the interface looks.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                "text-left rounded-lg border p-3 transition-all",
                current === m.id ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:bg-muted/40"
              )}
            >
              <div className="text-sm font-medium">{m.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{m.desc}</div>
            </button>
          ))}
        </div>

        <Separator />

        <div>
          <Label className="text-sm font-medium">Interface version</Label>
          <p className="text-xs text-muted-foreground mb-3">Switch between the redesigned and the traditional layout.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {([
              { id: "new", label: "New", desc: "Modern Embark layout" },
              { id: "traditional", label: "Traditional", desc: "Legacy layout and chrome" },
            ] as const).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setStyleTheme(opt.id)}
                className={cn(
                  "text-left rounded-lg border p-3 transition-all",
                  styleTheme === opt.id ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:bg-muted/40"
                )}
              >
                <div className="text-sm font-medium">{opt.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WorkspaceSection() {
  const { showLegacyModules, setShowLegacyModules } = useTheme();
  const agent = useAgentOne();

  const [confirming, setConfirming] = useState(false);

  const handleResetChat = () => {
    if (!confirming) { setConfirming(true); setTimeout(() => setConfirming(false), 3000); return; }
    setConfirming(false);
    try {
      // Clear known Agent One chat keys from localStorage.
      Object.keys(localStorage)
        .filter((k) => k.startsWith("agent-one-") || k.includes("chat-history"))
        .forEach((k) => localStorage.removeItem(k));
      agent?.handleReset?.();
      toast({ title: "Chat history cleared", description: "Agent One will start fresh next time." });
    } catch (e: any) {
      toast({ title: "Couldn't clear chat", description: String(e?.message ?? e), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Legacy modules</CardTitle>
          <CardDescription>Show the legacy Skill Targets, Learning Spaces and Manager pages in the sidebar.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Show legacy modules in sidebar</Label>
              <p className="text-xs text-muted-foreground">Default is off. Useful when comparing legacy and new flows.</p>
            </div>
            <Switch checked={showLegacyModules} onCheckedChange={setShowLegacyModules} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agent One chat</CardTitle>
          <CardDescription>Clear the local chat history for Agent One.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant={confirming ? "destructive" : "outline"} onClick={handleResetChat}>
            {confirming ? "Click again to confirm reset" : "Reset Agent One chat history"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function BrandingSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Branding</CardTitle>
        <CardDescription>Account logos, colour presets and custom palettes.</CardDescription>
      </CardHeader>
      <CardContent>
        <BrandingPanelContent />
      </CardContent>
    </Card>
  );
}

function DeveloperSection() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const runReset = async () => {
    setRunning(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("reset-rathbones-demo", { body: {} });
      if (error) throw error;
      setResult(JSON.stringify(data, null, 2));
      toast({ title: "Rathbones demo reset complete", description: "Learner journeys re-seeded from persona specs." });
    } catch (e: any) {
      setResult(String(e?.message ?? e));
      toast({ title: "Reset failed", description: String(e?.message ?? e), variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset Rathbones learner state</CardTitle>
        <CardDescription>
          Wipes and re-seeds <code>learner_progress</code>, <code>assessment_instances</code>,{" "}
          <code>chapter_lock_events</code>, <code>micro_learnings</code> and <code>learner_analytics</code>{" "}
          for the 9 Rathbones personas (rb-l1..rb-l9). Walks each persona through the real assoc_im
          modules so Clara, Theo, Beth and Kofi log in mid-journey with the manager-dashboard story
          intact.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={runReset} disabled={running}>
          {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {running ? "Re-seeding…" : "Reset Rathbones demo"}
        </Button>
        {result && (
          <pre className="bg-muted rounded-md p-3 text-xs whitespace-pre-wrap break-words max-h-72 overflow-auto">
            {result}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}

function AboutSection() {
  const { user, signedInUserIds, availableUsers, logoutUser } = useUser();
  const signed = availableUsers.filter((u) => signedInUserIds.includes(u.id));
  return (
    <Card>
      <CardHeader>
        <CardTitle>About</CardTitle>
        <CardDescription>Account and session details.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <Label className="text-xs text-muted-foreground">Signed in as</Label>
          <p className="font-medium">{user.name} <span className="text-muted-foreground">· {user.title || user.role}</span></p>
        </div>
        <Separator />
        <div>
          <Label className="text-xs text-muted-foreground">Active sessions</Label>
          <ul className="mt-1 space-y-1">
            {signed.map((u) => (
              <li key={u.id} className="flex items-center justify-between">
                <span>{u.name} <span className="text-muted-foreground text-xs">· {u.role}</span></span>
                <Button variant="ghost" size="sm" onClick={() => logoutUser(u.id)}>Sign out</Button>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

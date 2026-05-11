import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChevronLeft, Search, Send, Inbox } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TeamAvatar } from "@/components/team-home/Avatar";
import { TeamsBadge } from "@/components/team-home/TeamsBadge";
import { useAccount } from "@/contexts/AccountContext";
import { getAllDemoOverlays } from "@/data/managerDemoOverlay";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultLearnerId?: string | null;
}

type Step = "recipients" | "template" | "send";

const TEMPLATES = [
  {
    id: "pulse",
    name: "Weekly pulse",
    description: "Quick wellbeing & blocker check.",
    subject: "Quick check-in",
    body: "Hi {first_name},\n\nHow's your week going? Anything blocking you on {module}? I've got 15 mins this week if it'd help to talk it through.\n\nThanks,\nJulian",
  },
  {
    id: "wellbeing",
    name: "Wellbeing",
    description: "Lighter touch — just checking they're ok.",
    subject: "Just checking in",
    body: "Hi {first_name},\n\nNo agenda — just wanted to check how you're doing. Let me know if there's anything on your mind.\n\nJulian",
  },
  {
    id: "nudge",
    name: "Module nudge",
    description: "Gentle prompt on a stalled module.",
    subject: "Nudge: {module}",
    body: "Hi {first_name},\n\nNoticed {module} has been paused for a bit. Anything I can help unblock? Happy to jump on a call.\n\nJulian",
  },
];

export function SendCheckInDialog({ open, onOpenChange, defaultLearnerId }: Props) {
  const { normalizedAccount } = useAccount();
  const employeesById = normalizedAccount?.employeesById ?? {};
  const overlays = useMemo(() => getAllDemoOverlays(), []);

  const cohort = useMemo(
    () =>
      overlays.map((o) => {
        const activeCell = o.cells.find((c) => c.status === "in_progress") ?? o.cells[0];
        return {
          id: o.employeeId,
          name: employeesById[o.employeeId]?.name || o.employeeId,
          title: employeesById[o.employeeId]?.title || "Learner",
          status: o.status,
          module: activeCell?.module_code ?? "your current module",
        };
      }),
    [overlays, employeesById]
  );

  const initialPicked = () => new Set<string>(defaultLearnerId ? [defaultLearnerId] : []);
  const [step, setStep] = useState<Step>(defaultLearnerId ? "template" : "recipients");
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<Set<string>>(initialPicked());
  const [templateId, setTemplateId] = useState(TEMPLATES[0].id);
  const [subject, setSubject] = useState(TEMPLATES[0].subject);
  const [body, setBody] = useState(TEMPLATES[0].body);
  const [channel, setChannel] = useState<"teams" | "inapp">("teams");

  const reset = () => {
    setStep(defaultLearnerId ? "template" : "recipients");
    setSearch("");
    setPicked(initialPicked());
    setTemplateId(TEMPLATES[0].id);
    setSubject(TEMPLATES[0].subject);
    setBody(TEMPLATES[0].body);
    setChannel("teams");
  };

  const handleClose = (o: boolean) => {
    onOpenChange(o);
    if (!o) setTimeout(reset, 200);
  };

  const toggle = (id: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const quickPick = (kind: "all" | "atRisk" | "rising") => {
    if (kind === "all") setPicked(new Set(cohort.map((c) => c.id)));
    else if (kind === "atRisk") setPicked(new Set(cohort.filter((c) => c.status === "at_risk" || c.status === "needs_check_in").map((c) => c.id)));
    else setPicked(new Set(cohort.filter((c) => c.status === "rising_star").map((c) => c.id)));
  };

  const filtered = cohort.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  const pickTemplate = (id: string) => {
    setTemplateId(id);
    const t = TEMPLATES.find((x) => x.id === id)!;
    setSubject(t.subject);
    setBody(t.body);
  };

  const send = () => {
    const n = picked.size;
    toast.success(`Check-in sent to ${n} learner${n === 1 ? "" : "s"} via ${channel === "teams" ? "Teams" : "in-app inbox"} (demo)`);
    handleClose(false);
  };

  const titleByStep: Record<Step, string> = {
    recipients: "Send a check-in",
    template: "Choose a template",
    send: "Review & send",
  };

  // Preview substitution against the first picked recipient
  const previewName = (() => {
    const id = picked.values().next().value as string | undefined;
    return id ? cohort.find((c) => c.id === id) : undefined;
  })();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl gap-0 p-0">
        <DialogHeader className="border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            {step !== "recipients" && !(step === "template" && defaultLearnerId) && (
              <Button variant="ghost" size="sm" className="-ml-2 h-7 px-2" onClick={() => setStep(step === "send" ? "template" : "recipients")}>
                <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Back
              </Button>
            )}
            <DialogTitle className="font-display text-base">{titleByStep[step]}</DialogTitle>
            <div className="ml-auto flex items-center gap-1.5">
              <TeamsBadge label="Microsoft Teams" />
            </div>
          </div>
          <DialogDescription className="sr-only">Send a check-in message to one or more cohort learners.</DialogDescription>
          <div className="mt-3 flex items-center gap-1.5">
            {(["recipients", "template", "send"] as Step[]).map((s, i) => (
              <div key={s} className={cn("h-1 flex-1 rounded-full", step === s ? "bg-primary" : i < ["recipients", "template", "send"].indexOf(step) ? "bg-primary/50" : "bg-muted")} />
            ))}
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
          {step === "recipients" && (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-1.5">
                <button type="button" onClick={() => quickPick("all")} className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-secondary/50">Whole cohort</button>
                <button type="button" onClick={() => quickPick("atRisk")} className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-700 hover:bg-amber-500/20 dark:text-amber-300">At-risk only</button>
                <button type="button" onClick={() => quickPick("rising")} className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300">Rising stars</button>
                <span className="ml-auto text-xs text-muted-foreground">{picked.size} selected</span>
              </div>
              <div className="relative mb-3">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search cohort…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 pl-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                {filtered.map((c) => {
                  const isPicked = picked.has(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggle(c.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg border border-transparent p-2 text-left transition-colors hover:border-border hover:bg-secondary/50",
                        isPicked && "border-primary bg-primary/5"
                      )}
                    >
                      <TeamAvatar name={c.name} size={32} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{c.title}</p>
                      </div>
                      {(c.status === "at_risk" || c.status === "needs_check_in") && (
                        <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-700 dark:text-amber-300">Needs attention</Badge>
                      )}
                      <div className={cn("h-4 w-4 rounded border", isPicked ? "border-primary bg-primary" : "border-border")}>
                        {isPicked && <span className="block text-[10px] font-bold leading-4 text-primary-foreground text-center">✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === "template" && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => pickTemplate(t.id)}
                    className={cn(
                      "rounded-lg border p-3 text-left transition-colors",
                      templateId === t.id ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/50"
                    )}
                  >
                    <p className="text-sm font-medium text-foreground">{t.name}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{t.description}</p>
                  </button>
                ))}
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium text-foreground">Subject</p>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="h-9 text-sm" />
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium text-foreground">Message</p>
                <Textarea rows={7} value={body} onChange={(e) => setBody(e.target.value)} className="text-sm" />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  <code className="rounded bg-muted px-1">{"{first_name}"}</code> and <code className="rounded bg-muted px-1">{"{module}"}</code> are auto-substituted per recipient.
                </p>
              </div>
            </div>
          )}

          {step === "send" && (
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-medium text-foreground">Recipients ({picked.size})</p>
                <div className="flex flex-wrap gap-1.5">
                  {[...picked].slice(0, 12).map((id) => {
                    const c = cohort.find((x) => x.id === id);
                    if (!c) return null;
                    return (
                      <div key={id} className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/40 py-0.5 pl-0.5 pr-2">
                        <TeamAvatar name={c.name} size={20} />
                        <span className="text-xs text-foreground">{c.name}</span>
                      </div>
                    );
                  })}
                  {picked.size > 12 && (
                    <span className="self-center text-xs text-muted-foreground">+{picked.size - 12} more</span>
                  )}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-foreground">Channel</p>
                <RadioGroup value={channel} onValueChange={(v) => setChannel(v as "teams" | "inapp")} className="grid grid-cols-2 gap-2">
                  <label className={cn("flex cursor-pointer items-start gap-2 rounded-lg border p-3", channel === "teams" ? "border-primary bg-primary/5" : "border-border")}>
                    <RadioGroupItem value="teams" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-foreground">Teams chat</p>
                        <TeamsBadge />
                      </div>
                      <p className="text-[11px] text-muted-foreground">Sends a 1:1 chat in Microsoft Teams.</p>
                    </div>
                  </label>
                  <label className={cn("flex cursor-pointer items-start gap-2 rounded-lg border p-3", channel === "inapp" ? "border-primary bg-primary/5" : "border-border")}>
                    <RadioGroupItem value="inapp" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-foreground">In-app inbox</p>
                        <Inbox className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <p className="text-[11px] text-muted-foreground">Appears in their Action Centre.</p>
                    </div>
                  </label>
                </RadioGroup>
              </div>

              <div className="rounded-lg border border-border bg-secondary/20 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Preview {previewName ? `· ${previewName.name}` : ""}</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {subject.replace("{module}", previewName?.module ?? "your current module")}
                </p>
                <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">
                  {body
                    .replace(/\{first_name\}/g, previewName?.name.split(" ")[0] ?? "there")
                    .replace(/\{module\}/g, previewName?.module ?? "your current module")}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border px-6 py-3">
          <Button variant="ghost" onClick={() => handleClose(false)}>Cancel</Button>
          {step === "recipients" && (
            <Button disabled={picked.size === 0} onClick={() => setStep("template")}>
              Continue ({picked.size})
            </Button>
          )}
          {step === "template" && (
            <Button onClick={() => setStep("send")}>Continue</Button>
          )}
          {step === "send" && (
            <Button onClick={send}>
              <Send className="mr-1.5 h-4 w-4" />
              Send to {picked.size}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

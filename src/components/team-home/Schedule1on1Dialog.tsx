import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, Search, CalendarPlus, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TeamAvatar } from "@/components/team-home/Avatar";
import { TeamsBadge } from "@/components/team-home/TeamsBadge";
import { useAccount } from "@/contexts/AccountContext";
import { getAllDemoOverlays } from "@/data/managerDemoOverlay";
import { getAvailability, type Slot } from "@/data/teamsAvailability";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultLearnerId?: string | null;
}

type Step = "learner" | "time" | "confirm";

export function Schedule1on1Dialog({ open, onOpenChange, defaultLearnerId }: Props) {
  const { normalizedAccount } = useAccount();
  const employeesById = normalizedAccount?.employeesById ?? {};
  const overlays = useMemo(() => getAllDemoOverlays(), []);

  const cohort = useMemo(
    () =>
      overlays.map((o) => ({
        id: o.employeeId,
        name: employeesById[o.employeeId]?.name || o.employeeId,
        title: employeesById[o.employeeId]?.title || "Learner",
        risk: o.status === "needs_check_in" || o.status === "at_risk" ? "behind" : "on track",
      })),
    [overlays, employeesById]
  );

  const [step, setStep] = useState<Step>("learner");
  const [search, setSearch] = useState("");
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [pickedSlot, setPickedSlot] = useState<{ dayIdx: number; time: string } | null>(null);
  const [onlyFree, setOnlyFree] = useState(true);
  const [duration, setDuration] = useState(30);
  const [agenda, setAgenda] = useState("");
  const [sendViaTeams, setSendViaTeams] = useState(true);

  const picked = cohort.find((c) => c.id === pickedId);
  const availability = useMemo(() => (pickedId ? getAvailability(pickedId) : []), [pickedId]);

  const reset = () => {
    setStep("learner");
    setSearch("");
    setPickedId(null);
    setPickedSlot(null);
    setOnlyFree(true);
    setDuration(30);
    setAgenda("");
    setSendViaTeams(true);
  };

  const handleClose = (o: boolean) => {
    onOpenChange(o);
    if (!o) setTimeout(reset, 200);
  };

  const filtered = cohort.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  const slotChip = (s: Slot) => {
    if (s.status === "free") return <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-700 dark:text-emerald-300">Free</Badge>;
    if (s.status === "tentative") return <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-700 dark:text-amber-300">Tentative</Badge>;
    return <Badge variant="outline" className="border-border bg-muted text-[10px] text-muted-foreground">Busy</Badge>;
  };

  const confirm = () => {
    if (!picked || !pickedSlot) return;
    const day = availability[pickedSlot.dayIdx];
    toast.success(`1:1 with ${picked.name} scheduled for ${day.label} ${day.dateLabel} • ${pickedSlot.time} (Teams · demo)`);
    handleClose(false);
  };

  const titleByStep: Record<Step, string> = {
    learner: "Schedule a 1:1",
    time: `Pick a time with ${picked?.name ?? ""}`,
    confirm: "Confirm details",
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl gap-0 p-0">
        <DialogHeader className="border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            {step !== "learner" && (
              <Button variant="ghost" size="sm" className="-ml-2 h-7 px-2" onClick={() => setStep(step === "confirm" ? "time" : "learner")}>
                <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Back
              </Button>
            )}
            <DialogTitle className="font-display text-base">{titleByStep[step]}</DialogTitle>
            <div className="ml-auto flex items-center gap-1.5">
              <TeamsBadge label="Microsoft Teams" />
            </div>
          </div>
          <DialogDescription className="sr-only">Schedule a one-to-one meeting with a cohort learner.</DialogDescription>
          {/* Step indicator */}
          <div className="mt-3 flex items-center gap-1.5">
            {(["learner", "time", "confirm"] as Step[]).map((s, i) => (
              <div key={s} className={cn("h-1 flex-1 rounded-full", step === s ? "bg-primary" : i < ["learner", "time", "confirm"].indexOf(step) ? "bg-primary/50" : "bg-muted")} />
            ))}
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
          {step === "learner" && (
            <>
              <div className="relative mb-3">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  autoFocus
                  placeholder="Search cohort…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 pl-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                {filtered.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { setPickedId(c.id); setStep("time"); }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border border-transparent p-2 text-left transition-colors hover:border-border hover:bg-secondary/50",
                      pickedId === c.id && "border-primary bg-primary/5"
                    )}
                  >
                    <TeamAvatar name={c.name} size={32} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{c.title}</p>
                    </div>
                    {c.risk === "behind" && (
                      <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-700 dark:text-amber-300">Needs attention</Badge>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === "time" && picked && (
            <>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <TeamsBadge /> <span>availability shown from {picked.name.split(" ")[0]}'s Teams calendar</span>
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                  <Switch checked={onlyFree} onCheckedChange={setOnlyFree} />
                  Free only
                </label>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {availability.map((day, dayIdx) => (
                  <div key={dayIdx} className="rounded-lg border border-border bg-background p-2">
                    <div className="mb-2 text-center">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{day.label}</p>
                      <p className="text-xs font-medium text-foreground">{day.dateLabel}</p>
                    </div>
                    <div className="space-y-1">
                      {day.slots
                        .filter((s) => (onlyFree ? s.status !== "busy" : true))
                        .map((s) => {
                          const isPicked = pickedSlot?.dayIdx === dayIdx && pickedSlot?.time === s.time;
                          const disabled = s.status === "busy";
                          return (
                            <button
                              key={s.time}
                              type="button"
                              disabled={disabled}
                              onClick={() => setPickedSlot({ dayIdx, time: s.time })}
                              title={s.meeting}
                              className={cn(
                                "flex w-full items-center justify-between gap-1 rounded-md border px-1.5 py-1 text-[11px] transition-colors",
                                disabled
                                  ? "cursor-not-allowed border-transparent text-muted-foreground/60"
                                  : "border-transparent hover:border-primary/40 hover:bg-primary/5",
                                isPicked && "border-primary bg-primary/10"
                              )}
                            >
                              <span className="font-medium tabular-nums">{s.time}</span>
                              {slotChip(s)}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {step === "confirm" && picked && pickedSlot && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-secondary/30 p-3">
                <div className="flex items-center gap-3">
                  <TeamAvatar name={picked.name} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">1:1 with {picked.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {availability[pickedSlot.dayIdx].label} {availability[pickedSlot.dayIdx].dateLabel} · {pickedSlot.time} · {duration} min
                    </p>
                  </div>
                  <TeamsBadge />
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-xs font-medium text-foreground">Duration</p>
                <div className="flex gap-1.5">
                  {[15, 30, 45, 60].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDuration(d)}
                      className={cn(
                        "rounded-md border px-3 py-1 text-xs",
                        duration === d ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary/50"
                      )}
                    >
                      {d} min
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-xs font-medium text-foreground">Agenda</p>
                <Textarea
                  rows={4}
                  placeholder="What do you want to cover?"
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  className="text-sm"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">Tip: include their current module and one specific question.</p>
              </div>

              <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Send invite via Teams</p>
                  <p className="text-xs text-muted-foreground">Adds to both calendars and posts a chat reminder.</p>
                </div>
                <Switch checked={sendViaTeams} onCheckedChange={setSendViaTeams} />
              </label>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border px-6 py-3">
          <Button variant="ghost" onClick={() => handleClose(false)}>Cancel</Button>
          {step === "time" && (
            <Button disabled={!pickedSlot} onClick={() => setStep("confirm")}>
              Continue
            </Button>
          )}
          {step === "confirm" && (
            <Button onClick={confirm}>
              {sendViaTeams ? <CalendarPlus className="mr-1.5 h-4 w-4" /> : <Check className="mr-1.5 h-4 w-4" />}
              {sendViaTeams ? "Schedule in Teams" : "Schedule"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

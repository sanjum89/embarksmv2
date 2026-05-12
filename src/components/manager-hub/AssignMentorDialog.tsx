import { useMemo, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, X, UserPlus, Hand } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAccount } from "@/contexts/AccountContext";
import { useUser } from "@/contexts/UserContext";
import { TeamAvatar } from "@/components/team-home/Avatar";
import { emitMentorAssignment } from "@/lib/agentOneEventEmitter";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentee: { employeeId: string; name: string; title?: string } | null;
  contextLabel?: string;
  prefillReason?: string;
  prefillFocusAreas?: string[];
  showResolveOption?: boolean;
  onAssigned?: (mentorEmployeeId: string, opts: { markResolved: boolean }) => void;
}

// Title-based seniority — higher = more senior.
function seniorityScore(title: string | undefined): number {
  const t = (title || "").toLowerCase();
  if (/(head|director|chief|partner)/.test(t)) return 5;
  if (/senior/.test(t)) return 4;
  if (/lead|principal/.test(t)) return 4;
  if (/manager/.test(t) && !/assistant|associate/.test(t)) return 3;
  if (/investment manager/.test(t)) return 3;
  if (/assistant|associate/.test(t)) return 1;
  if (/analyst|trainee|graduate/.test(t)) return 0;
  return 2;
}

export function AssignMentorDialog({
  open,
  onOpenChange,
  mentee,
  contextLabel,
  prefillReason,
  prefillFocusAreas,
  showResolveOption,
  onAssigned,
}: Props) {
  const { activeAccount, normalizedAccount } = useAccount();
  const { user } = useUser();

  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [newFocus, setNewFocus] = useState("");
  const [markResolved, setMarkResolved] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Reset form on open
  useEffect(() => {
    if (open) {
      setSearch("");
      setShowAll(false);
      setSelectedId(null);
      setReason(prefillReason || "");
      setFocusAreas(prefillFocusAreas?.filter(Boolean) ?? []);
      setNewFocus("");
      setMarkResolved(true);
      setSubmitting(false);
    }
  }, [open, prefillReason, prefillFocusAreas]);

  const employeesById = normalizedAccount?.employeesById ?? {};
  const menteeTitle = mentee?.title || (mentee && employeesById[mentee.employeeId]?.title) || "";
  const menteeSeniority = seniorityScore(menteeTitle);

  const candidates = useMemo(() => {
    if (!mentee) return [] as Array<{ id: string; name: string; title?: string; rationale: string; score: number }>;
    const all = Object.values(employeesById) as any[];
    const scored = all
      .filter((e) => e.id && e.id !== mentee.employeeId)
      .map((e) => {
        const sScore = seniorityScore(e.title);
        const sameDomain = !!menteeTitle && !!e.title && (
          /investment/i.test(menteeTitle) === /investment/i.test(e.title)
        );
        const seniorEnough = sScore > menteeSeniority;
        const rationaleParts: string[] = [];
        if (e.title) rationaleParts.push(e.title);
        if (sameDomain && /investment/i.test(menteeTitle)) rationaleParts.push("same desk");
        if (seniorEnough) rationaleParts.push("more senior");
        const rationale = rationaleParts.join(" · ");
        const score = sScore * 10 + (sameDomain ? 5 : 0) + (seniorEnough ? 3 : 0);
        return { id: e.id, name: e.name, title: e.title, rationale, score, seniorEnough, sameDomain };
      });

    let filtered = scored;
    if (!showAll) {
      const seniorOnly = scored.filter((c) => c.seniorEnough);
      filtered = seniorOnly.length >= 3 ? seniorOnly : scored;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((c) => c.name.toLowerCase().includes(q) || (c.title || "").toLowerCase().includes(q));
    }
    filtered.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
    return showAll ? filtered : filtered.slice(0, 8);
  }, [employeesById, mentee, menteeTitle, menteeSeniority, search, showAll]);

  const selected = candidates.find((c) => c.id === selectedId) ?? null;

  const addFocus = (val: string) => {
    const v = val.trim();
    if (!v) return;
    if (focusAreas.includes(v)) return;
    setFocusAreas([...focusAreas, v]);
    setNewFocus("");
  };

  const removeFocus = (val: string) => setFocusAreas(focusAreas.filter((f) => f !== val));

  const handleAssign = async () => {
    if (!mentee || !selected || !activeAccount?.id || !normalizedAccount) return;
    setSubmitting(true);
    try {
      const assignerId = (user as any)?.linkedEmployeeId || user?.id || "system";
      await emitMentorAssignment(
        selected.id,
        mentee.employeeId,
        assignerId,
        activeAccount.id,
        normalizedAccount,
        reason || undefined,
        focusAreas.length ? focusAreas : undefined,
      );
      const firstName = mentee.name.split(" ")[0];
      toast.success(`${selected.name} assigned as mentor for ${firstName}`);
      onAssigned?.(selected.id, { markResolved: !!showResolveOption && markResolved });
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to assign mentor");
    } finally {
      setSubmitting(false);
    }
  };

  if (!mentee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] sm:max-w-lg overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-base">
            <UserPlus className="h-4 w-4 text-primary" />
            Assign a mentor
          </DialogTitle>
        </DialogHeader>

        {/* Mentee summary */}
        <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
          <TeamAvatar name={mentee.name} size={36} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{mentee.name}</p>
            <p className="truncate text-xs text-muted-foreground">{menteeTitle || "Learner"}</p>
            {contextLabel && (
              <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-rose-700 dark:text-rose-300">
                <Hand className="h-3 w-3" /> {contextLabel}
              </p>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Mentor picker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Pick a mentor
              </Label>
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="text-[11px] text-primary hover:underline"
              >
                {showAll ? "Suggested only" : "Show all"}
              </button>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or title…"
                className="h-8 pl-8 text-xs"
              />
            </div>
            <ScrollArea className="h-[220px] rounded-md border border-border">
              {candidates.length === 0 ? (
                <p className="p-6 text-center text-xs text-muted-foreground">No matching colleagues.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {candidates.map((c) => {
                    const isSel = c.id === selectedId;
                    return (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(c.id)}
                          className={cn(
                            "flex w-full items-center gap-3 p-2.5 text-left transition-colors",
                            isSel ? "bg-primary/10" : "hover:bg-muted/50"
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border",
                              isSel ? "border-primary bg-primary" : "border-border"
                            )}
                          >
                            {isSel && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                          </span>
                          <TeamAvatar name={c.name} size={32} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
                            <p className="truncate text-[11px] text-muted-foreground">{c.rationale || "Colleague"}</p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </ScrollArea>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <Label htmlFor="mentor-reason" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Reason
            </Label>
            <Input
              id="mentor-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you pairing them?"
              className="h-8 text-sm"
            />
          </div>

          {/* Focus areas */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Focus areas
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {focusAreas.map((f) => (
                <Badge key={f} variant="secondary" className="gap-1 text-[11px]">
                  {f}
                  <button type="button" onClick={() => removeFocus(f)} aria-label={`Remove ${f}`}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {focusAreas.length === 0 && (
                <span className="text-[11px] text-muted-foreground">No focus areas yet.</span>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={newFocus}
                onChange={(e) => setNewFocus(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addFocus(newFocus);
                  }
                }}
                placeholder="Add a focus area…"
                className="h-8 text-xs"
              />
              <Button type="button" size="sm" variant="outline" onClick={() => addFocus(newFocus)} disabled={!newFocus.trim()}>
                Add
              </Button>
            </div>
          </div>

          {showResolveOption && (
            <label className="flex items-center gap-2 rounded-md border border-border bg-muted/30 p-2.5 text-xs text-foreground">
              <Checkbox checked={markResolved} onCheckedChange={(v) => setMarkResolved(!!v)} />
              <span>Mark this raised hand as resolved once the mentor is assigned</span>
            </label>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleAssign} disabled={!selected || submitting}>
            <UserPlus className="mr-1.5 h-3.5 w-3.5" />
            {submitting ? "Assigning…" : "Assign mentor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

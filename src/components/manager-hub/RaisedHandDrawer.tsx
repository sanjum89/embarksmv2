import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { CalendarPlus, MessageSquarePlus, Send, Link2, CheckCircle2, Quote } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { useManagerActions } from "@/store/useManagerActions";
import { TeamAvatar } from "@/components/team-home/Avatar";
import { TeamsBadge } from "@/components/team-home/TeamsBadge";
import type { ActionItem } from "@/data/managerDemoOverlay";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: ActionItem | null;
  learner: { employeeId: string; name: string; title?: string } | null;
  onScheduleOneOnOne?: (employeeId: string) => void;
  onSendCheckIn?: (employeeId: string) => void;
}

const QUICK_REPLIES = [
  { id: "loom", label: "I'll record a quick Loom", body: "Great question — let me record a 2-minute Loom walking through it. I'll share it later today." },
  { id: "1on1", label: "Cover this in our 1:1", body: "Let's take this in our next 1:1 — it'll be easier with a worked example on screen. I'll send a slot." },
  { id: "primer", label: "Share a primer link", body: "Take a look at this short primer first — happy to dig in once you've skimmed it: [link]" },
];

export function RaisedHandDrawer({ open, onOpenChange, action, learner, onScheduleOneOnOne, onSendCheckIn }: Props) {
  const { user } = useUser();
  const { recordDecision } = useManagerActions();
  const [reply, setReply] = useState("");
  const [sent, setSent] = useState(false);

  if (!action || !learner) return null;

  const sendReply = () => {
    if (!reply.trim()) return;
    setSent(true);
    toast.success(`Reply sent to ${learner.name.split(" ")[0]} via Teams (demo)`);
  };

  const close = (o: boolean) => {
    onOpenChange(o);
    if (!o) {
      setTimeout(() => {
        setReply("");
        setSent(false);
      }, 200);
    }
  };

  return (
    <Sheet open={open} onOpenChange={close}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="space-y-3">
          <div className="flex items-start gap-3">
            <TeamAvatar name={learner.name} size={44} />
            <div className="min-w-0 flex-1">
              <SheetTitle className="font-display text-base">Raised hand from {learner.name}</SheetTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">{learner.title}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {action.module_title && (
                  <Badge variant="outline" className="text-[10px]">{action.module_title}</Badge>
                )}
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    action.severity === "high"
                      ? "border-rose-500/30 bg-rose-500/10 text-rose-700"
                      : action.severity === "medium"
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-700"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {action.severity}
                </Badge>
                <span className="text-[11px] text-muted-foreground">· raised {action.age}</span>
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Their message */}
        <div className="mt-5">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Their message</p>
          <div className="rounded-lg border border-border bg-secondary/30 p-3">
            <Quote className="mb-1.5 h-3.5 w-3.5 text-muted-foreground" />
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {action.learner_message ?? action.detail}
            </p>
          </div>
        </div>

        {/* Reply */}
        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your reply</p>
            <TeamsBadge variant="chip" />
          </div>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {QUICK_REPLIES.map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => setReply(q.body)}
                className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
              >
                {q.label}
              </button>
            ))}
          </div>
          <Textarea
            rows={4}
            placeholder={`Write a reply to ${learner.name.split(" ")[0]}…`}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            className="text-sm"
            disabled={sent}
          />
          <div className="mt-2 flex justify-end">
            <Button size="sm" onClick={sendReply} disabled={!reply.trim() || sent}>
              <Send className="mr-1.5 h-3.5 w-3.5" />
              {sent ? "Reply sent" : "Send reply"}
            </Button>
          </div>
        </div>

        <Separator className="my-5" />

        {/* Next steps */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next steps</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button
              variant="outline"
              className="h-auto justify-start gap-2 py-2"
              onClick={() => { close(false); onScheduleOneOnOne?.(learner.employeeId); }}
            >
              <CalendarPlus className="h-4 w-4 text-primary" />
              <div className="text-left">
                <p className="text-xs font-medium text-foreground">Schedule a 1:1</p>
                <p className="text-[10px] text-muted-foreground">Pick a Teams slot</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto justify-start gap-2 py-2"
              onClick={() => { close(false); onSendCheckIn?.(learner.employeeId); }}
            >
              <MessageSquarePlus className="h-4 w-4 text-primary" />
              <div className="text-left">
                <p className="text-xs font-medium text-foreground">Send a check-in</p>
                <p className="text-[10px] text-muted-foreground">Pulse, wellbeing or nudge</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto justify-start gap-2 py-2"
              onClick={() => toast.success("Resource shared (demo)")}
            >
              <Link2 className="h-4 w-4 text-primary" />
              <div className="text-left">
                <p className="text-xs font-medium text-foreground">Share a resource</p>
                <p className="text-[10px] text-muted-foreground">Microlearning or doc</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto justify-start gap-2 py-2"
              onClick={() => {
                recordDecision(action.id, "resolved", user.name);
                toast.success("Marked as resolved");
                close(false);
              }}
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <div className="text-left">
                <p className="text-xs font-medium text-foreground">Mark resolved</p>
                <p className="text-[10px] text-muted-foreground">Close this hand-raise</p>
              </div>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

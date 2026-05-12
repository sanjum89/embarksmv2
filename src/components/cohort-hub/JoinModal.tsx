import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Calendar, MapPin, Users } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  meta?: { label: string; value: string; icon?: "calendar" | "map" | "users" }[];
  teamsLink?: string;
  primaryLabel?: string;
  onConfirm?: () => void;
}

export function JoinModal({ open, onClose, title, description, meta = [], teamsLink, primaryLabel = "Confirm", onConfirm }: Props) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!teamsLink) return;
    await navigator.clipboard.writeText(teamsLink);
    setCopied(true);
    toast.success("Teams link copied");
    setTimeout(() => setCopied(false), 2000);
  };
  const handleConfirm = () => {
    onConfirm?.();
    toast.success(`${primaryLabel} · logged to Action Centre`);
    onClose();
  };
  const Icon = ({ k }: { k?: string }) => k === "calendar" ? <Calendar className="h-3.5 w-3.5" /> : k === "map" ? <MapPin className="h-3.5 w-3.5" /> : k === "users" ? <Users className="h-3.5 w-3.5" /> : null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {meta.length > 0 && (
          <div className="space-y-2 text-sm">
            {meta.map((m, i) => (
              <div key={i} className="flex items-center gap-2 text-muted-foreground">
                <Icon k={m.icon} />
                <span className="font-medium text-foreground">{m.label}:</span>
                <span>{m.value}</span>
              </div>
            ))}
          </div>
        )}
        {teamsLink && (
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs">
            <span className="flex-1 truncate font-mono text-muted-foreground">{teamsLink}</span>
            <Button size="sm" variant="ghost" onClick={copy} className="h-7 gap-1">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm}>{primaryLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Clock as ClockIcon } from "lucide-react";
import { KIND_META, CATEGORY_LABEL, type ActionFeedItem } from "@/lib/actionCentre/itemKinds";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Props {
  item: ActionFeedItem;
  onSnooze: (id: string) => void;
  onDone: (id: string) => void;
  onDismiss: (id: string) => void;
  onPrimaryCta?: (item: ActionFeedItem) => void;
}

export default function ActionRow({ item, onSnooze, onDone, onDismiss, onPrimaryCta }: Props) {
  const meta = KIND_META[item.kind];
  const Icon = meta.icon;
  const primary = item.ctas?.[0];
  const secondary = item.ctas?.slice(1) ?? [];

  const renderCta = (cta: NonNullable<ActionFeedItem["ctas"]>[number], isPrimary: boolean) => {
    const variant = cta.variant ?? (isPrimary ? "default" : "outline");
    const className = "h-7 px-2.5 text-xs";
    if (cta.href) {
      return (
        <Button key={cta.label} asChild size="sm" variant={variant} className={className}>
          <Link to={cta.href}>{cta.label}</Link>
        </Button>
      );
    }
    return (
      <Button
        key={cta.label}
        size="sm"
        variant={variant}
        className={className}
        onClick={() => {
          if (cta.onAction === "snooze") onSnooze(item.id);
          else if (cta.onAction === "ack") onDone(item.id);
          else onPrimaryCta?.(item);
        }}
      >
        {cta.label}
      </Button>
    );
  };

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 border-l-4 bg-card pl-3 pr-3 py-3 rounded-r-md",
        "border-y border-r border-border/40 hover:bg-muted/40 transition-colors",
        meta.rail
      )}
    >
      <div className={cn("mt-0.5 shrink-0 rounded-md bg-muted/50 p-1.5", meta.tone)}>
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-[10px] uppercase tracking-wide border-border/60 text-muted-foreground">
            {CATEGORY_LABEL[item.category]}
          </Badge>
          <span className="text-[11px] text-muted-foreground">{item.when}</span>
          {item.actor && <span className="text-[11px] text-muted-foreground">· {item.actor}</span>}
        </div>
        <p className="mt-1 text-sm font-medium text-foreground leading-snug">{item.title}</p>
        {item.detail && (
          <p className="mt-0.5 text-xs text-muted-foreground leading-snug line-clamp-2">{item.detail}</p>
        )}

        {(primary || secondary.length > 0) && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {primary && renderCta(primary, true)}
            {secondary.map((c) => renderCta(c, false))}
          </div>
        )}
      </div>

      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
        <Button size="icon" variant="ghost" className="h-7 w-7" title="Snooze" onClick={() => onSnooze(item.id)}>
          <ClockIcon className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" title="Mark done" onClick={() => onDone(item.id)}>
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" title="Dismiss" onClick={() => onDismiss(item.id)}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

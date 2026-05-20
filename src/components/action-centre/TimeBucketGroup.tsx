import { Badge } from "@/components/ui/badge";
import { PRIORITY_LABEL, type ActionFeedItem, type ActionPriority } from "@/lib/actionCentre/itemKinds";
import ActionRow from "./ActionRow";
import { cn } from "@/lib/utils";

interface Props {
  priority: ActionPriority;
  items: ActionFeedItem[];
  onSnooze: (id: string) => void;
  onDone: (id: string) => void;
  onDismiss: (id: string) => void;
}

const DOT_COLOR: Record<ActionPriority, string> = {
  now: "bg-rose-500",
  today: "bg-amber-500",
  this_week: "bg-blue-500",
  later: "bg-muted-foreground/50",
};

export default function TimeBucketGroup({ priority, items, onSnooze, onDone, onDismiss }: Props) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <span className={cn("h-2 w-2 rounded-full", DOT_COLOR[priority])} />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
          {PRIORITY_LABEL[priority]}
        </h2>
        <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{items.length}</Badge>
      </div>
      <div className="space-y-1.5">
        {items.map((i) => (
          <ActionRow
            key={i.id}
            item={i}
            onSnooze={onSnooze}
            onDone={onDone}
            onDismiss={onDismiss}
          />
        ))}
      </div>
    </section>
  );
}

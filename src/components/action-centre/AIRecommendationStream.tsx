import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { KIND_META, type ActionFeedItem } from "@/lib/actionCentre/itemKinds";
import { Link } from "react-router-dom";

interface Props {
  items: ActionFeedItem[];
  onDismiss: (id: string) => void;
}

export default function AIRecommendationStream({ items, onDismiss }: Props) {
  return (
    <aside className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">AI suggestions</h3>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nothing new from the AI right now.</p>
      ) : (
        items.map((i) => {
          const meta = KIND_META[i.kind];
          const Icon = meta.icon;
          const cta = i.ctas?.[0];
          return (
            <div
              key={i.id}
              className="rounded-lg border border-primary/15 bg-primary/[0.04] p-3"
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5 rounded-md bg-primary/10 p-1.5 text-primary">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground leading-snug">{i.title}</p>
                  {i.detail && (
                    <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{i.detail}</p>
                  )}
                  {cta && (
                    <div className="mt-2">
                      {cta.href ? (
                        <Button asChild size="sm" className="h-7 px-2.5 text-xs">
                          <Link to={cta.href}>{cta.label}</Link>
                        </Button>
                      ) : (
                        <Button size="sm" className="h-7 px-2.5 text-xs" onClick={() => onDismiss(i.id)}>
                          {cta.label}
                        </Button>
                      )}
                      <button
                        onClick={() => onDismiss(i.id)}
                        className="ml-2 text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        Not now
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </aside>
  );
}

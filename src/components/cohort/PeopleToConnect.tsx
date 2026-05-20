import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { Sparkles, UserPlus } from "lucide-react";
import type { HubPeer } from "@/hooks/useCohortHub";

interface MergedPeer extends HubPeer {
  source: "similar" | "match";
}

interface Props {
  peopleSimilar: HubPeer[];
  peerMatches: HubPeer[];
  onConnect: (p: HubPeer) => void;
}

function initials(name: string) {
  return name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function PeopleToConnect({ peopleSimilar, peerMatches, onConnect }: Props) {
  const merged: MergedPeer[] = useMemo(() => {
    const map = new Map<string, MergedPeer>();
    peopleSimilar.forEach((p) => map.set(p.employeeId, { ...p, source: "similar" }));
    peerMatches.forEach((p) => {
      if (!map.has(p.employeeId)) map.set(p.employeeId, { ...p, source: "match" });
    });
    return Array.from(map.values());
  }, [peopleSimilar, peerMatches]);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold">People to connect with</h2>
          <p className="text-xs text-muted-foreground">Cohort peers on similar topics and suggested matches.</p>
        </div>
        <Link to="#" className="text-xs text-muted-foreground hover:underline">View all ›</Link>
      </div>
      <div className="mt-4 space-y-2">
        {merged.length === 0 && <p className="text-sm text-muted-foreground">No suggestions yet.</p>}
        {merged.map((p) => (
          <div key={p.employeeId} className="flex items-center gap-3 rounded-md p-2 hover:bg-muted/30 transition-colors">
            <div className="relative">
              <Avatar className="h-9 w-9"><AvatarFallback className="bg-muted text-xs">{initials(p.name)}</AvatarFallback></Avatar>
              {p.online && <span className="absolute -bottom-0 -right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-semibold">{p.name}</div>
              <div className="truncate text-xs text-muted-foreground">{p.title}</div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <Badge
                  variant="outline"
                  className={`text-[9px] uppercase tracking-wide ${
                    p.source === "similar" ? "border-primary/30 text-primary" : "border-accent/40 text-accent-foreground"
                  }`}
                >
                  {p.source === "similar" ? "Similar topic" : "Suggested match"}
                </Badge>
                <span className="truncate text-[11px] text-muted-foreground">{p.reason}</span>
              </div>
            </div>
            <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" onClick={() => onConnect(p)}>Connect</Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

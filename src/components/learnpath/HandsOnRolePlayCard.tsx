import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import type { RolePlay } from "@/types/learning";

interface Props {
  rolePlay: RolePlay;
}

export function HandsOnRolePlayCard({ rolePlay }: Props) {
  const navigate = useNavigate();
  const initials = rolePlay.aiCloneConfig?.persona
    ? rolePlay.aiCloneConfig.persona
        .split(",")[0]
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "RP";

  const personaName = rolePlay.aiCloneConfig?.persona?.split(",")[0] ?? "AI Character";
  const personaDesc =
    rolePlay.aiCloneConfig?.context?.slice(0, 120) ??
    rolePlay.scenario?.slice(0, 120) ??
    "";

  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-4">
      <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0 text-sm font-bold text-accent">
        {initials}
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div>
          <h4 className="text-sm font-semibold text-foreground">{personaName}</h4>
          <p className="text-xs text-muted-foreground line-clamp-2">{personaDesc}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => navigate(`/role-play-bank/${rolePlay.id}`)}
          >
            🎭 Chat Role Play
          </Button>
          <Badge variant="secondary" className="text-[10px]">
            Voice: Soon
          </Badge>
        </div>
      </div>
    </div>
  );
}

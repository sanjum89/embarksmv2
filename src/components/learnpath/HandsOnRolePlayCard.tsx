import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Mic } from "lucide-react";
import type { RolePlay } from "@/types/learning";
import { useContentSubstitution } from "@/lib/contentSubstitution";

interface Props {
  rolePlay: RolePlay;
}

export function HandsOnRolePlayCard({ rolePlay }: Props) {
  const navigate = useNavigate();
  const { substitute } = useContentSubstitution();
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
  const personaRole = rolePlay.aiCloneConfig?.persona?.split(",").slice(1).join(",").trim() ?? "";
  const personaDesc = substitute(
    rolePlay.aiCloneConfig?.context?.slice(0, 180) ??
    rolePlay.scenario?.slice(0, 180) ??
    ""
  );

  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground leading-tight">{personaName}</h4>
          {personaRole && (
            <p className="text-xs text-muted-foreground mt-0.5">{personaRole}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
        {personaDesc}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap pt-1">
        <Button
          size="sm"
          className="gap-1.5 text-xs bg-accent text-accent-foreground hover:bg-accent/90"
          onClick={() => navigate(`/role-play-bank/${rolePlay.id}`)}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Chat Role Play
        </Button>
        <Button size="sm" variant="outline" disabled className="gap-1.5 text-xs">
          <Mic className="h-3.5 w-3.5" />
          Voice: Soon
        </Button>
      </div>
    </div>
  );
}

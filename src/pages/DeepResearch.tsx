import { useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { useAccount } from "@/contexts/AccountContext";
import { useDeepResearch } from "@/hooks/useDeepResearch";
import { DeepResearchWorkspace, type DeepResearchStarter } from "@/components/deep-research/DeepResearchWorkspace";
import { STARTERS } from "@/components/deep-research/StarterCards";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Microscope, Plus } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { useModeEyebrow } from "@/components/layout/useModeEyebrow";

export default function DeepResearch() {
  const { user } = useUser();
  const { activeAccount } = useAccount();
  const navigate = useNavigate();
  const params = useParams<{ threadId?: string }>();
  const accountId = activeAccount?.id ?? "default";
  const accountName = activeAccount?.name ?? null;

  const dr = useDeepResearch({ accountId, accountName, ownerId: user.id, scope: "team" });

  // Sync URL → activeThreadId
  useEffect(() => {
    if (params.threadId && params.threadId !== dr.activeThreadId) {
      dr.setActiveThreadId(params.threadId);
    }
  }, [params.threadId]);

  const scopeLabel = useMemo(() => {
    if (!user.canManage) return "Personal scope";
    return `Team scope · ${activeAccount?.name ?? "—"}`;
  }, [user.canManage, activeAccount?.name]);

  const eyebrow = useModeEyebrow();

  const starters: DeepResearchStarter[] = useMemo(
    () =>
      STARTERS.filter((s) => !s.comingSoon).map((s) => ({
        id: s.id,
        label: s.title,
        prompt: s.prompt,
        description: s.output,
        icon: s.icon,
        category: s.category,
      })),
    []
  );

  return (
    <div className="h-screen flex flex-col bg-background">
      <PageHeader
        eyebrow={eyebrow}
        title="Deep Research"
        subtitle="BI-style conversational workspace for managers and cohort leaders"
        actions={
          <>
            <Badge variant="secondary" className="text-[10px]">{scopeLabel}</Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const id = dr.newThread();
                navigate(`/team/deep-research/${id}`);
              }}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              New thread
            </Button>
          </>
        }
      />

      <DeepResearchWorkspace
        dr={dr}
        authorId={user.id}
        starters={starters}
        emptyState={{
          title: "Ask anything about your cohort",
          subtitle:
            "Deep Research turns connected learner, cohort, competency and evidence data into visual insight and recommended action. Pick a starter on the left or type your own question.",
          icon: Microscope,
        }}
        onSelectThread={(id) => navigate(`/team/deep-research/${id}`)}
        onNewThread={(id) => navigate(`/team/deep-research/${id}`, { replace: true })}
        composerPlaceholder="Ask about cohort readiness, learners, modules, evidence, risk…"
      />
    </div>
  );
}

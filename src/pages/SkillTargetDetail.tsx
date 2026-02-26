import { useParams, Link } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { mockSkillTargets } from "@/data/mock";
import { ArrowLeft } from "lucide-react";

export default function SkillTargetDetail() {
  const { id } = useParams();
  const target = mockSkillTargets.find((st) => st.id === id);

  if (!target) {
    return (
      <div>
        <AppHeader title="Skill Target" />
        <div className="flex items-center justify-center p-20 text-muted-foreground">
          Skill Target not found.
        </div>
      </div>
    );
  }

  return (
    <div>
      <AppHeader title={target.title} />
      <div className="p-6">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <div className="rounded-xl bg-card border border-border p-6 shadow-card">
          <h3 className="font-display text-xl font-bold text-foreground mb-2">{target.title}</h3>
          <p className="text-sm text-muted-foreground mb-6">{target.description}</p>
          <p className="text-sm text-muted-foreground italic">Step list UI will be built in Milestone 3.</p>
        </div>
      </div>
    </div>
  );
}

import { AppHeader } from "@/components/layout/AppHeader";
import { mockSkillTargets } from "@/data/mock";
import { SkillTargetCard } from "@/components/skill-target/SkillTargetCard";
import { useUser } from "@/contexts/UserContext";

export default function Dashboard() {
  const { user } = useUser();
  const targets = mockSkillTargets.filter((st) => st.assignedTo.includes(user.id));

  return (
    <div>
      <AppHeader title="Learning Spaces" />
      <div className="p-6">
        <div className="mb-6">
          <h3 className="font-display text-2xl font-bold text-foreground">
            Welcome back, {user.name.split(" ")[0]} 👋
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            You have {targets.length} skill targets assigned. Keep up the great work!
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {targets.map((target, i) => (
            <SkillTargetCard key={target.id} target={target} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

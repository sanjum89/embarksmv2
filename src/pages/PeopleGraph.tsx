import { AppHeader } from "@/components/layout/AppHeader";

export default function PeopleGraph() {
  return (
    <div>
      <AppHeader title="People Graph" />
      <div className="flex items-center justify-center p-20">
        <div className="text-center">
          <p className="font-display text-lg font-semibold text-foreground">People Graph</p>
          <p className="mt-1 text-sm text-muted-foreground">Learner competency signals and analytics. Coming in Milestone 9.</p>
        </div>
      </div>
    </div>
  );
}

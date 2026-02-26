import { AppHeader } from "@/components/layout/AppHeader";

export default function ManagerView() {
  return (
    <div>
      <AppHeader title="Manager" />
      <div className="flex items-center justify-center p-20">
        <div className="text-center">
          <p className="font-display text-lg font-semibold text-foreground">Manager Dashboard</p>
          <p className="mt-1 text-sm text-muted-foreground">Assign skill targets and monitor team progress. Coming in Milestone 8.</p>
        </div>
      </div>
    </div>
  );
}

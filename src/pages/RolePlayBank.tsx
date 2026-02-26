import { AppHeader } from "@/components/layout/AppHeader";

export default function RolePlayBank() {
  return (
    <div>
      <AppHeader title="Role Play Bank" />
      <div className="flex items-center justify-center p-20">
        <div className="text-center">
          <p className="font-display text-lg font-semibold text-foreground">Role Play Bank</p>
          <p className="mt-1 text-sm text-muted-foreground">Browse and practice AI-powered role play scenarios. Coming in Milestone 7.</p>
        </div>
      </div>
    </div>
  );
}

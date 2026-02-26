import { AppHeader } from "@/components/layout/AppHeader";

export default function RolePlaySession() {
  return (
    <div>
      <AppHeader title="Role Play" />
      <div className="flex items-center justify-center p-20">
        <div className="text-center">
          <p className="font-display text-lg font-semibold text-foreground">Role Play Session</p>
          <p className="mt-1 text-sm text-muted-foreground">AI-powered role play with private mode. Coming in Milestone 6.</p>
        </div>
      </div>
    </div>
  );
}

import { AppHeader } from "@/components/layout/AppHeader";

export default function AssessmentPage() {
  return (
    <div>
      <AppHeader title="Assessment" />
      <div className="flex items-center justify-center p-20">
        <div className="text-center">
          <p className="font-display text-lg font-semibold text-foreground">Assessment</p>
          <p className="mt-1 text-sm text-muted-foreground">Assessment UI with pre/post logic. Coming in Milestone 4.</p>
        </div>
      </div>
    </div>
  );
}

import { AppHeader } from "@/components/layout/AppHeader";

export default function LearningModulePage() {
  return (
    <div>
      <AppHeader title="Learning Module" />
      <div className="flex items-center justify-center p-20">
        <div className="text-center">
          <p className="font-display text-lg font-semibold text-foreground">Learning Module</p>
          <p className="mt-1 text-sm text-muted-foreground">Video/doc viewer with AI Companion. Coming in Milestone 5.</p>
        </div>
      </div>
    </div>
  );
}

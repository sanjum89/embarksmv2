import { useLearnPath, type LearningMode } from "@/contexts/LearnPathContext";
import { Eye, BookOpen, Headphones, Wrench, Layers, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const modes: { mode: LearningMode; label: string; icon: React.ElementType }[] = [
  { mode: "visual", label: "Visual", icon: Eye },
  { mode: "reading", label: "Reading", icon: BookOpen },
  { mode: "listening", label: "Listening", icon: Headphones },
  { mode: "hands-on", label: "Hands-On", icon: Wrench },
  { mode: "combined", label: "Combined", icon: Layers },
];

export function LearnPathModeSelector() {
  const { learningMode, setLearningMode, closeModule } = useLearnPath();

  return (
    <div className="px-4 py-2 border-b border-border flex items-center gap-3">
      <Button variant="ghost" size="sm" onClick={closeModule} className="gap-1 text-xs shrink-0">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </Button>
      <div className="flex-1 flex items-center gap-1 overflow-x-auto">
        {modes.map(({ mode, label, icon: Icon }) => (
          <button
            key={mode}
            onClick={() => setLearningMode(mode)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
              learningMode === mode
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

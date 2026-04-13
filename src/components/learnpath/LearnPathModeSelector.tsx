import { useEmbark, type LearningMode } from "@/contexts/EmbarkContext";
import { Eye, BookOpen, Headphones, Wrench, Layers, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const modes: { mode: LearningMode; label: string; icon: React.ElementType }[] = [
  { mode: "visual", label: "Visual", icon: Eye },
  { mode: "reading", label: "Reading", icon: BookOpen },
  { mode: "listening", label: "Listening", icon: Headphones },
  { mode: "hands-on", label: "Hands-On", icon: Wrench },
  { mode: "combined", label: "Combined", icon: Layers },
];

interface Props {
  skillTargetTitle?: string;
}

export function EmbarkModeSelector({ skillTargetTitle }: Props) {
  const { learningMode, setLearningMode, closeModule } = useEmbark();

  return (
    <div className="border-b border-border">
      {/* Top bar: skill target name + All Modules */}
      <div className="px-4 py-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground truncate">
          {skillTargetTitle ?? "Learning Path"}
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={closeModule}
          className="gap-1.5 text-xs shrink-0"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          All Modules
        </Button>
      </div>

      {/* Mode selector row */}
      <div className="px-4 pb-2.5 flex items-center gap-2 overflow-x-auto">
        <span className="text-xs text-muted-foreground whitespace-nowrap">Viewing in:</span>
        <div className="flex items-center gap-1">
          {modes.map(({ mode, label, icon: Icon }) => (
            <button
              key={mode}
              onClick={() => setLearningMode(mode)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap",
                learningMode === mode
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

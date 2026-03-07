import { Maximize2, X, ThumbsUp, ThumbsDown } from "lucide-react";
import type { StepItem } from "@/types/learning";

interface TraditionalContentViewerProps {
  step: StepItem;
  onClose: () => void;
}

export function TraditionalContentViewer({ step, onClose }: TraditionalContentViewerProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header with title */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">{step.title}</h2>
          <div className="flex items-center gap-2">
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <Maximize2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        {/* Placeholder content viewer */}
        <div className="aspect-video bg-muted/30 flex items-center justify-center">
          <div className="text-center">
            <div className="h-16 w-16 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="text-2xl">▶</span>
            </div>
            <p className="text-sm text-muted-foreground">Content preview</p>
            <p className="text-xs text-muted-foreground/60 mt-1">{step.description}</p>
          </div>
        </div>

        {/* Content info */}
        <div className="px-5 py-4">
          <p className="text-xs text-muted-foreground mb-2">Cornerstone</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <ThumbsUp className="h-4 w-4" />
              </button>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <ThumbsDown className="h-4 w-4" />
              </button>
            </div>
          </div>
          <h3 className="text-base font-semibold text-foreground mt-3">{step.title}</h3>
          {step.duration && (
            <p className="text-xs text-muted-foreground mt-1">Duration: {step.duration}</p>
          )}
        </div>
      </div>
    </div>
  );
}

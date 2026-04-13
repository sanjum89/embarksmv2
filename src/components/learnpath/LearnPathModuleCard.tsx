import { useEmbark } from "@/contexts/EmbarkContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Video, FileText, CheckCircle2, Lock, Clock, ClipboardCheck, MessageSquare, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";
import { useContentSubstitution } from "@/lib/contentSubstitution";
import type { StepType } from "@/types/learning";

interface StepEntry {
  stepId: string;
  moduleId: string;
  type: StepType;
  title: string;
  description: string;
  duration?: string;
  contentType: string;
  status: string;
  skillTargetId: string;
  skillTargetTitle: string;
  progress: number;
  referenceId: string;
}

const typeIcons: Record<StepType, React.ElementType> = {
  module: FileText,
  assessment: ClipboardCheck,
  role_play: MessageSquare,
};

export function EmbarkModuleCard({ step }: { step: StepEntry }) {
  const { openModule, openAssessment } = useEmbark();
  const { substitute } = useContentSubstitution();
  const isLocked = step.status === "locked";
  const isCompleted = step.status === "completed";
  const isSkipped = step.status === "skipped";

  const handleClick = () => {
    if (isLocked) return;
    if (step.type === "assessment") {
      openAssessment(step.stepId);
    } else {
      openModule(step.moduleId, step.skillTargetId);
    }
  };

  const Icon = typeIcons[step.type] ?? FileText;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isLocked && "opacity-50 cursor-not-allowed",
        isCompleted && "border-green-500/30",
        isSkipped && "opacity-60 border-amber-500/30"
      )}
      onClick={handleClick}
    >
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-accent shrink-0" />
            <h3 className="text-sm font-medium text-foreground leading-tight">{substitute(step.title)}</h3>
          </div>
          {isLocked && <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
          {isCompleted && <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />}
          {isSkipped && <SkipForward className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{substitute(step.description)}</p>
        <div className="flex items-center gap-2 flex-wrap">
          {step.duration && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> {step.duration}
            </span>
          )}
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {substitute(step.skillTargetTitle)}
          </Badge>
          <Badge
            variant={isCompleted ? "default" : isSkipped ? "outline" : "outline"}
            className={cn("text-[10px] px-1.5 py-0", isSkipped && "text-amber-600 border-amber-400")}
          >
            {isSkipped ? "skipped" : step.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

import { Button } from "@/components/ui/button";
import { BookOpen, Layers, Eye, Headphones, Wrench, ClipboardCheck } from "lucide-react";

interface Action {
  type: string;
  label?: string;
  moduleId?: string;
  mode?: string;
  skillTargetId?: string;
}

const iconMap: Record<string, React.ElementType> = {
  open_module: BookOpen,
  show_modules: Layers,
  set_mode: Eye,
  open_assessment: ClipboardCheck,
};

export function EmbarkActionButton({
  action,
  onClick,
}: {
  action: Action;
  onClick: (action: Action) => void;
}) {
  const Icon = iconMap[action.type] ?? BookOpen;
  const label = action.label ?? action.type.replace(/_/g, " ");

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 text-xs"
      onClick={() => onClick(action)}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Button>
  );
}

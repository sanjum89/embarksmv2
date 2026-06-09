import { Layers, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWorkforceGroups } from "@/contexts/WorkforceGroupContext";

/** Small badge shown on scoped pages indicating the active workforce-group filter. */
export function GroupScopeBadge({ className }: { className?: string }) {
  const { enabled, selectedGroupPath, selectedSubtreeEmployeeIds, setSelectedGroupId } = useWorkforceGroups();
  if (!enabled || selectedGroupPath.length === 0) return null;
  const label = selectedGroupPath.map((g) => g.name).join(" › ");
  return (
    <div className={className}>
      <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary gap-1.5 pr-1">
        <Layers className="h-3 w-3" />
        <span className="truncate max-w-[260px]">Filtered: {label}</span>
        <span className="text-[10px] opacity-70">· {selectedSubtreeEmployeeIds.length} people</span>
        <Button variant="ghost" size="sm" className="h-4 w-4 p-0 ml-0.5 hover:bg-primary/20" onClick={() => setSelectedGroupId(null)}>
          <X className="h-2.5 w-2.5" />
        </Button>
      </Badge>
    </div>
  );
}

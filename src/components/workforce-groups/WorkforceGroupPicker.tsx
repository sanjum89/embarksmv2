import { useState } from "react";
import { ChevronDown, Layers, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useWorkforceGroups, type WorkforceGroup } from "@/contexts/WorkforceGroupContext";

export function WorkforceGroupPicker() {
  const { enabled, groups, selectedGroupId, setSelectedGroupId, selectedGroupPath } = useWorkforceGroups();
  const [open, setOpen] = useState(false);

  if (!enabled) return null;
  if (groups.length === 0) return null;

  // Build tree
  const childrenOf = (pid: string | null) =>
    groups.filter((g) => g.parent_id === pid).sort((a, b) => a.sort_order - b.sort_order);

  const label = selectedGroupPath.length
    ? selectedGroupPath.map((g) => g.name).join(" › ")
    : "All workforce";

  const renderNode = (g: WorkforceGroup, depth: number) => {
    const kids = childrenOf(g.id);
    const active = g.id === selectedGroupId;
    return (
      <div key={g.id}>
        <button
          onClick={() => { setSelectedGroupId(g.id); setOpen(false); }}
          className={cn(
            "w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-md text-sm hover:bg-muted transition-colors",
            active && "bg-primary/10 text-primary font-medium"
          )}
          style={{ paddingLeft: 8 + depth * 14 }}
        >
          {active ? <Check className="h-3.5 w-3.5 shrink-0" /> : <span className="h-3.5 w-3.5 shrink-0" />}
          <span className="truncate">{g.name}</span>
          <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">{g.kind}</span>
        </button>
        {kids.map((k) => renderNode(k, depth + 1))}
      </div>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2 max-w-[280px]">
          <Layers className="h-3.5 w-3.5 text-primary" />
          <span className="truncate text-xs font-medium">{label}</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-2">
        <div className="flex items-center justify-between px-2 pb-2 border-b border-border/60 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Workforce Group</span>
          {selectedGroupId && (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => { setSelectedGroupId(null); setOpen(false); }}>
              <X className="h-3 w-3 mr-1" /> Clear
            </Button>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          <button
            onClick={() => { setSelectedGroupId(null); setOpen(false); }}
            className={cn(
              "w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-md text-sm hover:bg-muted transition-colors",
              !selectedGroupId && "bg-primary/10 text-primary font-medium"
            )}
          >
            {!selectedGroupId ? <Check className="h-3.5 w-3.5" /> : <span className="h-3.5 w-3.5" />}
            <span>All workforce</span>
          </button>
          {childrenOf(null).map((g) => renderNode(g, 0))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

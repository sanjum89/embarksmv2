import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Visual marker that data is sourced from the Microsoft Teams integration. */
export function TeamsBadge({ label = "Teams", className }: { label?: string; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 border-[hsl(244,55%,55%)]/30 bg-[hsl(244,55%,55%)]/10 px-1.5 py-0 text-[10px] font-medium text-[hsl(244,55%,45%)] dark:text-[hsl(244,80%,80%)]",
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-[hsl(244,55%,55%)]" />
      {label}
    </Badge>
  );
}

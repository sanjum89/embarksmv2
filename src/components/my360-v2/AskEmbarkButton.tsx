import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useAgentOne } from "@/contexts/AgentOneContext";
import { cn } from "@/lib/utils";

interface Props {
  prompt: string;
  context?: string;
  label?: string;
  variant?: "pill" | "ghost" | "icon";
  className?: string;
}

export function AskEmbarkButton({ prompt, context = "My 360", label = "Ask Embark", variant = "pill", className }: Props) {
  const { handleSend } = useAgentOne();
  const onClick = () => handleSend(prompt, context);

  if (variant === "icon") {
    return (
      <button
        onClick={onClick}
        title={label}
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors",
          className,
        )}
      >
        <Sparkles className="h-3.5 w-3.5" />
      </button>
    );
  }

  if (variant === "ghost") {
    return (
      <Button size="sm" variant="ghost" onClick={onClick} className={cn("h-7 text-xs gap-1.5 text-muted-foreground hover:text-primary", className)}>
        <Sparkles className="h-3.5 w-3.5" />
        {label}
      </Button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10 hover:border-primary/40 transition-colors",
        className,
      )}
    >
      <Sparkles className="h-3 w-3" />
      {label}
    </button>
  );
}

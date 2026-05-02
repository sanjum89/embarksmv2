import { ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccessibility, FontScale } from "@/contexts/AccessibilityContext";

interface Props {
  trigger: ReactNode;
  expanded: boolean;
  side?: "top" | "right";
}

const SCALES: { value: FontScale; label: string; sample: string }[] = [
  { value: "compact", label: "Compact", sample: "Aa" },
  { value: "default", label: "Default", sample: "Aa" },
  { value: "large", label: "Large", sample: "Aa" },
  { value: "xlarge", label: "X-Large", sample: "Aa" },
];

export function AccessibilityPanel({ trigger, expanded, side }: Props) {
  const a11y = useAccessibility();
  const popoverSide = side ?? (expanded ? "top" : "right");

  return (
    <Popover>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        </TooltipTrigger>
        {!expanded && <TooltipContent side="right" sideOffset={8}>Accessibility</TooltipContent>}
      </Tooltip>
      <PopoverContent side={popoverSide} align="start" sideOffset={8} className="w-72 p-3">
        <div className="flex items-center justify-between pb-2">
          <p className="text-sm font-semibold">Accessibility</p>
          <button
            onClick={a11y.reset}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Reset to defaults"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        </div>
        <Separator className="mb-3" />

        {/* Text size */}
        <div className="mb-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">Text size</p>
          <div className="grid grid-cols-4 gap-1">
            {SCALES.map((s) => {
              const active = a11y.fontScale === s.value;
              const px = { compact: 11, default: 13, large: 15, xlarge: 17 }[s.value];
              return (
                <button
                  key={s.value}
                  onClick={() => a11y.setFontScale(s.value)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 rounded-md border py-2 transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border hover:bg-secondary"
                  )}
                  title={s.label}
                >
                  <span style={{ fontSize: `${px}px`, lineHeight: 1 }} className="font-semibold">{s.sample}</span>
                  <span className="text-[10px] leading-none">{s.label}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">Tip: Ctrl/⌘ + or − to resize.</p>
        </div>

        <Separator className="mb-3" />

        {/* Toggles */}
        <div className="space-y-2.5">
          <ToggleRow
            label="Comfortable line spacing"
            checked={a11y.relaxedSpacing}
            onChange={a11y.setRelaxedSpacing}
          />
          <ToggleRow
            label="Wider letter spacing"
            checked={a11y.wideLetters}
            onChange={a11y.setWideLetters}
          />
          <ToggleRow
            label="Dyslexia-friendly font"
            checked={a11y.dyslexiaFriendly}
            onChange={a11y.setDyslexiaFriendly}
          />
          <ToggleRow
            label="Underline all links"
            checked={a11y.underlineLinks}
            onChange={a11y.setUnderlineLinks}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

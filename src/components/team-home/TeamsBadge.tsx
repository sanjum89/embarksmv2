import { cn } from "@/lib/utils";
import teamsLogo from "@/assets/microsoft-teams-logo.png";

function TeamsLogo({ className, size = 14 }: { className?: string; size?: number }) {
  return (
    <img
      src={teamsLogo}
      alt=""
      width={size}
      height={size}
      className={cn("block object-contain", className)}
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
}

interface Props {
  /** "icon" = logo only (default). "chip" = logo + wordmark in a subtle bordered chip. */
  variant?: "icon" | "chip";
  /** Override label text for chip variant. Defaults to "Microsoft Teams". */
  label?: string;
  className?: string;
  /** Logo size in pixels (square). */
  size?: number;
}

/** Marks data or a control as sourced from the Microsoft Teams integration. */
export function TeamsBadge({ variant, label, className, size = 14 }: Props) {
  const v = variant ?? (label ? "chip" : "icon");

  if (v === "icon") {
    return (
      <span
        title="Microsoft Teams integration"
        aria-label="Microsoft Teams integration"
        className={cn("inline-flex items-center justify-center", className)}
      >
        <TeamsLogo size={size} />
      </span>
    );
  }

  return (
    <span
      title="Microsoft Teams integration"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-1.5 py-0.5 text-[11px] font-medium text-foreground",
        className
      )}
    >
      <TeamsLogo size={size} />
      <span>{label ?? "Microsoft Teams"}</span>
    </span>
  );
}

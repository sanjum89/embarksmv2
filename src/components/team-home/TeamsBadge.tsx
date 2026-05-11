import { cn } from "@/lib/utils";

/** Official Microsoft Teams glyph (4-tile mark + inner T), inline SVG. */
function TeamsLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      {/* small circle (people indicator) */}
      <circle cx="22.5" cy="9.5" r="3.5" fill="#7B83EB" />
      <path
        d="M27 13.5h-5.6a.9.9 0 0 0-.9.9v6a4.5 4.5 0 0 0 3.6 4.4 4.5 4.5 0 0 0 5.4-4.4v-4.4A2.5 2.5 0 0 0 27 13.5z"
        fill="#7B83EB"
      />
      {/* main square */}
      <rect x="2" y="6" width="18" height="20" rx="2" fill="#5059C9" />
      {/* inner T */}
      <path d="M5.5 11h11v2.2h-4.2V21h-2.6v-7.8H5.5V11z" fill="#fff" />
    </svg>
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
  // Backward compat: any caller that passed a `label` (e.g. "Microsoft Teams")
  // historically expected the wordmark to render — treat that as `chip`.
  const v = variant ?? (label ? "chip" : "icon");

  if (v === "icon") {
    return (
      <span
        title="Microsoft Teams integration"
        aria-label="Microsoft Teams integration"
        className={cn("inline-flex items-center justify-center", className)}
      >
        <TeamsLogo className="block" />
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
      <TeamsLogo className="block" />
      <span>{label ?? "Microsoft Teams"}</span>
    </span>
  );
}

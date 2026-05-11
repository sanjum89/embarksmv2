import { cn } from "@/lib/utils";

function hashHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 360;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function TeamAvatar({ name, size = 36, className }: { name: string; size?: number; className?: string }) {
  const hue = hashHue(name);
  const bg = `hsl(${hue} 60% 88%)`;
  const fg = `hsl(${hue} 55% 28%)`;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-medium leading-none",
        className
      )}
      style={{
        width: size,
        height: size,
        background: bg,
        color: fg,
        fontSize: Math.round(size * 0.38),
      }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

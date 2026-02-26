import { useUser } from "@/contexts/UserContext";
import type { UserRole } from "@/types/learning";
import { cn } from "@/lib/utils";

const roles: UserRole[] = ["learner", "manager", "admin"];

export function AppHeader({ title }: { title: string }) {
  const { user, setRole } = useUser();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-6">
      <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>

      {/* Role switcher (prototype only) */}
      <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
        {roles.map((role) => (
          <button
            key={role}
            onClick={() => setRole(role)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-all duration-200",
              user.role === role
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {role}
          </button>
        ))}
      </div>
    </header>
  );
}

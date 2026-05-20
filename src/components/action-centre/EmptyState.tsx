import { Inbox } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-full bg-muted p-4">
        <Inbox className="h-7 w-7 text-muted-foreground/70" />
      </div>
      <p className="mt-4 text-base font-medium text-foreground">You're all clear.</p>
      <p className="mt-1 text-sm text-muted-foreground">
        We'll ping you the moment something needs your attention.
      </p>
    </div>
  );
}

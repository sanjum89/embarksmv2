import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CalendarPlus, Inbox, MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";

interface Props {
  managerName: string;
  managerTitle?: string;
  summary: string;
}

export function TeamHero({ managerName, managerTitle, summary }: Props) {
  return (
    <section className="mb-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Team Home
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {managerName}
          </h1>
          {managerTitle && (
            <p className="mt-1 text-sm text-muted-foreground">{managerTitle}</p>
          )}
          <p className="mt-3 max-w-2xl text-sm text-foreground/80">{summary}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => toast.success("1:1 scheduled in Teams (demo)")}>
            <CalendarPlus className="mr-1.5 h-3.5 w-3.5" /> Schedule 1:1
          </Button>
          <Button size="sm" variant="outline" onClick={() => toast.success("Cohort check-in posted (demo)")}>
            <MessageSquarePlus className="mr-1.5 h-3.5 w-3.5" /> Send check-in
          </Button>
          <Button size="sm" asChild>
            <Link to="/action-centre">
              <Inbox className="mr-1.5 h-3.5 w-3.5" /> Action Centre
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

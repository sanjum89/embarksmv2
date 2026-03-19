import { motion } from "framer-motion";
import { MapPin, Calendar, Clock, Briefcase } from "lucide-react";
import { useAccount } from "@/contexts/AccountContext";
import { mockNewHires as defaultNewHires } from "@/data/mock";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const levelColors: Record<string, string> = {
  Beginner: "bg-destructive/10 text-destructive",
  Intermediate: "bg-warning/10 text-warning",
  Advanced: "bg-success/10 text-success",
  Expert: "bg-info/10 text-info",
};

export default function NewHiresPanel() {
  const { normalizedAccount, activeAccount } = useAccount();
  const newHires = normalizedAccount?.newHires ?? activeAccount?.data?.newHires ?? defaultNewHires;
  return (
    <div className="p-6">
      <h3 className="font-display text-lg font-bold text-foreground mb-1">New Hires</h3>
      <p className="text-sm text-muted-foreground mb-6">{mockNewHires.length} new team members</p>

      <div className="space-y-4">
        {mockNewHires.map((hire, i) => (
          <motion.div
            key={hire.user.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border bg-background p-4"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shrink-0">
                {hire.user.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground">{hire.user.name}</p>
                <p className="text-xs text-muted-foreground">{hire.title}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3" />
                {hire.location}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                {hire.yearsExperience} yrs experience
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                Started {new Date(hire.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </div>
              {hire.program && (
                <div className="flex items-center gap-1.5">
                  <Briefcase className="h-3 w-3" />
                  {hire.program}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {hire.skills.map((skill) => (
                <span
                  key={skill.name}
                  className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium", levelColors[skill.level] || "bg-secondary text-foreground")}
                >
                  {skill.name} · {skill.level}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

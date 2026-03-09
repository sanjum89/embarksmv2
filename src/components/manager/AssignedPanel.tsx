import { motion } from "framer-motion";
import { CheckCircle2, MapPin, Clock, Calendar, Briefcase, Layers, Target } from "lucide-react";
import { mockNewHires, mockProgramContexts } from "@/data/mock";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const levelColors: Record<string, string> = {
  Beginner: "bg-destructive/10 text-destructive",
  Intermediate: "bg-warning/10 text-warning",
  Advanced: "bg-success/10 text-success",
  Expert: "bg-info/10 text-info",
};

export default function AssignedPanel() {
  const { skillTargets } = useSkillTargets();
  const program = mockProgramContexts[0];
  const st4 = skillTargets.find((st) => st.id === program.skillTargetId);
  const steps = st4?.steps ?? [];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/15 shrink-0">
          <CheckCircle2 className="h-5 w-5 text-success" />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">Training Assigned</h3>
          <p className="text-xs text-muted-foreground">Apple L1 Customer Support Readiness</p>
        </div>
      </div>

      {/* Program summary */}
      <div className="rounded-xl border border-border bg-background p-4 mb-5 mt-4">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">Program Details</p>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Chapters</span>
            <span className="font-medium text-foreground">{steps.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Assessment Pass %</span>
            <span className="font-medium text-foreground">{program.assessmentPassPercentage}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Adaptive Skip</span>
            <span className="font-medium text-foreground">&gt;{program.adaptiveSkipThresholds.skipOne}% / ≥{program.adaptiveSkipThresholds.skipTwo}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Est. Duration</span>
            <span className="font-medium text-foreground">
              {steps.reduce((acc, s) => acc + (parseInt(s.duration || "0") || 0), 0)} min
            </span>
          </div>
        </div>
      </div>

      {/* Assigned People */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-foreground">Assigned Learners</p>
          <Badge variant="secondary" className="text-[10px]">{mockNewHires.length} assigned</Badge>
        </div>
      </div>

      <div className="space-y-4">
        {mockNewHires.map((hire, i) => (
          <motion.div
            key={hire.user.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-xl border border-border bg-background p-4"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shrink-0">
                {hire.user.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">{hire.user.name}</p>
                  <Badge variant="outline" className="text-[9px] text-success border-success/30">Assigned</Badge>
                </div>
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

            {/* Training status */}
            <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
              <Target className="h-3 w-3 text-accent" />
              <span className="text-[10px] text-muted-foreground">
                {steps.length} chapters · Pass threshold {program.assessmentPassPercentage}% · Adaptive skipping enabled
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

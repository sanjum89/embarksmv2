import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Target, AlertTriangle, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { mockTeamMembers, mockTeamProgress, mockSkillTargets } from "@/data/mock";
import { cn } from "@/lib/utils";

export default function ManagerView() {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const teamLearners = mockTeamMembers.filter((m) => m.role === "learner");
  const progress = selectedMember
    ? mockTeamProgress.filter((tp) => tp.user.id === selectedMember)
    : mockTeamProgress;

  const statusIcons = {
    on_track: <TrendingUp className="h-3.5 w-3.5 text-success" />,
    at_risk: <AlertTriangle className="h-3.5 w-3.5 text-warning" />,
    completed: <CheckCircle2 className="h-3.5 w-3.5 text-success" />,
  };

  const statusLabels = {
    on_track: "On Track",
    at_risk: "At Risk",
    completed: "Completed",
  };

  const statusColors = {
    on_track: "text-success",
    at_risk: "text-warning",
    completed: "text-success",
  };

  const stats = {
    totalLearners: teamLearners.length,
    atRisk: mockTeamProgress.filter((tp) => tp.status === "at_risk").length,
    completed: mockTeamProgress.filter((tp) => tp.status === "completed").length,
  };

  return (
    <div>
      <AppHeader title="Manager Dashboard" />
      <div className="p-6 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h3 className="font-display text-2xl font-bold text-foreground">Team Overview</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor your team's learning progress and identify who needs support.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          {[
            { label: "Team Members", value: stats.totalLearners, icon: Users, color: "text-foreground" },
            { label: "At Risk", value: stats.atRisk, icon: AlertTriangle, color: "text-warning" },
            { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-success" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-card border border-border p-4 shadow-card">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={cn("h-4 w-4", stat.color)} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className={cn("font-display text-2xl font-bold", stat.color)}>{stat.value}</p>
            </div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Team member list */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <h4 className="font-display text-sm font-semibold text-foreground mb-3">Team</h4>
            <div className="space-y-1.5">
              <button
                onClick={() => setSelectedMember(null)}
                className={cn(
                  "w-full rounded-lg px-3 py-2.5 text-left text-sm transition-all",
                  !selectedMember
                    ? "bg-accent/10 text-accent font-medium"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                All Members
              </button>
              {teamLearners.map((member) => (
                <button
                  key={member.id}
                  onClick={() => setSelectedMember(member.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-all",
                    selectedMember === member.id
                      ? "bg-accent/10 text-accent font-medium"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs font-medium text-foreground">
                    {member.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <span className="truncate">{member.name}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Progress table */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-3"
          >
            <h4 className="font-display text-sm font-semibold text-foreground mb-3">
              {selectedMember ? `${teamLearners.find((m) => m.id === selectedMember)?.name}'s Progress` : "All Assignments"}
            </h4>
            <div className="rounded-xl bg-card border border-border shadow-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Learner</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Skill Target</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Progress</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {progress.map((tp, i) => {
                    const target = mockSkillTargets.find((st) => st.id === tp.skillTargetId);
                    return (
                      <tr key={`${tp.user.id}-${tp.skillTargetId}`} className="border-b border-border last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-[10px] font-medium text-foreground">
                              {tp.user.name.split(" ").map((n) => n[0]).join("")}
                            </div>
                            <span className="text-sm text-foreground">{tp.user.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-foreground">{target?.title ?? tp.skillTargetId}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 rounded-full bg-secondary overflow-hidden">
                              <div
                                className="h-full rounded-full gradient-accent"
                                style={{ width: `${tp.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{tp.progress}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex items-center gap-1 text-xs font-medium", statusColors[tp.status])}>
                            {statusIcons[tp.status]}
                            {statusLabels[tp.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {new Date(tp.lastActivity).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {progress.length === 0 && (
                <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                  No assignments found.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useChartColors } from "@/hooks/useChartColors";
import { BarChart3, TrendingUp, User, Filter } from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import {
  mockTeamMembers,
  mockPeopleGraphSignals,
  mockSkillTargets,
} from "@/data/mock";
import { cn } from "@/lib/utils";

export default function PeopleGraph() {
  const [selectedUser, setSelectedUser] = useState("u1");
  const colors = useChartColors();
  const learners = mockTeamMembers.filter((m) => m.role === "learner");

  // Radar data: avg score per skill target for selected user
  const radarData = useMemo(() => {
    const userSignals = mockPeopleGraphSignals.filter(
      (s) => s.userId === selectedUser && !s.excludeFromGraph
    );
    return mockSkillTargets.map((st) => {
      const signals = userSignals.filter((s) => s.skillTargetId === st.id);
      const avg = signals.length > 0 ? Math.round(signals.reduce((sum, s) => sum + s.value, 0) / signals.length) : 0;
      return { skill: st.title.split(":")[0].trim(), score: avg, fullMark: 100 };
    });
  }, [selectedUser]);

  // Bar chart: compare all learners per skill target
  const comparisonData = useMemo(() => {
    return mockSkillTargets.map((st) => {
      const row: Record<string, string | number> = { skill: st.title.split(":")[0].trim() };
      learners.forEach((learner) => {
        const signals = mockPeopleGraphSignals.filter(
          (s) => s.userId === learner.id && s.skillTargetId === st.id && !s.excludeFromGraph
        );
        row[learner.name.split(" ")[0]] =
          signals.length > 0
            ? Math.round(signals.reduce((sum, s) => sum + s.value, 0) / signals.length)
            : 0;
      });
      return row;
    });
  }, []);

  // Signal timeline
  const userSignals = mockPeopleGraphSignals
    .filter((s) => s.userId === selectedUser && !s.excludeFromGraph)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const excludedCount = mockPeopleGraphSignals.filter(
    (s) => s.userId === selectedUser && s.excludeFromGraph
  ).length;

  const signalTypeLabels = {
    assessment_score: "Assessment",
    role_play_rating: "Role Play",
    module_completion: "Module",
  };

  const chartColors = [colors.accent, colors.info, colors.success, colors.destructive];

  return (
    <div>
      
      <div className="p-6 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h3 className="font-display text-2xl font-bold text-foreground">People Graph</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Competency signals and learning analytics across your team.
          </p>
        </motion.div>

        {/* Learner selector */}
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          {learners.map((learner) => (
            <button
              key={learner.id}
              onClick={() => setSelectedUser(learner.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                selectedUser === learner.id
                  ? "bg-accent/10 text-accent ring-1 ring-accent/30"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-[10px] font-medium">
                {learner.name.split(" ").map((n) => n[0]).join("")}
              </div>
              {learner.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Radar chart */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-xl bg-card border border-border p-5 shadow-card"
          >
            <h4 className="font-display text-sm font-semibold text-foreground mb-4">
              Competency Radar
            </h4>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke={colors.grid} />
                <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: colors.tickFill }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: colors.tickFill }} />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke={colors.accent}
                  fill={colors.accent}
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Comparison bar chart */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl bg-card border border-border p-5 shadow-card"
          >
            <h4 className="font-display text-sm font-semibold text-foreground mb-4">
              Team Comparison
            </h4>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis dataKey="skill" tick={{ fontSize: 11, fill: colors.tickFill }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: colors.tickFill }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: colors.tooltipBg,
                    border: `1px solid ${colors.tooltipBorder}`,
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "inherit",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                {learners.map((learner, i) => (
                  <Bar
                    key={learner.id}
                    dataKey={learner.name.split(" ")[0]}
                    fill={chartColors[i % chartColors.length]}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Signal timeline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl bg-card border border-border p-5 shadow-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-display text-sm font-semibold text-foreground">
              Signal Timeline
            </h4>
            {excludedCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {excludedCount} private signal{excludedCount > 1 ? "s" : ""} excluded
              </span>
            )}
          </div>

          {userSignals.length > 0 ? (
            <div className="space-y-2">
              {userSignals.map((signal) => {
                const target = mockSkillTargets.find((st) => st.id === signal.skillTargetId);
                return (
                  <div
                    key={signal.id}
                    className="flex items-center gap-4 rounded-lg border border-border p-3"
                  >
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                      signal.value >= 80 ? "bg-success/15 text-success" :
                      signal.value >= 60 ? "bg-warning/15 text-warning" :
                      "bg-destructive/15 text-destructive"
                    )}>
                      {signal.value}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {target?.title ?? signal.skillTargetId}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {signalTypeLabels[signal.signalType]} ·{" "}
                        {new Date(signal.timestamp).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              No signals recorded yet.
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

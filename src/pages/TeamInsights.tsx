import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useChartColors } from "@/hooks/useChartColors";
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

import { useUser } from "@/contexts/UserContext";
import { useAccount } from "@/contexts/AccountContext";
import { getDirectReports as getDirectReportsV2 } from "@/lib/accountSelectors";
import { getDirectReports as getDirectReportsLegacy } from "@/lib/accountHierarchy";
import { deriveRadarSkills } from "@/lib/skillUtils";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/layout/PageHeader";
import PageBody from "@/components/layout/PageBody";
import { useModeEyebrow } from "@/components/layout/useModeEyebrow";

export default function TeamInsights() {
  const { user } = useUser();
  const { activeAccount, normalizedAccount } = useAccount();
  const colors = useChartColors();
  const eyebrow = useModeEyebrow();

  // Use normalized selectors when available, fallback to legacy
  const profileData = normalizedAccount?.profileData ?? activeAccount?.data?.profileData ?? {};

  const teamMembers = useMemo(() => {
    if (normalizedAccount) {
      return getDirectReportsV2(normalizedAccount, user.id);
    }
    const employees = activeAccount?.data?.employees ?? [];
    return getDirectReportsLegacy(user.id, employees);
  }, [user.id, normalizedAccount, activeAccount]);

  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const activeSelectedUser = selectedUser && teamMembers.some((m) => m.id === selectedUser)
    ? selectedUser
    : teamMembers[0]?.id ?? null;

  const profile = activeSelectedUser ? profileData[activeSelectedUser] : null;

  // Radar data from My 360 profile: role skills current vs required
  const radarData = useMemo(() => {
    if (!profile) return [];
    return deriveRadarSkills(profile.roleSkillsCurrent, profile.roleSkillsRequired);
  }, [profile]);

  // Project skills radar
  const projectRadarData = useMemo(() => {
    if (!profile) return [];
    return deriveRadarSkills(profile.projectSkillsCurrent, profile.projectSkillsRequired);
  }, [profile]);

  // Comparison bar chart: all team members' role skills avg proficiency
  const comparisonData = useMemo(() => {
    const allSkills = new Set<string>();
    teamMembers.forEach((m) => {
      const p = profileData[m.id];
      if (p) p.roleSkillsRequired.forEach((s) => allSkills.add(s.skill_name));
    });

    const profMap: Record<string, number> = {
      Beginner: 1, Intermediate: 2, Advanced: 3, Expert: 4, Master: 5,
    };

    return Array.from(allSkills).map((skill) => {
      const row: Record<string, string | number> = {
        skill: skill.length > 18 ? skill.slice(0, 16) + "…" : skill,
      };
      teamMembers.forEach((m) => {
        const p = profileData[m.id];
        const entry = p?.roleSkillsCurrent.find((s) => s.skill_name === skill);
        row[m.name.split(" ")[0]] = entry ? profMap[entry.proficiency] || 0 : 0;
      });
      return row;
    });
  }, [teamMembers, profileData]);

  const chartColors = [colors.accent, colors.info, colors.success, colors.destructive];

  if (teamMembers.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto">
        <PageHeader eyebrow={eyebrow} title="Team Insights" back />
        <PageBody>
          <p className="text-sm text-muted-foreground">
            No direct reports found for {user.name}.
          </p>
        </PageBody>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <PageHeader
        eyebrow={eyebrow}
        title="Team Insights"
        subtitle="Competency profiles and skill gaps across your team members."
        back
      />
      <PageBody>

        {/* Team member selector */}
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          {teamMembers.map((member) => (
            <button
              key={member.id}
              onClick={() => setSelectedUser(member.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                activeSelectedUser === member.id
                  ? "bg-accent/10 text-accent ring-1 ring-accent/30"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-[0.65rem] font-medium">
                {member.name.split(" ").map((n) => n[0]).join("")}
              </div>
              {member.name}
            </button>
          ))}
        </div>

        {profile ? (
          <>
            {/* Profile summary */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-card border border-border p-5 shadow-card mb-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {teamMembers.find((m) => m.id === activeSelectedUser)?.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="font-display text-sm font-semibold text-foreground">
                    {teamMembers.find((m) => m.id === activeSelectedUser)?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{profile.title} · {profile.location}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mt-2">{profile.summary}</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Role skills radar */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="rounded-xl bg-card border border-border p-5 shadow-card"
              >
                <h4 className="font-display text-sm font-semibold text-foreground mb-4">
                  Role Skills
                </h4>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={colors.grid} />
                    <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10, fill: colors.tickFill }} />
                    <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fontSize: 10, fill: colors.tickFill }} />
                    <Radar name="Current" dataKey="score" stroke={colors.accent} fill={colors.accent} fillOpacity={0.2} strokeWidth={2} />
                    <Radar name="Target" dataKey="target" stroke={colors.info} fill={colors.info} fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="4 4" />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                  </RadarChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Project skills radar */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-xl bg-card border border-border p-5 shadow-card"
              >
                <h4 className="font-display text-sm font-semibold text-foreground mb-4">
                  Project Skills
                </h4>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={projectRadarData}>
                    <PolarGrid stroke={colors.grid} />
                    <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10, fill: colors.tickFill }} />
                    <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fontSize: 10, fill: colors.tickFill }} />
                    <Radar name="Current" dataKey="score" stroke={colors.accent} fill={colors.accent} fillOpacity={0.2} strokeWidth={2} />
                    <Radar name="Target" dataKey="target" stroke={colors.info} fill={colors.info} fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="4 4" />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                  </RadarChart>
                </ResponsiveContainer>
              </motion.div>
            </div>

            {/* Team comparison bar chart */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-xl bg-card border border-border p-5 shadow-card"
            >
              <h4 className="font-display text-sm font-semibold text-foreground mb-4">
                Team Comparison — Role Skills
              </h4>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                  <XAxis dataKey="skill" tick={{ fontSize: 10, fill: colors.tickFill }} angle={-25} textAnchor="end" height={60} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: colors.tickFill }} ticks={[1, 2, 3, 4, 5]} tickFormatter={(v) => ["", "B", "I", "A", "E", "M"][v] || ""} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: colors.tooltipBg,
                      border: `1px solid ${colors.tooltipBorder}`,
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "inherit",
                    }}
                    formatter={(value: number) => ["", "Beginner", "Intermediate", "Advanced", "Expert", "Master"][value] || "—"}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  {teamMembers.map((member, i) => (
                    <Bar
                      key={member.id}
                      dataKey={member.name.split(" ")[0]}
                      fill={chartColors[i % chartColors.length]}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </>
        ) : (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            No profile data available for this team member.
          </div>
        )}
      </PageBody>
    </div>
  );
}

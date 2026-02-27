import { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  MapPin,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Info,
  ExternalLink,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { AppHeader } from "@/components/layout/AppHeader";
import { useUser } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";

/* ─── Mock profile data ─── */
const profileData = {
  title: "Senior Director, Product Management",
  location: "San Francisco, CA",
  manager: "Hitesh Dholakia",
  yearsExperience: 14,
  coreSkills: [
    "Product Strategy",
    "Stakeholder Management",
    "Product Ops & Scaling",
    "Prioritization Rigor",
    "Lovable AI",
    "FigJam",
    "Figma Wireframing",
    "Figma Make",
  ],
  otherSkills: [
    { name: "Python", level: "I", year: "'24" },
    { name: "SQL", level: "I", year: "'25" },
    { name: "OpenKnime - Analytics", level: "A", year: "'25" },
  ],
};

const radarSkills = [
  { skill: "Product Strategy", score: 85, fullMark: 100 },
  { skill: "Stakeholder Mgmt", score: 78, fullMark: 100 },
  { skill: "Product Ops", score: 62, fullMark: 100 },
  { skill: "Prioritization", score: 70, fullMark: 100 },
  { skill: "Figma Wireframing", score: 45, fullMark: 100 },
  { skill: "Figma Make", score: 55, fullMark: 100 },
  { skill: "FigJam", score: 60, fullMark: 100 },
  { skill: "Lovable AI", score: 40, fullMark: 100 },
];

const skillGaps = [
  { current: "Product Strategy", currentLevel: "E", target: "Figma Wireframing", targetLevel: "I" },
  { current: "Stakeholder Mgmt", currentLevel: "E", target: "Figma Make", targetLevel: "B" },
  { current: "Product Ops", currentLevel: "A", target: "FigJam", targetLevel: "B" },
  { current: "Prioritization", currentLevel: "A", target: "Lovable AI", targetLevel: "I" },
];

const tabs = ["Role & Skills", "Career Timeline", "Growth Path"] as const;

export default function My360() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Role & Skills");
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [gapView, setGapView] = useState<"Gap View" | "Action Plan">("Gap View");

  const visibleCoreSkills = profileData.coreSkills.slice(0, 4);
  const extraCoreCount = profileData.coreSkills.length - 4;
  const extraOtherCount = 24;

  return (
    <div>
      <AppHeader title="My 360" />
      <div className="p-6 max-w-6xl mx-auto">
        {/* Page title */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-2xl font-bold text-foreground">My 360</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Your profile and how to progress
              </p>
            </div>
            <button className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
              Manage Profile
            </button>
          </div>
        </motion.div>

        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl bg-card border border-border p-6 shadow-card mb-6"
        >
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-secondary text-lg font-bold text-foreground">
              {user.name.split(" ").map((n) => n[0]).join("")}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-display text-xl font-bold text-foreground">{user.name}</h4>
              <p className="text-sm text-muted-foreground">{profileData.title}</p>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {profileData.location}
                </span>
                <span>
                  Manager:{" "}
                  <span className="underline text-foreground">{profileData.manager}</span>
                </span>
              </div>
              <button
                onClick={() => setShowMoreDetails(!showMoreDetails)}
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-foreground underline"
              >
                More Details
                {showMoreDetails ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            {/* Years badge */}
            <div className="shrink-0 flex flex-col items-center justify-center rounded-xl border border-border px-5 py-3">
              <span className="font-display text-2xl font-bold text-foreground">
                {profileData.yearsExperience}
              </span>
              <span className="text-xs text-muted-foreground">Years</span>
            </div>
          </div>

          {/* Core Skills */}
          <div className="mt-5">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-sm font-semibold text-foreground">Core Skills</span>
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="flex flex-wrap gap-2">
              {visibleCoreSkills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                >
                  {skill}
                </span>
              ))}
              {extraCoreCount > 0 && (
                <span className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground">
                  +{extraCoreCount} more
                </span>
              )}
            </div>
          </div>

          {/* Other Skills */}
          <div className="mt-4">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-sm font-semibold text-foreground">Other Skills</span>
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="flex flex-wrap gap-2">
              {profileData.otherSkills.map((skill) => (
                <span
                  key={skill.name}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground"
                >
                  {skill.name}
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-secondary text-[10px] font-bold text-muted-foreground">
                    {skill.level}
                  </span>
                  <span className="text-muted-foreground">{skill.year}</span>
                </span>
              ))}
              <span className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground">
                +{extraOtherCount} more
              </span>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex gap-1 rounded-xl bg-secondary p-1 w-fit">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium transition-all",
                  activeTab === tab
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            {/* Role Snapshot */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="rounded-xl bg-card border border-border p-5 shadow-card"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-display text-sm font-semibold text-foreground">
                  Role Snapshot
                </h4>
                <button className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Explore <ExternalLink className="h-3 w-3" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Own the product vision and end-to-end execution of the WFAI
                Onboarding use case. Translate complex enterprise workforce
                challenges into scalable, AI-driven solutions.
              </p>
            </motion.div>

            {/* Project Snapshot */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-xl bg-card border border-border p-5 shadow-card"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-display text-sm font-semibold text-foreground">
                  Project Snapshot
                </h4>
                <button className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Explore <ExternalLink className="h-3 w-3" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Currently assigned to the WFAI Onboarding project, focusing on
                building dynamic People Graph across skills, performance, and
                training data to enable real-time deployment decisions.
              </p>
            </motion.div>

            {/* Skills & Gap */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="rounded-xl bg-card border border-border p-5 shadow-card"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-display text-sm font-semibold text-foreground">
                  Skills & Gap
                </h4>
                <div className="flex items-center gap-2">
                  <select className="rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground">
                    <option>Project</option>
                  </select>
                  <select className="rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground">
                    <option>Gap</option>
                  </select>
                  <button className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                    Explore <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="space-y-2.5">
                {skillGaps.map((gap, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1 font-medium text-foreground min-w-[110px] truncate">
                      {gap.current}
                      <span className="flex h-4 w-4 items-center justify-center rounded bg-muted text-[10px] font-bold text-muted-foreground">
                        {gap.currentLevel}
                      </span>
                    </span>
                    <span className="text-muted-foreground">{">>"}</span>
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 font-medium text-foreground min-w-[110px] truncate">
                      {gap.target}
                      <span className="flex h-4 w-4 items-center justify-center rounded bg-muted text-[10px] font-bold text-muted-foreground">
                        {gap.targetLevel}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right column — Radar chart */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="rounded-xl bg-card border border-border p-5 shadow-card"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-1 rounded-lg bg-secondary p-0.5">
                  {(["Gap View", "Action Plan"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setGapView(v)}
                      className={cn(
                        "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                        gapView === v
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={340}>
                <RadarChart data={radarSkills}>
                  <PolarGrid stroke="hsl(220, 16%, 90%)" />
                  <PolarAngleAxis
                    dataKey="skill"
                    tick={{ fontSize: 10, fill: "hsl(220, 10%, 46%)" }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="hsl(220, 16%, 60%)"
                    fill="hsl(220, 16%, 70%)"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

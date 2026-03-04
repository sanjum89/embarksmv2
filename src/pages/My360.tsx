import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  ChevronDown,
  ChevronUp,
  Info,
  ExternalLink,
  RadarIcon,
  BarChart3,
} from "lucide-react";
import { useVisibleCount } from "@/hooks/useVisibleCount";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

import { AIChatPanel, AIChatPanelHandle } from "@/components/chat/AIChatPanel";
import { CareerTimeline } from "@/components/my360/CareerTimeline";
import { useUser } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";
import { useChartColors } from "@/hooks/useChartColors";

/* ─── Mock profile data ─── */
const profileData = {
  title: "Senior Director, Product Management",
  location: "San Francisco, CA",
  manager: "Hitesh Dholakia",
  yearsExperience: 14,
  summary:
    "Developer turned product and sales leader with 12+ years of experience building, and commercializing SaaS platforms. Co-founded and grew a bootstrapped B2B SaaS startup that managed client workflows exceeding $200M. Closed multi-year contracts with leading e-commerce and BFSI enterprises, including Flipkart, Tata, AngelOne and ICICI.",
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

const proficiencyLabels = ["", "B", "I", "A", "E", "M"];

const radarSkills = [
  { skill: "Product Strategy", score: 80, target: 80 },
  { skill: "Stakeholder Mgmt", score: 80, target: 80 },
  { skill: "Product Ops", score: 60, target: 80 },
  { skill: "Prioritization", score: 60, target: 80 },
  { skill: "Figma Wireframing", score: 40, target: 60 },
  { skill: "Figma Make", score: 20, target: 40 },
  { skill: "FigJam", score: 20, target: 40 },
  { skill: "Lovable AI", score: 40, target: 60 },
];

const skillGapRows = [
  { left: { skill: "Product Stra…", level: "E", target: "✓", hasSkill: true },  right: { skill: "Figma Wiref…", level: "I", target: "A", hasSkill: true } },
  { left: { skill: "Stakeholder…", level: "E", target: "✓", hasSkill: true },   right: { skill: "Figma Make", level: "B", target: null, hasSkill: false } },
  { left: { skill: "Product Ops…", level: "A", target: "E", hasSkill: true },   right: { skill: "FigJam", level: "B", target: null, hasSkill: false } },
  { left: { skill: "Prioritization…", level: "A", target: "E", hasSkill: true }, right: { skill: "Lovable AI", level: "I", target: null, hasSkill: false } },
];

const tabs = ["Role & Skills", "Career Timeline", "Growth Path"] as const;

const ROLE_EXPLORE_PROMPT =
  "Tell me more about my current role, responsibilities, and what's expected of me.";

const ROLE_EXPLORE_RESPONSE = `Here's an overview of your role\n\n## Senior Director, Product Management\n\nAs **Senior Director of Product Management**, you are responsible for driving product strategy and execution across the WFAI platform.\n\n## Key Responsibilities\n\n- **Vision & Strategy:** Define and communicate the product vision aligned with enterprise workforce intelligence goals.\n- **Cross-functional Leadership:** Partner with Engineering, Design, Data Science, and Sales to deliver scalable AI-driven solutions.\n- **Stakeholder Management:** Engage with C-level sponsors, enterprise clients (Flipkart, Tata, ICICI), and internal leadership.\n- **Team Development:** Mentor and grow a team of product managers, fostering a culture of experimentation and data-driven decisions.\n\n## Success Metrics\n\n- Product adoption and NPS across enterprise accounts\n- Time-to-value for new client onboarding\n- Revenue impact from product-led growth initiatives`;

const PROJECT_EXPLORE_PROMPT =
  "Give me more details on the project I am currently assigned to, including objectives, stakeholders, and latest updates.";

const PROJECT_EXPLORE_RESPONSE = `Here is a quick summary for you\n\n## Overview\n\nYou're working on **WFAI — an agentic workforce intelligence platform** that builds a dynamic People Graph across skills, performance, and training data. **The goal** is to enable real-time deployment and upskilling decisions using AI-driven workforce insights at scale.\n\n## Opportunity\n\nThis is a chance to define a new category beyond LMS and static skills tools—by operationalising workforce intelligence across the enterprise sector.\n\n## Responsibilities\n\n- Own the product vision and end-to-end execution of the WFAI Onboarding use case.\n- Translate complex enterprise workforce challenges into scalable, AI-driven solutions.`;

export default function My360() {
  const { user } = useUser();
  const chatRef = useRef<AIChatPanelHandle>(null);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Role & Skills");
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [gapView, setGapView] = useState<"Gap View" | "Action Plan">("Gap View");
  const colors = useChartColors();

  const { containerRef: otherRef, visibleCount: otherVisible } = useVisibleCount(profileData.otherSkills.length);

  const otherExtra = profileData.otherSkills.length - otherVisible + 24;

  const handleRoleExploreClick = () => {
    chatRef.current?.sendMessage(ROLE_EXPLORE_PROMPT, ROLE_EXPLORE_RESPONSE, [
      { label: "Growth opportunities" },
      { label: "Key stakeholders" },
      { label: "Expected outcomes" },
    ]);
  };

  const handleProjectExploreClick = () => {
    chatRef.current?.sendMessage(PROJECT_EXPLORE_PROMPT, PROJECT_EXPLORE_RESPONSE, [
      { label: "Explore Further" },
      { label: "Your impact so far" },
      { label: "Skills to build" },
    ]);
  };

  return (
    <div>
      
      <div className="flex">
        <div className="flex-1 p-4 lg:p-5 max-w-5xl mx-auto">
          {/* Page title */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">My 360</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Your profile and how to progress
                </p>
              </div>
              <button className="rounded-lg border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
                Manage Profile
              </button>
            </div>
          </motion.div>

          {/* Profile card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-xl bg-card border border-border p-5 shadow-card mb-4"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full gradient-accent text-base font-bold text-accent-foreground">
                {user.name.split(" ").map((n) => n[0]).join("")}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-display text-lg font-bold text-foreground">{user.name}</h4>
                <p className="text-sm text-muted-foreground">{profileData.title}</p>
                <div className="flex items-center gap-4 mt-0.5 text-sm text-muted-foreground">
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
                  className="mt-1.5 inline-flex items-center gap-1 text-sm font-medium text-foreground underline"
                >
                  More Details
                  {showMoreDetails ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              <div className="shrink-0 flex flex-col items-center justify-center rounded-xl border-2 border-accent/30 bg-accent/5 px-5 py-2.5">
                <span className="font-display text-2xl font-bold text-accent">
                  {profileData.yearsExperience}
                </span>
                <span className="text-xs text-muted-foreground">Years</span>
              </div>
            </div>

            {/* More Details expandable */}
            <AnimatePresence>
              {showMoreDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 rounded-lg bg-muted/50 border border-border p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="rounded-full border border-border px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        Summarised by WFAI
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {profileData.summary}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Core Skills */}
            <div className="mt-4">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-sm font-semibold text-foreground">Core Skills</span>
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="flex flex-nowrap gap-2">
                {profileData.coreSkills.slice(0, 4).map((skill, i) => {
                  const skillColors = [
                    "bg-accent/10 text-accent border border-accent/20",
                    "bg-info/10 text-info border border-info/20",
                    "bg-success/10 text-success border border-success/20",
                    "bg-primary/10 text-primary border border-primary/20",
                  ];
                  return (
                    <span
                      key={skill}
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap shrink-0",
                        skillColors[i % skillColors.length]
                      )}
                    >
                      {skill}
                    </span>
                  );
                })}
                {profileData.coreSkills.length > 4 && (
                  <span className="rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground whitespace-nowrap shrink-0">
                    +{profileData.coreSkills.length - 4} more
                  </span>
                )}
              </div>
            </div>

            {/* Other Skills */}
            <div className="mt-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-sm font-semibold text-foreground">Other Skills</span>
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div ref={otherRef} className="relative flex flex-nowrap gap-2" style={{ overflow: 'visible' }}>
                {profileData.otherSkills.slice(0, otherVisible).map((skill) => {
                  const levelMap: Record<string, string> = { B: "Basic", I: "Intermediate", A: "Advanced", E: "Expert", M: "Master" };
                  const yearFull = skill.year.replace("'", "20");
                  return (
                    <div key={skill.name} className="relative group shrink-0">
                      <span className="inline-flex items-center rounded-full border border-border pl-4 pr-1.5 py-2 text-sm font-medium text-foreground gap-1.5 whitespace-nowrap cursor-default">
                        <span>{skill.name}</span>
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-bold text-muted-foreground">
                          {skill.level}
                        </span>
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-bold text-muted-foreground">
                          {skill.year}
                        </span>
                      </span>
                      {/* Hover card */}
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-50">
                        <div className="rounded-xl bg-card border border-border p-4 shadow-card-hover min-w-[200px]">
                          <p className="font-display text-sm font-bold text-foreground">{skill.name}</p>
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Proficiency</span>
                              <span className="font-medium text-foreground">{levelMap[skill.level] || skill.level}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Last assessed</span>
                              <span className="font-medium text-foreground">{yearFull}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-center">
                          <div className="h-2 w-2 rotate-45 bg-card border-r border-b border-border -mt-1" />
                        </div>
                      </div>
                    </div>
                  );
                })}
                {otherExtra > 0 && (
                  <span data-overflow="true" className="rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground whitespace-nowrap shrink-0">
                    +{otherExtra} more
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-4"
          >
            <div className="flex gap-1 rounded-xl bg-secondary p-1 w-fit">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "rounded-lg px-4 py-1.5 text-sm font-medium transition-all",
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

          {/* Tab Content */}
          {activeTab === "Role & Skills" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left column */}
              <div className="space-y-4">
                {/* Role Snapshot */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 }}
                  className="rounded-xl bg-card border border-border p-4 shadow-card border-l-4 border-l-info"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-display text-sm font-semibold text-foreground">Role Snapshot</h4>
                    <button
                      onClick={handleRoleExploreClick}
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Explore <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Own the product vision and end-to-end execution of the WFAI Onboarding use case. Translate complex enterprise workforce challenges into scalable, AI-driven solutions.
                  </p>
                </motion.div>

                {/* Project Snapshot */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="rounded-xl bg-card border border-border p-4 shadow-card border-l-4 border-l-success"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-display text-sm font-semibold text-foreground">Project Snapshot</h4>
                    <button
                      onClick={handleProjectExploreClick}
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Explore <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Currently assigned to the WFAI Onboarding project, focusing on building dynamic People Graph across skills, performance, and training data to enable real-time deployment decisions.
                  </p>
                </motion.div>

                {/* Skills & Gap */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 }}
                  className="rounded-xl bg-card border border-border p-4 shadow-card border-l-4 border-l-accent"
                >
                  <div className="flex items-center justify-between mb-3">
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
                  <div className="space-y-3 overflow-x-auto">
                    {skillGapRows.map((row, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs">
                        <span className="inline-flex items-center rounded-full border border-border pl-3 pr-1 py-1 font-medium text-foreground gap-1.5 min-w-0">
                          <span className="truncate">{row.left.skill}</span>
                          <span className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold shrink-0",
                            row.left.target === "✓" ? "bg-success/15 text-success" : "bg-accent/15 text-accent"
                          )}>
                            {row.left.level}
                          </span>
                        </span>
                        <span className="text-muted-foreground text-[10px] shrink-0">{">>"}</span>
                        <span className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold shrink-0",
                          row.left.target === "✓" ? "bg-success/15 text-success" : "bg-accent/15 text-accent"
                        )}>
                          {row.left.target === "✓" ? "✓" : row.left.target}
                        </span>

                        <span className={cn(
                          "inline-flex items-center rounded-full pl-3 pr-1 py-1 font-medium gap-1.5 min-w-0",
                          row.right.hasSkill
                            ? "border border-border text-foreground"
                            : "border border-dashed border-muted-foreground/40 text-muted-foreground"
                        )}>
                          <span className="truncate">{row.right.skill}</span>
                          <span className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold shrink-0",
                            row.right.hasSkill ? "bg-info/15 text-info" : "bg-warning/15 text-warning"
                          )}>
                            {row.right.level}
                          </span>
                        </span>
                        {row.right.target && (
                          <>
                            <span className="text-muted-foreground text-[10px] shrink-0">{">>"}</span>
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-info/15 text-[10px] font-bold text-info shrink-0">
                              {row.right.target}
                            </span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Right column — Radar chart */}
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 }}
                  className="rounded-xl bg-card border border-border p-4 shadow-card"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex gap-1 rounded-lg bg-secondary p-0.5">
                      {(["Gap View", "Action Plan"] as const).map((v) => (
                        <button
                          key={v}
                          onClick={() => setGapView(v)}
                          className={cn(
                            "rounded-md px-3 py-1 text-xs font-medium transition-all",
                            gapView === v
                              ? "bg-card text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-1">
                      <button className="rounded-lg border border-border p-1.5 text-foreground bg-card shadow-sm">
                        <RadarIcon className="h-4 w-4" />
                      </button>
                      <button className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                        <BarChart3 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={320}>
                    <RadarChart data={radarSkills}>
                      <PolarGrid stroke={colors.grid} />
                      <PolarAngleAxis
                        dataKey="skill"
                        tick={{ fontSize: 10, fill: colors.tickFill }}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tickCount={6}
                        tick={({ x, y, payload }) => {
                          const label = proficiencyLabels[Math.round(payload.value / 20)] || "";
                          if (!label) return <text />;
                          return (
                            <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={9} fill={colors.tickFill}>
                              {label}
                            </text>
                          );
                        }}
                        axisLine={false}
                      />
                      <Radar
                        name="Target"
                        dataKey="target"
                        stroke={colors.radarTargetStroke}
                        fill={colors.radarTargetFill}
                        fillOpacity={0.4}
                        strokeWidth={1.5}
                      />
                      <Radar
                        name="Current"
                        dataKey="score"
                        stroke={colors.radarCurrentStroke}
                        fill={colors.radarCurrentFill}
                        fillOpacity={0.3}
                        strokeWidth={1.5}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>
            </div>
          )}

          {activeTab === "Career Timeline" && <CareerTimeline />}

          {activeTab === "Growth Path" && (
            <div className="rounded-xl bg-card border border-border p-8 shadow-card text-center">
              <p className="text-sm text-muted-foreground">Growth Path content coming soon.</p>
            </div>
          )}
        </div>

        {/* AI Chat Panel */}
        <div className="w-[320px] shrink-0 border-l border-border h-screen sticky top-0">
          <AIChatPanel ref={chatRef} contextLabel="My 360 → Profile" />
        </div>
      </div>
    </div>
  );
}

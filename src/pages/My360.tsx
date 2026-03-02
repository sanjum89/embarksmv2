import { useState, useRef } from "react";
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
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { AppHeader } from "@/components/layout/AppHeader";
import { AIChatPanel, AIChatPanelHandle } from "@/components/chat/AIChatPanel";
import { useUser } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";

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

const PROJECT_EXPLORE_PROMPT =
  "Give me more details on the project I am currently assigned to, including objectives, stakeholders, and latest updates.";

const PROJECT_EXPLORE_RESPONSE = `Here is a quick summary for you

## Overview

You're working on **WFAI — an agentic workforce intelligence platform** that builds a dynamic People Graph across skills, performance, and training data. **The goal** is to enable real-time deployment and upskilling decisions using AI-driven workforce insights at scale.

## Opportunity

This is a chance to define a new category beyond LMS and static skills tools—by operationalising workforce intelligence across the enterprise sector.

## Responsibilities

- Own the product vision and end-to-end execution of the WFAI Onboarding use case.
- Translate complex enterprise workforce challenges into scalable, AI-driven solutions.`;

export default function My360() {
  const { user } = useUser();
  const chatRef = useRef<AIChatPanelHandle>(null);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Role & Skills");
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [gapView, setGapView] = useState<"Gap View" | "Action Plan">("Gap View");
  const [snapshotView, setSnapshotView] = useState<"Role" | "Project">("Role");

  const visibleCoreSkills = profileData.coreSkills.slice(0, 4);
  const extraCoreCount = profileData.coreSkills.length - 4;
  const extraOtherCount = 24;

  const handleExploreClick = () => {
    if (snapshotView === "Project") {
      chatRef.current?.sendMessage(PROJECT_EXPLORE_PROMPT, PROJECT_EXPLORE_RESPONSE, [
        { label: "Explore Further" },
        { label: "Your impact so far" },
        { label: "Skills to build" },
      ]);
    }
  };

  return (
    <div>
      <AppHeader title="My 360" />
      <div className="flex">
        <div className="flex-1 p-6 max-w-5xl mx-auto">
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

              <div className="shrink-0 flex flex-col items-center justify-center rounded-xl border border-border px-5 py-3">
                <span className="font-display text-2xl font-bold text-foreground">
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
                  <div className="mt-4 rounded-lg bg-muted/50 border border-border p-4">
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
              {/* Snapshot */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="rounded-xl bg-card border border-border p-5 shadow-card"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-display text-sm font-semibold text-foreground">Snapshot</h4>
                  <button
                    onClick={handleExploreClick}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Explore <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex gap-1 rounded-lg bg-secondary p-0.5 w-fit mb-3">
                  {(["Role", "Project"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setSnapshotView(v)}
                      className={cn(
                        "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                        snapshotView === v
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {snapshotView === "Role"
                    ? "Own the product vision and end-to-end execution of the WFAI Onboarding use case. Translate complex enterprise workforce challenges into scalable, AI-driven solutions."
                    : "Currently assigned to the WFAI Onboarding project, focusing on building dynamic People Graph across skills, performance, and training data to enable real-time deployment decisions."}
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
                <div className="space-y-3 overflow-x-auto">
                  {skillGapRows.map((row, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 font-medium text-foreground max-w-[120px] truncate">
                        {row.left.skill}
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                          {row.left.level}
                        </span>
                      </span>
                      <span className="text-muted-foreground text-xs shrink-0">{">>"}</span>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-foreground shrink-0">
                        {row.left.target === "✓" ? "✓" : row.left.target}
                      </span>

                      <span className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium max-w-[120px] truncate",
                        row.right.hasSkill
                          ? "bg-secondary text-foreground"
                          : "border border-dashed border-muted-foreground/40 text-muted-foreground"
                      )}>
                        {row.right.skill}
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                          {row.right.level}
                        </span>
                      </span>
                      {row.right.target && (
                        <>
                          <span className="text-muted-foreground text-xs shrink-0">{">>"}</span>
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-foreground shrink-0">
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
                  <div className="flex gap-1">
                    <button className="rounded-lg border border-border p-1.5 text-foreground bg-card shadow-sm">
                      <RadarIcon className="h-4 w-4" />
                    </button>
                    <button className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                      <BarChart3 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarSkills}>
                    <PolarGrid stroke="hsl(220, 16%, 88%)" />
                    <PolarAngleAxis
                      dataKey="skill"
                      tick={{ fontSize: 10, fill: "hsl(220, 10%, 46%)" }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tickCount={6}
                      tick={({ x, y, payload }) => {
                        const label = proficiencyLabels[Math.round(payload.value / 20)] || "";
                        if (!label) return <text />;
                        return (
                          <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={9} fill="hsl(220, 10%, 46%)">
                            {label}
                          </text>
                        );
                      }}
                      axisLine={false}
                    />
                    <Radar
                      name="Target"
                      dataKey="target"
                      stroke="hsl(220, 16%, 55%)"
                      fill="hsl(220, 16%, 65%)"
                      fillOpacity={0.4}
                      strokeWidth={1.5}
                    />
                    <Radar
                      name="Current"
                      dataKey="score"
                      stroke="hsl(220, 16%, 70%)"
                      fill="hsl(220, 16%, 80%)"
                      fillOpacity={0.3}
                      strokeWidth={1.5}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </motion.div>
            </div>
          </div>
        </div>

        {/* AI Chat Panel */}
        <div className="w-[320px] shrink-0 border-l border-border h-[calc(100vh-64px)] sticky top-16">
          <AIChatPanel ref={chatRef} contextLabel="My 360 → Profile" />
        </div>
      </div>
    </div>
  );
}

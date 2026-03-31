import React, { useState, useRef, useMemo, useEffect } from "react";
import { Tooltip as UiTooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { FirstLoginTour } from "@/components/onboarding/FirstLoginTour";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  ChevronDown,
  ChevronUp,
  Info,
  ExternalLink,
  RadarIcon,
  BarChart3,
  Users,
  BookOpen,
} from "lucide-react";
import { ResponsivePillRow } from "@/components/my360/ResponsivePillRow";
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


import { CareerTimeline } from "@/components/my360/CareerTimeline";
import { ActionPlanView } from "@/components/my360/ActionPlanView";
import { useUser } from "@/contexts/UserContext";
import { useAccount } from "@/contexts/AccountContext";
import { profileDataByUser as staticProfileData } from "@/data/mock";
import { getProfileData, getEmployeeCohorts, getManagedCohorts, getCohortAssignment } from "@/lib/accountSelectors";
import { cn } from "@/lib/utils";
import { useChartColors } from "@/hooks/useChartColors";
import { proficiencyShort } from "@/types/learning";
import { deriveGapsFromEmployee, deriveRadarFromEmployee, deriveFullRoleGaps, deriveFullRoleRadar, deriveSkillGapRows } from "@/lib/skillUtils";

const proficiencyLabels = ["", "B", "I", "A", "E", "M"];

const tabs = ["Role & Skills", "Career Timeline", "Growth Path"] as const;

const ROLE_EXPLORE_PROMPT =
  "Tell me more about my current role, responsibilities, and what's expected of me.";

const FALLBACK_ROLE_EXPLORE_RESPONSE = `Here's an overview of your role

## Customer Support Executive L1

You work as a **Customer Support Executive L1**, responsible for handling first-line customer queries and delivering a smooth support experience. The role focuses on customer communication, issue understanding, guided troubleshooting, documentation, process adherence, and correct escalation.

## Key Responsibilities

- Handle incoming customer queries with empathy, clarity, and professionalism
- Understand the issue through the right probing and clarifying questions
- Provide basic troubleshooting and guided support at L1 level
- Document issue details, actions taken, and next steps accurately
- Follow customer verification, privacy, and support workflow guidelines
- Escalate cases correctly when they cannot be resolved at L1

## Success Metrics

- Communication quality
- Customer satisfaction
- Accuracy of documentation
- Resolution quality at L1
- Process and compliance adherence
- Escalation accuracy`;

const PROJECT_EXPLORE_PROMPT =
  "Give me more details on the project I am currently assigned to, including objectives, stakeholders, and latest updates.";

const PROJECT_EXPLORE_RESPONSE = `Here's a summary of your project

## Apple Support Program

You're working on the **Apple Support Program** — a customer support project focused on handling first-line Apple customer queries across account access, Apple ID, iCloud, product basics, device troubleshooting, billing questions, subscriptions, and service-related support. The goal is to provide clear, accurate, and empathetic L1 support while following the right workflows for documentation, verification, resolution, and escalation.

## Opportunity

This project gives you the opportunity to build strong expertise in one of the world's most recognized customer support environments, while developing both customer communication and technical troubleshooting skills. It is also a strong foundation for growing into more advanced Apple support or broader tech support roles.

## Responsibilities

- Handle first-line customer interactions across Apple product, account, and service-related queries
- Follow support workflows for issue clarification, knowledge base usage, case documentation, and correct escalation
- Deliver a high-quality customer experience through empathy, accuracy, and clear next-step guidance`;

type GapSource = "Role" | "Project";
type GapFilter = "All" | "Gap" | "No gap";

export default function My360() {
  const [showTour, setShowTour] = useState(false);
  const { user } = useUser();
  const { activeAccount, normalizedAccount } = useAccount();
  const chatRef = useRef<any>(null);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Role & Skills");
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [gapView, setGapView] = useState<"Gap View" | "Action Plan">("Gap View");
  const [chartMode, setChartMode] = useState<"radar" | "bar">("radar");
  const [gapSource, setGapSource] = useState<GapSource>("Project");
  const [gapFilter, setGapFilter] = useState<GapFilter>("All");
  const colors = useChartColors();

  // Clear chat when profile changes
  useEffect(() => {
    chatRef.current?.clearMessages();
  }, [user.id]);

  // Use normalized selector; for non-default accounts avoid static fallback
  const isDefaultAccount = normalizedAccount?.isDefault !== false;
  const profileData = (normalizedAccount ? getProfileData(normalizedAccount, user.id) : null)
    || activeAccount?.data?.profileData?.[user.id]
    || (isDefaultAccount ? staticProfileData[user.id] || staticProfileData["u1"] : null);

  // Cohorts data
  const memberCohorts = useMemo(() => {
    if (!normalizedAccount) return [];
    return getEmployeeCohorts(normalizedAccount, user.id);
  }, [normalizedAccount, user.id]);

  const managedCohorts = useMemo(() => {
    if (!normalizedAccount) return [];
    return getManagedCohorts(normalizedAccount, user.id);
  }, [normalizedAccount, user.id]);

  // Derived core skills from role skills current
  const coreSkillNames = useMemo(
    () => profileData?.roleSkillsCurrent?.map((s) => s.skill_name) || [],
    [profileData?.roleSkillsCurrent]
  );

  // Look up the employee's role from the catalog
  const employee = normalizedAccount?.employeesById[user.id];
  const role = employee?.roleId ? normalizedAccount?.rolesById?.[employee.roleId] : undefined;

  // Dynamic role snapshot text and explore response
  const roleSnapshotText = (role as any)?.snapshotText || profileData?.roleSnapshotText;
  const roleExploreResponse = (role as any)?.description || (role as any)?.detailedDescription || FALLBACK_ROLE_EXPLORE_RESPONSE;

  // Derived radar data based on gap source
  const radarSkills = useMemo(() => {
    if (!profileData) return [];
    if (gapSource === "Role") {
      return deriveFullRoleRadar(profileData.roleSkillsCurrent, profileData.roleSkillsRequired);
    }
    return deriveRadarFromEmployee(profileData.projectSkillsCurrent, profileData.projectSkillsRequired);
  }, [profileData, gapSource]);

  // Derived gap rows
  const allGapRows = useMemo(() => {
    if (!profileData) return [];
    const gaps = gapSource === "Role"
      ? deriveFullRoleGaps(profileData.roleSkillsCurrent || [], profileData.roleSkillsRequired || [])
      : deriveGapsFromEmployee(profileData.projectSkillsCurrent || [], profileData.projectSkillsRequired || []);
    return deriveSkillGapRows(gaps);
  }, [profileData, gapSource]);

  const filteredGapRows = useMemo(() => {
    if (gapFilter === "Gap") return allGapRows.filter((r) => r.hasGap);
    if (gapFilter === "No gap") return allGapRows.filter((r) => !r.hasGap);
    return allGapRows;
  }, [allGapRows, gapFilter]);

  const formatShortYear = (value: unknown) => {
    if (value == null || value === "") return "—";
    return `'${String(value).slice(-2)}`;
  };

  if (!profileData) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="font-display text-lg font-semibold text-foreground">No Profile Data</p>
            <p className="mt-1 text-sm text-muted-foreground">This account does not have profile data for the current user. Upload an account with employee skills to auto-generate profiles.</p>
          </div>
        </div>
      </div>
    );
  }


  const handleRoleExploreClick = () => {
    chatRef.current?.sendMessage(ROLE_EXPLORE_PROMPT, roleExploreResponse, [
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
    <>
    <FirstLoginTour open={showTour} onClose={() => setShowTour(false)} />
    <div className="flex flex-1 min-h-0 h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6">
          {/* Page title */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">My 360</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Your profile and how to progress
                </p>
              </div>
              <button onClick={() => setShowTour(true)} className="rounded-lg border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
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
                <div className="flex items-center gap-2">
                  <h4 className="font-display text-lg font-bold text-foreground">{user.name}</h4>
                  {profileData.status && (
                    <span className="rounded-full bg-info/10 border border-info/20 px-2.5 py-0.5 text-[10px] font-medium text-info">
                      {profileData.status}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{profileData.title}</p>
                <div className="flex items-center gap-4 mt-0.5 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {profileData.location}
                  </span>
                  <span>
                    Manager:{" "}
                    <span className="underline text-foreground">{profileData.manager}</span>
                  </span>
                  {profileData.team && (
                    <span>Team: <span className="text-foreground">{profileData.team}</span></span>
                  )}
                </div>
                {profileData.program && (
                  <div className="mt-0.5 text-sm text-muted-foreground">
                    Program: <span className="text-foreground">{profileData.program}</span>
                  </div>
                )}
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
                <TooltipProvider>
                  <UiTooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[220px] text-xs">
                      Validated skills confirmed by your manager or through assessments
                    </TooltipContent>
                  </UiTooltip>
                </TooltipProvider>
              </div>
              <ResponsivePillRow
                totalCount={profileData.roleSkillsCurrent?.length ?? 0}
                renderPill={(i) => {
                  const entry = profileData.roleSkillsCurrent?.[i];
                  if (!entry) return null;
                  const skillName = typeof entry.skill_name === "string" && entry.skill_name.trim()
                    ? entry.skill_name
                    : "Unknown skill";
                  const displayName = skillName.length > 13
                    ? skillName.slice(0, 10) + "..."
                    : skillName;
                  const shortLevel = proficiencyShort[entry.proficiency];
                  const shortYear = formatShortYear(entry.assessment_year);
                  const skillColors = [
                    "bg-accent/10 text-accent border border-accent/20",
                    "bg-info/10 text-info border border-info/20",
                    "bg-success/10 text-success border border-success/20",
                    "bg-primary/10 text-primary border border-primary/20",
                  ];
                  return (
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full pl-4 pr-1.5 py-2 text-sm font-medium whitespace-nowrap gap-1.5",
                        skillColors[i % skillColors.length]
                      )}
                    >
                      <span className="w-[5.5rem] truncate">{displayName}</span>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 shadow-sm text-xs font-bold">{shortLevel}</span>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 shadow-sm text-xs font-bold">{shortYear}</span>
                    </span>
                  );
                }}
                renderExpandedList={() => (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">All Core Skills</p>
                    {(profileData.roleSkillsCurrent || []).map((entry, i) => (
                      <div key={i} className="flex items-center justify-between gap-4 text-sm">
                        <span className="font-medium text-foreground">{entry.skill_name || "Unknown skill"}</span>
                        <div className="flex items-center gap-2 text-muted-foreground text-xs">
                          <span>{entry.proficiency}</span>
                          <span>·</span>
                          <span>{entry.assessment_year}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              />
            </div>

            {/* Inferred Skills */}
            <div className="mt-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-sm font-semibold text-foreground">Inferred Skills</span>
                <TooltipProvider>
                  <UiTooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[240px] text-xs">
                      Skills inferred from resume uploads or reflections — pending manager validation
                    </TooltipContent>
                  </UiTooltip>
                </TooltipProvider>
              </div>
              <ResponsivePillRow
                totalCount={profileData.otherSkills?.length ?? 0}
                renderPill={(i) => {
                  const skill = profileData.otherSkills?.[i];
                  if (!skill) return null;
                  const shortLevel = proficiencyShort[skill.proficiency];
                  const shortYear = formatShortYear(skill.assessment_year);
                  return (
                    <div className="relative group">
                      <span className="inline-flex items-center rounded-full border border-border pl-4 pr-1.5 py-2 text-sm font-medium text-foreground gap-1.5 whitespace-nowrap cursor-default">
                        <span>{skill.skill_name || "Unknown skill"}</span>
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-bold text-muted-foreground">
                          {shortLevel}
                        </span>
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-bold text-muted-foreground">
                          {shortYear}
                        </span>
                      </span>
                      {/* Hover card */}
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-50">
                        <div className="rounded-xl bg-card border border-border p-4 shadow-card-hover min-w-[200px]">
                          <p className="font-display text-sm font-bold text-foreground">{skill.skill_name || "Unknown skill"}</p>
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Proficiency</span>
                              <span className="font-medium text-foreground">{skill.proficiency}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Last assessed</span>
                              <span className="font-medium text-foreground">{skill.assessment_year}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-center">
                          <div className="h-2 w-2 rotate-45 bg-card border-r border-b border-border -mt-1" />
                        </div>
                      </div>
                    </div>
                  );
                }}
                renderExpandedList={() => (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">All Inferred Skills</p>
                    {(profileData.otherSkills ?? []).map((skill, i) => (
                      <div key={i} className="flex items-center justify-between gap-4 text-sm">
                        <span className="font-medium text-foreground">{skill.skill_name || "Unknown skill"}</span>
                        <div className="flex items-center gap-2 text-muted-foreground text-xs">
                          <span>{skill.proficiency}</span>
                          <span>·</span>
                          <span>{skill.assessment_year}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              />
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
                      ? "bg-primary text-primary-foreground shadow-sm"
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
                    {roleSnapshotText}
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
                    {profileData.projectSnapshotText}
                  </p>
                </motion.div>

                {/* Learning Cohorts */}
                {(memberCohorts.length > 0 || managedCohorts.length > 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.17 }}
                    className="rounded-xl bg-card border border-border p-4 shadow-card border-l-4 border-l-primary"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-4 w-4 text-primary" />
                      <h4 className="font-display text-sm font-semibold text-foreground">Learning Cohorts</h4>
                    </div>
                    {memberCohorts.length > 0 && (
                      <div className="space-y-2 mb-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Enrolled</p>
                        {memberCohorts.map((cohort) => {
                          const assignment = normalizedAccount ? getCohortAssignment(normalizedAccount, user.id, cohort.id) : undefined;
                          const progress = assignment?.progress || 0;
                          return (
                            <div key={cohort.id} className="rounded-lg border border-border p-3 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="text-sm font-medium text-foreground">{cohort.name}</span>
                                </div>
                                {cohort.type && (
                                  <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">
                                    {cohort.type}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-primary transition-all"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium text-muted-foreground w-8 text-right">{progress}%</span>
                              </div>
                              {cohort.skillTargetIds.length > 0 && (
                                <p className="text-[10px] text-muted-foreground">
                                  {cohort.skillTargetIds.length} skill target{cohort.skillTargetIds.length !== 1 ? "s" : ""}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {managedCohorts.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Managing</p>
                        {managedCohorts.map((cohort) => (
                          <div key={cohort.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-sm font-medium text-foreground">{cohort.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {cohort.type && (
                                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">
                                  {cohort.type}
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {cohort.status || "active"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

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
                      <select
                        value={gapSource}
                        onChange={(e) => setGapSource(e.target.value as GapSource)}
                        className="rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground"
                      >
                        <option value="Role">Role</option>
                        <option value="Project">Project</option>
                      </select>
                      <select
                        value={gapFilter}
                        onChange={(e) => setGapFilter(e.target.value as GapFilter)}
                        className="rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground"
                      >
                        <option value="All">All</option>
                        <option value="Gap">Gap</option>
                        <option value="No gap">No gap</option>
                      </select>
                      <button className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                        Explore <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    {filteredGapRows.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">
                        {gapFilter === "Gap" ? "No gaps found — all skills meet or exceed requirements." : "No matching skills."}
                      </p>
                    ) : (
                      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 gap-y-2 items-center">
                        {filteredGapRows.map((row) => (
                          <React.Fragment key={row.skill}>
                            {/* Skill name pill */}
                            <span className={cn(
                              "inline-flex items-center rounded-full border pl-3 pr-1.5 py-1 text-xs font-medium gap-1.5 w-full min-w-0",
                              row.hasGap
                                ? "border-border text-foreground"
                                : "border-success/30 text-foreground"
                            )}>
                              <span className="truncate">{row.skill}</span>
                              <span className={cn(
                                "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold shrink-0 ml-auto",
                                row.hasGap ? "bg-accent/15 text-accent" : "bg-success/15 text-success"
                              )}>
                                {row.level}
                              </span>
                            </span>

                            {/* Arrow */}
                            <span className="text-muted-foreground text-[10px] shrink-0 text-center">{">>"}</span>

                            {/* Target badge */}
                            <span className={cn(
                              "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold shrink-0",
                              !row.hasGap ? "bg-success/15 text-success" : row.gapLevel === "High gap" ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning"
                            )}>
                              {!row.hasGap ? "✓" : row.target}
                            </span>

                            {/* Gap label (fixed-width column) */}
                            <span className="w-[72px]">
                              {row.hasGap ? (
                                <span className={cn(
                                  "rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap",
                                  row.gapLevel === "High gap" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"
                                )}>
                                  {row.gapLevel}
                                </span>
                              ) : null}
                            </span>
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Right column — Radar chart or Action Plan */}
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
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                    {gapView === "Gap View" && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => setChartMode("radar")}
                          className={cn(
                            "rounded-lg border border-border p-1.5 transition-colors",
                            chartMode === "radar" ? "text-foreground bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <RadarIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setChartMode("bar")}
                          className={cn(
                            "rounded-lg border border-border p-1.5 transition-colors",
                            chartMode === "bar" ? "text-foreground bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <BarChart3 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {gapView === "Gap View" ? (
                    chartMode === "radar" ? (
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
                    ) : (
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={radarSkills} barGap={2} barSize={14}>
                          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                          <XAxis
                            dataKey="skill"
                            tick={{ fontSize: 9, fill: colors.tickFill }}
                            axisLine={{ stroke: colors.grid }}
                            tickLine={false}
                            interval={0}
                            angle={-30}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis
                            domain={[0, 100]}
                            tickCount={6}
                            tickFormatter={(v: number) => proficiencyLabels[Math.round(v / 20)] || ""}
                            tick={{ fontSize: 10, fill: colors.tickFill }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              background: colors.tooltipBg,
                              border: `1px solid ${colors.tooltipBorder}`,
                              borderRadius: 8,
                              fontSize: 12,
                            }}
                            formatter={(value: number, name: string) => {
                              const label = proficiencyLabels[Math.round(value / 20)] || "";
                              return [`${label} (${value})`, name];
                            }}
                          />
                          <Legend
                            wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
                          />
                          <Bar dataKey="target" name="Target" fill={colors.radarTargetFill} radius={[4, 4, 0, 0]} />
                          <Bar dataKey="score" name="Current" fill={colors.accent} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )
                  ) : (
                    <ActionPlanView />
                  )}
                </motion.div>
              </div>
            </div>
          )}

          {activeTab === "Career Timeline" && <CareerTimeline userId={user.id} />}

          {activeTab === "Growth Path" && (
            <div className="rounded-xl bg-card border border-border p-8 shadow-card text-center">
              <p className="text-sm text-muted-foreground">Growth Path content coming soon.</p>
            </div>
          )}
      </div>

    </div>
    </>
  );
}

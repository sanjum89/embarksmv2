import type {
  NormalizedAccount,
  AccountUser,
  AccountEmployee,
  AccountRole,
  AccountProject,
  AccountBranding,
  SkillGapEntry,
  AccountHeader,
  CompanyProfile,
  SiteProfile,
  SiteRationale,
  ArchitectureSource,
  ArchitectureSignalCount,
  OrgOverviewData,
  PeopleGraphRow,
  EmployeeSignal,
  ReflectionEntry,
  ReflectionSummary,
  WorkSignalCard,
  LearningAndSkillsSummary,
  ShowcaseCase,
  ExplainabilityTrace,
  PerformanceAlert,
  RecommendedCTA,
  LearningCohort,
  CohortAssignment,
  EmployeeEntityOverride,
} from "@/types/account-v2";
import type { ProfileData } from "@/data/mock";
import { proficiencyNumeric, type Proficiency } from "@/types/learning";
import {
  deriveExplainabilityTraces,
  deriveLearningAndSkills,
  deriveOrgOverview,
  derivePeopleGraph,
  derivePerformanceAlerts,
  deriveRecommendedCTAs,
  deriveReflections,
  deriveShowcaseCases,
  deriveWorkSignals,
} from "@/lib/adminDataDerivation";

const DEFAULT_SCALE_ORDER: Record<string, number> = {
  Beginner: 1, Intermediate: 2, Advanced: 3, Expert: 4, Master: 5,
};

function profOrder(level: string): number {
  return DEFAULT_SCALE_ORDER[level] ?? 0;
}

function getAdminEmployeeSource(acct: NormalizedAccount): any[] {
  const namedById = Object.fromEntries(acct.namedEmployees.map((employee) => [employee.id, employee]));
  return Object.values(acct.employeesById).map((employee) => ({
    ...employee,
    ...(namedById[employee.id] || {}),
  }));
}

/* ─── Account-level ─── */

export function getAccountBranding(acct: NormalizedAccount): AccountBranding {
  return acct.branding;
}

/* ─── User / Employee ─── */

export function getUserById(acct: NormalizedAccount, userId: string): AccountUser | undefined {
  return acct.usersById[userId];
}

export function getEmployeeById(acct: NormalizedAccount, employeeId: string): AccountEmployee | undefined {
  return acct.employeesById[employeeId];
}

export function getCurrentEmployee(acct: NormalizedAccount, userId: string): AccountEmployee | undefined {
  const user = acct.usersById[userId];
  if (!user) return undefined;
  const empId = user.linkedEmployeeId || userId;
  return acct.employeesById[empId];
}

export function getAllUsers(acct: NormalizedAccount): AccountUser[] {
  return Object.values(acct.usersById);
}

export function getAllEmployees(acct: NormalizedAccount): AccountEmployee[] {
  return Object.values(acct.employeesById);
}

/* ─── Hierarchy ─── */

export function getDirectReports(acct: NormalizedAccount, managerId: string): AccountEmployee[] {
  const reportIds = acct.hierarchyMap[managerId] || [];
  return reportIds.map((id) => acct.employeesById[id]).filter(Boolean);
}

export function getFullReportingTree(acct: NormalizedAccount, managerId: string): AccountEmployee[] {
  const result: AccountEmployee[] = [];
  const queue = [managerId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const reportIds = acct.hierarchyMap[current] || [];
    for (const id of reportIds) {
      const emp = acct.employeesById[id];
      if (emp) {
        result.push(emp);
        queue.push(id);
      }
    }
  }
  return result;
}

/* ─── Projects ─── */

export function getEmployeeProjects(acct: NormalizedAccount, employeeId: string): AccountProject[] {
  const projectIds = acct.projectAssignments
    .filter((a) => a.employeeId === employeeId)
    .map((a) => a.projectId);
  return projectIds.map((id) => acct.projectsById[id]).filter(Boolean);
}

export function getProjectMembers(acct: NormalizedAccount, projectId: string): AccountEmployee[] {
  const empIds = acct.projectAssignments
    .filter((a) => a.projectId === projectId)
    .map((a) => a.employeeId);
  return empIds.map((id) => acct.employeesById[id]).filter(Boolean);
}

/* ─── Roles ─── */

export function getRoleByEmployee(acct: NormalizedAccount, employeeId: string): AccountRole | undefined {
  const emp = acct.employeesById[employeeId];
  if (!emp?.roleId) return undefined;
  return acct.rolesById[emp.roleId];
}

/* ─── Cohorts ─── */

export function getEmployeeCohorts(acct: NormalizedAccount, employeeId: string): LearningCohort[] {
  const cohortIds = (acct.cohortAssignments || [])
    .filter((a) => a.employeeId === employeeId && a.role === "member")
    .map((a) => a.cohortId);
  return cohortIds.map((id) => acct.cohortsById[id]).filter(Boolean);
}

export function getManagedCohorts(acct: NormalizedAccount, employeeId: string): LearningCohort[] {
  const cohortIds = (acct.cohortAssignments || [])
    .filter((a) => a.employeeId === employeeId && a.role === "manager")
    .map((a) => a.cohortId);
  return cohortIds.map((id) => acct.cohortsById[id]).filter(Boolean);
}

export function getCohortAssignment(acct: NormalizedAccount, employeeId: string, cohortId: string): CohortAssignment | undefined {
  return (acct.cohortAssignments || []).find((a) => a.employeeId === employeeId && a.cohortId === cohortId);
}

export function getCohortProgress(acct: NormalizedAccount, cohortId: string): { total: number; avgProgress: number } {
  const members = (acct.cohortAssignments || []).filter((a) => a.cohortId === cohortId && a.role === "member");
  const avg = members.length ? members.reduce((s, m) => s + (m.progress || 0), 0) / members.length : 0;
  return { total: members.length, avgProgress: Math.round(avg) };
}

/* ─── Entity Overrides ─── */

export function getRoleForEmployee(acct: NormalizedAccount, employeeId: string): (AccountRole & { descriptionOverride?: string; snapshotOverride?: string }) | undefined {
  const role = getRoleByEmployee(acct, employeeId);
  if (!role) return undefined;
  const override = (acct.employeeEntityOverrides || []).find(
    (o) => o.employeeId === employeeId && o.entityType === "role" && o.entityId === role.id
  );
  return { ...role, descriptionOverride: override?.descriptionOverride, snapshotOverride: override?.snapshotOverride };
}

export function getProjectsForEmployee(acct: NormalizedAccount, employeeId: string): (AccountProject & { descriptionOverride?: string; snapshotOverride?: string })[] {
  const projects = getEmployeeProjects(acct, employeeId);
  return projects.map((p) => {
    const override = (acct.employeeEntityOverrides || []).find(
      (o) => o.employeeId === employeeId && o.entityType === "project" && o.entityId === p.id
    );
    return { ...p, descriptionOverride: override?.descriptionOverride, snapshotOverride: override?.snapshotOverride };
  });
}

/* ─── Skill Gaps ─── */

export function getEmployeeRoleGap(acct: NormalizedAccount, employeeId: string): SkillGapEntry[] {
  const role = getRoleByEmployee(acct, employeeId);
  const emp = acct.employeesById[employeeId];
  if (!role || !emp?.skills) return [];

  return role.requiredSkills.map((req) => {
    const current = emp.skills?.find((s) => s.skillName === req.skillName);
    const currentProf = current?.proficiency || "Beginner";
    return {
      skillName: req.skillName,
      currentProficiency: currentProf,
      targetProficiency: req.proficiency,
      hasGap: profOrder(currentProf) < profOrder(req.proficiency),
      source: "role" as const,
    };
  });
}

export function getEmployeeProjectGap(
  acct: NormalizedAccount,
  employeeId: string,
  projectId?: string
): SkillGapEntry[] {
  const emp = acct.employeesById[employeeId];
  if (!emp?.skills) return [];

  const projects = projectId
    ? [acct.projectsById[projectId]].filter(Boolean)
    : getEmployeeProjects(acct, employeeId);

  const gaps: SkillGapEntry[] = [];
  const seen = new Set<string>();

  for (const project of projects) {
    for (const req of project.requiredSkills || []) {
      if (seen.has(req.skillName)) continue;
      seen.add(req.skillName);
      const current = emp.skills?.find((s) => s.skillName === req.skillName);
      const currentProf = current?.proficiency || "Beginner";
      gaps.push({
        skillName: req.skillName,
        currentProficiency: currentProf,
        targetProficiency: req.proficiency,
        hasGap: profOrder(currentProf) < profOrder(req.proficiency),
        source: "project",
      });
    }
  }

  return gaps;
}

export function getCombinedGap(acct: NormalizedAccount, employeeId: string): SkillGapEntry[] {
  const roleGaps = getEmployeeRoleGap(acct, employeeId);
  const projectGaps = getEmployeeProjectGap(acct, employeeId);

  const merged = new Map<string, SkillGapEntry>();
  for (const g of [...roleGaps, ...projectGaps]) {
    const existing = merged.get(g.skillName);
    if (!existing || profOrder(g.targetProficiency) > profOrder(existing.targetProficiency)) {
      merged.set(g.skillName, g);
    }
  }
  return Array.from(merged.values());
}

/* ─── Summary Selectors ─── */

export function getAdminOrgSummary(acct: NormalizedAccount) {
  const employees = getAllEmployees(acct);
  const projects = Object.values(acct.projectsById);
  return {
    totalEmployees: employees.length,
    totalProjects: projects.length,
    totalRoles: Object.keys(acct.rolesById).length,
    totalSkillTargets: acct.skillTargets.length,
  };
}

export function getManagerTeamSummary(acct: NormalizedAccount, managerId: string) {
  const reports = getDirectReports(acct, managerId);
  return {
    directReports: reports.length,
    totalTree: getFullReportingTree(acct, managerId).length,
    reportNames: reports.map((r) => r.name),
  };
}

export function getLearnerHomeData(acct: NormalizedAccount, userId: string) {
  const user = acct.usersById[userId];
  const assignedTargets = acct.skillTargets.filter((st) => st.assignedTo?.includes(userId));
  return {
    user,
    assignedTargets,
    totalTargets: assignedTargets.length,
    inProgress: assignedTargets.filter((st) => st.progress > 0 && st.progress < 100).length,
    completed: assignedTargets.filter((st) => st.progress === 100).length,
  };
}

/* ─── Profile Data Helper ─── */

export function getProfileData(acct: NormalizedAccount, userId: string): ProfileData | undefined {
  return acct.profileData[userId];
}

/* ─── New Dataset Selectors ─── */

export function getHeader(acct: NormalizedAccount): AccountHeader | undefined {
  return acct.header;
}

export function getCompanyProfile(acct: NormalizedAccount): CompanyProfile | undefined {
  return acct.companyProfile;
}

export function getSiteProfile(acct: NormalizedAccount): SiteProfile | undefined {
  return acct.siteProfile;
}

export function getSiteRationale(acct: NormalizedAccount): SiteRationale | undefined {
  return acct.siteRationale;
}

export function getArchitectureSources(acct: NormalizedAccount): ArchitectureSource[] {
  return acct.architectureSources;
}

export function getArchitectureSignalCounts(acct: NormalizedAccount): ArchitectureSignalCount[] {
  return acct.architectureSignalCounts;
}

export function getOrgOverviewData(acct: NormalizedAccount): OrgOverviewData {
  if (acct.orgOverview) return acct.orgOverview;
  return deriveOrgOverview(getAdminEmployeeSource(acct), acct.hierarchyMap);
}

export function getPeopleGraphRows(acct: NormalizedAccount): PeopleGraphRow[] {
  if (acct.peopleGraph.length > 0) return acct.peopleGraph;
  return derivePeopleGraph(getAdminEmployeeSource(acct), acct.hierarchyMap);
}

export function getEmployeeSignals(acct: NormalizedAccount, employeeId: string): EmployeeSignal[] {
  return acct.signals.filter((s) => s.employeeId === employeeId);
}

export function getReflections(acct: NormalizedAccount, employeeId?: string): ReflectionEntry[] {
  const entries = (acct.reflections?.length ? acct.reflections : deriveReflections(getAdminEmployeeSource(acct))) as ReflectionEntry[];
  if (!employeeId) return entries;
  return entries.filter((r) => r.employeeId === employeeId);
}

export function getReflectionSummary(acct: NormalizedAccount, employeeId?: string): ReflectionSummary {
  const entries = getReflections(acct, employeeId);
  const withConfidence = entries.filter((e) => e.confidence != null);
  const withWorkload = entries.filter((e) => e.workload != null);

  const allThemes = entries.flatMap((e) => e.themes || []);
  const themeCounts: Record<string, number> = {};
  for (const t of allThemes) {
    themeCounts[t] = (themeCounts[t] || 0) + 1;
  }
  const topThemes = Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([t]) => t);

  const sentimentTrend = entries.length
    ? entries[0]?.sentiment || (() => {
        const counts = entries.reduce<Record<string, number>>((acc, entry) => {
          if (entry.sentiment) acc[entry.sentiment] = (acc[entry.sentiment] || 0) + 1;
          return acc;
        }, {});

        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
      })()
    : undefined;

  return {
    employeeId,
    avgConfidence: withConfidence.length ? withConfidence.reduce((s, e) => s + (e.confidence || 0), 0) / withConfidence.length : undefined,
    avgWorkload: withWorkload.length ? withWorkload.reduce((s, e) => s + (e.workload || 0), 0) / withWorkload.length : undefined,
    sentimentTrend,
    topThemes,
    entries,
  };
}

export function getWorkSignalsData(acct: NormalizedAccount): WorkSignalCard[] {
  return (acct.workSignals?.length ? acct.workSignals : deriveWorkSignals(getAdminEmployeeSource(acct))) as WorkSignalCard[];
}

export function getLearningAndSkillsData(acct: NormalizedAccount): LearningAndSkillsSummary | undefined {
  return acct.learningAndSkills || deriveLearningAndSkills(getAdminEmployeeSource(acct));
}

export function getShowcaseCases(acct: NormalizedAccount): ShowcaseCase[] {
  return acct.showcaseCases?.length ? acct.showcaseCases : deriveShowcaseCases(getAdminEmployeeSource(acct), getReflections(acct));
}

export function getExplainabilityTrace(acct: NormalizedAccount, employeeId?: string): ExplainabilityTrace[] {
  const traces = acct.explainability?.length ? acct.explainability : deriveExplainabilityTraces(getAdminEmployeeSource(acct), getReflections(acct));
  if (!employeeId) return traces;
  return traces.filter((e) => e.employeeId === employeeId);
}

export function getPerformanceAlerts(acct: NormalizedAccount): PerformanceAlert[] {
  return acct.performanceAlerts?.length ? acct.performanceAlerts : derivePerformanceAlerts(getAdminEmployeeSource(acct));
}

export function getRecommendedCTAs(acct: NormalizedAccount): RecommendedCTA[] {
  return acct.recommendedCTAs?.length ? acct.recommendedCTAs : deriveRecommendedCTAs(getAdminEmployeeSource(acct));
}

/* ─── Scoped Account (for Team Dashboard) ─── */

export function getScopedAccount(
  acct: NormalizedAccount,
  managerId: string
): NormalizedAccount {
  // Get all recursive report IDs
  const reportIds = new Set<string>();
  const queue = [managerId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const directIds = acct.hierarchyMap[current] || [];
    for (const id of directIds) {
      if (acct.employeesById[id]) {
        reportIds.add(id);
        queue.push(id);
      }
    }
  }

  const scopedEmployeesById: Record<string, any> = {};
  for (const id of reportIds) {
    scopedEmployeesById[id] = acct.employeesById[id];
  }

  const scopedHierarchy: Record<string, string[]> = {};
  for (const id of reportIds) {
    if (acct.hierarchyMap[id]) {
      scopedHierarchy[id] = acct.hierarchyMap[id].filter((rid) => reportIds.has(rid));
    }
  }
  // Include manager's direct reports in hierarchy
  if (acct.hierarchyMap[managerId]) {
    scopedHierarchy[managerId] = acct.hierarchyMap[managerId].filter((rid) => reportIds.has(rid));
  }

  return {
    ...acct,
    employeesById: scopedEmployeesById,
    hierarchyMap: scopedHierarchy,
    namedEmployees: acct.namedEmployees.filter((e) => reportIds.has(e.id)),
    peopleGraph: acct.peopleGraph.filter((r) => reportIds.has(r.employeeId)),
    signals: acct.signals.filter((s) => reportIds.has(s.employeeId)),
    reflections: (acct.reflections as any[]).filter((r: any) => reportIds.has(r.employeeId)),
    workSignals: (acct.workSignals as any[]).filter((w: any) => !w.employeeId || reportIds.has(w.employeeId)),
    showcaseCases: acct.showcaseCases.filter((c: any) => !c.employeeId || reportIds.has(c.employeeId)),
    explainability: acct.explainability.filter((e) => !e.employeeId || reportIds.has(e.employeeId)),
    performanceAlerts: acct.performanceAlerts.filter((a) => !a.employeeId || reportIds.has(a.employeeId)),
    recommendedCTAs: acct.recommendedCTAs.filter((c) => !c.targetEmployeeId || reportIds.has(c.targetEmployeeId)),
    // Clear cached derived data so panels re-derive from scoped employees
    orgOverview: undefined,
    learningAndSkills: undefined,
  };
}

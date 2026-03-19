import type {
  NormalizedAccount,
  AccountUser,
  AccountEmployee,
  AccountRole,
  AccountProject,
  AccountBranding,
  SkillGapEntry,
} from "@/types/account-v2";
import type { ProfileData } from "@/data/mock";
import { proficiencyNumeric, type Proficiency } from "@/types/learning";

const DEFAULT_SCALE_ORDER: Record<string, number> = {
  Beginner: 1, Intermediate: 2, Advanced: 3, Expert: 4, Master: 5,
};

function profOrder(level: string): number {
  return DEFAULT_SCALE_ORDER[level] ?? 0;
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
  const assignedTargets = acct.skillTargets.filter((st) => st.assignedTo.includes(userId));
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

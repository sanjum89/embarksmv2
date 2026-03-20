import type { NormalizedAccount } from "@/types/account-v2";
import type { ProfileData } from "@/data/mock";

/**
 * Auto-generate profileData from employees with skills when not explicitly provided.
 */
export function generateProfileData(acct: NormalizedAccount): Record<string, ProfileData> {
  const result: Record<string, ProfileData> = {};

  for (const emp of Object.values(acct.employeesById)) {
    if (!emp.skills?.length) continue;

    // Find manager name
    let managerName = "—";
    if (emp.reportsTo && acct.employeesById[emp.reportsTo]) {
      managerName = acct.employeesById[emp.reportsTo].name;
    }

    // Get role requirements
    const role = emp.roleId ? acct.rolesById[emp.roleId] : undefined;
    const roleSkillsRequired = (role?.requiredSkills || []).map((s) => ({
      skill_name: s.skillName,
      proficiency: s.proficiency as any,
      assessment_year: new Date().getFullYear(),
    }));

    const roleSkillsCurrent = emp.skills.map((s) => ({
      skill_name: s.skillName,
      proficiency: s.proficiency as any,
      assessment_year: s.assessmentYear || new Date().getFullYear(),
    }));

    // Find project skills
    const empProjects = acct.projectAssignments
      .filter((a) => a.employeeId === emp.id)
      .map((a) => acct.projectsById[a.projectId])
      .filter(Boolean);

    const projectSkillsRequired = empProjects.flatMap((p) =>
      (p.requiredSkills || []).map((s) => ({
        skill_name: s.skillName,
        proficiency: s.proficiency as any,
        assessment_year: new Date().getFullYear(),
      }))
    );

    // Deduplicate project skills
    const seenProjectSkills = new Set<string>();
    const uniqueProjectRequired = projectSkillsRequired.filter((s) => {
      if (seenProjectSkills.has(s.skill_name)) return false;
      seenProjectSkills.add(s.skill_name);
      return true;
    });

    // Project current = employee's current proficiency for project-required skills
    const projectSkillsCurrent = uniqueProjectRequired.map((req) => {
      const current = emp.skills?.find((s) => s.skillName === req.skill_name);
      return {
        skill_name: req.skill_name,
        proficiency: (current?.proficiency || "Beginner") as any,
        assessment_year: current?.assessmentYear || new Date().getFullYear(),
      };
    });

    // Other skills = skills not in role requirements
    const roleSkillNames = new Set(roleSkillsRequired.map((s) => s.skill_name));
    const otherSkills = emp.skills
      .filter((s) => !roleSkillNames.has(s.skillName))
      .map((s) => ({
        skill_name: s.skillName,
        proficiency: s.proficiency as any,
        assessment_year: s.assessmentYear || new Date().getFullYear(),
      }));

    const projectNames = empProjects.map((p) => p.name).join(", ");

    result[emp.id] = {
      title: emp.title || "Team Member",
      location: (acct as any).namedEmployees?.find((n: any) => n.id === emp.id)?.location || "—",
      manager: managerName,
      yearsExperience: 0,
      summary: `${emp.name} is a ${emp.title || "team member"}${emp.department ? ` in ${emp.department}` : ""}.${projectNames ? ` Currently assigned to: ${projectNames}.` : ""}`,
      roleSnapshotText: role ? `${role.name} — ${role.requiredSkills.length} required skills` : emp.title || "Team Member",
      projectSnapshotText: projectNames || "No active projects",
      roleSkillsCurrent,
      roleSkillsRequired,
      projectSkillsCurrent,
      projectSkillsRequired: uniqueProjectRequired,
      otherSkills,
    };
  }

  return result;
}

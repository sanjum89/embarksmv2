import type { NormalizedAccount } from "@/types/account-v2";
import type { ProfileData } from "@/data/mock";

/**
 * Auto-generate profileData from employees with skills when not explicitly provided.
 */
export function generateProfileData(acct: NormalizedAccount): Record<string, ProfileData> {
  const result: Record<string, ProfileData> = {};

  for (const emp of Object.values(acct.employeesById)) {
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

    const employeeSkills = emp.skills || [];

    const roleSkillNames = new Set(roleSkillsRequired.map((s) => s.skill_name));
    const roleSkillsCurrent = roleSkillsRequired.map((req) => {
      const current = employeeSkills.find((s) => s.skillName === req.skill_name);
      return {
        skill_name: req.skill_name,
        proficiency: (current?.proficiency || "Beginner") as any,
        assessment_year: current?.assessmentYear || new Date().getFullYear(),
      };
    });

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
        const current = employeeSkills.find((s) => s.skillName === req.skill_name);
      return {
        skill_name: req.skill_name,
        proficiency: (current?.proficiency || "Beginner") as any,
        assessment_year: current?.assessmentYear || new Date().getFullYear(),
      };
    });

    // Other skills = skills not in role requirements
    const projectSkillNames = new Set(uniqueProjectRequired.map((s) => s.skill_name));
    const otherSkills = employeeSkills
      .filter((s) => !roleSkillNames.has(s.skillName) && !projectSkillNames.has(s.skillName))
      .map((s) => ({
        skill_name: s.skillName,
        proficiency: s.proficiency as any,
        assessment_year: s.assessmentYear || new Date().getFullYear(),
      }));

    const projectNames = empProjects.map((p) => p.name).join(", ");
    const yearsExperience = typeof emp.tenure === "number" ? emp.tenure : Number.parseFloat(String(emp.tenure ?? 0)) || 0;
    const location = (acct as any).namedEmployees?.find((n: any) => n.id === emp.id)?.location || emp.location || "—";
    const team = emp.department || emp.function;
    const title = emp.title || role?.name || "Team Member";
    const summaryParts = [
      `${emp.name} is a ${title}`,
      team ? `working in ${team}` : undefined,
      projectNames ? `currently contributing to ${projectNames}` : undefined,
      employeeSkills.length ? `with ${employeeSkills.length} tracked skill${employeeSkills.length === 1 ? "" : "s"}` : `with profile scaffolding generated from available workforce data`,
    ].filter(Boolean);

    result[emp.id] = {
      title,
      location,
      manager: managerName,
      yearsExperience,
      team,
      program: projectNames || undefined,
      summary: `${summaryParts.join(" ")}.`,
      roleSnapshotText: role ? `${role.name} — ${role.requiredSkills.length} required skills` : title,
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

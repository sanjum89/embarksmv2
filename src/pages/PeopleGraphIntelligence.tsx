import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Database, Activity } from "lucide-react";
import { useAccount } from "@/contexts/AccountContext";
import { useUser } from "@/contexts/UserContext";
import { getScopedAccount } from "@/lib/accountSelectors";
import { ConnectedSystemsMap } from "@/components/people-graph/ConnectedSystemsMap";
import { EmployeeSignalExplorer } from "@/components/people-graph/EmployeeSignalExplorer";
import {
  foundationalSystems,
  engagementSystems,
  investmentManagementSystems,
} from "@/data/peopleGraphSystems";
import type { SkillGapEntry } from "@/types/account-v2";

export default function PeopleGraphIntelligence() {
  const { normalizedAccount } = useAccount();
  const { user } = useUser();
  const activeUserId = user.id;
  const [pendingToggles, setPendingToggles] = useState<Record<string, boolean>>({});

  const scoped = useMemo(() => {
    if (!normalizedAccount || !activeUserId) return null;
    return getScopedAccount(normalizedAccount, activeUserId);
  }, [normalizedAccount, activeUserId]);

  if (!scoped) return null;

  const employees = Object.values(scoped.employeesById);

  const handleToggle = (systemId: string, enabled: boolean) => {
    setPendingToggles(prev => ({ ...prev, [systemId]: enabled }));
  };

  const getSkillGaps = (empId: string): { roleGaps: SkillGapEntry[]; projectGaps: SkillGapEntry[] } => {
    const emp = scoped.employeesById[empId];
    if (!emp) return { roleGaps: [], projectGaps: [] };

    const roleGaps: SkillGapEntry[] = [];
    const projectGaps: SkillGapEntry[] = [];

    // Role gaps
    if (emp.roleId && scoped.rolesById[emp.roleId]) {
      const role = scoped.rolesById[emp.roleId];
      for (const req of role.requiredSkills) {
        const empSkill = emp.skills?.find(s => s.skillName === req.skillName);
        const current = empSkill?.proficiency || "None";
        roleGaps.push({
          skillName: req.skillName,
          currentProficiency: current,
          targetProficiency: req.proficiency,
          hasGap: current !== req.proficiency,
          source: "role",
        });
      }
    }

    // Project gaps
    const assignments = scoped.projectAssignments.filter(a => a.employeeId === empId);
    for (const assign of assignments) {
      const proj = scoped.projectsById[assign.projectId];
      if (!proj?.requiredSkills) continue;
      for (const req of proj.requiredSkills) {
        const empSkill = emp.skills?.find(s => s.skillName === req.skillName);
        const current = empSkill?.proficiency || "None";
        if (current !== req.proficiency) {
          projectGaps.push({
            skillName: req.skillName,
            currentProficiency: current,
            targetProficiency: req.proficiency,
            hasGap: true,
            source: "project",
          });
        }
      }
    }

    return { roleGaps, projectGaps };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-purple-600 flex items-center justify-center">
            <Database className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">People Graph Intelligence</h1>
            <p className="text-sm text-muted-foreground">Understanding the signals behind your team</p>
          </div>
        </div>
      </motion.div>

      {/* Section 1: Connected Systems */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-4 w-4 text-teal-500" />
          <h2 className="text-lg font-semibold text-foreground">Connected Systems</h2>
        </div>
        <ConnectedSystemsMap
          foundational={foundationalSystems}
          engagement={engagementSystems}
          work={investmentManagementSystems}
          pendingToggles={pendingToggles}
          onToggle={handleToggle}
        />
      </section>

      {/* Section 2: Employee Signal Explorer */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-4 w-4 text-purple-500" />
          <h2 className="text-lg font-semibold text-foreground">Employee Signal Explorer</h2>
        </div>
        <EmployeeSignalExplorer
          employees={employees}
          rolesById={scoped.rolesById}
          projectsById={scoped.projectsById}
          getSkillGaps={getSkillGaps}
        />
      </section>
    </div>
  );
}

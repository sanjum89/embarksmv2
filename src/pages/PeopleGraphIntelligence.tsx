import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Database, Activity, GitBranch, Circle } from "lucide-react";
import { useAccount } from "@/contexts/AccountContext";
import { useUser } from "@/contexts/UserContext";
import { getScopedAccount } from "@/lib/accountSelectors";
import { ConnectedSystemsMap } from "@/components/people-graph/ConnectedSystemsMap";
import { EmployeeSignalExplorer } from "@/components/people-graph/EmployeeSignalExplorer";
import { DataFlowWorkflow } from "@/components/people-graph/DataFlowWorkflow";
import { NodeGraphView } from "@/components/people-graph/NodeGraphView";
import {
  foundationalSystems,
  engagementSystems,
  investmentManagementSystems,
} from "@/data/peopleGraphSystems";
import type { SkillGapEntry } from "@/types/account-v2";
import PageHeader from "@/components/layout/PageHeader";
import PageBody from "@/components/layout/PageBody";
import { useModeEyebrow } from "@/components/layout/useModeEyebrow";

export default function PeopleGraphIntelligence() {
  const { normalizedAccount } = useAccount();
  const { user } = useUser();
  const activeUserId = user.id;
  const [pendingToggles, setPendingToggles] = useState<Record<string, boolean>>({});
  const [view, setView] = useState<"signals" | "dataflow" | "nodegraph">("signals");

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
    <div className="h-full overflow-y-auto">
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

        {/* View toggle */}
        <div className="flex gap-1 mt-3 bg-muted rounded-lg p-1 w-fit">
          <button
            onClick={() => setView("signals")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              view === "signals"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            Systems & Signals
          </button>
          <button
            onClick={() => setView("dataflow")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              view === "dataflow"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <GitBranch className="h-3.5 w-3.5" />
            Data Flow
          </button>
          <button
            onClick={() => setView("nodegraph")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              view === "nodegraph"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Circle className="h-3.5 w-3.5" />
            Node Graph
          </button>
        </div>
      </motion.div>

      {view === "nodegraph" ? (
        <section>
          <NodeGraphView
            foundational={foundationalSystems}
            engagement={engagementSystems}
            work={investmentManagementSystems}
            pendingToggles={pendingToggles}
            onToggle={handleToggle}
          />
        </section>
      ) : view === "dataflow" ? (
        <section>
          <DataFlowWorkflow
            foundational={foundationalSystems}
            engagement={engagementSystems}
            work={investmentManagementSystems}
            pendingToggles={pendingToggles}
            onToggle={handleToggle}
          />
        </section>
      ) : (
      <>
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
      </>
      )}
    </div>
    </div>
  );
}

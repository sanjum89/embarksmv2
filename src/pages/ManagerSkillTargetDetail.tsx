import { useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BookOpen, ClipboardCheck, Drama, Clock, SkipForward, Users, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { managerSkillTargets as defaultManagerSkillTargets, getAssigneeProgress, type AssigneeProgress } from "@/data/managerSkillTargets";
import { useAccount } from "@/contexts/AccountContext";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AIChatPanel, AIChatPanelHandle } from "@/components/chat/AIChatPanel";
import { cn } from "@/lib/utils";

const typeIcon: Record<string, React.ElementType> = { module: BookOpen, assessment: ClipboardCheck, role_play: Drama };
const typeLabel: Record<string, string> = { module: "Module", assessment: "Assessment", role_play: "Role Play" };

const statusColor: Record<string, string> = {
  on_track: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400",
  at_risk: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400",
  completed: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400",
  not_started: "text-muted-foreground bg-muted",
};
const statusLabel: Record<string, string> = { on_track: "On Track", at_risk: "At Risk", completed: "Completed", not_started: "Not Started" };

function generateAgentResponse(assignee: AssigneeProgress, targetTitle: string): string {
  const statusEmoji = assignee.status === "completed" ? "🟢" : assignee.status === "at_risk" ? "🔴" : assignee.status === "on_track" ? "🟡" : "⚪";
  const riskLine = assignee.status === "at_risk"
    ? `\n\n⚠️ **Risk Flag:** ${assignee.name} hasn't been active for ${assignee.lastActivity}. They are behind by ${assignee.totalSteps - assignee.completedSteps} modules. Consider scheduling a 1:1 check-in.`
    : "";
  const projectedOutcome = assignee.status === "completed"
    ? `${assignee.name} has completed this path and should demonstrate improved proficiency in the related skills.`
    : `Completing this path will help ${assignee.name} close skill gaps and progress toward the next proficiency level. At current pace, estimated completion is in ${Math.ceil((assignee.totalSteps - assignee.completedSteps) * 2.5)} days.`;

  return `**${assignee.name}'s Progress on ${targetTitle}**

📊 **Completion:** ${assignee.progress}% (${assignee.completedSteps}/${assignee.totalSteps} modules done)
⏰ **Last Active:** ${assignee.lastActivity}
${statusEmoji} **Status:** ${statusLabel[assignee.status]}${riskLine}

**Skill Gap Analysis:**
- Customer Communication: Intermediate → Advanced (1 level gap)
- Technical Proficiency: Beginner → Intermediate (1 level gap)
- Problem Solving: Intermediate → Advanced (1 level gap)

**Projected Outcome:**
${projectedOutcome}

**Recommendation:** ${assignee.status === "at_risk" ? "Schedule a 1:1 to discuss blockers and adjust pacing." : assignee.status === "completed" ? "Consider assigning an advanced follow-up path." : "Keep monitoring — progress is steady."}`;
}

export default function ManagerSkillTargetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const chatRef = useRef<AIChatPanelHandle>(null);
  const [showAssignees, setShowAssignees] = useState(false);
  const { normalizedAccount } = useAccount();

  const managerSkillTargets = (normalizedAccount?.skillTargets?.length ? normalizedAccount.skillTargets.map(st => ({
    ...st,
    difficulty: "Intermediate" as string,
    skills: [] as string[],
    steps: st.steps || [],
  })) : null) ?? defaultManagerSkillTargets;

  const target = managerSkillTargets.find((t) => t.id === id);
  const allProgress = useMemo(() => getAssigneeProgress(), []);
  const assignees = target ? allProgress[target.id] || [] : [];

  if (!target) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Learning path not found.</p>
      </div>
    );
  }

  const handleAskAgent = (assignee: AssigneeProgress) => {
    const prompt = `How is ${assignee.name} doing on "${target.title}"?`;
    const response = generateAgentResponse(assignee, target.title);
    chatRef.current?.sendMessage(prompt, response, [
      { label: "Show all at-risk learners" },
      { label: "Compare team progress" },
    ]);
  };

  return (
    <div className="flex flex-1 h-full min-h-0">
      {/* Left: Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Back + Header */}
          <button onClick={() => navigate("/manager/skill-targets")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Learning Paths
          </button>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-[0.65rem]">{target.category}</Badge>
              <Badge variant="outline" className="text-[0.65rem]">{target.difficulty}</Badge>
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">{target.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{target.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {target.skills.map((s) => (
                <span key={s} className="rounded-full bg-blue-50 dark:bg-blue-900/20 px-2.5 py-0.5 text-[0.65rem] font-medium text-blue-700 dark:text-blue-400">{s}</span>
              ))}
            </div>
          </div>

          {/* Blue accent timeline */}
          <div className="space-y-0">
            {target.steps.map((step, i) => {
              const Icon = typeIcon[step.type] || BookOpen;
              const isLast = i === target.steps.length - 1;
              return (
                <div key={step.id} className="flex gap-3.5">
                  {/* Timeline rail */}
                  <div className="flex flex-col items-center">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 ring-2 ring-blue-200 dark:ring-blue-800 shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    {!isLast && <div className="w-0.5 flex-1 bg-blue-300 dark:bg-blue-700 min-h-[24px]" />}
                  </div>

                  {/* Content */}
                  <div className={cn("pb-6 flex-1", isLast && "pb-0")}>
                    <button className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline text-left">
                      {step.title}
                    </button>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <Badge variant="outline" className="text-[0.65rem] gap-1">
                        <Icon className="h-3 w-3" />
                        {typeLabel[step.type]}
                      </Badge>
                      {step.duration && (
                        <Badge variant="outline" className="text-[0.65rem] gap-1">
                          <Clock className="h-3 w-3" />
                          {step.duration}
                        </Badge>
                      )}
                      {step.skipCondition && (
                        <Badge className="text-[0.65rem] gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-100">
                          <SkipForward className="h-3 w-3" />
                          {step.skipCondition}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Assigned To */}
          <div className="border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => setShowAssignees(!showAssignees)}
              className="flex items-center justify-between w-full px-4 py-3 bg-card hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">Assigned To</span>
                <Badge variant="secondary" className="text-[0.65rem]">{assignees.length}</Badge>
              </div>
              {showAssignees ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>

            <AnimatePresence>
              {showAssignees && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="divide-y divide-border">
                    {assignees.map((a) => (
                      <div key={a.userId} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[0.65rem] font-bold text-primary-foreground shrink-0">
                          {a.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{a.name}</p>
                          <p className="text-[0.65rem] text-muted-foreground">{a.title}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <Badge variant="outline" className={cn("text-[0.65rem]", statusColor[a.status])}>{statusLabel[a.status]}</Badge>
                          <div className="w-20">
                            <Progress value={a.progress} className="h-1.5" />
                          </div>
                          <span className="text-xs font-medium text-muted-foreground w-8 text-right">{a.progress}%</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[0.65rem] gap-1 text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/20"
                            onClick={(e) => { e.stopPropagation(); handleAskAgent(a); }}
                          >
                            <Sparkles className="h-3 w-3" />
                            Ask AgentOne
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Right: AgentOne */}
      <div className="w-[400px] border-l border-border shrink-0 min-h-0">
        <AIChatPanel
          ref={chatRef}
          contextLabel={`Learning Path: ${target.title}`}
          suggestedActions={[
            { label: "Show all at-risk learners" },
            { label: "Compare team progress" },
            { label: "Suggest interventions" },
          ]}
        />
      </div>
    </div>
  );
}

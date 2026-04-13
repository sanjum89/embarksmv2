import { useState } from "react";
import { motion } from "framer-motion";
import {
  Database, Users, FileText, Briefcase, BarChart3, Brain,
  MessageSquare, Target, BookOpen, UserCheck, Radar, ArrowRight,
  Cpu, TrendingUp, AlertTriangle, Sparkles, HeartPulse, Layers,
  GraduationCap, Shield, Activity
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FlowNode {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  signals?: string[];
  badge?: string;
}

const sourceNodes: FlowNode[] = [
  { id: "pre-onboard", label: "Pre-Onboarding", icon: <FileText className="h-4 w-4" />, color: "from-blue-500/20 to-blue-600/10 border-blue-500/30", signals: ["CV / Resume data", "Offer details", "Prior certifications"], badge: "3 signals" },
  { id: "hris", label: "HRIS / HCM", icon: <Users className="h-4 w-4" />, color: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30", signals: ["Job title & department", "Start date & tenure", "Reporting lines", "Compensation band"], badge: "4 signals" },
  { id: "resume", label: "Resume Parser", icon: <FileText className="h-4 w-4" />, color: "from-amber-500/20 to-amber-600/10 border-amber-500/30", signals: ["Extracted skills", "Experience years", "Education & qualifications"], badge: "3 signals" },
  { id: "job-arch", label: "Job Architecture", icon: <Briefcase className="h-4 w-4" />, color: "from-purple-500/20 to-purple-600/10 border-purple-500/30", signals: ["Role definitions", "Required competencies", "Proficiency levels", "Career frameworks"], badge: "4 signals" },
  { id: "engagement", label: "Engagement Systems", icon: <HeartPulse className="h-4 w-4" />, color: "from-pink-500/20 to-pink-600/10 border-pink-500/30", signals: ["Survey responses", "eNPS scores", "Pulse check-ins", "Reflection submissions"], badge: "4 signals" },
  { id: "work-sys", label: "Systems of Work", icon: <Activity className="h-4 w-4" />, color: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30", signals: ["LMS completions", "Project assignments", "Meeting patterns", "Collaboration data"], badge: "4 signals" },
];

const computeNodes: FlowNode[] = [
  { id: "skill-map", label: "Skill-to-Proficiency Mapping", icon: <Layers className="h-3.5 w-3.5" />, color: "text-blue-400", signals: ["Maps extracted skills + assessments → proficiency levels per competency"] },
  { id: "gap-analysis", label: "Gap Analysis", icon: <BarChart3 className="h-3.5 w-3.5" />, color: "text-amber-400", signals: ["Compares current proficiency vs role/project requirements → gap severity"] },
  { id: "label-derive", label: "Label Derivation", icon: <AlertTriangle className="h-3.5 w-3.5" />, color: "text-red-400", signals: ["Combines engagement + performance + tenure signals → Flight Risk, Rising Star, Needs Mentoring"] },
  { id: "sentiment", label: "Sentiment Extraction", icon: <MessageSquare className="h-3.5 w-3.5" />, color: "text-pink-400", signals: ["Analyses reflection text + survey responses → concern flags, morale indicators"] },
  { id: "learn-velocity", label: "Learning Velocity", icon: <TrendingUp className="h-3.5 w-3.5" />, color: "text-emerald-400", signals: ["Tracks module completion rate + assessment scores over time → learning speed index"] },
];

const consumerNodes: FlowNode[] = [
  { id: "agent-learner", label: "Agent One (Learner)", icon: <Sparkles className="h-4 w-4" />, color: "from-violet-500/20 to-violet-600/10 border-violet-500/30", signals: ["Skill recommendations", "Gap-aware answers", "Personalised nudges"] },
  { id: "agent-team", label: "Agent One (Team)", icon: <Shield className="h-4 w-4" />, color: "from-indigo-500/20 to-indigo-600/10 border-indigo-500/30", signals: ["Team risk flags", "Readiness insights", "Mentoring suggestions"] },
  { id: "learnpath", label: "LearnPath", icon: <BookOpen className="h-4 w-4" />, color: "from-teal-500/20 to-teal-600/10 border-teal-500/30", signals: ["Module recommendations", "Assessment calibration", "Content sequencing"] },
  { id: "manager-dash", label: "Manager Dashboard", icon: <UserCheck className="h-4 w-4" />, color: "from-orange-500/20 to-orange-600/10 border-orange-500/30", signals: ["Team overview cards", "1-on-1 prompts", "Performance signals"] },
  { id: "my360", label: "My 360", icon: <Radar className="h-4 w-4" />, color: "from-rose-500/20 to-rose-600/10 border-rose-500/30", signals: ["Personal skill radar", "Career timeline", "Strength areas"] },
  { id: "skill-targets", label: "Skill Targets", icon: <Target className="h-4 w-4" />, color: "from-lime-500/20 to-lime-600/10 border-lime-500/30", signals: ["Gap-driven suggestions", "Priority ranking", "Progress tracking"] },
];

function FlowCard({ node, delay, side }: { node: FlowNode; delay: number; side: "left" | "right" }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, x: side === "left" ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay * 0.08, duration: 0.4 }}
          >
            <Card className={`bg-gradient-to-br ${node.color} border px-3 py-2.5 cursor-pointer hover:scale-[1.03] transition-transform duration-200`}>
              <div className="flex items-center gap-2">
                <div className="text-foreground/80">{node.icon}</div>
                <span className="text-xs font-medium text-foreground truncate">{node.label}</span>
                {node.badge && (
                  <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 h-4 shrink-0">
                    {node.badge}
                  </Badge>
                )}
              </div>
            </Card>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side={side === "left" ? "right" : "left"} className="max-w-56">
          <p className="font-medium text-xs mb-1">{node.label}</p>
          <ul className="space-y-0.5">
            {node.signals?.map((s, i) => (
              <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1">
                <span className="text-primary mt-0.5">•</span> {s}
              </li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function AnimatedConnector({ direction }: { direction: "right" | "left" }) {
  return (
    <div className="flex items-center justify-center w-8 shrink-0">
      <div className="relative h-px w-full bg-border/50">
        <div
          className={`absolute top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary/70 ${
            direction === "right" ? "animate-flow-right" : "animate-flow-left"
          }`}
        />
      </div>
    </div>
  );
}

function ComputeNode({ node, delay }: { node: FlowNode; delay: number }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + delay * 0.1, duration: 0.35 }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted/80 cursor-pointer transition-colors"
          >
            <span className={node.color}>{node.icon}</span>
            <span className="text-[11px] font-medium text-foreground/90">{node.label}</span>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent className="max-w-64">
          <p className="text-[10px] text-muted-foreground">{node.signals?.[0]}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function DataFlowWorkflow() {
  return (
    <div className="space-y-4">
      {/* Mobile: vertical stack */}
      <div className="block lg:hidden space-y-6">
        <ColumnSection title="Source Systems" icon={<Database className="h-4 w-4 text-teal-500" />}>
          <div className="grid gap-2">
            {sourceNodes.map((n, i) => <FlowCard key={n.id} node={n} delay={i} side="left" />)}
          </div>
        </ColumnSection>

        <div className="flex justify-center">
          <ArrowRight className="h-5 w-5 text-muted-foreground rotate-90" />
        </div>

        <EngineCard />

        <div className="flex justify-center">
          <ArrowRight className="h-5 w-5 text-muted-foreground rotate-90" />
        </div>

        <ColumnSection title="Consumers" icon={<Sparkles className="h-4 w-4 text-purple-500" />}>
          <div className="grid gap-2">
            {consumerNodes.map((n, i) => <FlowCard key={n.id} node={n} delay={i} side="right" />)}
          </div>
        </ColumnSection>
      </div>

      {/* Desktop: three-column */}
      <div className="hidden lg:grid lg:grid-cols-[1fr_auto_minmax(280px,1.2fr)_auto_1fr] gap-0 items-start">
        {/* Sources */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-teal-500" /> Source Systems
          </p>
          {sourceNodes.map((n, i) => <FlowCard key={n.id} node={n} delay={i} side="left" />)}
        </div>

        {/* Left connectors */}
        <div className="flex flex-col justify-center gap-[18px] pt-8">
          {sourceNodes.map((_, i) => <AnimatedConnector key={i} direction="right" />)}
        </div>

        {/* Engine */}
        <div className="pt-0">
          <EngineCard />
        </div>

        {/* Right connectors */}
        <div className="flex flex-col justify-center gap-[18px] pt-8">
          {consumerNodes.map((_, i) => <AnimatedConnector key={i} direction="right" />)}
        </div>

        {/* Consumers */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-purple-500" /> Consumers
          </p>
          {consumerNodes.map((n, i) => <FlowCard key={n.id} node={n} delay={i} side="right" />)}
        </div>
      </div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="flex items-center gap-4 justify-center pt-4 text-[10px] text-muted-foreground"
      >
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-pulse" /> Live data flow
        </span>
        <span>Hover any card for detail</span>
      </motion.div>
    </div>
  );
}

function EngineCard() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 shadow-lg shadow-primary/5 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent pointer-events-none" />

        <div className="p-4 space-y-3 relative">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-500 to-purple-600 flex items-center justify-center">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">People Graph Engine</h3>
              <p className="text-[10px] text-muted-foreground">Core computation pipeline</p>
            </div>
          </div>

          <div className="space-y-1.5">
            {computeNodes.map((n, i) => (
              <ComputeNode key={n.id} node={n} delay={i} />
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function ColumnSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
        {icon} {title}
      </p>
      {children}
    </div>
  );
}

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database, Users, FileText, Briefcase, BarChart3, Brain,
  MessageSquare, Target, BookOpen, UserCheck, Radar, ArrowRight,
  TrendingUp, AlertTriangle, Sparkles, HeartPulse, Layers,
  Shield, Activity, Eye, EyeOff, Power, ChevronDown, ChevronUp,
  Zap, Clock, GraduationCap, HeartHandshake, Calculator, Search,
  ShieldCheck, Mail, UserPlus, Building2, Network, MessageCircle,
  Drama, Cpu,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { ConnectedSystem } from "@/data/peopleGraphSystems";

/* ─── Icon map (same as ConnectedSystemsMap) ─── */
const iconMap: Record<string, React.ElementType> = {
  TrendingUp, Briefcase, Users, HeartHandshake, Calculator,
  Search, ShieldCheck, Mail, UserPlus, Building2, FileText,
  UserCheck, Network, GraduationCap, MessageCircle, Drama,
};

/* ─── Compute & Consumer node definitions ─── */
interface ComputeNode {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

interface ConsumerNode {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  signals: string[];
}

const computeNodes: ComputeNode[] = [
  { id: "skill-map", label: "Skill-to-Proficiency Mapping", icon: <Layers className="h-3.5 w-3.5" />, color: "text-blue-400", description: "Maps extracted skills + assessments → proficiency levels per competency" },
  { id: "gap-analysis", label: "Gap Analysis", icon: <BarChart3 className="h-3.5 w-3.5" />, color: "text-amber-400", description: "Compares current proficiency vs role/project requirements → gap severity" },
  { id: "label-derive", label: "Label Derivation", icon: <AlertTriangle className="h-3.5 w-3.5" />, color: "text-red-400", description: "Combines engagement + performance + tenure → Flight Risk, Rising Star labels" },
  { id: "sentiment", label: "Sentiment Extraction", icon: <MessageSquare className="h-3.5 w-3.5" />, color: "text-pink-400", description: "Analyses reflection text + survey responses → concern flags, morale indicators" },
  { id: "learn-velocity", label: "Learning Velocity", icon: <TrendingUp className="h-3.5 w-3.5" />, color: "text-emerald-400", description: "Tracks module completion rate + scores over time → learning speed index" },
];

const consumerNodes: ConsumerNode[] = [
  { id: "agent-learner", label: "Agent One (Learner)", icon: <Sparkles className="h-4 w-4" />, color: "from-violet-500/20 to-violet-600/10 border-violet-500/30", signals: ["Skill recommendations", "Gap-aware answers", "Personalised nudges"] },
  { id: "agent-team", label: "Agent One (Team)", icon: <Shield className="h-4 w-4" />, color: "from-indigo-500/20 to-indigo-600/10 border-indigo-500/30", signals: ["Team risk flags", "Readiness insights", "Mentoring suggestions"] },
  { id: "learnpath", label: "LearnPath", icon: <BookOpen className="h-4 w-4" />, color: "from-teal-500/20 to-teal-600/10 border-teal-500/30", signals: ["Module recommendations", "Assessment calibration", "Content sequencing"] },
  { id: "manager-dash", label: "Manager Dashboard", icon: <UserCheck className="h-4 w-4" />, color: "from-orange-500/20 to-orange-600/10 border-orange-500/30", signals: ["Team overview cards", "1-on-1 prompts", "Performance signals"] },
  { id: "my360", label: "My 360", icon: <Radar className="h-4 w-4" />, color: "from-rose-500/20 to-rose-600/10 border-rose-500/30", signals: ["Personal skill radar", "Career timeline", "Strength areas"] },
  { id: "skill-targets", label: "Skill Targets", icon: <Target className="h-4 w-4" />, color: "from-lime-500/20 to-lime-600/10 border-lime-500/30", signals: ["Gap-driven suggestions", "Priority ranking", "Progress tracking"] },
];

/* ─── Dependency map: source system category → compute nodes → consumer nodes ─── */
const sourceToCategoryMap: Record<string, string[]> = {
  "pre-onboarding": ["skill-map", "label-derive"],
  "hris": ["gap-analysis", "label-derive", "sentiment"],
  "resume": ["skill-map", "gap-analysis"],
  "manager-validated": ["skill-map", "gap-analysis", "label-derive"],
  "job-architecture": ["gap-analysis", "skill-map"],
  "engagement": ["learn-velocity", "sentiment", "skill-map"],
  "work": ["gap-analysis", "label-derive", "learn-velocity"],
};

const computeToConsumerMap: Record<string, string[]> = {
  "skill-map": ["agent-learner", "my360", "skill-targets"],
  "gap-analysis": ["learnpath", "manager-dash", "skill-targets", "agent-team"],
  "label-derive": ["manager-dash", "agent-team"],
  "sentiment": ["manager-dash", "agent-team", "my360"],
  "learn-velocity": ["learnpath", "agent-learner", "manager-dash"],
};

/* ─── Props ─── */
interface Props {
  foundational: ConnectedSystem[];
  engagement: ConnectedSystem[];
  work: ConnectedSystem[];
  pendingToggles: Record<string, boolean>;
  onToggle: (systemId: string, enabled: boolean) => void;
}

export function DataFlowWorkflow({ foundational, engagement, work, pendingToggles, onToggle }: Props) {
  const allSystems = useMemo(() => [...foundational, ...engagement, ...work], [foundational, engagement, work]);
  const [simulatedOff, setSimulatedOff] = useState<Set<string>>(new Set());
  const [switchOffTarget, setSwitchOffTarget] = useState<ConnectedSystem | null>(null);
  const [expandedSystems, setExpandedSystems] = useState<Set<string>>(new Set());

  // Compute affected nodes from all simulated-off sources
  const { affectedCompute, affectedConsumers } = useMemo(() => {
    const computeSet = new Set<string>();
    const consumerSet = new Set<string>();
    for (const sysId of simulatedOff) {
      const sys = allSystems.find(s => s.id === sysId);
      if (!sys) continue;
      const computes = sourceToCategoryMap[sys.category] || [];
      computes.forEach(c => {
        computeSet.add(c);
        (computeToConsumerMap[c] || []).forEach(con => consumerSet.add(con));
      });
    }
    return { affectedCompute: computeSet, affectedConsumers: consumerSet };
  }, [simulatedOff, allSystems]);

  const hasSimulation = simulatedOff.size > 0;

  const toggleSimulate = (sysId: string) => {
    setSimulatedOff(prev => {
      const next = new Set(prev);
      if (next.has(sysId)) next.delete(sysId);
      else next.add(sysId);
      return next;
    });
  };

  const toggleExpand = (sysId: string) => {
    setExpandedSystems(prev => {
      const next = new Set(prev);
      if (next.has(sysId)) next.delete(sysId);
      else next.add(sysId);
      return next;
    });
  };

  const getConsequences = (sys: ConnectedSystem) => {
    const computes = sourceToCategoryMap[sys.category] || [];
    const consumers = new Set<string>();
    computes.forEach(c => (computeToConsumerMap[c] || []).forEach(con => consumers.add(con)));
    return {
      computeLabels: computes.map(c => computeNodes.find(n => n.id === c)?.label || c),
      consumerLabels: Array.from(consumers).map(c => consumerNodes.find(n => n.id === c)?.label || c),
      signalCount: sys.signalCount,
    };
  };

  return (
    <div className="space-y-4">
      {/* Simulation banner */}
      <AnimatePresence>
        {hasSimulation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">
                Simulating impact of {simulatedOff.size} system{simulatedOff.size > 1 ? "s" : ""} switched off
              </span>
            </div>
            <button
              onClick={() => setSimulatedOff(new Set())}
              className="text-xs text-destructive hover:text-destructive/80 underline"
            >
              Clear all
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile: vertical stack */}
      <div className="block lg:hidden space-y-6">
        <ColumnSection title="Source Systems" icon={<Database className="h-4 w-4 text-teal-500" />}>
          <div className="grid gap-2">
            {allSystems.map((sys, i) => (
              <SourceCard
                key={sys.id}
                system={sys}
                delay={i}
                isSimulated={simulatedOff.has(sys.id)}
                isExpanded={expandedSystems.has(sys.id)}
                isPending={pendingToggles[sys.id] !== undefined}
                isEnabled={pendingToggles[sys.id] ?? sys.status === "active"}
                onSimulate={() => toggleSimulate(sys.id)}
                onRequestOff={() => setSwitchOffTarget(sys)}
                onToggleExpand={() => toggleExpand(sys.id)}
              />
            ))}
          </div>
        </ColumnSection>

        <div className="flex justify-center">
          <ArrowRight className="h-5 w-5 text-muted-foreground rotate-90" />
        </div>

        <EngineCard affectedCompute={affectedCompute} hasSimulation={hasSimulation} />

        <div className="flex justify-center">
          <ArrowRight className="h-5 w-5 text-muted-foreground rotate-90" />
        </div>

        <ColumnSection title="Consumers" icon={<Sparkles className="h-4 w-4 text-purple-500" />}>
          <div className="grid gap-2">
            {consumerNodes.map((n, i) => (
              <ConsumerCard key={n.id} node={n} delay={i} isAffected={affectedConsumers.has(n.id)} hasSimulation={hasSimulation} />
            ))}
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
          {allSystems.map((sys, i) => (
            <SourceCard
              key={sys.id}
              system={sys}
              delay={i}
              isSimulated={simulatedOff.has(sys.id)}
              isExpanded={expandedSystems.has(sys.id)}
              isPending={pendingToggles[sys.id] !== undefined}
              isEnabled={pendingToggles[sys.id] ?? sys.status === "active"}
              onSimulate={() => toggleSimulate(sys.id)}
              onRequestOff={() => setSwitchOffTarget(sys)}
              onToggleExpand={() => toggleExpand(sys.id)}
            />
          ))}
        </div>

        {/* Left connectors */}
        <div className="flex flex-col justify-center gap-[18px] pt-8">
          {allSystems.map((sys) => (
            <AnimatedConnector key={sys.id} direction="right" isAffected={simulatedOff.has(sys.id)} />
          ))}
        </div>

        {/* Engine */}
        <div className="pt-0">
          <EngineCard affectedCompute={affectedCompute} hasSimulation={hasSimulation} />
        </div>

        {/* Right connectors */}
        <div className="flex flex-col justify-center gap-[18px] pt-8">
          {consumerNodes.map((n) => (
            <AnimatedConnector key={n.id} direction="right" isAffected={affectedConsumers.has(n.id)} />
          ))}
        </div>

        {/* Consumers */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-purple-500" /> Consumers
          </p>
          {consumerNodes.map((n, i) => (
            <ConsumerCard key={n.id} node={n} delay={i} isAffected={affectedConsumers.has(n.id)} hasSimulation={hasSimulation} />
          ))}
        </div>
      </div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="flex items-center gap-4 justify-center pt-4 text-[10px] text-muted-foreground flex-wrap"
      >
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-pulse" /> Live data flow
        </span>
        <span className="flex items-center gap-1.5">
          <Eye className="h-3 w-3" /> Simulate impact
        </span>
        <span className="flex items-center gap-1.5">
          <Power className="h-3 w-3" /> Request switch off
        </span>
        <span>Click any card to expand signals</span>
      </motion.div>

      {/* Switch-off confirmation dialog */}
      <AlertDialog open={!!switchOffTarget} onOpenChange={(open) => !open && setSwitchOffTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Power className="h-5 w-5 text-destructive" />
              Request Switch Off: {switchOffTarget?.name}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Switching off <strong>{switchOffTarget?.name}</strong> will stop{" "}
                  <strong>{switchOffTarget?.signalCount.toLocaleString()}</strong> signals from flowing into the People Graph.
                </p>
                {switchOffTarget && (() => {
                  const { computeLabels, consumerLabels } = getConsequences(switchOffTarget);
                  return (
                    <>
                      <div>
                        <p className="text-xs font-semibold text-destructive mb-1">Affected computations:</p>
                        <ul className="text-xs space-y-0.5">
                          {computeLabels.map(l => (
                            <li key={l} className="flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                              {l}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-destructive mb-1">Affected features:</p>
                        <ul className="text-xs space-y-0.5">
                          {consumerLabels.map(l => (
                            <li key={l} className="flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                              {l}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  );
                })()}
                <p className="text-xs text-muted-foreground italic">
                  This will send a request for approval. The system will not be disconnected immediately.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (switchOffTarget) {
                  onToggle(switchOffTarget.id, false);
                  setSwitchOffTarget(null);
                }
              }}
            >
              Send Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ─── Source card with real system data ─── */
function SourceCard({
  system, delay, isSimulated, isExpanded, isPending, isEnabled,
  onSimulate, onRequestOff, onToggleExpand,
}: {
  system: ConnectedSystem;
  delay: number;
  isSimulated: boolean;
  isExpanded: boolean;
  isPending: boolean;
  isEnabled: boolean;
  onSimulate: () => void;
  onRequestOff: () => void;
  onToggleExpand: () => void;
}) {
  const Icon = iconMap[system.icon] || Database;
  const directCount = system.signals.filter(s => s.type === "direct").length;
  const derivedCount = system.signals.filter(s => s.type === "derived").length;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay * 0.05, duration: 0.4 }}
    >
      <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
        <Card className={`relative overflow-hidden border transition-all duration-300 ${
          isSimulated
            ? "border-destructive/60 bg-destructive/5 ring-1 ring-destructive/30 animate-pulse"
            : "border-border/50 bg-gradient-to-br from-muted/30 to-background hover:shadow-md"
        }`}>
          <CardContent className="p-3 space-y-2">
            {/* Header row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isSimulated ? "bg-destructive/20" : "bg-background/80"
                }`}>
                  <Icon className={`h-4 w-4 ${isSimulated ? "text-destructive" : "text-foreground"}`} />
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-semibold truncate ${isSimulated ? "text-destructive line-through" : "text-foreground"}`}>
                    {system.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">{system.description}</p>
                </div>
              </div>
              {isSimulated && (
                <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-4 shrink-0 animate-pulse">
                  Simulating off
                </Badge>
              )}
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><Zap className="h-2.5 w-2.5" />{system.signalCount.toLocaleString()}</span>
              <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{system.lastSync}</span>
              <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 bg-emerald-500/15 text-emerald-700 border-emerald-500/30">
                {directCount}D
              </Badge>
              <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 bg-purple-500/15 text-purple-700 border-purple-500/30">
                {derivedCount}Dr
              </Badge>
            </div>

            {/* Action row */}
            <div className="flex items-center justify-between pt-1 border-t border-border/30">
              <div className="flex items-center gap-1">
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => { e.stopPropagation(); onSimulate(); }}
                        className={`h-7 w-7 rounded-md flex items-center justify-center transition-colors ${
                          isSimulated
                            ? "bg-destructive/20 text-destructive hover:bg-destructive/30"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {isSimulated ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      {isSimulated ? "Stop simulation" : "Simulate impact of switching off"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => { e.stopPropagation(); onRequestOff(); }}
                        className="h-7 w-7 rounded-md flex items-center justify-center bg-muted/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      >
                        <Power className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      Request to switch off this system
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="flex items-center gap-2">
                {isPending && (
                  <Badge variant="outline" className="text-[9px] border-amber-500/50 text-amber-600">
                    Pending
                  </Badge>
                )}
                <CollapsibleTrigger className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  Signals
                </CollapsibleTrigger>
              </div>
            </div>

            {/* Expandable signal list */}
            <CollapsibleContent>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1 pt-2 border-t border-border/30"
                  >
                    {system.signals.map((sig) => (
                      <div key={sig.id} className="flex items-center justify-between py-0.5">
                        <span className="text-[10px] text-foreground/80">{sig.name}</span>
                        <Badge
                          variant="outline"
                          className={`text-[8px] ${
                            sig.type === "direct"
                              ? "border-emerald-500/40 text-emerald-600"
                              : "border-purple-500/40 text-purple-600"
                          }`}
                        >
                          {sig.type}
                        </Badge>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </CollapsibleContent>
          </CardContent>
        </Card>
      </Collapsible>
    </motion.div>
  );
}

/* ─── Animated connector line ─── */
function AnimatedConnector({ direction, isAffected }: { direction: "right" | "left"; isAffected: boolean }) {
  return (
    <div className="flex items-center justify-center w-8 shrink-0">
      <div className={`relative h-px w-full ${isAffected ? "bg-destructive/50" : "bg-border/50"}`}>
        <div
          className={`absolute top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full ${
            isAffected ? "bg-destructive animate-pulse" : "bg-primary/70"
          } ${direction === "right" ? "animate-flow-right" : "animate-flow-left"}`}
        />
      </div>
    </div>
  );
}

/* ─── Engine card with affected highlighting ─── */
function EngineCard({ affectedCompute, hasSimulation }: { affectedCompute: Set<string>; hasSimulation: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 shadow-lg shadow-primary/5 relative overflow-hidden">
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
            {computeNodes.map((n, i) => {
              const isAffected = hasSimulation && affectedCompute.has(n.id);
              return (
                <TooltipProvider key={n.id} delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.1, duration: 0.35 }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-300 ${
                          isAffected
                            ? "bg-destructive/10 ring-1 ring-destructive/30"
                            : "bg-muted/50 hover:bg-muted/80"
                        }`}
                      >
                        <span className={isAffected ? "text-destructive" : n.color}>{n.icon}</span>
                        <span className={`text-[11px] font-medium ${
                          isAffected ? "text-destructive line-through" : "text-foreground/90"
                        }`}>
                          {n.label}
                        </span>
                        {isAffected && (
                          <Badge variant="destructive" className="ml-auto text-[8px] px-1 py-0 h-3.5">
                            Impacted
                          </Badge>
                        )}
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-64">
                      <p className="text-[10px] text-muted-foreground">{n.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

/* ─── Consumer card with affected highlighting ─── */
function ConsumerCard({ node, delay, isAffected, hasSimulation }: { node: ConsumerNode; delay: number; isAffected: boolean; hasSimulation: boolean }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay * 0.08, duration: 0.4 }}
          >
            <Card className={`bg-gradient-to-br ${node.color} border px-3 py-2.5 cursor-pointer transition-all duration-300 ${
              isAffected && hasSimulation
                ? "ring-1 ring-destructive/40 border-destructive/40"
                : "hover:scale-[1.03]"
            }`}>
              <div className="flex items-center gap-2">
                <div className={`${isAffected && hasSimulation ? "text-destructive" : "text-foreground/80"}`}>
                  {node.icon}
                </div>
                <span className={`text-xs font-medium truncate ${
                  isAffected && hasSimulation ? "text-destructive" : "text-foreground"
                }`}>
                  {node.label}
                </span>
                {isAffected && hasSimulation && (
                  <Badge variant="destructive" className="ml-auto text-[9px] px-1.5 py-0 h-4 shrink-0">
                    Data reduced
                  </Badge>
                )}
              </div>
            </Card>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-56">
          <p className="font-medium text-xs mb-1">{node.label}</p>
          <ul className="space-y-0.5">
            {node.signals.map((s, i) => (
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

/* ─── Section wrapper ─── */
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

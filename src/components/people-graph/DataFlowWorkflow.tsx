import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database, Users, FileText, Briefcase, BarChart3, Brain,
  MessageSquare, Target, BookOpen, UserCheck, Radar,
  TrendingUp, AlertTriangle, Sparkles, Layers,
  Shield, Eye, EyeOff, Power, ChevronDown, ChevronUp,
  Zap, Clock, GraduationCap, HeartHandshake, Calculator, Search,
  ShieldCheck, Mail, UserPlus, Building2, Network, MessageCircle,
  Drama, ArrowDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

const iconMap: Record<string, React.ElementType> = {
  TrendingUp, Briefcase, Users, HeartHandshake, Calculator,
  Search, ShieldCheck, Mail, UserPlus, Building2, FileText,
  UserCheck, Network, GraduationCap, MessageCircle, Drama,
};

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
  { id: "skill-map", label: "Skill Mapping", icon: <Layers className="h-5 w-5" />, color: "text-blue-400", description: "Maps extracted skills + assessments → proficiency levels per competency" },
  { id: "gap-analysis", label: "Gap Analysis", icon: <BarChart3 className="h-5 w-5" />, color: "text-amber-400", description: "Compares current proficiency vs role/project requirements → gap severity" },
  { id: "label-derive", label: "Label Derivation", icon: <AlertTriangle className="h-5 w-5" />, color: "text-red-400", description: "Combines engagement + performance + tenure → Flight Risk, Rising Star labels" },
  { id: "sentiment", label: "Sentiment", icon: <MessageSquare className="h-5 w-5" />, color: "text-pink-400", description: "Analyses reflection text + survey responses → concern flags, morale indicators" },
  { id: "learn-velocity", label: "Learning Velocity", icon: <TrendingUp className="h-5 w-5" />, color: "text-emerald-400", description: "Tracks module completion rate + scores over time → learning speed index" },
];

const consumerNodes: ConsumerNode[] = [
  { id: "agent-learner", label: "Agent One (Learner)", icon: <Sparkles className="h-5 w-5" />, color: "from-violet-500/20 to-violet-600/10 border-violet-500/30", signals: ["Skill recommendations", "Gap-aware answers", "Personalised nudges"] },
  { id: "agent-team", label: "Agent One (Team)", icon: <Shield className="h-5 w-5" />, color: "from-indigo-500/20 to-indigo-600/10 border-indigo-500/30", signals: ["Team risk flags", "Readiness insights", "Mentoring suggestions"] },
  { id: "learnpath", label: "LearnPath", icon: <BookOpen className="h-5 w-5" />, color: "from-teal-500/20 to-teal-600/10 border-teal-500/30", signals: ["Module recommendations", "Assessment calibration", "Content sequencing"] },
  { id: "manager-dash", label: "Manager Dashboard", icon: <UserCheck className="h-5 w-5" />, color: "from-orange-500/20 to-orange-600/10 border-orange-500/30", signals: ["Team overview cards", "1-on-1 prompts", "Performance signals"] },
  { id: "my360", label: "My 360", icon: <Radar className="h-5 w-5" />, color: "from-rose-500/20 to-rose-600/10 border-rose-500/30", signals: ["Personal skill radar", "Career timeline", "Strength areas"] },
  { id: "skill-targets", label: "Skill Targets", icon: <Target className="h-5 w-5" />, color: "from-lime-500/20 to-lime-600/10 border-lime-500/30", signals: ["Gap-driven suggestions", "Priority ranking", "Progress tracking"] },
];

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

const categoryLabels: Record<string, string> = {
  "pre-onboarding": "Pre-Onboarding",
  hris: "HRIS",
  resume: "Resume",
  "manager-validated": "Manager",
  "job-architecture": "Job Arch",
  engagement: "Engagement",
  work: "Systems of Work",
};

interface Props {
  foundational: ConnectedSystem[];
  engagement: ConnectedSystem[];
  work: ConnectedSystem[];
  pendingToggles: Record<string, boolean>;
  onToggle: (systemId: string, enabled: boolean) => void;
}

export function DataFlowWorkflow({ foundational = [], engagement = [], work = [], pendingToggles, onToggle }: Props) {
  const allSystems = useMemo(() => [...foundational, ...engagement, ...work], [foundational, engagement, work]);
  const [simulatedOff, setSimulatedOff] = useState<Set<string>>(new Set());
  const [switchOffTarget, setSwitchOffTarget] = useState<ConnectedSystem | null>(null);
  const [expandedSource, setExpandedSource] = useState<string | null>(null);
  const [expandedConsumer, setExpandedConsumer] = useState<string | null>(null);

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
    <div className="space-y-2">
      {/* Simulation banner */}
      <AnimatePresence>
        {hasSimulation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-destructive/10 border border-destructive/30 rounded-xl px-5 py-3.5 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-destructive/20 flex items-center justify-center">
                <Eye className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-semibold text-destructive">
                  Impact Simulation Active
                </p>
                <p className="text-xs text-destructive/70">
                  {simulatedOff.size} system{simulatedOff.size > 1 ? "s" : ""} simulated off — red highlights show affected pipeline
                </p>
              </div>
            </div>
            <button
              onClick={() => setSimulatedOff(new Set())}
              className="text-xs font-medium text-destructive hover:text-destructive/80 bg-destructive/10 hover:bg-destructive/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              Clear all
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ TIER 1: SOURCE SYSTEMS ═══ */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Database className="h-4 w-4 text-teal-500" />
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Source Systems</h3>
          <span className="text-xs text-muted-foreground ml-1">({allSystems.length})</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {allSystems.map((sys, i) => {
            const Icon = iconMap[sys.icon] || Database;
            const isSimulated = simulatedOff.has(sys.id);
            const isExpanded = expandedSource === sys.id;
            const directCount = sys.signals.filter(s => s.type === "direct").length;
            const derivedCount = sys.signals.filter(s => s.type === "derived").length;

            return (
              <motion.div
                key={sys.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.4 }}
              >
                <Card
                  className={`relative overflow-hidden cursor-pointer transition-all duration-300 ${
                    isSimulated
                      ? "border-destructive/60 bg-destructive/5 ring-2 ring-destructive/30 shadow-lg shadow-destructive/10"
                      : "border-border/50 bg-card hover:shadow-lg hover:border-primary/30"
                  }`}
                  onClick={() => setExpandedSource(isExpanded ? null : sys.id)}
                >
                  <CardContent className="p-0">
                    {/* Main card face */}
                    <div className="p-4 space-y-3">
                      {/* Icon + Status */}
                      <div className="flex items-start justify-between">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                          isSimulated
                            ? "bg-destructive/20"
                            : "bg-gradient-to-br from-teal-500/20 to-primary/10"
                        }`}>
                          <Icon className={`h-5 w-5 ${isSimulated ? "text-destructive" : "text-teal-600"}`} />
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isSimulated ? (
                            <Badge variant="destructive" className="text-[10px] px-2 py-0.5 animate-pulse">
                              Simulating Off
                            </Badge>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Live
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Name + Description */}
                      <div>
                        <h4 className={`text-sm font-bold leading-tight ${
                          isSimulated ? "text-destructive line-through" : "text-foreground"
                        }`}>
                          {sys.name}
                        </h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                          {sys.description}
                        </p>
                      </div>

                      {/* Key metrics */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-xs text-foreground/80 font-semibold">
                          <Zap className="h-3 w-3 text-amber-500" />
                          {sys.signalCount.toLocaleString()}
                          <span className="text-muted-foreground font-normal">signals</span>
                        </div>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
                          {directCount} direct
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-purple-500/10 text-purple-700 border-purple-500/20">
                          {derivedCount} derived
                        </Badge>
                      </div>

                      {/* Category + sync */}
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {categoryLabels[sys.category] || sys.category}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" /> {sys.lastSync}
                        </span>
                      </div>

                      {/* Expand indicator */}
                      <div className="flex items-center justify-center pt-1 border-t border-border/30">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          {isExpanded ? "Collapse" : "View signals & actions"}
                        </span>
                      </div>
                    </div>

                    {/* Expanded detail panel */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-3 border-t border-border/40">
                            {/* Signal list */}
                            <div className="pt-3">
                              <p className="text-[11px] font-semibold text-foreground mb-2">
                                Signals ({sys.signals.length})
                              </p>
                              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                {sys.signals.map((sig) => (
                                  <div key={sig.id} className="flex items-start justify-between gap-2 py-1 px-2 rounded-md bg-muted/30">
                                    <div className="min-w-0 flex-1">
                                      <p className="text-[11px] font-medium text-foreground">{sig.name}</p>
                                      <p className="text-[10px] text-muted-foreground">{sig.description}</p>
                                    </div>
                                    <Badge
                                      variant="outline"
                                      className={`text-[9px] shrink-0 ${
                                        sig.type === "direct"
                                          ? "border-emerald-500/40 text-emerald-600"
                                          : "border-purple-500/40 text-purple-600"
                                      }`}
                                    >
                                      {sig.type}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-2 border-t border-border/30">
                              <TooltipProvider delayDuration={200}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); toggleSimulate(sys.id); }}
                                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                                        isSimulated
                                          ? "bg-destructive/15 text-destructive hover:bg-destructive/25 ring-1 ring-destructive/30"
                                          : "bg-muted hover:bg-muted/80 text-foreground"
                                      }`}
                                    >
                                      {isSimulated ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                      {isSimulated ? "Stop Simulation" : "Simulate Impact"}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent className="text-xs max-w-52">
                                    {isSimulated
                                      ? "Remove this system from impact simulation"
                                      : "See what data would be lost if this system is switched off"}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider delayDuration={200}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setSwitchOffTarget(sys); }}
                                      className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium bg-muted hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all"
                                    >
                                      <Power className="h-3.5 w-3.5" />
                                      Request Off
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent className="text-xs max-w-52">
                                    Send a request to disconnect this system
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ═══ CONNECTOR: Sources → Engine ═══ */}
      <div className="flex justify-center py-2">
        <div className="flex flex-col items-center gap-0.5">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ delay: i * 0.2, duration: 1.5, repeat: Infinity }}
            >
              <ArrowDown className={`h-4 w-4 ${hasSimulation ? "text-destructive/60" : "text-muted-foreground/40"}`} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* ═══ TIER 2: PEOPLE GRAPH ENGINE ═══ */}
      <section>
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-accent/5 shadow-lg shadow-primary/5 overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-purple-600 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">People Graph Engine</h3>
                  <p className="text-xs text-muted-foreground">Core computation pipeline</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {computeNodes.map((n, i) => {
                  const isAffected = hasSimulation && affectedCompute.has(n.id);
                  return (
                    <TooltipProvider key={n.id} delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 + i * 0.08, duration: 0.35 }}
                            className={`flex flex-col items-center gap-2 px-3 py-4 rounded-xl cursor-default text-center transition-all duration-300 ${
                              isAffected
                                ? "bg-destructive/10 ring-2 ring-destructive/30 shadow-md shadow-destructive/10"
                                : "bg-muted/40 hover:bg-muted/60"
                            }`}
                          >
                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                              isAffected ? "bg-destructive/20" : "bg-background/80"
                            }`}>
                              <span className={isAffected ? "text-destructive" : n.color}>{n.icon}</span>
                            </div>
                            <span className={`text-xs font-semibold leading-tight ${
                              isAffected ? "text-destructive line-through" : "text-foreground/90"
                            }`}>
                              {n.label}
                            </span>
                            {isAffected && (
                              <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-4">
                                Impacted
                              </Badge>
                            )}
                          </motion.div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-56">
                          <p className="text-xs">{n.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* ═══ CONNECTOR: Engine → Consumers ═══ */}
      <div className="flex justify-center py-2">
        <div className="flex flex-col items-center gap-0.5">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ delay: i * 0.2, duration: 1.5, repeat: Infinity }}
            >
              <ArrowDown className={`h-4 w-4 ${hasSimulation ? "text-destructive/60" : "text-muted-foreground/40"}`} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* ═══ TIER 3: CONSUMERS ═══ */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-purple-500" />
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Consumers</h3>
          <span className="text-xs text-muted-foreground ml-1">({consumerNodes.length})</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {consumerNodes.map((n, i) => {
            const isAffected = hasSimulation && affectedConsumers.has(n.id);
            const isExpanded = expandedConsumer === n.id;

            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.06, duration: 0.4 }}
              >
                <Card
                  className={`cursor-pointer transition-all duration-300 overflow-hidden ${
                    isAffected
                      ? "ring-2 ring-destructive/40 border-destructive/40 shadow-md shadow-destructive/10"
                      : "hover:shadow-lg hover:border-primary/30"
                  } bg-gradient-to-br ${n.color} border`}
                  onClick={() => setExpandedConsumer(isExpanded ? null : n.id)}
                >
                  <CardContent className="p-0">
                    <div className="p-4 space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                            isAffected ? "bg-destructive/20" : "bg-background/60"
                          }`}>
                            <span className={isAffected ? "text-destructive" : "text-foreground/80"}>{n.icon}</span>
                          </div>
                          <h4 className={`text-sm font-bold ${
                            isAffected ? "text-destructive" : "text-foreground"
                          }`}>
                            {n.label}
                          </h4>
                        </div>
                        {isAffected && (
                          <Badge variant="destructive" className="text-[10px] px-2 py-0.5 shrink-0">
                            Data Reduced
                          </Badge>
                        )}
                      </div>

                      {/* Signal bullets preview */}
                      <ul className="space-y-0.5">
                        {n.signals.slice(0, 3).map((s, j) => (
                          <li key={j} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                            <span className={`h-1 w-1 rounded-full shrink-0 ${isAffected ? "bg-destructive" : "bg-primary/60"}`} />
                            {s}
                          </li>
                        ))}
                      </ul>

                      <div className="flex items-center justify-center pt-1 border-t border-border/20">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          {isExpanded ? "Collapse" : "View details"}
                        </span>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-1 space-y-2 border-t border-border/30">
                            <p className="text-[11px] font-semibold text-foreground">
                              Feeds from compute nodes:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {computeNodes
                                .filter(cn => (computeToConsumerMap[cn.id] || []).includes(n.id))
                                .map(cn => {
                                  const cnAffected = hasSimulation && affectedCompute.has(cn.id);
                                  return (
                                    <Badge
                                      key={cn.id}
                                      variant={cnAffected ? "destructive" : "secondary"}
                                      className="text-[10px] px-2 py-0.5"
                                    >
                                      {cn.label}
                                      {cnAffected && " ⚠"}
                                    </Badge>
                                  );
                                })}
                            </div>
                            <p className="text-[11px] font-semibold text-foreground mt-2">All signals:</p>
                            <ul className="space-y-1">
                              {n.signals.map((s, j) => (
                                <li key={j} className="text-[11px] text-foreground/80 flex items-center gap-1.5">
                                  <span className={`h-1 w-1 rounded-full shrink-0 ${isAffected ? "bg-destructive" : "bg-primary/60"}`} />
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex items-center gap-5 justify-center pt-4 text-[11px] text-muted-foreground flex-wrap"
      >
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live data flow
        </span>
        <span className="flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5" /> Simulate impact
        </span>
        <span className="flex items-center gap-1.5">
          <Power className="h-3.5 w-3.5" /> Request switch off
        </span>
        <span>Click any node to expand</span>
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

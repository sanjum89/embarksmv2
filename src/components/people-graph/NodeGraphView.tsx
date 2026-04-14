import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database, Users, FileText, Briefcase, BarChart3, Brain,
  MessageSquare, Target, BookOpen, UserCheck, Radar,
  TrendingUp, AlertTriangle, Sparkles, Layers,
  Shield, Eye, EyeOff, Power, X, Zap, Clock,
  GraduationCap, HeartHandshake, Calculator, Search,
  ShieldCheck, Mail, UserPlus, Building2, Network, MessageCircle,
  Drama,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  bgColor: string;
  description: string;
}

interface ConsumerNode {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  signals: string[];
}

const computeNodes: ComputeNode[] = [
  { id: "skill-map", label: "Skill Mapping", icon: <Layers className="h-4 w-4" />, color: "text-blue-400", bgColor: "bg-blue-500/15 border-blue-500/30", description: "Maps extracted skills + assessments → proficiency levels per competency" },
  { id: "gap-analysis", label: "Gap Analysis", icon: <BarChart3 className="h-4 w-4" />, color: "text-amber-400", bgColor: "bg-amber-500/15 border-amber-500/30", description: "Compares current proficiency vs role/project requirements → gap severity" },
  { id: "label-derive", label: "Label Derivation", icon: <AlertTriangle className="h-4 w-4" />, color: "text-red-400", bgColor: "bg-red-500/15 border-red-500/30", description: "Combines engagement + performance + tenure → Flight Risk, Rising Star labels" },
  { id: "sentiment", label: "Sentiment", icon: <MessageSquare className="h-4 w-4" />, color: "text-pink-400", bgColor: "bg-pink-500/15 border-pink-500/30", description: "Analyses reflection text + survey responses → concern flags, morale indicators" },
  { id: "learn-velocity", label: "Learning Velocity", icon: <TrendingUp className="h-4 w-4" />, color: "text-emerald-400", bgColor: "bg-emerald-500/15 border-emerald-500/30", description: "Tracks module completion rate + scores over time → learning speed index" },
];

const consumerNodes: ConsumerNode[] = [
  { id: "agent-learner", label: "Agent One (Learner)", icon: <Sparkles className="h-4 w-4" />, color: "text-violet-400", bgColor: "bg-violet-500/15 border-violet-500/30", signals: ["Skill recommendations", "Gap-aware answers", "Personalised nudges"] },
  { id: "agent-team", label: "Agent One (Team)", icon: <Shield className="h-4 w-4" />, color: "text-indigo-400", bgColor: "bg-indigo-500/15 border-indigo-500/30", signals: ["Team risk flags", "Readiness insights", "Mentoring suggestions"] },
  { id: "learnpath", label: "Embark AI", icon: <BookOpen className="h-4 w-4" />, color: "text-teal-400", bgColor: "bg-teal-500/15 border-teal-500/30", signals: ["Module recommendations", "Assessment calibration", "Content sequencing"] },
  { id: "manager-dash", label: "Manager Dashboard", icon: <UserCheck className="h-4 w-4" />, color: "text-orange-400", bgColor: "bg-orange-500/15 border-orange-500/30", signals: ["Team overview cards", "1-on-1 prompts", "Performance signals"] },
  { id: "my360", label: "My 360", icon: <Radar className="h-4 w-4" />, color: "text-rose-400", bgColor: "bg-rose-500/15 border-rose-500/30", signals: ["Personal skill radar", "Career timeline", "Strength areas"] },
  { id: "skill-targets", label: "Skill Targets", icon: <Target className="h-4 w-4" />, color: "text-lime-400", bgColor: "bg-lime-500/15 border-lime-500/30", signals: ["Gap-driven suggestions", "Priority ranking", "Progress tracking"] },
];

const sourceToCategoryMap: Record<string, string[]> = {
  "pre-onboarding": ["skill-map", "label-derive"],
  hris: ["gap-analysis", "label-derive", "sentiment"],
  resume: ["skill-map", "gap-analysis"],
  "manager-validated": ["skill-map", "gap-analysis", "label-derive"],
  "job-architecture": ["gap-analysis", "skill-map"],
  engagement: ["learn-velocity", "sentiment", "skill-map"],
  work: ["gap-analysis", "label-derive", "learn-velocity"],
};

const computeToConsumerMap: Record<string, string[]> = {
  "skill-map": ["agent-learner", "my360", "skill-targets"],
  "gap-analysis": ["learnpath", "manager-dash", "skill-targets", "agent-team"],
  "label-derive": ["manager-dash", "agent-team"],
  sentiment: ["manager-dash", "agent-team", "my360"],
  "learn-velocity": ["learnpath", "agent-learner", "manager-dash"],
};

const categoryColors: Record<string, string> = {
  "pre-onboarding": "border-sky-500/40 bg-sky-500/10",
  hris: "border-blue-500/40 bg-blue-500/10",
  resume: "border-amber-500/40 bg-amber-500/10",
  "manager-validated": "border-green-500/40 bg-green-500/10",
  "job-architecture": "border-purple-500/40 bg-purple-500/10",
  engagement: "border-pink-500/40 bg-pink-500/10",
  work: "border-teal-500/40 bg-teal-500/10",
};

const categoryIconColors: Record<string, string> = {
  "pre-onboarding": "text-sky-500",
  hris: "text-blue-500",
  resume: "text-amber-500",
  "manager-validated": "text-green-500",
  "job-architecture": "text-purple-500",
  engagement: "text-pink-500",
  work: "text-teal-500",
};

type SelectedNode =
  | { type: "source"; system: ConnectedSystem }
  | { type: "engine" }
  | { type: "consumer"; consumer: ConsumerNode };

interface Props {
  foundational: ConnectedSystem[];
  engagement: ConnectedSystem[];
  work: ConnectedSystem[];
  pendingToggles: Record<string, boolean>;
  onToggle: (systemId: string, enabled: boolean) => void;
}

export function NodeGraphView({ foundational = [], engagement = [], work = [] }: Props) {
  const allSystems = useMemo(() => [...foundational, ...engagement, ...work], [foundational, engagement, work]);
  const [selected, setSelected] = useState<SelectedNode | null>(null);
  const [simulatedOff, setSimulatedOff] = useState<Set<string>>(new Set());

  const { affectedCompute, affectedConsumers } = useMemo(() => {
    const computeSet = new Set<string>();
    const consumerSet = new Set<string>();
    for (const sysId of simulatedOff) {
      const sys = allSystems.find((s) => s.id === sysId);
      if (!sys) continue;
      const computes = sourceToCategoryMap[sys.category] || [];
      computes.forEach((c) => {
        computeSet.add(c);
        (computeToConsumerMap[c] || []).forEach((con) => consumerSet.add(con));
      });
    }
    return { affectedCompute: computeSet, affectedConsumers: consumerSet };
  }, [simulatedOff, allSystems]);

  const toggleSimulate = useCallback((sysId: string) => {
    setSimulatedOff((prev) => {
      const next = new Set(prev);
      if (next.has(sysId)) next.delete(sysId);
      else next.add(sysId);
      return next;
    });
  }, []);

  // Layout: place nodes on concentric rings in the SVG viewBox
  const CX = 500;
  const CY = 450;
  const SOURCE_R = 340;
  const CONSUMER_R = 180;
  const ENGINE_R = 54;
  const SOURCE_NODE_R = 44;
  const CONSUMER_NODE_R = 38;

  const sourcePositions = useMemo(
    () =>
      allSystems.map((_, i) => {
        const angle = (2 * Math.PI * i) / allSystems.length - Math.PI / 2;
        return { x: CX + SOURCE_R * Math.cos(angle), y: CY + SOURCE_R * Math.sin(angle) };
      }),
    [allSystems]
  );

  const consumerPositions = useMemo(
    () =>
      consumerNodes.map((_, i) => {
        const angle = (2 * Math.PI * i) / consumerNodes.length - Math.PI / 2;
        return { x: CX + CONSUMER_R * Math.cos(angle), y: CY + CONSUMER_R * Math.sin(angle) };
      }),
    []
  );

  const hasSimulation = simulatedOff.size > 0;

  // Helper to calculate line endpoints offset by radii
  const getLineEndpoints = (
    sx: number, sy: number, sR: number,
    tx: number, ty: number, tR: number
  ) => {
    const angle = Math.atan2(ty - sy, tx - sx);
    return {
      x1: sx + sR * Math.cos(angle),
      y1: sy + sR * Math.sin(angle),
      x2: tx - tR * Math.cos(angle),
      y2: ty - tR * Math.sin(angle),
    };
  };

  return (
    <div className="relative">
      {/* Simulation banner */}
      <AnimatePresence>
        {hasSimulation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-destructive/10 border border-destructive/30 rounded-xl px-5 py-3 flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-destructive/20 flex items-center justify-center">
                <Eye className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-semibold text-destructive">Impact Simulation Active</p>
                <p className="text-xs text-destructive/70">
                  {simulatedOff.size} system{simulatedOff.size > 1 ? "s" : ""} simulated off
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

      {/* Flow animation styles */}
      <style>{`
        @keyframes flowIn {
          to { stroke-dashoffset: 0; }
          from { stroke-dashoffset: 20; }
        }
        @keyframes flowOut {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -20; }
        }
        .flow-line-in {
          stroke-dasharray: 6 4;
          animation: flowIn 1.5s linear infinite;
        }
        .flow-line-out {
          stroke-dasharray: 6 4;
          animation: flowOut 1.5s linear infinite;
        }
      `}</style>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-background via-muted/20 to-background">
        <svg viewBox="0 0 1000 900" className="w-full h-auto" style={{ minHeight: 500 }}>
          <defs>
            <radialGradient id="engine-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </radialGradient>
            <filter id="node-shadow">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="hsl(var(--foreground))" floodOpacity="0.08" />
            </filter>
            {/* Arrow markers */}
            <marker id="arrow-normal" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto" markerUnits="userSpaceOnUse">
              <path d="M0,1 L9,4 L0,7" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.2" opacity="0.5" />
            </marker>
            <marker id="arrow-destructive" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto" markerUnits="userSpaceOnUse">
              <path d="M0,1 L9,4 L0,7" fill="none" stroke="hsl(var(--destructive))" strokeWidth="1.5" opacity="0.8" />
            </marker>
          </defs>

          {/* Concentric ring guides */}
          <circle cx={CX} cy={CY} r={SOURCE_R} fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.3" />
          <circle cx={CX} cy={CY} r={CONSUMER_R} fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.3" />

          {/* Lines: Sources → Engine */}
          {sourcePositions.map((pos, i) => {
            const sys = allSystems[i];
            const isOff = simulatedOff.has(sys.id);
            const ep = getLineEndpoints(pos.x, pos.y, SOURCE_NODE_R, CX, CY, ENGINE_R);
            return (
              <line
                key={`s2e-${sys.id}`}
                x1={ep.x1}
                y1={ep.y1}
                x2={ep.x2}
                y2={ep.y2}
                stroke={isOff ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))"}
                strokeWidth={isOff ? 1.5 : 1}
                opacity={isOff ? 0.6 : 0.25}
                className={isOff ? "" : "flow-line-in"}
                markerEnd={isOff ? "url(#arrow-destructive)" : "url(#arrow-normal)"}
              />
            );
          })}

          {/* Lines: Engine → Consumers */}
          {consumerPositions.map((pos, i) => {
            const con = consumerNodes[i];
            const isAffected = affectedConsumers.has(con.id);
            const ep = getLineEndpoints(CX, CY, ENGINE_R, pos.x, pos.y, CONSUMER_NODE_R);
            return (
              <line
                key={`e2c-${con.id}`}
                x1={ep.x1}
                y1={ep.y1}
                x2={ep.x2}
                y2={ep.y2}
                stroke={isAffected ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))"}
                strokeWidth={isAffected ? 1.5 : 1}
                opacity={isAffected ? 0.6 : 0.25}
                className={isAffected ? "" : "flow-line-out"}
                markerEnd={isAffected ? "url(#arrow-destructive)" : "url(#arrow-normal)"}
              />
            );
          })}

          {/* Engine glow */}
          <circle cx={CX} cy={CY} r={70} fill="url(#engine-glow)" />

          {/* SOURCE NODES */}
          {allSystems.map((sys, i) => {
            const pos = sourcePositions[i];
            const Icon = iconMap[sys.icon] || Database;
            const isOff = simulatedOff.has(sys.id);
            const isSelected = selected?.type === "source" && selected.system.id === sys.id;
            const nodeR = SOURCE_NODE_R;
            return (
              <g
                key={sys.id}
                onClick={() => setSelected(isSelected ? null : { type: "source", system: sys })}
                className="cursor-pointer"
              >
                {/* Outer ring for simulation */}
                {isOff && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={nodeR + 4}
                    fill="none"
                    stroke="hsl(var(--destructive))"
                    strokeWidth="2"
                    opacity="0.7"
                  >
                    <animate attributeName="opacity" values="0.4;0.9;0.4" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                {/* Selection ring */}
                {isSelected && (
                  <circle cx={pos.x} cy={pos.y} r={nodeR + 3} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
                )}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={nodeR}
                  fill="hsl(var(--card))"
                  stroke={isOff ? "hsl(var(--destructive))" : "hsl(var(--border))"}
                  strokeWidth="1.5"
                  filter="url(#node-shadow)"
                />
                {/* Icon centered in circle */}
                <foreignObject x={pos.x - 14} y={pos.y - 14} width="28" height="28">
                  <div className={`flex items-center justify-center w-full h-full ${isOff ? "text-destructive" : categoryIconColors[sys.category] || "text-teal-500"}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </foreignObject>
                {/* Label below circle */}
                <text
                  x={pos.x}
                  y={pos.y + nodeR + 14}
                  textAnchor="middle"
                  className="fill-foreground"
                  style={{ fontSize: 9, fontWeight: 600 }}
                >
                  {sys.name.length > 20 ? sys.name.slice(0, 18) + "…" : sys.name}
                </text>
                {/* Signal count badge */}
                <circle cx={pos.x + 30} cy={pos.y - 30} r={12} fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="1" />
                <text
                  x={pos.x + 30}
                  y={pos.y - 26}
                  textAnchor="middle"
                  className="fill-muted-foreground"
                  style={{ fontSize: 7, fontWeight: 600 }}
                >
                  {sys.signalCount > 999 ? `${(sys.signalCount / 1000).toFixed(1)}k` : sys.signalCount}
                </text>
              </g>
            );
          })}

          {/* ENGINE NODE */}
          <g
            onClick={() => setSelected(selected?.type === "engine" ? null : { type: "engine" })}
            className="cursor-pointer"
          >
            {selected?.type === "engine" && (
              <circle cx={CX} cy={CY} r={58} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" />
            )}
            <circle
              cx={CX}
              cy={CY}
              r={54}
              fill="hsl(var(--card))"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              filter="url(#node-shadow)"
            />
            <foreignObject x={CX - 16} y={CY - 22} width="32" height="32">
              <div className="flex items-center justify-center w-full h-full text-primary">
                <Brain className="h-6 w-6" />
              </div>
            </foreignObject>
            <text x={CX} y={CY + 20} textAnchor="middle" className="fill-foreground" style={{ fontSize: 9, fontWeight: 700 }}>
              People Graph
            </text>
            <text x={CX} y={CY + 32} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 7 }}>
              Engine
            </text>
          </g>

          {/* CONSUMER NODES */}
          {consumerNodes.map((con, i) => {
            const pos = consumerPositions[i];
            const isAffected = affectedConsumers.has(con.id);
            const isSelected = selected?.type === "consumer" && selected.consumer.id === con.id;
            const nodeR = CONSUMER_NODE_R;
            return (
              <g
                key={con.id}
                onClick={() => setSelected(isSelected ? null : { type: "consumer", consumer: con })}
                className="cursor-pointer"
              >
                {isAffected && (
                  <circle cx={pos.x} cy={pos.y} r={nodeR + 4} fill="none" stroke="hsl(var(--destructive))" strokeWidth="2" opacity="0.7">
                    <animate attributeName="opacity" values="0.4;0.9;0.4" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                {isSelected && (
                  <circle cx={pos.x} cy={pos.y} r={nodeR + 3} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
                )}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={nodeR}
                  fill="hsl(var(--card))"
                  stroke={isAffected ? "hsl(var(--destructive))" : "hsl(var(--border))"}
                  strokeWidth="1.5"
                  filter="url(#node-shadow)"
                />
                {/* Icon centered in circle */}
                <foreignObject x={pos.x - 12} y={pos.y - 12} width="24" height="24">
                  <div className={`flex items-center justify-center w-full h-full ${con.color}`}>
                    {con.icon}
                  </div>
                </foreignObject>
                {/* Label below circle */}
                <text
                  x={pos.x}
                  y={pos.y + nodeR + 14}
                  textAnchor="middle"
                  className="fill-foreground"
                  style={{ fontSize: 8, fontWeight: 600 }}
                >
                  {con.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Detail Panel Overlay */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-4 left-4 right-4 z-20"
          >
            <div className="rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden max-h-[320px] overflow-y-auto">
              {/* Close button */}
              <button
                onClick={() => setSelected(null)}
                className="absolute top-3 right-3 h-7 w-7 rounded-full bg-muted/80 hover:bg-muted flex items-center justify-center z-10"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>

              {/* Source Detail */}
              {selected.type === "source" && (
                <SourceDetail
                  system={selected.system}
                  isSimulated={simulatedOff.has(selected.system.id)}
                  onToggleSimulate={() => toggleSimulate(selected.system.id)}
                />
              )}

              {/* Engine Detail */}
              {selected.type === "engine" && <EngineDetail affectedCompute={affectedCompute} />}

              {/* Consumer Detail */}
              {selected.type === "consumer" && (
                <ConsumerDetail consumer={selected.consumer} isAffected={affectedConsumers.has(selected.consumer.id)} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Detail Sub-Components ─── */

function SourceDetail({
  system,
  isSimulated,
  onToggleSimulate,
}: {
  system: ConnectedSystem;
  isSimulated: boolean;
  onToggleSimulate: () => void;
}) {
  const Icon = iconMap[system.icon] || Database;
  const directCount = system.signals.filter((s) => s.type === "direct").length;
  const derivedCount = system.signals.filter((s) => s.type === "derived").length;

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div
          className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
            isSimulated ? "bg-destructive/20" : categoryColors[system.category] || "bg-teal-500/10 border border-teal-500/30"
          }`}
        >
          <Icon className={`h-5 w-5 ${isSimulated ? "text-destructive" : categoryIconColors[system.category] || "text-teal-500"}`} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-foreground">{system.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{system.description}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1">
              <Zap className="h-3 w-3 text-amber-500" />
              {system.signalCount.toLocaleString()} signals
            </span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
              {directCount} direct
            </Badge>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-purple-500/10 text-purple-700 border-purple-500/20">
              {derivedCount} derived
            </Badge>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1 ml-auto">
              <Clock className="h-2.5 w-2.5" /> {system.lastSync}
            </span>
          </div>
        </div>
      </div>

      {/* Signal list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
        {system.signals.map((sig) => (
          <div key={sig.id} className="flex items-start justify-between gap-2 py-1.5 px-2.5 rounded-lg bg-muted/40">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-foreground">{sig.name}</p>
              <p className="text-[10px] text-muted-foreground line-clamp-1">{sig.description}</p>
            </div>
            <Badge
              variant="outline"
              className={`text-[9px] shrink-0 ${
                sig.type === "direct" ? "border-emerald-500/40 text-emerald-600" : "border-purple-500/40 text-purple-600"
              }`}
            >
              {sig.type}
            </Badge>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-border/40">
        <button
          onClick={onToggleSimulate}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
            isSimulated
              ? "bg-destructive/15 text-destructive hover:bg-destructive/25 ring-1 ring-destructive/30"
              : "bg-muted hover:bg-muted/80 text-foreground"
          }`}
        >
          {isSimulated ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {isSimulated ? "Stop Simulation" : "Simulate Impact"}
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 text-foreground transition-all">
          <Power className="h-3.5 w-3.5" />
          Request Switch Off
        </button>
      </div>
    </div>
  );
}

function EngineDetail({ affectedCompute }: { affectedCompute: Set<string> }) {
  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
          <Brain className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">People Graph Engine</h3>
          <p className="text-xs text-muted-foreground">5 compute nodes processing signals into actionable intelligence</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {computeNodes.map((node) => {
          const isAffected = affectedCompute.has(node.id);
          return (
            <div
              key={node.id}
              className={`p-3 rounded-xl border transition-all ${
                isAffected ? "border-destructive/50 bg-destructive/5" : `${node.bgColor}`
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className={isAffected ? "text-destructive" : node.color}>{node.icon}</span>
                <span className={`text-xs font-semibold ${isAffected ? "text-destructive" : "text-foreground"}`}>
                  {node.label}
                </span>
                {isAffected && (
                  <Badge variant="destructive" className="text-[9px] px-1.5 py-0 ml-auto">
                    Impacted
                  </Badge>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{node.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ConsumerDetail({ consumer, isAffected }: { consumer: ConsumerNode; isAffected: boolean }) {
  // Find which compute nodes feed this consumer
  const feedingComputes = computeNodes.filter((cn) => (computeToConsumerMap[cn.id] || []).includes(consumer.id));

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div
          className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border ${
            isAffected ? "bg-destructive/15 border-destructive/30" : consumer.bgColor
          }`}
        >
          <span className={isAffected ? "text-destructive" : consumer.color}>{consumer.icon}</span>
        </div>
        <div>
          <h3 className={`text-sm font-bold ${isAffected ? "text-destructive" : "text-foreground"}`}>
            {consumer.label}
          </h3>
          {isAffected && (
            <Badge variant="destructive" className="text-[10px] px-2 py-0.5 mt-1">
              Data Reduced — Simulation Active
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Signals received */}
        <div>
          <p className="text-[11px] font-semibold text-foreground mb-2">Signals Received</p>
          <div className="space-y-1">
            {consumer.signals.map((sig, i) => (
              <div key={i} className="flex items-center gap-2 py-1 px-2 rounded-md bg-muted/40">
                <Zap className="h-2.5 w-2.5 text-amber-500 shrink-0" />
                <span className="text-[11px] text-foreground">{sig}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fed by compute nodes */}
        <div>
          <p className="text-[11px] font-semibold text-foreground mb-2">Fed by Compute Nodes</p>
          <div className="space-y-1">
            {feedingComputes.map((cn) => {
              const isCompAffected = isAffected;
              return (
                <div
                  key={cn.id}
                  className={`flex items-center gap-2 py-1 px-2 rounded-md ${
                    isCompAffected ? "bg-destructive/10" : "bg-muted/40"
                  }`}
                >
                  <span className={isCompAffected ? "text-destructive" : cn.color}>{cn.icon}</span>
                  <span className={`text-[11px] ${isCompAffected ? "text-destructive" : "text-foreground"}`}>
                    {cn.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

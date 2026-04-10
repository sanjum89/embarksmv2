import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, Briefcase, Users, HeartHandshake, Calculator,
  Search, ShieldCheck, Mail, UserPlus, Building2, FileText,
  UserCheck, Network, GraduationCap, MessageCircle, Drama,
  Database, ChevronDown, ChevronUp, Zap, Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { ConnectedSystem } from "@/data/peopleGraphSystems";

const iconMap: Record<string, React.ElementType> = {
  TrendingUp, Briefcase, Users, HeartHandshake, Calculator,
  Search, ShieldCheck, Mail, UserPlus, Building2, FileText,
  UserCheck, Network, GraduationCap, MessageCircle, Drama,
};

const categoryConfig: Record<string, { label: string; gradient: string; border: string }> = {
  "pre-onboarding": { label: "Pre-Onboarding", gradient: "from-emerald-500/20 to-teal-500/10", border: "border-emerald-500/30" },
  "hris": { label: "HRIS / HCM", gradient: "from-blue-500/20 to-indigo-500/10", border: "border-blue-500/30" },
  "resume": { label: "Resume", gradient: "from-violet-500/20 to-purple-500/10", border: "border-violet-500/30" },
  "manager-validated": { label: "Manager", gradient: "from-amber-500/20 to-orange-500/10", border: "border-amber-500/30" },
  "job-architecture": { label: "Job Architecture", gradient: "from-cyan-500/20 to-sky-500/10", border: "border-cyan-500/30" },
  "engagement": { label: "System of Engagement", gradient: "from-pink-500/20 to-rose-500/10", border: "border-pink-500/30" },
  "work": { label: "System of Work", gradient: "from-teal-500/20 to-emerald-500/10", border: "border-teal-500/30" },
};

interface Props {
  foundational: ConnectedSystem[];
  engagement: ConnectedSystem[];
  work: ConnectedSystem[];
  pendingToggles: Record<string, boolean>;
  onToggle: (systemId: string, enabled: boolean) => void;
}

export function ConnectedSystemsMap({ foundational, engagement, work, pendingToggles, onToggle }: Props) {
  const groups = [
    { key: "foundational", label: "Foundational Sources", systems: foundational, description: "Core identity and skills data" },
    { key: "engagement", label: "System of Engagement", systems: engagement, description: "Learning, reflections, and role plays" },
    { key: "work", label: "System of Work", systems: work, description: "Real-world performance signals" },
  ];

  return (
    <div className="space-y-6">
      {/* Central People Graph Node */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex justify-center"
      >
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-teal-500/30 via-purple-500/20 to-amber-500/30 blur-xl" />
          <Card className="relative border-2 border-teal-500/40 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-teal-400 to-purple-500 flex items-center justify-center">
                <Database className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">People Graph</h3>
                <p className="text-sm text-slate-400">
                  {foundational.length + engagement.length + work.length} systems connected · {" "}
                  {(foundational.concat(engagement, work)).reduce((s, sys) => s + sys.signalCount, 0).toLocaleString()} signals
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500" />
                </span>
                <span className="text-xs text-teal-400 font-medium">Live</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Flow lines */}
      <div className="flex justify-center">
        <div className="flex gap-8">
          {["from-emerald-500", "from-pink-500", "from-teal-500"].map((c, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: 32 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className={`w-0.5 bg-gradient-to-b ${c} to-transparent`}
            />
          ))}
        </div>
      </div>

      {/* System Groups */}
      {groups.map((group, gi) => (
        <motion.div
          key={group.key}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 + gi * 0.15 }}
        >
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-foreground">{group.label}</h4>
            <p className="text-xs text-muted-foreground">{group.description}</p>
          </div>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {group.systems.map((sys) => (
              <SystemCard
                key={sys.id}
                system={sys}
                isPending={pendingToggles[sys.id] !== undefined}
                isEnabled={pendingToggles[sys.id] ?? sys.status === "active"}
                onToggle={(enabled) => onToggle(sys.id, enabled)}
              />
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function SystemCard({ system, isPending, isEnabled, onToggle }: {
  system: ConnectedSystem;
  isPending: boolean;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const Icon = iconMap[system.icon] || Database;
  const cat = categoryConfig[system.category] || categoryConfig["work"];
  const directCount = system.signals.filter(s => s.type === "direct").length;
  const derivedCount = system.signals.filter(s => s.type === "derived").length;

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <Card className={`relative overflow-hidden border ${cat.border} bg-gradient-to-br ${cat.gradient} backdrop-blur-sm transition-all hover:shadow-lg`}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-background/80 flex items-center justify-center shadow-sm">
                <Icon className="h-4.5 w-4.5 text-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{system.name}</p>
                <p className="text-xs text-muted-foreground truncate">{system.description}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Zap className="h-3 w-3" />{system.signalCount.toLocaleString()}</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{system.lastSync}</span>
            </div>
            <div className="flex items-center gap-2">
              {isPending && (
                <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-600">
                  Pending
                </Badge>
              )}
              <Switch
                checked={isEnabled}
                onCheckedChange={onToggle}
                className="scale-75"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px] bg-emerald-500/15 text-emerald-700 border-emerald-500/30">
              {directCount} Direct
            </Badge>
            <Badge variant="secondary" className="text-[10px] bg-purple-500/15 text-purple-700 border-purple-500/30">
              {derivedCount} Derived
            </Badge>
          </div>

          <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer w-full justify-center pt-1">
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? "Hide signals" : "View signals"}
          </CollapsibleTrigger>

          <CollapsibleContent>
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1.5 pt-2 border-t border-border/50"
                >
                  {system.signals.map((sig) => (
                    <div key={sig.id} className="flex items-center justify-between py-1">
                      <span className="text-xs text-foreground/80">{sig.name}</span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] ${
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
  );
}

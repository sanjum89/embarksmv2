import { useLearnPath, type LearningMode } from "@/contexts/LearnPathContext";
import { useContentSubstitution } from "@/lib/contentSubstitution";
import { useAccount } from "@/contexts/AccountContext";
import { LearnPathPodcastPlayer } from "./LearnPathPodcastPlayer";
import { ScenarioQuestion } from "./ScenarioQuestion";
import { HandsOnRolePlayCard } from "./HandsOnRolePlayCard";
import { VisualDiagram, parseTranscriptToDiagram, extractFlowCharts } from "./VisualDiagram";
import { FlowDiagram } from "./FlowDiagram";
import type { LearningModule, LearningFormat } from "@/types/learning";
import ReactMarkdown from "react-markdown";
import { useState, useRef, useEffect, useCallback } from "react";
import { Eye, BookOpen, Headphones, Wrench, Layers, Clock, FileText, BookOpenCheck, Users, Zap, ChevronDown, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { cn } from "@/lib/utils";
import { getPodcastTranscript, getStaticPodcastUrl } from "@/data/podcastTranscripts";
import { getHandsOnScenarios } from "@/data/handsOnScenarios";
import { mockRolePlayBank, moduleRolePlayMap } from "@/data/mock";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface Props {
  module: LearningModule;
  skillTargetTitle?: string;
  learningFormat?: LearningFormat;
  learningModeOverride?: LearningMode;
  skillTargetId?: string;
  stepId?: string;
  onComplete?: () => void;
  /** When true, suppresses the inner module header card + mode banner (parent renders its own) */
  hideHeader?: boolean;
}

const modeBanners: Record<string, { icon: React.ElementType; label: string; desc: string; className: string }> = {
  visual: { icon: Eye, label: "Visual Mode", desc: "Key concepts presented visually with diagrams and summaries.", className: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800" },
  reading: { icon: BookOpen, label: "Reading Mode", desc: "Full written content for deep, self-paced study.", className: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" },
  listening: { icon: Headphones, label: "Listening Mode", desc: "Podcast-style conversation — learn hands-free.", className: "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800" },
  "hands-on": { icon: Wrench, label: "Hands-On Mode", desc: "Interactive scenarios and role-play practice.", className: "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800" },
  combined: { icon: Layers, label: "Combined Mode", desc: "A curated blend of reading, visuals, and practice.", className: "bg-primary/10 text-primary border-primary/20" },
};

export function LearnPathModuleContent({ module, skillTargetTitle, learningFormat, learningModeOverride, skillTargetId, stepId, onComplete, hideHeader }: Props) {
  const learnPathCtx = useLearnPath();
  const learningMode = learningModeOverride ?? learnPathCtx.learningMode;
  const openAssessment = learnPathCtx.openAssessment;
  const { skillTargets, updateSkillTarget } = useSkillTargets();
  const navigate = useNavigate();
  const { substitute, substituteDeep } = useContentSubstitution();
  const { normalizedAccount } = useAccount();
  const isMicro = learningFormat === "micro";
  const transcript = substitute(module.transcript ?? "No content available for this module.");
  const [microExpanded, setMicroExpanded] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showAllBullets, setShowAllBullets] = useState(false);

  // Reading progress
  const scrollRef = useRef<HTMLDivElement>(null);
  const [readingProgress, setReadingProgress] = useState(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const progress = scrollHeight <= clientHeight ? 100 : Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
    setReadingProgress(progress);
  }, []);

  // For micro mode: truncate to ~30% of content
  const microTranscript = (() => {
    if (!isMicro || microExpanded) return transcript;
    const lines = transcript.split("\n");
    const cutoff = Math.max(8, Math.ceil(lines.length * 0.3));
    return lines.slice(0, cutoff).join("\n") + "\n\n---\n\n*This is a condensed view. Expand to see the full content.*";
  })();

  const banner = modeBanners[learningMode];
  const rawPodcastScript = getPodcastTranscript(module.id);
  const podcastScript = rawPodcastScript ? substituteDeep(rawPodcastScript) : undefined;
  const rawHandsOnData = getHandsOnScenarios(module.id);
  const handsOnData = rawHandsOnData ? substituteDeep(rawHandsOnData) : undefined;
  const rpIds = moduleRolePlayMap[module.id] ?? [];
  const rolePlays = rpIds.map((id) => mockRolePlayBank.find((rp) => rp.id === id)).filter(Boolean).map((rp) => substituteDeep(rp));

  const wordCount = transcript.split(/\s+/).length;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const handleMarkComplete = () => {
    setCompleted(true);
    if (onComplete) {
      onComplete();
      return;
    }
    // If we have skillTargetId and stepId, update directly
    if (skillTargetId && stepId) {
      updateSkillTarget(skillTargetId, (target) => {
        const updatedSteps = target.steps.map((s) => {
          if (s.id === stepId) return { ...s, status: "completed" as const };
          return s;
        });
        const sortedSteps = [...updatedSteps].sort((a, b) => a.order - b.order);
        const currentStep = sortedSteps.find((s) => s.id === stepId);
        const currentOrder = currentStep?.order ?? 0;
        const nextLocked = sortedSteps.find((s) => s.order > currentOrder && s.status === "locked");
        const finalSteps = nextLocked
          ? updatedSteps.map((s) => s.id === nextLocked.id ? { ...s, status: "available" as const } : s)
          : updatedSteps;
        const completedCount = finalSteps.filter((s) => s.status === "completed" || s.status === "skipped").length;
        const progress = Math.round((completedCount / finalSteps.length) * 100);
        return { ...target, steps: finalSteps, progress };
      });
    }
  };

  const renderModuleHeader = () => (
    <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-4">
      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
        <FileText className="h-5 w-5 text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground text-base">{substitute(module.title)}</h3>
        {skillTargetTitle && <p className="text-xs text-muted-foreground mt-0.5">{skillTargetTitle}</p>}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            <Clock className="h-3 w-3" /> {module.duration}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            <FileText className="h-3 w-3" /> {isMicro ? "Microlearning" : (module.contentType === "video" ? "Video" : "Full Module")}
          </span>
          {isMicro && (
            <span className="inline-flex items-center gap-1 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-medium">
              <Zap className="h-3 w-3" /> Condensed
            </span>
          )}
        </div>
      </div>
      <Button
        size="sm"
        variant={completed ? "ghost" : "default"}
        disabled={completed}
        onClick={handleMarkComplete}
        className={cn("shrink-0 gap-1.5 text-xs", completed && "text-emerald-600")}
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        {completed ? "Completed" : "Mark as Complete"}
      </Button>
    </div>
  );

  const renderModeBanner = () => {
    if (!banner) return null;
    const Icon = banner.icon;
    return (
      <div className={cn("rounded-lg border px-4 py-3 flex items-center gap-3", banner.className)}>
        <Icon className="h-4 w-4 shrink-0" />
        <div>
          <span className="font-medium text-sm">{banner.label}</span>
          <span className="text-xs ml-2 opacity-80">{banner.desc}</span>
        </div>
      </div>
    );
  };

  /* ═══ VISUAL MODE ═══ */
  const renderVisual = () => {
    const flowCharts = substituteDeep(extractFlowCharts(transcript));
    const diagramNodes = substituteDeep(parseTranscriptToDiagram(transcript));
    const bullets = transcript.match(/^\*\s+.+$/gm)?.slice(0, 8) ?? [];
    const visibleBullets = showAllBullets ? bullets : bullets.slice(0, 6);

    return (
      <div className="space-y-6">
        {/* Flow-chart diagrams */}
        {flowCharts.length > 0 && (
          <div className="space-y-6">
            {flowCharts.map((chart, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-8 flex justify-center animate-fade-in">
                <FlowDiagram chart={chart} />
              </div>
            ))}
          </div>
        )}
        {/* Concept Map — section cards */}
        {diagramNodes.length > 0 && (
          <VisualDiagram title="Concept Map" nodes={diagramNodes} />
        )}

        {/* Key Takeaways */}
        {visibleBullets.length > 0 && (
          <div className="bg-card rounded-xl p-5 border border-border">
            <h4 className="font-semibold mb-3 text-foreground flex items-center gap-2 text-sm">
              💡 Key Takeaways
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {visibleBullets.map((b, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-sm text-foreground flex items-start gap-2 animate-fade-in",
                    i % 2 === 0 ? "bg-muted/50" : "bg-muted/30"
                  )}
                  style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
                >
                  <span className="text-primary font-bold mt-0.5 shrink-0">→</span>
                  <span className="leading-relaxed">{b.replace(/^\*\s*/, "").replace(/\*\*/g, "")}</span>
                </div>
              ))}
            </div>
            {bullets.length > 6 && !showAllBullets && (
              <Button variant="ghost" size="sm" onClick={() => setShowAllBullets(true)} className="mt-3 w-full text-xs">
                Show {bullets.length - 6} more takeaways
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  /* ═══ READING MODE ═══ */
  const renderReading = () => {
    const headings = transcript.match(/^#{1,3}\s+.+$/gm) ?? [];
    return (
      <div className="space-y-5">
        {/* Reading progress bar */}
        <div className="sticky top-0 z-10 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-150 ease-out rounded-full"
            style={{ width: `${readingProgress}%` }}
          />
        </div>

        {/* Table of contents */}
        {headings.length > 2 && (
          <div className="rounded-xl border border-border bg-muted/30 p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Table of Contents</h4>
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <BookOpenCheck className="h-3 w-3" /> ~{readingMinutes} min · {wordCount} words
              </span>
            </div>
            <ul className="space-y-1.5">
              {headings.map((h, i) => {
                const level = (h.match(/^#+/) ?? [""])[0].length;
                const text = h.replace(/^#+\s*/, "");
                return (
                  <li key={i} className={cn(
                    "text-sm",
                    level <= 2 ? "text-foreground font-medium" : "ml-4 text-muted-foreground",
                  )}>
                    {text}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Content */}
        <div className="bg-card rounded-xl border border-border p-6 md:p-10">
          <div className={cn(
            "prose prose-lg dark:prose-invert max-w-prose mx-auto",
            "prose-headings:text-foreground prose-headings:font-bold",
            "prose-h1:text-2xl prose-h1:mt-6 prose-h1:mb-4",
            "prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-l-4 prose-h2:border-l-primary prose-h2:pl-4",
            "prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3",
            "prose-p:text-muted-foreground prose-p:leading-8 prose-p:mb-4",
            "prose-li:text-muted-foreground prose-li:leading-7",
            "prose-strong:text-foreground prose-strong:font-semibold",
            "prose-ul:space-y-2 prose-ul:my-4",
            "prose-ol:space-y-2 prose-ol:my-4",
            "prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:px-4",
          )}>
            <ReactMarkdown>{isMicro ? microTranscript : transcript}</ReactMarkdown>
          </div>
          {isMicro && !microExpanded && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMicroExpanded(true)}
              className="mt-4 gap-1.5 w-full"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              View Full Content
            </Button>
          )}
        </div>
      </div>
    );
  };

  /* ═══ LISTENING MODE ═══ */
  const renderListening = () => {
    if (podcastScript) {
      const staticUrl = getStaticPodcastUrl(module.id, normalizedAccount?.branding?.name);
      return <LearnPathPodcastPlayer script={podcastScript} staticAudioUrl={staticUrl} />;
    }
    return (
      <div className="space-y-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Podcast version not available for this module. Showing reading transcript instead.</p>
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{transcript}</ReactMarkdown>
        </div>
      </div>
    );
  };

  /* ═══ HANDS-ON MODE ═══ */
  const renderHandsOn = () => (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        {handsOnData?.intro ?? "Practice what you've learned through interactive scenarios and role-play."}
      </p>
      {rolePlays.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Role Play Scenarios
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {rolePlays.map((rp) => rp && <HandsOnRolePlayCard key={rp.id} rolePlay={rp} />)}
          </div>
        </div>
      )}
      {handsOnData?.scenarios.map((scenario, idx) => (
        <ScenarioQuestion
          key={idx}
          index={idx}
          title={scenario.title}
          context={scenario.context}
          options={scenario.options}
        />
      ))}
      <Button variant="outline" onClick={() => openAssessment(module.id)} className="gap-2 w-full">
        📝 Take a Quick Assessment
      </Button>
    </div>
  );

  /* ═══ COMBINED MODE — Curated Blend ═══ */
  const renderCombined = () => {
    const flowCharts = extractFlowCharts(transcript);
    const diagramNodes = parseTranscriptToDiagram(transcript);

    // Extract a condensed summary: first 2 paragraphs of transcript
    const paragraphs = transcript.split("\n\n").filter(p => p.trim() && !p.startsWith("#"));
    const summaryText = paragraphs.slice(0, 3).join("\n\n");

    return (
      <div className="space-y-6">
        {/* 1. Condensed Reading Summary */}
        <div className="bg-card rounded-xl border border-border p-6 md:p-8">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
            <BookOpen className="h-4 w-4 text-primary" />
            Summary
          </h4>
          <div className={cn(
            "prose prose-sm dark:prose-invert max-w-prose",
            "prose-p:text-muted-foreground prose-p:leading-7 prose-p:mb-3",
            "prose-strong:text-foreground prose-strong:font-semibold",
            "prose-ul:space-y-1 prose-ul:my-3",
            "prose-li:text-muted-foreground prose-li:leading-6",
          )}>
            <ReactMarkdown>{summaryText}</ReactMarkdown>
          </div>
        </div>

        {/* 2. Visual Representation (if applicable) */}
        {(flowCharts.length > 0 || diagramNodes.length > 0) && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              Visual Overview
            </h4>
            {flowCharts.length > 0 && (
              <div className="space-y-4">
                {flowCharts.map((chart, i) => (
                  <div key={i} className="bg-card rounded-xl border border-border p-6 flex justify-center animate-fade-in">
                    <FlowDiagram chart={chart} />
                  </div>
                ))}
              </div>
            )}
            {diagramNodes.length > 0 && (
              <VisualDiagram title="Concept Map" nodes={diagramNodes} />
            )}
          </div>
        )}

        {/* 3. Role Play (if available) */}
        {rolePlays.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Practice: Role Play
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {rolePlays.map((rp) => rp && <HandsOnRolePlayCard key={rp.id} rolePlay={rp} />)}
            </div>
          </div>
        )}

        {/* 4. Scenario Questions (if available) */}
        {handsOnData && handsOnData.scenarios.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Wrench className="h-4 w-4 text-primary" />
              Check Your Understanding
            </h4>
            {handsOnData.scenarios.map((scenario, idx) => (
              <ScenarioQuestion
                key={idx}
                index={idx}
                title={scenario.title}
                context={scenario.context}
                options={scenario.options}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center animate-fade-in">
        <div className="h-16 w-16 rounded-full bg-success/15 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Module Complete!</h3>
        <p className="text-sm text-muted-foreground mb-6">Great work. Keep going!</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4" ref={scrollRef} onScroll={handleScroll}>
      {!hideHeader && renderModuleHeader()}
      {!hideHeader && renderModeBanner()}
      {learningMode === "visual" && renderVisual()}
      {learningMode === "reading" && renderReading()}
      {learningMode === "listening" && renderListening()}
      {learningMode === "hands-on" && renderHandsOn()}
      {learningMode === "combined" && renderCombined()}
    </div>
  );
}

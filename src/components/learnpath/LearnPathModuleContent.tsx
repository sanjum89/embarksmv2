import { useEmbark, type LearningMode } from "@/contexts/LearnPathContext";
import { useContentSubstitution } from "@/lib/contentSubstitution";
import { useAccount } from "@/contexts/AccountContext";
import { EmbarkPodcastPlayer } from "./LearnPathPodcastPlayer";
import { ScenarioQuestion } from "./ScenarioQuestion";
import { HandsOnRolePlayCard } from "./HandsOnRolePlayCard";
import { VisualDiagram, parseTranscriptToDiagram, extractFlowCharts } from "./VisualDiagram";
import { FlowDiagram } from "./FlowDiagram";
import type { LearningModule, LearningFormat, StepType } from "@/types/learning";
import ReactMarkdown from "react-markdown";
import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Eye, BookOpen, Headphones, Wrench, Layers, Clock, FileText, BookOpenCheck, Users, Zap, ChevronDown, CheckCircle2, ArrowRight, Timer, BarChart3, TrendingUp, Flame, Lightbulb, Star, Sparkles, ChevronRight } from "lucide-react";
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
  /** Next step info for continue button on completion */
  nextModuleId?: string;
  nextModuleTitle?: string;
  nextSkillTargetId?: string;
  nextStepType?: StepType;
  /** Mount in completed state (revisiting a finished module) */
  initialCompleted?: boolean;
  /** Notify parent when completion state changes (so parent can hide mode selector etc.) */
  onCompletedChange?: (completed: boolean) => void;
}

const modeBanners: Record<string, { icon: React.ElementType; label: string; desc: string; className: string }> = {
  visual: { icon: Eye, label: "Visual Mode", desc: "Key concepts presented visually with diagrams and summaries.", className: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800" },
  reading: { icon: BookOpen, label: "Reading Mode", desc: "Full written content for deep, self-paced study.", className: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" },
  listening: { icon: Headphones, label: "Listening Mode", desc: "Podcast-style conversation — learn hands-free.", className: "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800" },
  "hands-on": { icon: Wrench, label: "Hands-On Mode", desc: "Interactive scenarios and role-play practice.", className: "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800" },
  combined: { icon: Layers, label: "Combined Mode", desc: "A curated blend of reading, visuals, and practice.", className: "bg-primary/10 text-primary border-primary/20" },
};

export function EmbarkModuleContent({ module, skillTargetTitle, learningFormat, learningModeOverride, skillTargetId, stepId, onComplete, hideHeader, nextModuleId, nextModuleTitle, nextSkillTargetId, nextStepType, initialCompleted = false, onCompletedChange }: Props) {
  const learnPathCtx = useEmbark();
  const learningMode = learningModeOverride ?? learnPathCtx.learningMode;
  const openAssessment = learnPathCtx.openAssessment;
  const { skillTargets, updateSkillTarget } = useSkillTargets();
  const navigate = useNavigate();
  const { substitute, substituteDeep } = useContentSubstitution();
  const { normalizedAccount } = useAccount();
  const isMicro = learningFormat === "micro";
  const transcript = substitute(module.transcript ?? "No content available for this module.");
  const [microExpanded, setMicroExpanded] = useState(false);
  const [completed, setCompleted] = useState(initialCompleted);
  const [isRevisit] = useState(initialCompleted);
  const [showAllBullets, setShowAllBullets] = useState(false);
  const startTimeRef = useRef(Date.now());

  // Notify parent of completion state changes
  useEffect(() => {
    onCompletedChange?.(completed);
  }, [completed, onCompletedChange]);

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
    // Always update skill target to unlock next step
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
    onComplete?.();
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
    const contentToRender = isMicro ? microTranscript : transcript;

    // Extract key takeaway — last section after "Key" / "Summary" / "Takeaway" heading, or last paragraph
    const takeawayMatch = contentToRender.match(/#{1,3}\s+(?:Key|Summary|Takeaway|Conclusion)[^\n]*\n([\s\S]*?)(?=\n#{1,3}\s|\z)/i);
    const takeawayText = takeawayMatch
      ? takeawayMatch[1].trim()
      : contentToRender.split("\n\n").filter(p => p.trim() && !p.startsWith("#")).slice(-1)[0]?.trim();

    // Section counter for h2
    let sectionCounter = 0;

    return (
      <div className="space-y-5">
        {/* Reading progress bar — warm gradient */}
        <div className="sticky top-0 z-10 h-1.5 bg-muted/60 rounded-full overflow-hidden group">
          <div
            className="h-full rounded-full transition-all duration-200 ease-out"
            style={{
              width: `${readingProgress}%`,
              background: 'linear-gradient(90deg, hsl(var(--success)), hsl(var(--primary)))',
            }}
          />
        </div>

        {/* Warm welcome banner */}
        <div className="rounded-2xl border border-border overflow-hidden">
          <div
            className="px-6 py-7 md:px-8 md:py-8"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--success) / 0.08), hsl(var(--accent) / 0.06), hsl(var(--primary) / 0.04))',
            }}
          >
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-success/15 flex items-center justify-center shrink-0">
                <BookOpen className="h-6 w-6 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-xl md:text-2xl font-bold text-foreground leading-tight mb-1.5">
                  {substitute(module.title)}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Let's explore this together — take your time and enjoy the read.
                </p>
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-card/80 px-2.5 py-1 rounded-full border border-border/50">
                    <Clock className="h-3 w-3" /> ~{readingMinutes} min read
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-card/80 px-2.5 py-1 rounded-full border border-border/50">
                    <FileText className="h-3 w-3" /> {wordCount.toLocaleString()} words
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table of contents — warm "What you'll learn" */}
        {headings.length > 2 && (
          <Accordion type="single" collapsible defaultValue="toc">
            <AccordionItem value="toc" className="rounded-2xl border border-border bg-card overflow-hidden">
              <AccordionTrigger className="px-5 py-4 hover:no-underline">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <span className="text-sm font-semibold text-foreground">What you'll learn</span>
                  <span className="text-xs text-muted-foreground ml-1">({headings.filter(h => (h.match(/^#+/) ?? [""])[0].length <= 2).length} sections)</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="px-5 pb-4 space-y-1">
                  {headings.map((h, i) => {
                    const level = (h.match(/^#+/) ?? [""])[0].length;
                    const text = h.replace(/^#+\s*/, "");
                    if (level > 3) return null;
                    return (
                      <div
                        key={i}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted/60 cursor-default",
                          level <= 2 ? "text-foreground font-medium" : "ml-6 text-muted-foreground text-xs",
                        )}
                      >
                        {level <= 2 && (
                          <span className="h-5 w-5 rounded-md bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                            {headings.filter((hh, ii) => ii <= i && (hh.match(/^#+/) ?? [""])[0].length <= 2).length}
                          </span>
                        )}
                        {level > 2 && <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />}
                        <span>{text}</span>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* Content with custom ReactMarkdown components */}
        <div className="bg-card rounded-2xl border border-border p-6 md:p-10">
          <div className="max-w-prose mx-auto">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="font-display text-2xl font-bold text-foreground mt-6 mb-4">{children}</h1>
                ),
                h2: ({ children }) => {
                  sectionCounter++;
                  return (
                    <div className="mt-12 mb-5 first:mt-0">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="h-7 w-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                          {sectionCounter}
                        </span>
                        <div className="h-px flex-1 bg-border" />
                      </div>
                      <h2 className="font-display text-xl font-bold text-foreground border-l-4 border-l-accent pl-4">
                        {children}
                      </h2>
                    </div>
                  );
                },
                h3: ({ children }) => (
                  <div className="mt-8 mb-3 flex items-center gap-2.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                    <h3 className="font-display text-lg font-semibold text-foreground">{children}</h3>
                  </div>
                ),
                p: ({ children }) => (
                  <p className="text-[15px] text-muted-foreground leading-[1.85] mb-4">{children}</p>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-foreground bg-accent/10 px-1 py-0.5 rounded-sm">{children}</strong>
                ),
                ul: ({ children }) => (
                  <ul className="space-y-1.5 my-4">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="space-y-1.5 my-4 list-none counter-reset-none">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="flex items-start gap-2.5 rounded-lg bg-muted/30 px-3.5 py-2.5 text-[15px] text-muted-foreground leading-relaxed">
                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                    <span>{children}</span>
                  </li>
                ),
                blockquote: ({ children }) => (
                  <div className="my-5 rounded-xl border border-accent/20 bg-accent/5 p-4 flex gap-3">
                    <Lightbulb className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    <div className="text-sm text-foreground/80 leading-relaxed [&>p]:mb-0">{children}</div>
                  </div>
                ),
                hr: () => (
                  <div className="my-8 flex items-center gap-3">
                    <div className="h-px flex-1 bg-border" />
                    <Sparkles className="h-3.5 w-3.5 text-muted-foreground/40" />
                    <div className="h-px flex-1 bg-border" />
                  </div>
                ),
              }}
            >
              {contentToRender}
            </ReactMarkdown>
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

        {/* Key Takeaway box */}
        {takeawayText && takeawayText.length > 20 && (
          <div className="rounded-2xl border border-accent/20 overflow-hidden">
            <div className="px-5 py-4 flex items-center gap-2.5" style={{ background: 'linear-gradient(135deg, hsl(var(--accent) / 0.08), hsl(var(--accent) / 0.03))' }}>
              <Star className="h-4.5 w-4.5 text-accent" />
              <span className="text-sm font-semibold text-foreground">Key Takeaway</span>
            </div>
            <div className="px-5 py-4 bg-card">
              <p className="text-sm text-muted-foreground leading-relaxed">{takeawayText.replace(/^\*+\s*/, "").replace(/\*+/g, "")}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ═══ LISTENING MODE ═══ */
  const renderListening = () => {
    if (podcastScript) {
      const staticUrl = getStaticPodcastUrl(module.id, normalizedAccount?.branding?.name);
      return <EmbarkPodcastPlayer script={podcastScript} staticAudioUrl={staticUrl} />;
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
            {rolePlays.map((rp) => rp && <HandsOnRolePlayCard key={rp.id} rolePlay={rp} skillTargetId={skillTargetId} />)}
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
    const flowCharts = substituteDeep(extractFlowCharts(transcript));
    const diagramNodes = substituteDeep(parseTranscriptToDiagram(transcript));

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
              {rolePlays.map((rp) => rp && <HandsOnRolePlayCard key={rp.id} rolePlay={rp} skillTargetId={skillTargetId} />)}
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

  const completionStats = useMemo(() => {
    if (!completed) return null;
    let timeSpent: string;
    if (isRevisit) {
      timeSpent = "Previously completed";
    } else {
      const elapsed = Date.now() - startTimeRef.current;
      const mins = Math.floor(elapsed / 60000);
      const secs = Math.floor((elapsed % 60000) / 1000);
      timeSpent = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    }

    // Skill target progress
    const currentTarget = skillTargetId ? skillTargets.find(t => t.id === skillTargetId) : undefined;
    const totalSteps = currentTarget?.steps.length ?? 0;
    const completedSteps = currentTarget?.steps.filter(s => s.status === "completed" || s.status === "skipped").length ?? 0;
    const progressText = totalSteps > 0 ? `${completedSteps}/${totalSteps}` : "—";

    // Assessment score — look for a completed assessment sibling step
    const assessmentStep = currentTarget?.steps.find(s =>
      (s as any).type === "assessment" && (s.status === "completed" || s.status === "skipped")
    );
    const assessmentScore = (assessmentStep as any)?.score != null ? `${(assessmentStep as any).score}%` : "—";

    // Learning streak — consecutive completed steps ending at current
    let streak = 0;
    if (currentTarget) {
      const sorted = [...currentTarget.steps].sort((a, b) => a.order - b.order);
      const currentIdx = sorted.findIndex(s => s.id === stepId);
      for (let i = currentIdx; i >= 0; i--) {
        if (sorted[i].status === "completed") streak++;
        else break;
      }
    }
    const streakText = streak > 0 ? `${streak} in a row` : "—";

    return { timeSpent, assessmentScore, progressText, streakText };
  }, [completed, skillTargetId, skillTargets, stepId]);

  if (completed) {
    const handleContinue = () => {
      if (!nextModuleId) return;
      if (nextStepType === "assessment") {
        learnPathCtx.openAssessment(nextModuleId);
      } else {
        learnPathCtx.openModule(nextModuleId, nextSkillTargetId);
      }
    };

    return (
      <CompletionScreen
        moduleTitle={substitute(module.title)}
        completionStats={completionStats}
        nextModuleId={nextModuleId}
        nextModuleTitle={nextModuleTitle}
        nextSkillTargetId={nextSkillTargetId}
        skillTargetId={skillTargetId}
        isRevisit={isRevisit}
        onContinue={handleContinue}
        onBackToGrid={() => learnPathCtx.showModuleGrid()}
      />
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

interface CompletionScreenProps {
  moduleTitle: string;
  completionStats: { timeSpent: string; assessmentScore: string; progressText: string; streakText: string } | null;
  nextModuleId?: string;
  nextModuleTitle?: string;
  nextSkillTargetId?: string;
  skillTargetId?: string;
  isRevisit: boolean;
  onContinue: () => void;
  onBackToGrid: () => void;
}

function CompletionScreen({
  moduleTitle,
  completionStats,
  nextModuleId,
  nextModuleTitle,
  nextSkillTargetId,
  skillTargetId,
  isRevisit,
  onContinue,
  onBackToGrid,
}: CompletionScreenProps) {
  const AUTO_ADVANCE_MS = 5000;
  const TICK_MS = 50;
  const hasNext = Boolean(nextModuleId && nextModuleTitle);
  // Auto-advance only on first completion (not revisits) and when there is a next step
  const [autoActive, setAutoActive] = useState(hasNext && !isRevisit);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!autoActive) return;
    const start = Date.now();
    const interval = setInterval(() => {
      const e = Date.now() - start;
      if (e >= AUTO_ADVANCE_MS) {
        clearInterval(interval);
        setElapsed(AUTO_ADVANCE_MS);
        onContinue();
      } else {
        setElapsed(e);
      }
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [autoActive, onContinue]);

  const cancelAuto = () => setAutoActive(false);
  const progressPct = Math.min(100, Math.round((elapsed / AUTO_ADVANCE_MS) * 100));
  const secondsLeft = Math.max(0, Math.ceil((AUTO_ADVANCE_MS - elapsed) / 1000));

  return (
    <div
      className="flex flex-col items-center justify-center p-8 md:p-12 text-center animate-fade-in max-w-lg mx-auto"
      onMouseEnter={cancelAuto}
    >
      <div className="h-16 w-16 rounded-full bg-success/15 flex items-center justify-center mb-4">
        <CheckCircle2 className="h-8 w-8 text-success" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">
        {isRevisit ? "Module Summary" : "Module Complete!"}
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        {isRevisit ? "You've already completed" : "Great work on"} "{moduleTitle}"
      </p>

      {completionStats && (
        <div className="grid grid-cols-2 gap-3 w-full mb-6">
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col items-center gap-1.5">
            <Timer className="h-5 w-5 text-primary" />
            <span className="text-xs text-muted-foreground">Time Spent</span>
            <span className="text-sm font-bold text-foreground">{completionStats.timeSpent}</span>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col items-center gap-1.5">
            <BarChart3 className="h-5 w-5 text-primary" />
            <span className="text-xs text-muted-foreground">Assessment</span>
            <span className="text-lg font-bold text-foreground">{completionStats.assessmentScore}</span>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col items-center gap-1.5">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="text-xs text-muted-foreground">Progress</span>
            <span className="text-lg font-bold text-foreground">{completionStats.progressText}</span>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col items-center gap-1.5">
            <Flame className="h-5 w-5 text-primary" />
            <span className="text-xs text-muted-foreground">Streak</span>
            <span className="text-lg font-bold text-foreground">{completionStats.streakText}</span>
          </div>
        </div>
      )}

      {hasNext ? (
        <div className="w-full space-y-3">
          <div className="rounded-xl border border-border bg-card p-4 text-left">
            <p className="text-xs text-muted-foreground mb-1">Next Up</p>
            <p className="text-sm font-medium text-foreground">{nextModuleTitle}</p>
            {nextSkillTargetId && nextSkillTargetId !== skillTargetId && (
              <p className="text-xs text-muted-foreground mt-0.5">New skill target</p>
            )}
          </div>

          {autoActive && (
            <div className="space-y-2">
              <Progress value={progressPct} className="h-1.5" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Auto-advancing in {secondsLeft}s…</span>
                <button
                  onClick={cancelAuto}
                  className="font-medium text-foreground hover:text-primary transition-colors"
                >
                  Stay here
                </button>
              </div>
            </div>
          )}

          <Button onClick={onContinue} className="w-full gap-2">
            <ArrowRight className="h-4 w-4" />
            Continue to Next Chapter
          </Button>
        </div>
      ) : (
        <Button variant="outline" onClick={onBackToGrid} className="w-full gap-2">
          Back to All Chapters
        </Button>
      )}
    </div>
  );
}

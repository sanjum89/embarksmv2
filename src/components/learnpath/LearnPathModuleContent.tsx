import { useLearnPath } from "@/contexts/LearnPathContext";
import { LearnPathPodcastPlayer } from "./LearnPathPodcastPlayer";
import { ScenarioQuestion } from "./ScenarioQuestion";
import { HandsOnRolePlayCard } from "./HandsOnRolePlayCard";
import { VisualDiagram, parseTranscriptToDiagram, extractFlowCharts } from "./VisualDiagram";
import { FlowDiagram } from "./FlowDiagram";
import type { LearningModule, LearningFormat } from "@/types/learning";
import ReactMarkdown from "react-markdown";
import { useState } from "react";
import { Eye, BookOpen, Headphones, Wrench, Layers, Clock, FileText, BookOpenCheck, Users, Zap, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { cn } from "@/lib/utils";
import { getPodcastTranscript, getStaticPodcastUrl } from "@/data/podcastTranscripts";
import { getHandsOnScenarios } from "@/data/handsOnScenarios";
import { mockRolePlayBank, moduleRolePlayMap } from "@/data/mock";

interface Props {
  module: LearningModule;
  skillTargetTitle?: string;
  learningFormat?: LearningFormat;
}

const modeBanners: Record<string, { icon: React.ElementType; label: string; desc: string; className: string }> = {
  visual: { icon: Eye, label: "Visual Mode", desc: "Key concepts presented visually with diagrams and summaries.", className: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800" },
  reading: { icon: BookOpen, label: "Reading Mode", desc: "Full written content for deep, self-paced study.", className: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" },
  listening: { icon: Headphones, label: "Listening Mode", desc: "Podcast-style conversation — learn hands-free.", className: "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800" },
  "hands-on": { icon: Wrench, label: "Hands-On Mode", desc: "Interactive scenarios and role-play practice.", className: "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800" },
  combined: { icon: Layers, label: "Combined Mode", desc: "All learning modes in one comprehensive view.", className: "bg-accent/10 text-accent-foreground border-accent/20" },
};

export function LearnPathModuleContent({ module, skillTargetTitle, learningFormat }: Props) {
  const { learningMode, openAssessment } = useLearnPath();
  const { skillTargets } = useSkillTargets();
  const navigate = useNavigate();
  const isMicro = learningFormat === "micro";
  const transcript = module.transcript ?? "No content available for this module.";
  const [microExpanded, setMicroExpanded] = useState(false);

  // For micro mode: truncate to ~30% of content
  const microTranscript = (() => {
    if (!isMicro || microExpanded) return transcript;
    const lines = transcript.split("\n");
    const cutoff = Math.max(8, Math.ceil(lines.length * 0.3));
    return lines.slice(0, cutoff).join("\n") + "\n\n---\n\n*This is a condensed view. Expand to see the full content.*";
  })();

  const banner = modeBanners[learningMode];
  const podcastScript = getPodcastTranscript(module.id);
  const handsOnData = getHandsOnScenarios(module.id);
  const rpIds = moduleRolePlayMap[module.id] ?? [];
  const rolePlays = rpIds.map((id) => mockRolePlayBank.find((rp) => rp.id === id)).filter(Boolean);

  const wordCount = transcript.split(/\s+/).length;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const renderModuleHeader = () => (
    <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-4">
      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
        <FileText className="h-5 w-5 text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground text-base">{module.title}</h3>
        {skillTargetTitle && <p className="text-xs text-muted-foreground mt-0.5">{skillTargetTitle}</p>}
        <div className="flex items-center gap-3 mt-2">
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
    const flowCharts = extractFlowCharts(transcript);
    const diagramNodes = parseTranscriptToDiagram(transcript);
    const bullets = transcript.match(/^\*\s+.+$/gm)?.slice(0, 8) ?? [];

    return (
      <div className="space-y-5">
        {/* Flow-chart diagrams */}
        {flowCharts.length > 0 && (
          <div className="space-y-6">
            {flowCharts.map((chart, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-6 flex justify-center">
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
        {bullets.length > 0 && (
          <div className="bg-card rounded-xl p-5 border border-border">
            <h4 className="font-semibold mb-3 text-foreground flex items-center gap-2 text-sm">
              💡 Key Takeaways
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {bullets.map((b, i) => (
                <div key={i} className="rounded-lg bg-muted/50 px-3 py-2.5 text-sm text-foreground flex items-start gap-2">
                  <span className="text-primary font-bold mt-0.5 shrink-0">→</span>
                  <span>{b.replace(/^\*\s*/, "").replace(/\*\*/g, "")}</span>
                </div>
              ))}
            </div>
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
        {/* Reading header card */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-2xl font-bold text-foreground">{module.title}</h2>
          {skillTargetTitle && <p className="text-sm text-muted-foreground mt-1">{skillTargetTitle}</p>}
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <BookOpenCheck className="h-3.5 w-3.5" /> ~{readingMinutes} min read
            </span>
            <span>•</span>
            <span>{wordCount} words</span>
            <span>•</span>
            <span>{module.duration}</span>
          </div>
        </div>

        {/* Table of contents */}
        {headings.length > 2 && (
          <div className="rounded-xl border border-border bg-muted/30 p-5">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Table of Contents</h4>
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
          <div className="prose prose-base dark:prose-invert max-w-none
            prose-headings:text-foreground prose-headings:font-bold
            prose-h1:text-2xl prose-h1:mt-6 prose-h1:mb-4
            prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border prose-h2:pb-3
            prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-muted-foreground prose-p:leading-8 prose-p:mb-4
            prose-li:text-muted-foreground prose-li:leading-7
            prose-strong:text-foreground prose-strong:font-semibold
            prose-ul:space-y-2 prose-ul:my-4
            prose-ol:space-y-2 prose-ol:my-4
            prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:px-4
          ">
            <ReactMarkdown>{transcript}</ReactMarkdown>
          </div>
        </div>
      </div>
    );
  };

  /* ═══ LISTENING MODE ═══ */
  const renderListening = () => {
    if (podcastScript) {
      const staticUrl = getStaticPodcastUrl(module.id);
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
      {/* Intro */}
      <p className="text-sm text-muted-foreground">
        {handsOnData?.intro ?? "Practice what you've learned through interactive scenarios and role-play."}
      </p>

      {/* Role Play Cards — before scenarios */}
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

      {/* Scenarios */}
      {handsOnData?.scenarios.map((scenario, idx) => (
        <ScenarioQuestion
          key={idx}
          index={idx}
          title={scenario.title}
          context={scenario.context}
          options={scenario.options}
        />
      ))}

      {/* Assessment CTA */}
      <Button variant="outline" onClick={() => openAssessment(module.id)} className="gap-2 w-full">
        📝 Take a Quick Assessment
      </Button>
    </div>
  );

  /* ═══ COMBINED MODE ═══ */
  const renderCombined = () => (
    <div className="space-y-6">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Visual Summary</h4>
      {renderVisual()}
      <hr className="border-border" />
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Full Reading</h4>
      {renderReading()}
      <hr className="border-border" />
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Listen</h4>
      {renderListening()}
      <hr className="border-border" />
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Practice</h4>
      {renderHandsOn()}
    </div>
  );

  return (
    <div className="p-6 space-y-4">
      {renderModuleHeader()}
      {renderModeBanner()}
      {learningMode === "visual" && renderVisual()}
      {learningMode === "reading" && renderReading()}
      {learningMode === "listening" && renderListening()}
      {learningMode === "hands-on" && renderHandsOn()}
      {learningMode === "combined" && renderCombined()}
    </div>
  );
}

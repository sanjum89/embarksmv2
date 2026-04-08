import { useLearnPath } from "@/contexts/LearnPathContext";
import { LearnPathPodcastPlayer } from "./LearnPathPodcastPlayer";
import { ScenarioQuestion } from "./ScenarioQuestion";
import { HandsOnRolePlayCard } from "./HandsOnRolePlayCard";
import type { LearningModule } from "@/types/learning";
import ReactMarkdown from "react-markdown";
import { Eye, BookOpen, Headphones, Wrench, Layers, Clock, FileText, BookOpenCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { cn } from "@/lib/utils";
import { getPodcastTranscript } from "@/data/podcastTranscripts";
import { getHandsOnScenarios } from "@/data/handsOnScenarios";
import { mockRolePlayBank, moduleRolePlayMap } from "@/data/mock";

interface Props {
  module: LearningModule;
  skillTargetTitle?: string;
}

const modeBanners: Record<string, { icon: React.ElementType; label: string; desc: string; className: string }> = {
  visual: { icon: Eye, label: "Visual Mode", desc: "Key concepts presented visually with diagrams and summaries.", className: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800" },
  reading: { icon: BookOpen, label: "Reading Mode", desc: "Full written content for deep, self-paced study.", className: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" },
  listening: { icon: Headphones, label: "Listening Mode", desc: "Podcast-style conversation — learn hands-free.", className: "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800" },
  "hands-on": { icon: Wrench, label: "Hands-On Mode", desc: "Interactive scenarios and role-play practice.", className: "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800" },
  combined: { icon: Layers, label: "Combined Mode", desc: "All learning modes in one comprehensive view.", className: "bg-accent/10 text-accent-foreground border-accent/20" },
};

export function LearnPathModuleContent({ module, skillTargetTitle }: Props) {
  const { learningMode, openAssessment } = useLearnPath();
  const { skillTargets } = useSkillTargets();
  const navigate = useNavigate();
  const transcript = module.transcript ?? "No content available for this module.";

  const banner = modeBanners[learningMode];
  const podcastScript = getPodcastTranscript(module.id);
  const handsOnData = getHandsOnScenarios(module.id);
  const rpIds = moduleRolePlayMap[module.id] ?? [];
  const rolePlays = rpIds.map((id) => mockRolePlayBank.find((rp) => rp.id === id)).filter(Boolean);

  // Reading time estimate
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
            <FileText className="h-3 w-3" /> {module.contentType === "video" ? "Video" : "Full Module"}
          </span>
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
    // Extract headings from markdown for key concepts
    const headings = transcript.match(/^#{1,3}\s+.+$/gm) ?? [];
    const bullets = transcript.match(/^\*\s+.+$/gm)?.slice(0, 8) ?? [];

    return (
      <div className="space-y-4">
        {/* Key Concepts Cards */}
        <div className="bg-card rounded-xl p-5 border border-border">
          <h4 className="font-medium mb-3 text-foreground flex items-center gap-2">
            <span className="text-lg">🎯</span> Key Concepts
          </h4>
          {headings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {headings.slice(0, 6).map((h, i) => (
                <div key={i} className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-foreground">
                  {h.replace(/^#+\s*/, "")}
                </div>
              ))}
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{transcript.slice(0, 600) + (transcript.length > 600 ? "..." : "")}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Key Points */}
        {bullets.length > 0 && (
          <div className="bg-card rounded-xl p-5 border border-border">
            <h4 className="font-medium mb-3 text-foreground flex items-center gap-2">
              <span className="text-lg">💡</span> Key Points
            </h4>
            <ul className="space-y-1.5">
              {bullets.map((b, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-accent mt-0.5">•</span>
                  {b.replace(/^\*\s*/, "").replace(/\*\*/g, "")}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-lg p-4 border text-center">
            <div className="text-2xl mb-1">📚</div>
            <p className="text-xs text-muted-foreground">{module.duration}</p>
          </div>
          <div className="bg-card rounded-lg p-4 border text-center">
            <div className="text-2xl mb-1">{module.contentType === "video" ? "🎥" : "📄"}</div>
            <p className="text-xs text-muted-foreground">{module.contentType === "video" ? "Video" : "Document"}</p>
          </div>
          <div className="bg-card rounded-lg p-4 border text-center">
            <div className="text-2xl mb-1">📝</div>
            <p className="text-xs text-muted-foreground">{wordCount} words</p>
          </div>
        </div>
      </div>
    );
  };

  /* ═══ READING MODE ═══ */
  const renderReading = () => {
    const headings = transcript.match(/^#{1,3}\s+.+$/gm) ?? [];
    return (
      <div className="space-y-4">
        {/* Reading info bar */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <BookOpenCheck className="h-3.5 w-3.5" />
          <span>~{readingMinutes} min read</span>
          <span>•</span>
          <span>{wordCount} words</span>
        </div>

        {/* Table of contents */}
        {headings.length > 2 && (
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Contents</h4>
            <ul className="space-y-1">
              {headings.map((h, i) => {
                const level = (h.match(/^#+/) ?? [""])[0].length;
                const text = h.replace(/^#+\s*/, "");
                return (
                  <li key={i} className={cn("text-sm text-foreground", level > 2 && "ml-4 text-muted-foreground")}>
                    {text}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Content */}
        <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground">
          <ReactMarkdown>{transcript}</ReactMarkdown>
        </div>
      </div>
    );
  };

  /* ═══ LISTENING MODE ═══ */
  const renderListening = () => {
    if (podcastScript) {
      return <LearnPathPodcastPlayer script={podcastScript} />;
    }
    // Fallback to basic audio player with transcript
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
    <div className="space-y-4">
      {/* Intro */}
      <p className="text-sm text-muted-foreground">
        {handsOnData?.intro ?? "Practice what you've learned through interactive scenarios and role-play."}
      </p>

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

      {/* Role Play Cards */}
      {rolePlays.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <span>🎭</span> Practice Role Plays
          </h4>
          {rolePlays.map((rp) => rp && <HandsOnRolePlayCard key={rp.id} rolePlay={rp} />)}
        </div>
      )}

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

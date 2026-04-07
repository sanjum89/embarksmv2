import { useLearnPath } from "@/contexts/LearnPathContext";
import { LearnPathAudioPlayer } from "./LearnPathAudioPlayer";
import type { LearningModule } from "@/types/learning";
import ReactMarkdown from "react-markdown";
import { Eye, BookOpen, Headphones, Wrench, Layers, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { cn } from "@/lib/utils";

interface Props {
  module: LearningModule;
  skillTargetTitle?: string;
}

const modeBanners: Record<string, { icon: React.ElementType; label: string; desc: string; className: string }> = {
  visual: {
    icon: Eye,
    label: "Visual Mode",
    desc: "Key concepts presented visually with diagrams and summaries.",
    className: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  },
  reading: {
    icon: BookOpen,
    label: "Reading Mode",
    desc: "Full written content for deep, self-paced study.",
    className: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  },
  listening: {
    icon: Headphones,
    label: "Listening Mode",
    desc: "Audio narration with transcript — learn hands-free.",
    className: "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  },
  "hands-on": {
    icon: Wrench,
    label: "Hands-On Mode",
    desc: "Work through scenarios and practice applying what you've learned.",
    className: "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  },
  combined: {
    icon: Layers,
    label: "Combined Mode",
    desc: "All learning modes in one comprehensive view.",
    className: "bg-accent/10 text-accent-foreground border-accent/20",
  },
};

export function LearnPathModuleContent({ module, skillTargetTitle }: Props) {
  const { learningMode, activeSkillTargetId, openAssessment } = useLearnPath();
  const { skillTargets } = useSkillTargets();
  const navigate = useNavigate();
  const transcript = module.transcript ?? "No content available for this module.";

  const skillTarget = skillTargets.find((st) => st.id === activeSkillTargetId);
  const rolePlaySteps = skillTarget?.steps.filter((s) => s.type === "role_play") ?? [];

  const banner = modeBanners[learningMode];

  const renderModuleHeader = () => (
    <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-4">
      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
        <FileText className="h-5 w-5 text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground text-base">{module.title}</h3>
        {skillTargetTitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{skillTargetTitle}</p>
        )}
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

  const renderVisual = () => (
    <div className="space-y-4">
      <div className="bg-card rounded-xl p-5 border border-border">
        <h4 className="font-medium mb-3 text-foreground">🎯 Key Concepts</h4>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{transcript.slice(0, 600) + (transcript.length > 600 ? "..." : "")}</ReactMarkdown>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-lg p-4 border text-center">
          <div className="text-2xl mb-1">📚</div>
          <p className="text-xs text-muted-foreground">Duration: {module.duration}</p>
        </div>
        <div className="bg-card rounded-lg p-4 border text-center">
          <div className="text-2xl mb-1">{module.contentType === "video" ? "🎥" : "📄"}</div>
          <p className="text-xs text-muted-foreground">{module.contentType === "video" ? "Video" : "Document"}</p>
        </div>
      </div>
    </div>
  );

  const renderReading = () => (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown>{transcript}</ReactMarkdown>
    </div>
  );

  const renderListening = () => (
    <div className="space-y-4">
      <LearnPathAudioPlayer text={transcript} />
      <div className="bg-card rounded-lg p-4 border text-sm">
        <h4 className="font-medium mb-2 text-foreground">Transcript</h4>
        <div className="prose prose-xs dark:prose-invert max-w-none text-muted-foreground">
          <ReactMarkdown>{transcript}</ReactMarkdown>
        </div>
      </div>
    </div>
  );

  const renderHandsOn = () => {
    // Generate inline decision-point scenarios from the module content
    const scenarios = generateScenarios(module.title, transcript);

    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Practice what you've learned through interactive scenarios and role-play.
        </p>

        {scenarios.map((scenario, idx) => (
          <div key={idx} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="bg-orange-50 dark:bg-orange-950/20 px-4 py-3 border-b border-border">
              <h4 className="text-sm font-semibold text-foreground">Scenario {idx + 1}: {scenario.title}</h4>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-muted-foreground">{scenario.context}</p>
              <div className="space-y-2">
                {scenario.options.map((opt, oi) => (
                  <button
                    key={oi}
                    className="w-full text-left rounded-lg border border-border px-4 py-3 text-sm hover:bg-accent/5 hover:border-accent/30 transition-colors"
                  >
                    <span className="font-medium text-foreground">{String.fromCharCode(65 + oi)}.</span>{" "}
                    <span className="text-muted-foreground">{opt}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}

        {rolePlaySteps.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">🎭 Related Role-Plays</h4>
            {rolePlaySteps.map((rp) => (
              <Button
                key={rp.id}
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => navigate(`/role-play-bank/${rp.referenceId}`)}
              >
                🎭 {rp.title}
              </Button>
            ))}
          </div>
        )}

        <Button variant="outline" onClick={() => openAssessment(module.id)} className="gap-2 w-full">
          📝 Take a Quick Assessment
        </Button>
      </div>
    );
  };

  const renderCombined = () => (
    <div className="space-y-6">
      {renderVisual()}
      <hr className="border-border" />
      {renderReading()}
      <hr className="border-border" />
      <LearnPathAudioPlayer text={transcript} />
      {rolePlaySteps.length > 0 && (
        <>
          <hr className="border-border" />
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">🎭 Related Role-Plays</h4>
            {rolePlaySteps.map((rp) => (
              <Button
                key={rp.id}
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => navigate(`/role-play-bank/${rp.referenceId}`)}
              >
                {rp.title}
              </Button>
            ))}
          </div>
        </>
      )}
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

/** Generate simple decision-point scenarios from the module title/transcript */
function generateScenarios(title: string, transcript: string) {
  const keywords = transcript.slice(0, 200).split(/\s+/).filter((w) => w.length > 5);
  const topic = title.toLowerCase();

  if (topic.includes("heritage") || topic.includes("values")) {
    return [
      {
        title: "Client First Impressions",
        context: "A prospective HNW client asks what makes your firm different from a large bank's wealth management division. How do you respond?",
        options: [
          "Emphasise the firm's 280+ year heritage of independent, client-focused stewardship",
          "Focus primarily on recent investment performance numbers",
          "Offer to match any competitor's fee structure",
          "Suggest they compare online reviews of different firms",
        ],
      },
      {
        title: "Ethical Dilemma",
        context: "A colleague suggests cutting corners on KYC documentation to onboard a lucrative client faster. What do you do?",
        options: [
          "Follow the proper compliance process — integrity is a core value",
          "Escalate to your manager before making any decision",
          "Complete the abbreviated process since the client is well-known",
          "Ask the client to provide documentation later",
        ],
      },
    ];
  }

  if (topic.includes("investment") || topic.includes("philosophy")) {
    return [
      {
        title: "Portfolio Recommendation",
        context: "A new client wants to invest their entire portfolio in a single high-growth technology stock. How do you advise them?",
        options: [
          "Explain the importance of diversification and propose a balanced portfolio aligned with their risk profile",
          "Execute the trade as the client requested",
          "Suggest splitting between two technology stocks instead",
          "Decline the instruction and escalate to compliance",
        ],
      },
      {
        title: "Market Downturn",
        context: "Markets have dropped 15% in a week. A nervous client calls demanding you sell everything. What's your approach?",
        options: [
          "Acknowledge their concerns, review their long-term plan, and advise against panic selling",
          "Immediately sell all positions as instructed",
          "Ignore the call and wait for markets to recover",
          "Suggest doubling down and buying more equities",
        ],
      },
    ];
  }

  // Generic fallback
  return [
    {
      title: "Applying Your Knowledge",
      context: `Based on what you've learned about "${title}", a colleague asks for your advice on handling a related situation. What approach do you take?`,
      options: [
        "Apply the key principles from the module and explain your reasoning",
        "Suggest they read the training materials themselves",
        "Defer to a senior colleague without offering your own perspective",
        "Give a quick answer based on general knowledge",
      ],
    },
  ];
}

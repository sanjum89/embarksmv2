import { useLearnPath } from "@/contexts/LearnPathContext";
import { LearnPathAudioPlayer } from "./LearnPathAudioPlayer";
import type { LearningModule } from "@/types/learning";
import ReactMarkdown from "react-markdown";
import { Video, FileText, Eye, BookOpen, Headphones, Wrench, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";

interface Props {
  module: LearningModule;
}

export function LearnPathModuleContent({ module }: Props) {
  const { learningMode, activeSkillTargetId, openAssessment } = useLearnPath();
  const { skillTargets } = useSkillTargets();
  const navigate = useNavigate();
  const transcript = module.transcript ?? "No content available for this module.";

  // Find linked role-plays in the same skill target
  const skillTarget = skillTargets.find((st) => st.id === activeSkillTargetId);
  const rolePlaySteps = skillTarget?.steps.filter((s) => s.type === "role_play") ?? [];

  const renderVisual = () => (
    <div className="space-y-4">
      <div className="bg-accent/5 rounded-xl p-6 border border-accent/10">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="h-5 w-5 text-accent" />
          <h3 className="font-semibold text-foreground">Visual Summary</h3>
        </div>
        <div className="space-y-3 text-sm text-foreground">
          <div className="bg-card rounded-lg p-4 border">
            <h4 className="font-medium mb-2">🎯 Key Concepts</h4>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{transcript.slice(0, 300) + "..."}</ReactMarkdown>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card rounded-lg p-3 border text-center">
              <div className="text-2xl mb-1">📚</div>
              <p className="text-xs text-muted-foreground">Duration: {module.duration}</p>
            </div>
            <div className="bg-card rounded-lg p-3 border text-center">
              <div className="text-2xl mb-1">{module.contentType === "video" ? "🎥" : "📄"}</div>
              <p className="text-xs text-muted-foreground">{module.contentType === "video" ? "Video" : "Document"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReading = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-accent" />
        <h3 className="font-semibold text-foreground">{module.title}</h3>
      </div>
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown>{transcript}</ReactMarkdown>
      </div>
    </div>
  );

  const renderListening = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Headphones className="h-5 w-5 text-accent" />
        <h3 className="font-semibold text-foreground">Listen: {module.title}</h3>
      </div>
      <LearnPathAudioPlayer text={transcript} />
      <div className="bg-muted rounded-lg p-4 text-sm">
        <h4 className="font-medium mb-2 text-foreground">Transcript</h4>
        <p className="text-muted-foreground text-xs leading-relaxed">{transcript}</p>
      </div>
    </div>
  );

  const renderHandsOn = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Wrench className="h-5 w-5 text-accent" />
        <h3 className="font-semibold text-foreground">Hands-On Practice</h3>
      </div>
      <div className="bg-muted rounded-lg p-4 text-sm">
        <p className="text-muted-foreground mb-3">
          Practice what you've learned through interactive role-play scenarios.
        </p>
        {rolePlaySteps.length > 0 ? (
          <div className="space-y-2">
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
        ) : (
          <Button variant="outline" onClick={() => navigate("/role-play-bank")} className="gap-2">
            🎭 Browse Role Play Bank
          </Button>
        )}
      </div>
      <Button variant="outline" onClick={() => openAssessment(module.id)} className="gap-2 w-full">
        📝 Take a Quick Assessment
      </Button>
    </div>
  );

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
    <div className="p-6">
      <h2 className="text-lg font-bold text-foreground mb-4">{module.title}</h2>
      {learningMode === "visual" && renderVisual()}
      {learningMode === "reading" && renderReading()}
      {learningMode === "listening" && renderListening()}
      {learningMode === "hands-on" && renderHandsOn()}
      {learningMode === "combined" && renderCombined()}
    </div>
  );
}

import React, { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useContentSubstitution } from "@/lib/contentSubstitution";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ChevronRight, ChevronLeft, SkipForward, Upload, CheckCircle2,
  Loader2, Eye, BookOpen, Headphones, Hand, Pencil, Sparkles, FileText, GraduationCap
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useAccount } from "@/contexts/AccountContext";
import { getProfileData } from "@/lib/accountSelectors";
import { profileDataByUser as staticProfileData } from "@/data/mock";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { proficiencyShort } from "@/types/learning";
import type { ProfileData } from "@/data/mock";

interface FirstLoginTourProps {
  open: boolean;
  onClose: () => void;
}

const LEARNING_STYLES = [
  { id: "visual", label: "Visual", icon: Eye, desc: "Learn best through diagrams, videos, and visual aids" },
  { id: "listening", label: "Listening", icon: Headphones, desc: "Prefer audio, discussions, and verbal explanations" },
  { id: "reading", label: "Reading", icon: BookOpen, desc: "Absorb information through text-based content" },
  { id: "handson", label: "Hands-on", icon: Hand, desc: "Learn by doing, practicing, and experimenting" },
] as const;

const PSYCHOMETRIC_QUESTIONS = [
  { q: "When learning something new, I prefer to…", a: ["Watch a demo or video", "Listen to an explanation", "Read the documentation", "Try it myself right away"] },
  { q: "I remember things best when I…", a: ["See them written down or in a diagram", "Hear someone explain them", "Read detailed notes", "Practice repeatedly"] },
  { q: "In a team meeting, I'm most engaged when…", a: ["There are slides or visuals", "There's open discussion", "There's a written agenda", "We do a hands-on activity"] },
  { q: "My ideal study environment is…", a: ["Quiet with visual aids around", "Background music or podcasts", "A library-like setting", "A workshop or lab space"] },
  { q: "When stuck on a problem, I usually…", a: ["Draw it out or sketch a diagram", "Talk it through with someone", "Research and read about it", "Experiment with different solutions"] },
];

function splitProfileData(profileData: ProfileData) {
  const allRoleSkills = profileData.roleSkillsCurrent || [];
  const allProjectSkills = profileData.projectSkillsCurrent || [];
  const allOtherSkills = profileData.otherSkills || [];

  const roleSplit = Math.ceil(allRoleSkills.length * 0.6);
  const projectSplit = Math.ceil(allProjectSkills.length * 0.6);
  const otherSplit = Math.ceil(allOtherSkills.length * 0.6);

  return {
    currentSkills: {
      role: allRoleSkills.slice(0, roleSplit),
      project: allProjectSkills.slice(0, projectSplit),
      other: allOtherSkills.slice(0, otherSplit),
    },
    inferredSkills: {
      role: allRoleSkills.slice(roleSplit),
      project: allProjectSkills.slice(projectSplit),
      other: allOtherSkills.slice(otherSplit),
    },
  };
}

export function FirstLoginTour({ open, onClose }: FirstLoginTourProps) {
  const { user } = useUser();
  const { activeAccount, normalizedAccount } = useAccount();
  const { substitute } = useContentSubstitution();
  const [step, setStep] = useState(0);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizDone, setQuizDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const isDefaultAccount = normalizedAccount?.isDefault !== false;
  const profileData = (normalizedAccount ? getProfileData(normalizedAccount, user.id) : null)
    || activeAccount?.data?.profileData?.[user.id]
    || (isDefaultAccount ? staticProfileData[user.id] || staticProfileData["u1"] : null);

  if (!open || !profileData) return null;

  const accountName = activeAccount?.name || normalizedAccount?.branding?.name || "your organization";
  const { currentSkills, inferredSkills } = splitProfileData(profileData);

  const TOTAL_STEPS = 6;

  const handleSkip = () => {
    setStep(0);
    onClose();
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = () => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setUploadDone(true);
      setTimeout(() => handleNext(), 600);
    }, 2000);
  };

  const handleSaveEdits = () => {
    setEditing(false);
    toast({ title: "Skill changes sent to your manager for approval", description: "Your manager will review the updates." });
  };

  const handleConfirmInferred = () => {
    toast({ title: "Skills sent to manager for approval", description: "Inferred skills will be added once approved." });
    handleNext();
  };

  const handleQuizAnswer = (answerIdx: number) => {
    const newAnswers = [...quizAnswers, answerIdx];
    setQuizAnswers(newAnswers);
    if (quizStep < PSYCHOMETRIC_QUESTIONS.length - 1) {
      setQuizStep(quizStep + 1);
    } else {
      // Determine style from answers
      const counts = [0, 0, 0, 0];
      newAnswers.forEach((a) => counts[a]++);
      const maxIdx = counts.indexOf(Math.max(...counts));
      setSelectedStyle(LEARNING_STYLES[maxIdx].id);
      setQuizDone(true);
      setShowQuiz(false);
    }
  };

  const handleComplete = () => {
    setStep(0);
    onClose();
  };

  const renderSkillRow = (skill: { skill_name: string; proficiency: string; assessment_year?: number }, idx: number, inferred = false) => (
    <div key={idx} className={cn("flex items-center justify-between py-2 px-3 rounded-lg text-sm", inferred ? "bg-accent/5 border border-accent/20" : "bg-muted/50")}>
      <div className="flex items-center gap-2">
        <span className="font-medium text-foreground">{skill.skill_name}</span>
        {inferred && (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 border border-accent/20 px-2 py-0.5 text-[10px] font-medium text-accent">
            <Sparkles className="h-3 w-3" /> Inferred
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>{proficiencyShort[skill.proficiency] || skill.proficiency}</span>
        {skill.assessment_year && <span>{skill.assessment_year}</span>}
      </div>
    </div>
  );

  const slideVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  const renderStep = () => {
    switch (step) {
      case 0: // Welcome
        return (
          <motion.div key="welcome" variants={slideVariants} initial="enter" animate="center" exit="exit" className="flex flex-col items-center justify-center text-center py-12 px-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-full gradient-accent text-2xl font-bold text-accent-foreground mb-6">
              {user.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
              Welcome to {accountName}, {user.name.split(" ")[0]}! 🎉
            </h2>
            <p className="text-muted-foreground max-w-md leading-relaxed">
              We're excited to have you on board. Let's take a quick tour to set up your profile, verify your skills, and personalise your learning experience.
            </p>
            <p className="text-sm text-muted-foreground mt-4">This will only take a couple of minutes.</p>
          </motion.div>
        );

      case 1: // Your Details
        return (
          <motion.div key="details" variants={slideVariants} initial="enter" animate="center" exit="exit" className="py-6 px-8 overflow-y-auto max-h-[70vh]">
            <h2 className="font-display text-xl font-bold text-foreground mb-1">Let's confirm your details</h2>
            <p className="text-sm text-muted-foreground mb-5">Here's what we have on file. Let us know if anything needs updating.</p>

            {/* Employee info */}
            <div className="rounded-xl bg-muted/50 border border-border p-4 mb-5 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Name</span><span className="font-medium text-foreground">{user.name}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Title</span><span className="font-medium text-foreground">{profileData.title}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Location</span><span className="font-medium text-foreground">{profileData.location}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Manager</span><span className="font-medium text-foreground">{profileData.manager}</span></div>
              {profileData.team && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Team</span><span className="font-medium text-foreground">{substitute(profileData.team)}</span></div>}
              {profileData.program && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Program</span><span className="font-medium text-foreground">{substitute(profileData.program)}</span></div>}
            </div>

            {/* Skills */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Your Skills</h3>
              <button onClick={() => setEditing(!editing)} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                <Pencil className="h-3 w-3" /> {editing ? "Cancel" : "Edit"}
              </button>
            </div>

            <div className="space-y-1.5 mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Role Skills</p>
              {currentSkills.role.map((s, i) => renderSkillRow(s, i))}
            </div>
            {currentSkills.project.length > 0 && (
              <div className="space-y-1.5 mb-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Project Skills</p>
                {currentSkills.project.map((s, i) => renderSkillRow(s, i))}
              </div>
            )}
            {currentSkills.other.length > 0 && (
              <div className="space-y-1.5 mb-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Inferred Skills</p>
                {currentSkills.other.map((s, i) => renderSkillRow(s, i))}
              </div>
            )}

            {editing && (
              <div className="mt-3 p-3 rounded-lg border border-info/20 bg-info/5 text-sm text-info">
                <p className="font-medium mb-1">Edit mode</p>
                <p className="text-xs">Make any changes above. Skill edits will be sent to your manager for review.</p>
                <button onClick={handleSaveEdits} className="mt-2 rounded-md bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                  Save Changes
                </button>
              </div>
            )}
          </motion.div>
        );

      case 2: // Upload Resume
        return (
          <motion.div key="resume" variants={slideVariants} initial="enter" animate="center" exit="exit" className="flex flex-col items-center justify-center text-center py-12 px-8">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="font-display text-xl font-bold text-foreground mb-2">Upload your latest resume</h2>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
              We'll extract skills, career history, and other relevant information to enrich your profile automatically.
            </p>

            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium text-muted-foreground">Analysing your resume…</p>
              </div>
            ) : uploadDone ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle2 className="h-8 w-8 text-success" />
                <p className="text-sm font-medium text-success">Resume processed!</p>
              </div>
            ) : (
              <button
                onClick={handleUpload}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 px-10 py-8 text-sm font-medium text-muted-foreground hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
              >
                <Upload className="h-5 w-5" />
                Click to upload or drag & drop
              </button>
            )}
            <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
          </motion.div>
        );

      case 3: // Inferred Data
        return (
          <motion.div key="inferred" variants={slideVariants} initial="enter" animate="center" exit="exit" className="py-6 px-8 overflow-y-auto max-h-[70vh]">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-5 w-5 text-accent" />
              <h2 className="font-display text-xl font-bold text-foreground">Data inferred from your resume</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-5">We've extracted the following from your resume. Please confirm or edit before we proceed.</p>

            {/* AI Summary */}
            <div className="rounded-xl bg-accent/5 border border-accent/20 p-4 mb-5">
              <p className="text-xs font-medium text-accent uppercase tracking-wide mb-1.5">AI-Generated Summary</p>
              <p className="text-sm text-foreground leading-relaxed">{profileData.summary}</p>
            </div>

            {/* Inferred Skills */}
            {inferredSkills.role.length > 0 && (
              <div className="space-y-1.5 mb-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Additional Role Skills</p>
                {inferredSkills.role.map((s, i) => renderSkillRow(s, i, true))}
              </div>
            )}
            {inferredSkills.project.length > 0 && (
              <div className="space-y-1.5 mb-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Additional Project Skills</p>
                {inferredSkills.project.map((s, i) => renderSkillRow(s, i, true))}
              </div>
            )}
            {inferredSkills.other.length > 0 && (
              <div className="space-y-1.5 mb-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Additional Skills</p>
                {inferredSkills.other.map((s, i) => renderSkillRow(s, i, true))}
              </div>
            )}

            <button onClick={handleConfirmInferred} className="mt-2 w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              Looks good — continue
            </button>
          </motion.div>
        );

      case 4: // Profile Preview
        return (
          <motion.div key="preview" variants={slideVariants} initial="enter" animate="center" exit="exit" className="py-6 px-8 overflow-y-auto max-h-[70vh]">
            <h2 className="font-display text-xl font-bold text-foreground mb-1">Your updated profile</h2>
            <p className="text-sm text-muted-foreground mb-5">Here's the complete picture. Submit when you're ready.</p>

            {/* Profile card */}
            <div className="rounded-xl bg-card border border-border p-5 mb-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full gradient-accent text-sm font-bold text-accent-foreground">
                  {user.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">{user.name}</h3>
                  <p className="text-sm text-muted-foreground">{profileData.title}</p>
                  <p className="text-xs text-muted-foreground">{profileData.location} · Manager: {profileData.manager}</p>
                </div>
              </div>

              <div className="rounded-lg bg-muted/50 p-3 mb-4">
                <p className="text-xs text-muted-foreground leading-relaxed">{profileData.summary}</p>
              </div>

              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">All Skills ({(profileData.roleSkillsCurrent?.length || 0) + (profileData.projectSkillsCurrent?.length || 0) + (profileData.otherSkills?.length || 0)})</p>
              <div className="flex flex-wrap gap-1.5">
                {[...(profileData.roleSkillsCurrent || []), ...(profileData.projectSkillsCurrent || []), ...(profileData.otherSkills || [])].map((s, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-foreground">
                    {s.skill_name}
                    <span className="text-muted-foreground">{proficiencyShort[s.proficiency]}</span>
                  </span>
                ))}
              </div>
            </div>

            <button onClick={handleNext} className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              Submit Profile
            </button>
          </motion.div>
        );

      case 5: // Learning Style
        return (
          <motion.div key="style" variants={slideVariants} initial="enter" animate="center" exit="exit" className="py-6 px-8 overflow-y-auto max-h-[70vh]">
            {showQuiz ? (
              <>
                <h2 className="font-display text-xl font-bold text-foreground mb-1">Quick Learning Style Assessment</h2>
                <p className="text-sm text-muted-foreground mb-5">Question {quizStep + 1} of {PSYCHOMETRIC_QUESTIONS.length}</p>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-muted rounded-full mb-6">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${((quizStep + 1) / PSYCHOMETRIC_QUESTIONS.length) * 100}%` }} />
                </div>

                <p className="text-base font-medium text-foreground mb-4">{PSYCHOMETRIC_QUESTIONS[quizStep].q}</p>
                <div className="space-y-2">
                  {PSYCHOMETRIC_QUESTIONS[quizStep].a.map((answer, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuizAnswer(idx)}
                      className="w-full text-left rounded-xl border border-border bg-card p-4 text-sm text-foreground hover:border-primary hover:bg-primary/5 transition-all"
                    >
                      {answer}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h2 className="font-display text-xl font-bold text-foreground mb-1">What type of learner are you?</h2>
                <p className="text-sm text-muted-foreground mb-5">Select your preferred learning style. You can always change this from your profile settings.</p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {LEARNING_STYLES.map(({ id, label, icon: Icon, desc }) => (
                    <button
                      key={id}
                      onClick={() => setSelectedStyle(id)}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border-2 p-5 text-center transition-all",
                        selectedStyle === id
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border bg-card hover:border-primary/50"
                      )}
                    >
                      <Icon className={cn("h-8 w-8", selectedStyle === id ? "text-primary" : "text-muted-foreground")} />
                      <span className="text-sm font-semibold text-foreground">{label}</span>
                      <span className="text-xs text-muted-foreground leading-tight">{desc}</span>
                    </button>
                  ))}
                </div>

                {!quizDone && (
                  <button
                    onClick={() => { setShowQuiz(true); setQuizStep(0); setQuizAnswers([]); }}
                    className="w-full text-center text-sm font-medium text-primary hover:underline mb-4"
                  >
                    Or take a quick psychometric test to determine your style →
                  </button>
                )}

                {quizDone && (
                  <div className="rounded-lg bg-success/10 border border-success/20 p-3 text-sm text-success mb-4">
                    <CheckCircle2 className="h-4 w-4 inline mr-1.5" />
                    Based on your answers, you're a <strong>{LEARNING_STYLES.find(s => s.id === selectedStyle)?.label}</strong> learner!
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => { handleComplete(); navigate("/"); }}
                    disabled={!selectedStyle}
                    className={cn(
                      "w-full rounded-lg py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2",
                      selectedStyle
                        ? "bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    )}
                  >
                    <GraduationCap className="h-4 w-4" />
                    Start Learning on Embark AI
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={!selectedStyle}
                    className={cn(
                      "w-full rounded-lg py-2.5 text-sm font-medium transition-colors",
                      selectedStyle
                        ? "border border-border text-foreground hover:bg-muted"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    )}
                  >
                    Complete Setup
                  </button>
                </div>
              </>
            )}
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-background">
      <div className="relative w-full h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === step ? "w-8 bg-primary" : i < step ? "w-4 bg-primary/40" : "w-4 bg-border"
                )}
              />
            ))}
          </div>
          <button onClick={handleSkip} className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
            <SkipForward className="h-3.5 w-3.5" /> Skip
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto flex items-center justify-center">
          <div className="w-full max-w-2xl mx-auto px-6">
            <AnimatePresence mode="wait">
              {renderStep()}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        {step !== 5 && !showQuiz && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-muted/30">
            <button
              onClick={handleBack}
              disabled={step === 0}
              className={cn("inline-flex items-center gap-1 text-sm font-medium transition-colors", step === 0 ? "text-muted-foreground/50 cursor-not-allowed" : "text-foreground hover:text-primary")}
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <span className="text-xs text-muted-foreground">Step {step + 1} of {TOTAL_STEPS}</span>
            {step < TOTAL_STEPS - 1 && step !== 2 && step !== 3 && step !== 4 && (
              <button onClick={handleNext} className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                Next <ChevronRight className="h-4 w-4" />
              </button>
            )}
            {(step === 2 || step === 3 || step === 4) && <div />}
          </div>
        )}
      </div>
    </div>
  );
}

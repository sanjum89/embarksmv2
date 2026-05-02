import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { emitEvent } from "@/lib/agentOneEventEmitter";
import type { NormalizedAccount } from "@/types/account-v2";
import { Loader2, Sparkles, X, Plus, MessageSquare, Send, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  account: NormalizedAccount;
  targetEmployeeIds: string[];
  managerEmployeeId: string;
}

type Step = "topic" | "questions" | "preview" | "done";

export default function RequestReflectionDialog({ open, onOpenChange, accountId, account, targetEmployeeIds, managerEmployeeId }: Props) {
  const [step, setStep] = useState<Step>("topic");
  const [topic, setTopic] = useState("general_progress");
  const [customTopic, setCustomTopic] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const employeeNames = targetEmployeeIds.map(id => account.employeesById[id]?.name || id);
  const displayTopic = topic === "custom" ? customTopic : topic === "general_progress" ? "General progress review" : topic;

  const handleGenerateQuestions = async () => {
    setGenerating(true);
    try {
      const firstName = employeeNames[0] || "the employee";
      const role = targetEmployeeIds[0] ? account.employeesById[targetEmployeeIds[0]]?.title || "" : "";
      
      const { data, error } = await supabase.functions.invoke("reflection-questions", {
        body: {
          employeeName: firstName,
          employeeRole: role,
          topic: displayTopic,
          customMessage,
          mode: topic === "onboarding_experience" ? "onboarding" : undefined,
        },
      });

      if (error) throw error;
      setQuestions(data.questions || []);
      setStep("questions");
    } catch (err) {
      console.error("Failed to generate questions:", err);
      // Fallback questions
      setQuestions([
        "How has your experience been so far?",
        "What's been going well?",
        "Where do you feel you need more support?",
        "What have you learned that's been most valuable?",
        "Is there anything you'd like to share with your manager?",
      ]);
      setStep("questions");
    } finally {
      setGenerating(false);
    }
  };

  const handleAddQuestion = () => {
    setQuestions(prev => [...prev, ""]);
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleQuestionChange = (idx: number, value: string) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? value : q));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Create reflection_request
      await supabase.from("reflection_requests" as any).insert({
        account_id: accountId,
        manager_employee_id: managerEmployeeId,
        target_employee_ids: targetEmployeeIds,
        topic: displayTopic,
        custom_message: customMessage || null,
        questions: questions.filter(q => q.trim()),
        status: "pending",
      } as any);

      // Emit event to create nudge cards for each employee
      for (const empId of targetEmployeeIds) {
        const empName = account.employeesById[empId]?.name || empId;
        await emitEvent({
          account_id: accountId,
          event_type: "reflection_requested" as any,
          category: "reflection_request" as any,
          source_employee_id: managerEmployeeId,
          target_employee_id: empId,
          related_employee_ids: [empId],
          payload: {
            topic: displayTopic,
            questions: questions.filter(q => q.trim()),
            managerMessage: customMessage,
            managerName: account.employeesById[managerEmployeeId]?.name || "Your manager",
          },
        }, account);
      }

      setStep("done");
      toast.success(`Reflection request sent to ${employeeNames.length} employee${employeeNames.length > 1 ? "s" : ""}`);
      setTimeout(() => {
        onOpenChange(false);
        resetState();
      }, 1500);
    } catch (err) {
      console.error("Failed to submit reflection request:", err);
      toast.error("Failed to send reflection request");
    } finally {
      setSubmitting(false);
    }
  };

  const resetState = () => {
    setStep("topic");
    setTopic("general_progress");
    setCustomTopic("");
    setCustomMessage("");
    setQuestions([]);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetState(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Request Reflection
          </DialogTitle>
          <DialogDescription>
            {targetEmployeeIds.length === 1
              ? `Request a reflection from ${employeeNames[0]}`
              : `Request reflections from ${employeeNames.length} employees`
            }
          </DialogDescription>
        </DialogHeader>

        {step === "topic" && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">What should this reflection be about?</label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { value: "general_progress", label: "General progress review" },
                  { value: "onboarding_experience", label: "Onboarding experience" },
                  { value: "custom", label: "Custom topic" },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setTopic(opt.value)}
                    className={cn(
                      "text-left rounded-lg border px-4 py-3 text-sm transition-colors",
                      topic === opt.value
                        ? "border-primary bg-primary/5 text-foreground font-medium"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {topic === "custom" && (
                <Input
                  value={customTopic}
                  onChange={e => setCustomTopic(e.target.value)}
                  placeholder="E.g. Q1 project retrospective"
                  className="mt-2"
                />
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Add a personal message (optional)</label>
              <Textarea
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                placeholder="E.g. I'd love to hear how you're settling in with the team..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                onClick={handleGenerateQuestions}
                disabled={generating || (topic === "custom" && !customTopic.trim())}
              >
                {generating ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" /> Generate Questions</>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "questions" && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Review & edit questions
              </label>
              <div className="space-y-2">
                {questions.map((q, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-xs text-muted-foreground mt-2.5 w-5 shrink-0">{i + 1}.</span>
                    <Input
                      value={q}
                      onChange={e => handleQuestionChange(i, e.target.value)}
                      className="flex-1"
                    />
                    <button onClick={() => handleRemoveQuestion(i)} className="p-2 text-muted-foreground hover:text-destructive">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <Button variant="ghost" size="sm" onClick={handleAddQuestion} className="mt-2">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add question
              </Button>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep("topic")}>Back</Button>
              <Button onClick={() => setStep("preview")} disabled={questions.filter(q => q.trim()).length === 0}>
                <Eye className="h-4 w-4 mr-2" /> Preview
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                  {account.employeesById[managerEmployeeId]?.name?.split(" ").map(n => n[0]).join("") || "M"}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{account.employeesById[managerEmployeeId]?.name || "Manager"}</p>
                  <p className="text-[0.65rem] text-muted-foreground">Requested a reflection</p>
                </div>
              </div>
              <div className="text-sm text-foreground">
                <p className="font-medium mb-1">Topic: {displayTopic}</p>
                {customMessage && <p className="text-muted-foreground italic mb-2">"{customMessage}"</p>}
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Questions:</p>
                {questions.filter(q => q.trim()).map((q, i) => (
                  <p key={i}>{i + 1}. {q}</p>
                ))}
              </div>
              <p className="text-[0.65rem] text-muted-foreground border-t border-border pt-2">
                Sending to: {employeeNames.join(", ")}
              </p>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep("questions")}>Back</Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</>
                ) : (
                  <><Send className="h-4 w-4 mr-2" /> Send Request</>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "done" && (
          <div className="py-8 text-center">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-sm font-medium text-foreground">Reflection request sent!</p>
            <p className="text-xs text-muted-foreground mt-1">
              {employeeNames.length === 1
                ? `${employeeNames[0]} will receive a notification`
                : `${employeeNames.length} employees will receive notifications`
              }
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { NormalizedAccount } from "@/types/account-v2";
import { CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Reflection {
  id: string;
  topic: string;
  summary: string | null;
  status: string;
  trigger_type: string;
  questions: any[];
  skills_extracted: any[];
  manager_feedback: string | null;
  submitted_at: string | null;
  created_at: string;
}

interface Props {
  accountId: string;
  employeeId: string;
  account: NormalizedAccount;
}

export default function ReflectionReviewPanel({ accountId, employeeId, account }: Props) {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    loadReflections();
  }, [accountId, employeeId]);

  const loadReflections = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("reflections" as any)
      .select("*")
      .eq("account_id", accountId)
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false });
    setReflections((data as any[]) || []);
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    await supabase
      .from("reflections" as any)
      .update({
        status: "approved",
        manager_feedback: feedback || null,
        reviewed_at: new Date().toISOString(),
      } as any)
      .eq("id", id);
    toast.success("Reflection approved");
    setFeedback("");
    loadReflections();
  };

  const handleReject = async (id: string) => {
    await supabase
      .from("reflections" as any)
      .update({
        status: "rejected",
        manager_feedback: feedback || "Changes requested",
        reviewed_at: new Date().toISOString(),
      } as any)
      .eq("id", id);
    toast.success("Requested changes on reflection");
    setFeedback("");
    loadReflections();
  };

  if (loading) {
    return <div className="text-xs text-muted-foreground py-4">Loading reflections...</div>;
  }

  if (reflections.length === 0) {
    return <div className="text-xs text-muted-foreground py-4">No reflections submitted yet.</div>;
  }

  return (
    <div className="space-y-3">
      {reflections.map((ref) => (
        <div key={ref.id} className="rounded-lg border border-border bg-muted/20 overflow-hidden">
          <button
            onClick={() => setExpandedId(expandedId === ref.id ? null : ref.id)}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <div className="flex items-center gap-2">
              <StatusIcon status={ref.status} />
              <div>
                <p className="text-xs font-medium text-foreground">{ref.topic || "Reflection"}</p>
                <p className="text-[0.65rem] text-muted-foreground">
                  {ref.submitted_at ? new Date(ref.submitted_at).toLocaleDateString() : "Pending"} · {ref.trigger_type.replace(/_/g, " ")}
                </p>
              </div>
            </div>
            {expandedId === ref.id ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
          </button>

          {expandedId === ref.id && (
            <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
              {ref.summary && (
                <div>
                  <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground mb-1">Summary</p>
                  <p className="text-xs text-foreground leading-relaxed">{ref.summary}</p>
                </div>
              )}

              {ref.questions && ref.questions.length > 0 && (
                <div>
                  <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground mb-1">Q&A</p>
                  <div className="space-y-2">
                    {ref.questions.map((qa: any, i: number) => (
                      <div key={i} className="text-xs">
                        <p className="font-medium text-foreground">{qa.question}</p>
                        <p className="text-muted-foreground">{qa.answer || "—"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {ref.skills_extracted && ref.skills_extracted.length > 0 && (
                <div>
                  <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground mb-1">Skills Identified</p>
                  <div className="flex flex-wrap gap-1">
                    {ref.skills_extracted.map((skill: any, i: number) => (
                      <span key={i} className="text-[0.65rem] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {typeof skill === "string" ? skill : skill.name || skill.skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {ref.manager_feedback && (
                <div>
                  <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground mb-1">Manager Feedback</p>
                  <p className="text-xs text-foreground">{ref.manager_feedback}</p>
                </div>
              )}

              {ref.status === "submitted" && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <Textarea
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    placeholder="Add feedback (optional)..."
                    rows={2}
                    className="text-xs"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleApprove(ref.id)} className="text-xs">
                      <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleReject(ref.id)} className="text-xs">
                      <XCircle className="h-3.5 w-3.5 mr-1" /> Request Changes
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "approved") return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
  if (status === "rejected") return <XCircle className="h-3.5 w-3.5 text-destructive" />;
  if (status === "submitted") return <Clock className="h-3.5 w-3.5 text-warning" />;
  return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
}

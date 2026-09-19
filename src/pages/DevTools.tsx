import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function DevTools() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [backfilling, setBackfilling] = useState(false);
  const [backfillResult, setBackfillResult] = useState<string | null>(null);
  const [mirroring, setMirroring] = useState(false);
  const [mirrorResult, setMirrorResult] = useState<string | null>(null);

  const runReset = async () => {
    setRunning(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("reset-rathbones-demo", { body: {} });
      if (error) throw error;
      setResult(JSON.stringify(data, null, 2));
      toast({ title: "Rathbones demo reset complete", description: "Learner journeys re-seeded from persona specs." });
    } catch (e: any) {
      setResult(String(e?.message ?? e));
      toast({ title: "Reset failed", description: String(e?.message ?? e), variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  const runBackfill = async () => {
    setBackfilling(true);
    setBackfillResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-catalog-chapters", { body: { limit: 25 } });
      if (error) throw error;
      setBackfillResult(JSON.stringify(data, null, 2));
      toast({ title: "Chapter backfill complete", description: `Processed ${(data as any)?.processed ?? "?"} chapters.` });
    } catch (e: any) {
      setBackfillResult(String(e?.message ?? e));
      toast({ title: "Backfill failed", description: String(e?.message ?? e), variant: "destructive" });
    } finally {
      setBackfilling(false);
    }
  };

  const runMirror = async () => {
    setMirroring(true);
    setMirrorResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("mirror-account-content", { body: {} });
      if (error) throw error;
      setMirrorResult(JSON.stringify(data, null, 2));
      toast({ title: "Pinnacle mirrored", description: "Pinnacle Capital now matches Rathbones." });
    } catch (e: any) {
      setMirrorResult(String(e?.message ?? e));
      toast({ title: "Mirror failed", description: String(e?.message ?? e), variant: "destructive" });
    } finally {
      setMirroring(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Dev Tools</h1>
        <p className="text-sm text-muted-foreground">Demo data utilities. Not visible to end users.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reset Rathbones learner state</CardTitle>
          <CardDescription>
            Wipes and re-seeds <code>learner_progress</code>, <code>assessment_instances</code>,{" "}
            <code>chapter_lock_events</code>, <code>micro_learnings</code> and <code>learner_analytics</code>{" "}
            for the 9 Rathbones personas (rb-l1..rb-l9). Walks each persona through the real assoc_im
            modules so Clara, Theo, Beth and Kofi log in mid-journey with the manager-dashboard story
            intact. Adaptive rules (post-assessment micro-learnings and midpoint-fail chapter reopens)
            are applied during the seed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={runReset} disabled={running}>
            {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {running ? "Re-seeding…" : "Reset Rathbones demo"}
          </Button>
          {result && (
            <pre className="bg-muted rounded-md p-3 text-xs whitespace-pre-wrap break-words max-h-72 overflow-auto">
              {result}
            </pre>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backfill chapter content</CardTitle>
          <CardDescription>
            Invokes <code>generate-catalog-chapters</code> to fill any{" "}
            <code>catalog_chapters</code> row with empty <code>chapter_long_form_content</code>.
            Generates a ~700-word Rathbones playbook body plus content sections and diagnostic
            questions. Safe to re-run — already-filled chapters are skipped.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={runBackfill} disabled={backfilling} variant="outline">
            {backfilling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {backfilling ? "Generating…" : "Backfill empty chapters (25 max)"}
          </Button>
          {backfillResult && (
            <pre className="bg-muted rounded-md p-3 text-xs whitespace-pre-wrap break-words max-h-72 overflow-auto">
              {backfillResult}
            </pre>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Re-mirror Pinnacle from Rathbones</CardTitle>
          <CardDescription>
            Replaces every Pinnacle Capital row (cohorts, catalog, chapters, personas, progress,
            assessments, micro-learnings, workforce groups) with an exact copy of the Rathbones
            equivalents, keeping the same codes and employee IDs. Safe to re-run after any
            Rathbones seeding change. Rathbones data is never modified.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={runMirror} disabled={mirroring} variant="outline">
            {mirroring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {mirroring ? "Mirroring…" : "Re-mirror Pinnacle from Rathbones"}
          </Button>
          {mirrorResult && (
            <pre className="bg-muted rounded-md p-3 text-xs whitespace-pre-wrap break-words max-h-72 overflow-auto">
              {mirrorResult}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

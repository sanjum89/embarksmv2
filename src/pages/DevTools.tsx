import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function DevTools() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

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
    </div>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const RATHBONES_ACCOUNT_ID = "6c49ca7c-fecb-4b34-a690-7e4e28bb2194";
const PINNACLE_ACCOUNT_ID  = "08b9c4d5-f4ec-44bb-8bc2-099d9848f465";
const UBS_ACCOUNT_ID       = "7b8c9d0e-1f2a-4b3c-8d4e-5f6a7b8c9d0e";

export default function DevTools() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [backfilling, setBackfilling] = useState(false);
  const [backfillResult, setBackfillResult] = useState<string | null>(null);
  const [mirroring, setMirroring] = useState(false);
  const [mirrorResult, setMirrorResult] = useState<string | null>(null);
  const [mirroringUBS, setMirroringUBS] = useState(false);
  const [mirrorUBSResult, setMirrorUBSResult] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [seedingSkills, setSeedingSkills] = useState(false);
  const [seedSkillsResult, setSeedSkillsResult] = useState<string | null>(null);

  const runReset = async () => {
    setRunning(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("embarksmv2-reset-rathbones-demo", { body: {} });
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
      const { data, error } = await supabase.functions.invoke("embarksmv2-generate-catalog-chapters", { body: { accountId: RATHBONES_ACCOUNT_ID, limit: 25 } });
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

  const runCatalogImport = async () => {
    setImporting(true);
    setImportResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("embarksmv2-catalog-import", {
        body: { accountId: RATHBONES_ACCOUNT_ID },
      });
      if (error) throw error;
      setImportResult(JSON.stringify(data, null, 2));
      toast({ title: "Catalog import complete", description: "Modules and chapters seeded for Rathbones." });
    } catch (e: any) {
      setImportResult(String(e?.message ?? e));
      toast({ title: "Import failed", description: String(e?.message ?? e), variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const runSeedSkills = async () => {
    setSeedingSkills(true);
    setSeedSkillsResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("embarksmv2-seed-rathbones-persona-skills", {
        body: { account_id: RATHBONES_ACCOUNT_ID },
      });
      if (error) throw error;
      setSeedSkillsResult(JSON.stringify(data, null, 2));
      toast({ title: "Skills seeded", description: "Persona capability profiles created for Rathbones." });
    } catch (e: any) {
      setSeedSkillsResult(String(e?.message ?? e));
      toast({ title: "Seed skills failed", description: String(e?.message ?? e), variant: "destructive" });
    } finally {
      setSeedingSkills(false);
    }
  };

  const runMirror = async () => {
    setMirroring(true);
    setMirrorResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("embarksmv2-mirror-account-content", { body: {} });
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

  const runMirrorUBS = async () => {
    setMirroringUBS(true);
    setMirrorUBSResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("embarksmv2-mirror-account-content", {
        body: { source_account_id: PINNACLE_ACCOUNT_ID, target_account_id: UBS_ACCOUNT_ID },
      });
      if (error) throw error;
      setMirrorUBSResult(JSON.stringify(data, null, 2));
      toast({ title: "UBS mirrored", description: "UBS now matches Pinnacle Capital." });
    } catch (e: any) {
      setMirrorUBSResult(String(e?.message ?? e));
      toast({ title: "UBS mirror failed", description: String(e?.message ?? e), variant: "destructive" });
    } finally {
      setMirroringUBS(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
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
          <CardTitle>Seed persona skills &amp; capability profiles</CardTitle>
          <CardDescription>
            Populates <code>employee_capability_proficiency</code> and{" "}
            <code>persona_competency_profiles</code> for the 9 Rathbones personas. This powers
            the AI chat skill-gap analysis with inline graphs and the "why this content" explanations.
            Run after Reset Rathbones demo, then re-mirror Pinnacle.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={runSeedSkills} disabled={seedingSkills} variant="outline">
            {seedingSkills ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {seedingSkills ? "Seeding skills…" : "Seed persona skills"}
          </Button>
          {seedSkillsResult && (
            <pre className="bg-muted rounded-md p-3 text-xs whitespace-pre-wrap break-words max-h-72 overflow-auto">
              {seedSkillsResult}
            </pre>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import catalog (Step 1 — run first on a fresh DB)</CardTitle>
          <CardDescription>
            Calls <code>catalog-import</code> with the Rathbones account ID. Uses OpenAI to expand
            module skeletons into full chapters, assessment blueprints and evidence tasks. Idempotent
            — re-running updates existing rows. <strong>Requires OPENAI_API_KEY</strong> set in
            Supabase Edge Function secrets. Run this before Reset Rathbones demo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={runCatalogImport} disabled={importing} variant="outline">
            {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {importing ? "Importing…" : "Import catalog for Rathbones"}
          </Button>
          {importResult && (
            <pre className="bg-muted rounded-md p-3 text-xs whitespace-pre-wrap break-words max-h-72 overflow-auto">
              {importResult}
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

      <Card>
        <CardHeader>
          <CardTitle>Mirror Pinnacle → UBS</CardTitle>
          <CardDescription>
            Copies the full Pinnacle Capital data set into the UBS account — cohorts, catalog,
            chapters, personas, progress, assessments, and micro-learnings. Run this after
            Re-mirror Pinnacle from Rathbones. UBS branding (red theme, logo) is applied via
            the frontend; the content in the DB is identical to Pinnacle.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={runMirrorUBS} disabled={mirroringUBS} variant="outline">
            {mirroringUBS ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {mirroringUBS ? "Mirroring…" : "Mirror Pinnacle → UBS"}
          </Button>
          {mirrorUBSResult && (
            <pre className="bg-muted rounded-md p-3 text-xs whitespace-pre-wrap break-words max-h-72 overflow-auto">
              {mirrorUBSResult}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
    </div>
  );
}

/**
 * Read-only content audit for Sophie (rb-l1), Theo (rb-l3) and Clara (rb-l6).
 * Walks every cohort module on each persona's journey and flags weak data.
 *
 * Run: bun scripts/audit-clara-theo-content.ts
 * Output: /mnt/documents/sophie-theo-clara-content-audit.md
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ACCOUNT_ID = "6c49ca7c-fecb-4b34-a690-7e4e28bb2194"; // Rathbones
const PERSONAS: { employeeId: string; label: string }[] = [
  { employeeId: "rb-l1", label: "Sophie Linden (early · outside FS — canonical baseline)" },
  { employeeId: "rb-l3", label: "Theo Marchant (early · IM)" },
  { employeeId: "rb-l6", label: "Clara Wren (mid · IM)" },
];
const PLACEHOLDERS = [/\blorem\b/i, /\bTBD\b/, /\bTODO\b/, /\bsample text\b/i, /\bplaceholder\b/i];

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

interface Finding {
  module: string;
  chapter: string;
  title: string;
  adaptation: string;
  issues: string[];
}

interface PersonaReport {
  employeeId: string;
  label: string;
  findings: Finding[];
  trackSummary: Record<string, { total: number; failing: number }>;
  modulesMissingEvidenceTask: string[];
  modulesWithGenericReason: string[];
  adaptationMatrix: { module_code: string; module_title: string; track: string; adaptation_type: string }[];
}

async function auditPersona(employeeId: string, label: string): Promise<PersonaReport> {
  const { data: persRow } = await sb
    .from("employee_persona_assignments")
    .select("persona_code")
    .eq("account_id", ACCOUNT_ID)
    .eq("employee_id", employeeId)
    .maybeSingle();
  const personaCode = persRow?.persona_code as string | undefined;

  const { data: enrol } = await sb
    .from("cohort_enrollments")
    .select("cohort_id")
    .eq("account_id", ACCOUNT_ID)
    .eq("employee_id", employeeId);
  const cohortIds = (enrol ?? []).map((e: any) => e.cohort_id);

  let modules: any[] = [];
  if (cohortIds.length > 0) {
    const { data: cohorts } = await sb
      .from("cohorts")
      .select("id, role_cohort_code, domain_code")
      .in("id", cohortIds);
    const roleCohortCodes = Array.from(new Set((cohorts ?? []).map((c: any) => c.role_cohort_code)));
    const domainCodes = Array.from(new Set((cohorts ?? []).map((c: any) => c.domain_code)));
    if (roleCohortCodes.length && domainCodes.length) {
      const { data } = await sb
        .from("catalog_modules")
        .select("module_code, module_title, learning_track_code, role_cohort_code, domain_code")
        .eq("account_id", ACCOUNT_ID)
        .in("role_cohort_code", roleCohortCodes)
        .in("domain_code", domainCodes);
      modules = data ?? [];
    }
  }
  if (modules.length === 0 && personaCode) {
    const { data: adaptedMods } = await sb
      .from("persona_module_adaptations")
      .select("module_code")
      .eq("account_id", ACCOUNT_ID)
      .eq("persona_code", personaCode);
    const codes = Array.from(new Set((adaptedMods ?? []).map((a: any) => a.module_code)));
    if (codes.length) {
      const { data } = await sb
        .from("catalog_modules")
        .select("module_code, module_title, learning_track_code, role_cohort_code, domain_code")
        .eq("account_id", ACCOUNT_ID)
        .in("module_code", codes);
      modules = data ?? [];
    }
  }
  if (modules.length === 0) {
    const { data } = await sb
      .from("catalog_modules")
      .select("module_code, module_title, learning_track_code, role_cohort_code, domain_code")
      .eq("account_id", ACCOUNT_ID);
    modules = data ?? [];
  }

  const moduleCodes = (modules ?? []).map((m: any) => m.module_code);
  if (moduleCodes.length === 0) {
    return {
      employeeId, label, findings: [], trackSummary: {},
      modulesMissingEvidenceTask: [], modulesWithGenericReason: [],
      adaptationMatrix: [],
    };
  }

  const { data: adapts } = personaCode
    ? await sb
        .from("persona_module_adaptations")
        .select("module_code, adaptation_type, reason")
        .eq("account_id", ACCOUNT_ID)
        .eq("persona_code", personaCode)
        .in("module_code", moduleCodes)
    : { data: [] };
  const adaptByMod = new Map<string, { adaptation_type: string; reason: string | null }>();
  for (const a of adapts ?? []) adaptByMod.set((a as any).module_code, a as any);

  const { data: chapters } = await sb
    .from("catalog_chapters")
    .select("module_code, chapter_code, chapter_title, learning_objective, chapter_long_form_content, content_sections, diagnostic_questions, practical_activity, display_order")
    .eq("account_id", ACCOUNT_ID)
    .in("module_code", moduleCodes)
    .order("module_code", { ascending: true })
    .order("display_order", { ascending: true });

  const { data: evTasks } = await sb
    .from("catalog_evidence_tasks")
    .select("module_code")
    .eq("account_id", ACCOUNT_ID)
    .in("module_code", moduleCodes);
  const evByMod = new Set<string>((evTasks ?? []).map((e: any) => e.module_code));

  const trackByMod = new Map<string, string>();
  const titleByMod = new Map<string, string>();
  for (const m of modules ?? []) {
    trackByMod.set((m as any).module_code, (m as any).learning_track_code);
    titleByMod.set((m as any).module_code, (m as any).module_title);
  }

  const findings: Finding[] = [];
  const trackSummary: Record<string, { total: number; failing: number }> = {};
  const modulesMissingEvidenceTask: string[] = [];
  const modulesWithGenericReason: string[] = [];
  const seenAdaptations = new Set<string>();

  const adaptationMatrix = moduleCodes
    .slice()
    .sort()
    .map((code) => ({
      module_code: code,
      module_title: titleByMod.get(code) ?? "—",
      track: trackByMod.get(code) ?? "unknown",
      adaptation_type: adaptByMod.get(code)?.adaptation_type ?? "full_module",
    }));

  for (const ch of chapters ?? []) {
    const c = ch as any;
    const adap = adaptByMod.get(c.module_code);
    const adaptType = adap?.adaptation_type ?? "full_module";
    const issues: string[] = [];

    const lo = (c.learning_objective ?? "").trim();
    if (lo.length < 40) issues.push(`learning_objective too short (${lo.length} chars)`);

    const longForm = (c.chapter_long_form_content ?? "") as string;
    const sections = Array.isArray(c.content_sections) ? c.content_sections : [];
    const sectionsLen = sections.reduce((acc: number, s: any) => acc + (s?.body_md?.length ?? 0), 0);
    const bodyLen = Math.max(longForm.length, sectionsLen);
    if (bodyLen < 1500) issues.push(`thin chapter body (${bodyLen} chars total)`);

    if (adaptType === "diagnostic_only") {
      const dq = Array.isArray(c.diagnostic_questions) ? c.diagnostic_questions : [];
      if (dq.length < 3) issues.push(`diagnostic_only module but only ${dq.length} questions on this chapter`);
      else {
        for (const [i, q] of dq.entries()) {
          if (!Array.isArray(q.options) || q.options.length < 4) {
            issues.push(`diagnostic Q${i + 1}: needs 4 options`);
          }
          if (typeof q.correctIndex !== "number") issues.push(`diagnostic Q${i + 1}: missing correctIndex`);
          if (!q.explanation) issues.push(`diagnostic Q${i + 1}: missing explanation`);
        }
      }
    }

    if (adaptType === "evidence_required") {
      const pa = (c.practical_activity ?? "").trim();
      if (pa.length < 200) issues.push(`evidence chapter has thin practical_activity (${pa.length} chars)`);
    }

    for (const re of PLACEHOLDERS) {
      if (re.test(longForm) || re.test(JSON.stringify(sections))) {
        issues.push(`placeholder text matched ${re.source}`);
      }
    }

    if (!seenAdaptations.has(c.module_code)) {
      seenAdaptations.add(c.module_code);
      if (adaptType === "evidence_required" && !evByMod.has(c.module_code)) {
        modulesMissingEvidenceTask.push(c.module_code);
      }
      const reason = (adap?.reason ?? "").trim();
      if (
        (adaptType === "microlearning" || adaptType === "diagnostic_only" || adaptType === "evidence_required") &&
        (reason.length < 30 || /^Risk-critical content/.test(reason))
      ) {
        modulesWithGenericReason.push(`${c.module_code} (${adaptType}): "${reason || "—"}"`);
      }
    }

    const track = trackByMod.get(c.module_code) ?? "unknown";
    trackSummary[track] ??= { total: 0, failing: 0 };
    trackSummary[track].total += 1;
    if (issues.length > 0) {
      trackSummary[track].failing += 1;
      findings.push({
        module: c.module_code,
        chapter: c.chapter_code,
        title: c.chapter_title,
        adaptation: adaptType,
        issues,
      });
    }
  }

  return {
    employeeId, label, findings, trackSummary,
    modulesMissingEvidenceTask, modulesWithGenericReason, adaptationMatrix,
  };
}

function renderReport(reports: PersonaReport[]): string {
  const lines: string[] = [];
  lines.push(`# Sophie + Theo + Clara content audit`);
  lines.push(`_Generated ${new Date().toISOString()}_`);
  lines.push(`_Account: Rathbones (${ACCOUNT_ID})_`);
  lines.push("");
  lines.push("## Adaptation matrix (module × persona)");
  lines.push("");
  // Build a wide matrix: rows = module, columns = personas
  const allCodes = new Set<string>();
  for (const r of reports) for (const m of r.adaptationMatrix) allCodes.add(m.module_code);
  const codes = Array.from(allCodes).sort();
  const headers = ["module", "track", ...reports.map((r) => r.label.split(" ")[0])];
  lines.push(`| ${headers.join(" | ")} |`);
  lines.push(`| ${headers.map(() => "---").join(" | ")} |`);
  for (const code of codes) {
    const first = reports[0].adaptationMatrix.find((m) => m.module_code === code);
    const cells = [
      `\`${code}\``,
      first?.track ?? "—",
      ...reports.map((r) => r.adaptationMatrix.find((m) => m.module_code === code)?.adaptation_type ?? "—"),
    ];
    lines.push(`| ${cells.join(" | ")} |`);
  }
  lines.push("");

  lines.push("## Summary");
  lines.push("");
  lines.push("| Persona | Track | Chapters | Failing |");
  lines.push("|---|---|---:|---:|");
  for (const r of reports) {
    const tracks = Object.keys(r.trackSummary).sort();
    if (tracks.length === 0) {
      lines.push(`| ${r.label} | — | 0 | 0 |`);
    } else {
      for (const t of tracks) {
        const s = r.trackSummary[t];
        lines.push(`| ${r.label} | ${t} | ${s.total} | ${s.failing} |`);
      }
    }
  }
  lines.push("");

  for (const r of reports) {
    lines.push(`## ${r.label}`);
    lines.push("");
    if (r.modulesMissingEvidenceTask.length > 0) {
      lines.push(`### Missing evidence-task rows (\`catalog_evidence_tasks\`)`);
      for (const m of r.modulesMissingEvidenceTask) lines.push(`- \`${m}\``);
      lines.push("");
    }
    if (r.modulesWithGenericReason.length > 0) {
      lines.push(`### Adaptations with generic / boilerplate reason`);
      for (const m of r.modulesWithGenericReason) lines.push(`- ${m}`);
      lines.push("");
    }
    if (r.findings.length === 0) {
      lines.push(`_No chapter-level issues found._`);
      lines.push("");
      continue;
    }
    lines.push(`### Chapter findings (${r.findings.length})`);
    let currentMod = "";
    for (const f of r.findings) {
      if (f.module !== currentMod) {
        currentMod = f.module;
        lines.push("");
        lines.push(`#### \`${f.module}\``);
      }
      lines.push(`- **${f.chapter}** — ${f.title} _(adaptation: ${f.adaptation})_`);
      for (const i of f.issues) lines.push(`  - ${i}`);
    }
    lines.push("");
  }

  lines.push("## Recommended next steps");
  lines.push("");
  lines.push("- Backfill `catalog_evidence_tasks` for the modules listed under \"Missing evidence-task rows\" so the new evidence-brief UI shows real Rathbones-flavoured prompts (currently falls back to a generated brief).");
  lines.push("- Replace boilerplate adaptation reasons (\"Risk-critical content — please evidence current competence.\") with persona-specific rationale that explains _why_ this module is being adapted for that learner.");
  lines.push("- For chapters flagged with a thin body (Sophie is the canonical baseline — anything thin for her affects all three personas), expand `chapter_long_form_content` or `content_sections` to ≥ 1,500 chars with concrete Rathbones examples.");
  lines.push("- For diagnostic-only modules (mostly Clara) with sparse questions, top each chapter up to ≥ 3 well-formed MCQs (4 options + correctIndex + explanation).");

  return lines.join("\n");
}

(async () => {
  const reports: PersonaReport[] = [];
  for (const p of PERSONAS) {
    process.stdout.write(`Auditing ${p.label}…\n`);
    reports.push(await auditPersona(p.employeeId, p.label));
  }
  const md = renderReport(reports);
  mkdirSync("/mnt/documents", { recursive: true });
  const out = "/mnt/documents/sophie-theo-clara-content-audit.md";
  writeFileSync(out, md, "utf-8");
  console.log(`Wrote ${out} (${md.length} chars)`);
})();

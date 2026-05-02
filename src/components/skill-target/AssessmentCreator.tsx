import { useState } from "react";
import { Plus, X, Trash2, Sparkles, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { StepItem } from "@/types/learning";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

interface Props {
  existingModules: StepItem[];
  onAdd: (assessment: {
    title: string;
    questions: Question[];
    passingScore: number;
    linkedModuleIds: string[];
    skipThreshold: number;
  }) => void;
  onCancel: () => void;
}

/* ── Mock question pool ── */
type Difficulty = "foundational" | "applied" | "analytical" | "expert";

interface PoolQuestion extends Question {
  difficulty: Difficulty;
  format: "mc" | "tf" | "scenario";
}

const questionPool: PoolQuestion[] = [
  { id: "p1", difficulty: "foundational", format: "mc", question: "What is the primary goal of active listening?", options: ["Waiting for your turn to speak", "Understanding the speaker's message", "Formulating a response quickly", "Taking notes verbatim"], correctIndex: 1 },
  { id: "p2", difficulty: "foundational", format: "tf", question: "Empathy and sympathy mean the same thing in a support context.", options: ["True", "False"], correctIndex: 1 },
  { id: "p3", difficulty: "foundational", format: "mc", question: "Which greeting best sets a professional tone?", options: ["Hey, what's up?", "Hi, thanks for contacting support — how can I help?", "What do you need?", "Go ahead."], correctIndex: 1 },
  { id: "p4", difficulty: "foundational", format: "mc", question: "What should you do first when a customer reports an issue?", options: ["Escalate immediately", "Acknowledge their concern", "Ask for their account number", "Offer a refund"], correctIndex: 1 },
  { id: "p5", difficulty: "applied", format: "mc", question: "A customer is frustrated about a delayed shipment. What is the best first response?", options: ["Tell them to wait longer", "Apologize and look up the tracking info", "Offer a discount immediately", "Transfer to another agent"], correctIndex: 1 },
  { id: "p6", difficulty: "applied", format: "scenario", question: "A customer says 'I've been on hold for 30 minutes!' — which response de-escalates most effectively?", options: ["That's not that long actually.", "I completely understand your frustration — let me make sure we resolve this right now.", "Let me transfer you to my manager.", "Can you call back at a less busy time?"], correctIndex: 1 },
  { id: "p7", difficulty: "applied", format: "mc", question: "When should you use a knowledge base article during a call?", options: ["Never — rely on memory", "When the issue matches a documented solution", "Only if the customer asks", "After the call for notes"], correctIndex: 1 },
  { id: "p8", difficulty: "applied", format: "tf", question: "It's acceptable to place a customer on hold without explaining why.", options: ["True", "False"], correctIndex: 1 },
  { id: "p9", difficulty: "analytical", format: "scenario", question: "A customer's issue requires input from engineering. The SLA is 24 hours but engineering needs 48. What do you do?", options: ["Promise 24 hours anyway", "Set expectation for 48 hours and explain why", "Close the ticket and reopen later", "Tell the customer to contact engineering directly"], correctIndex: 1 },
  { id: "p10", difficulty: "analytical", format: "mc", question: "Which metric best indicates first-contact resolution effectiveness?", options: ["Average handle time", "Customer satisfaction score", "Number of tickets reopened within 7 days", "Agent utilization rate"], correctIndex: 2 },
  { id: "p11", difficulty: "analytical", format: "scenario", question: "You notice a pattern of similar complaints over the past week. What is the best action?", options: ["Handle each one individually", "Flag the trend to your team lead with data", "Ignore it — patterns happen", "Create a workaround and keep it to yourself"], correctIndex: 1 },
  { id: "p12", difficulty: "expert", format: "scenario", question: "A VIP customer threatens to leave unless given an exception outside policy. How do you handle it?", options: ["Grant the exception immediately", "Refuse and cite policy", "Empathize, explain policy rationale, and offer an alternative within guidelines", "Escalate without attempting resolution"], correctIndex: 2 },
  { id: "p13", difficulty: "expert", format: "mc", question: "When designing a support escalation matrix, which factor should be weighted most heavily?", options: ["Agent seniority", "Customer lifetime value and issue severity", "Time of day", "Ticket volume"], correctIndex: 1 },
  { id: "p14", difficulty: "expert", format: "scenario", question: "Your team's CSAT dropped 8% this month. How do you investigate?", options: ["Blame the new hires", "Correlate with recent process changes, ticket categories, and individual scores", "Wait another month to see if it recovers", "Send a survey asking customers what went wrong"], correctIndex: 1 },
  { id: "p15", difficulty: "expert", format: "tf", question: "Root cause analysis should only be performed on escalated tickets.", options: ["True", "False"], correctIndex: 1 },
];

function generateMockQuestions(config: {
  count: number;
  difficulty: Difficulty;
  formats: string[];
}): Question[] {
  const formatMap: Record<string, PoolQuestion["format"]> = { "Multiple Choice": "mc", "True / False": "tf", "Scenario-based": "scenario" };
  const allowedFormats = config.formats.map((f) => formatMap[f] || "mc");

  let pool = questionPool.filter(
    (q) => q.difficulty === config.difficulty && allowedFormats.includes(q.format)
  );
  // Fallback: if not enough, include adjacent difficulties
  if (pool.length < config.count) {
    pool = questionPool.filter((q) => allowedFormats.includes(q.format));
  }
  if (pool.length < config.count) {
    pool = [...questionPool];
  }

  // Shuffle & pick
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, config.count).map((q, i) => ({
    id: `ai-${Date.now()}-${i}`,
    question: q.question,
    options: q.options,
    correctIndex: q.correctIndex,
  }));
}

/* ── Formats ── */
const FORMAT_OPTIONS = ["Multiple Choice", "True / False", "Scenario-based"] as const;

export function AssessmentCreator({ existingModules, onAdd, onCancel }: Props) {
  const [tab, setTab] = useState<"manual" | "ai">("manual");

  // ── Shared state ──
  const [title, setTitle] = useState("");
  const [passingScore, setPassingScore] = useState(70);
  const [linkedModuleIds, setLinkedModuleIds] = useState<string[]>([]);
  const [skipThreshold, setSkipThreshold] = useState(80);

  // ── Manual state ──
  const [questions, setQuestions] = useState<Question[]>([]);

  // ── AI state ──
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<Difficulty>("applied");
  const [formats, setFormats] = useState<string[]>(["Multiple Choice"]);
  const [generating, setGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[] | null>(null);

  // ── Helpers ──
  const toggleModule = (refId: string) =>
    setLinkedModuleIds((prev) => (prev.includes(refId) ? prev.filter((id) => id !== refId) : [...prev, refId]));

  const toggleFormat = (f: string) =>
    setFormats((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));

  // ── Manual question helpers ──
  const addQuestion = () =>
    setQuestions((prev) => [...prev, { id: `cq-${Date.now()}`, question: "", options: ["", "", "", ""], correctIndex: 0 }]);
  const updateQuestion = (idx: number, field: Partial<Question>) =>
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...field } : q)));
  const updateOption = (qIdx: number, oIdx: number, value: string) =>
    setQuestions((prev) => prev.map((q, i) => (i === qIdx ? { ...q, options: q.options.map((o, j) => (j === oIdx ? value : o)) } : q)));
  const removeQuestion = (idx: number) => setQuestions((prev) => prev.filter((_, i) => i !== idx));

  // ── AI generate ──
  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      const qs = generateMockQuestions({ count: numQuestions, difficulty, formats });
      setGeneratedQuestions(qs);
      setGenerating(false);
    }, 1500);
  };

  // ── Validation ──
  const manualValid = title.trim() && questions.length > 0 && questions.every((q) => q.question.trim() && q.options.every((o) => o.trim()));
  const aiValid = title.trim() && generatedQuestions && generatedQuestions.length > 0;

  const handleSubmit = () => {
    const qs = tab === "manual" ? questions : generatedQuestions!;
    onAdd({ title, questions: qs, passingScore, linkedModuleIds, skipThreshold });
  };

  const difficultyLabels: Record<Difficulty, string> = {
    foundational: "Foundational — Recall & recognition",
    applied: "Applied — Use in context",
    analytical: "Analytical — Evaluate & decide",
    expert: "Expert — Design & lead",
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">Create Assessment</h4>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Title — shared */}
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Assessment title" className="h-8 text-sm" />

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as "manual" | "ai")}>
        <TabsList className="w-full">
          <TabsTrigger value="manual" className="flex-1 text-xs">Manual</TabsTrigger>
          <TabsTrigger value="ai" className="flex-1 text-xs gap-1">
            <Sparkles className="h-3 w-3" /> AI Generate
          </TabsTrigger>
        </TabsList>

        {/* ── Manual Tab ── */}
        <TabsContent value="manual" className="space-y-3 mt-3">
          {questions.map((q, qi) => (
            <div key={q.id} className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Q{qi + 1}</span>
                <Input value={q.question} onChange={(e) => updateQuestion(qi, { question: e.target.value })} placeholder="Question text" className="h-7 text-xs flex-1" />
                <button onClick={() => removeQuestion(qi)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-1.5">
                    <button onClick={() => updateQuestion(qi, { correctIndex: oi })} className={cn("h-4 w-4 rounded-full border-2 flex-shrink-0 transition-colors", q.correctIndex === oi ? "border-green-500 bg-green-500" : "border-muted-foreground")} />
                    <Input value={opt} onChange={(e) => updateOption(qi, oi, e.target.value)} placeholder={`Option ${oi + 1}`} className="h-7 text-xs" />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button onClick={addQuestion} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Plus className="h-3.5 w-3.5" /> Add question
          </button>
        </TabsContent>

        {/* ── AI Generate Tab ── */}
        <TabsContent value="ai" className="space-y-4 mt-3">
          {/* Number of questions */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Number of Questions: {numQuestions}</label>
            <Slider value={[numQuestions]} onValueChange={([v]) => setNumQuestions(v)} min={3} max={20} step={1} />
          </div>

          {/* Difficulty */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Difficulty Level</label>
            <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(difficultyLabels) as Difficulty[]).map((d) => (
                  <SelectItem key={d} value={d} className="text-xs">{difficultyLabels[d]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Question format */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Question Formats</label>
            <div className="flex flex-wrap gap-2">
              {FORMAT_OPTIONS.map((f) => (
                <label key={f} className="flex items-center gap-1.5 cursor-pointer text-xs text-foreground">
                  <Checkbox checked={formats.includes(f)} onCheckedChange={() => toggleFormat(f)} />
                  {f}
                </label>
              ))}
            </div>
          </div>

          {/* Source modules */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Source Modules</label>
            {existingModules.length > 0 ? (
              <div className="space-y-1">
                {existingModules.map((m) => (
                  <label key={m.id} className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
                    <Checkbox checked={linkedModuleIds.includes(m.referenceId)} onCheckedChange={() => toggleModule(m.referenceId)} />
                    {m.title}
                  </label>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-3 text-center">
                <p className="text-xs text-muted-foreground">No modules added yet. Add modules first to scope the assessment.</p>
              </div>
            )}
          </div>

          {/* Generate button */}
          <Button onClick={handleGenerate} disabled={generating || formats.length === 0} size="sm" variant="secondary" className="w-full gap-1.5">
            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {generating ? "Generating…" : "Generate Questions"}
          </Button>

          {/* Preview generated questions */}
          {generatedQuestions && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">{generatedQuestions.length} questions generated</p>
              {generatedQuestions.map((q, qi) => (
                <div key={q.id} className="rounded-lg border border-border p-2.5 space-y-1.5">
                  <p className="text-xs font-medium text-foreground">Q{qi + 1}: {q.question}</p>
                  <div className="grid grid-cols-2 gap-1">
                    {q.options.map((opt, oi) => (
                      <span key={oi} className={cn("text-[0.7rem] px-2 py-0.5 rounded", oi === q.correctIndex ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground")}>
                        {opt}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Shared: Passing score ── */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Passing Score: {passingScore}%</label>
        <Slider value={[passingScore]} onValueChange={([v]) => setPassingScore(v)} min={10} max={100} step={5} />
      </div>

      {/* ── Shared: Skip threshold (when modules linked) ── */}
      {linkedModuleIds.length > 0 && (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Skip Threshold: {skipThreshold}%</label>
          <Slider value={[skipThreshold]} onValueChange={([v]) => setSkipThreshold(v)} min={50} max={100} step={5} />
          <p className="text-[0.7rem] text-muted-foreground mt-1">Modules linked above will be skipped if the learner scores above {skipThreshold}%.</p>
        </div>
      )}

      {/* ── Shared: Module linking (manual tab only, since AI tab has it inline) ── */}
      {tab === "manual" && existingModules.length > 0 && (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Connect to modules (skip if score &gt; {skipThreshold}%)</label>
          <div className="space-y-1">
            {existingModules.map((m) => (
              <label key={m.id} className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
                <Checkbox checked={linkedModuleIds.includes(m.referenceId)} onCheckedChange={() => toggleModule(m.referenceId)} />
                {m.title}
              </label>
            ))}
          </div>
        </div>
      )}

      <Button onClick={handleSubmit} disabled={tab === "manual" ? !manualValid : !aiValid} size="sm" className="w-full">
        Add Assessment to Skill Target
      </Button>
    </div>
  );
}

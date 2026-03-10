import { useState } from "react";
import { Plus, X, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export function AssessmentCreator({ existingModules, onAdd, onCancel }: Props) {
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [passingScore, setPassingScore] = useState(70);
  const [linkedModuleIds, setLinkedModuleIds] = useState<string[]>([]);
  const [skipThreshold, setSkipThreshold] = useState(80);

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      { id: `cq-${Date.now()}`, question: "", options: ["", "", "", ""], correctIndex: 0 },
    ]);
  };

  const updateQuestion = (idx: number, field: Partial<Question>) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...field } : q)));
  };

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx ? { ...q, options: q.options.map((o, j) => (j === oIdx ? value : o)) } : q
      )
    );
  };

  const removeQuestion = (idx: number) => setQuestions((prev) => prev.filter((_, i) => i !== idx));

  const toggleModule = (refId: string) => {
    setLinkedModuleIds((prev) =>
      prev.includes(refId) ? prev.filter((id) => id !== refId) : [...prev, refId]
    );
  };

  const valid = title.trim() && questions.length > 0 && questions.every((q) => q.question.trim() && q.options.every((o) => o.trim()));

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">Create Assessment</h4>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Title */}
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Assessment title" className="h-8 text-sm" />

      {/* Questions */}
      <div className="space-y-3">
        {questions.map((q, qi) => (
          <div key={q.id} className="rounded-lg border border-border p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Q{qi + 1}</span>
              <Input
                value={q.question}
                onChange={(e) => updateQuestion(qi, { question: e.target.value })}
                placeholder="Question text"
                className="h-7 text-xs flex-1"
              />
              <button onClick={() => removeQuestion(qi)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateQuestion(qi, { correctIndex: oi })}
                    className={cn(
                      "h-4 w-4 rounded-full border-2 flex-shrink-0 transition-colors",
                      q.correctIndex === oi ? "border-green-500 bg-green-500" : "border-muted-foreground"
                    )}
                  />
                  <Input
                    value={opt}
                    onChange={(e) => updateOption(qi, oi, e.target.value)}
                    placeholder={`Option ${oi + 1}`}
                    className="h-7 text-xs"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
        <button onClick={addQuestion} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <Plus className="h-3.5 w-3.5" />
          Add question
        </button>
      </div>

      {/* Passing score */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          Passing Score: {passingScore}%
        </label>
        <Slider value={[passingScore]} onValueChange={([v]) => setPassingScore(v)} min={10} max={100} step={5} />
      </div>

      {/* Link to modules for skipping */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          Connect to modules (skip if score &gt; {skipThreshold}%)
        </label>
        <Slider value={[skipThreshold]} onValueChange={([v]) => setSkipThreshold(v)} min={50} max={100} step={5} className="mb-2" />
        {existingModules.length > 0 ? (
          <div className="space-y-1">
            {existingModules.map((m) => (
              <label key={m.id} className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
                <Checkbox
                  checked={linkedModuleIds.includes(m.referenceId)}
                  onCheckedChange={() => toggleModule(m.referenceId)}
                />
                {m.title}
              </label>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-3 text-center">
            <p className="text-xs text-muted-foreground">No modules added yet. Add modules first to link them for skipping.</p>
          </div>
        )}
      </div>

      <Button onClick={() => valid && onAdd({ title, questions, passingScore, linkedModuleIds, skipThreshold })} disabled={!valid} size="sm" className="w-full">
        Add Assessment to Skill Target
      </Button>
    </div>
  );
}

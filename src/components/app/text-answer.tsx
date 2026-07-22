"use client";

import { useState } from "react";
import { submitAttemptText } from "@/lib/actions/attempts";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw, Send, Sparkles } from "lucide-react";
import type { PhotoGradeResult } from "@/components/app/photo-answer";

// Typed counterpart to PhotoAnswer, for a student who'd rather write than
// photograph — same real AI grading (score + feedback), not the old
// "saved, on review" placeholder that plain text answers used to get.
export function TextAnswer({
  taskId,
  maxScore,
  mockExamAttemptId,
  initialResult,
  onGraded,
}: {
  taskId: string;
  maxScore: number;
  mockExamAttemptId?: string;
  initialResult?: PhotoGradeResult;
  onGraded?: (result: PhotoGradeResult) => void;
}) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PhotoGradeResult | null>(initialResult ?? null);

  async function handleSubmit() {
    if (!value.trim() || busy) return;
    setError(null);
    setBusy(true);
    try {
      const res = await submitAttemptText({ taskId, answerText: value, mockExamAttemptId });
      const graded = {
        score: res.score,
        maxScore: res.maxScore,
        feedback: res.feedback,
        xpGain: res.xpGain,
        isCorrect: res.isCorrect,
      };
      setResult(graded);
      onGraded?.(graded);
    } catch {
      setError("Не получилось проверить ответ — попробуй отправить ещё раз.");
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-2xl bg-(--color-sky-2) px-4 py-3 text-sm font-bold text-(--color-brand-blue)">
          <Sparkles className="h-5 w-5 shrink-0" />
          {result.score}/{result.maxScore} баллов
        </div>
        <div className="rounded-2xl bg-(--color-paper-dim) p-5 text-sm leading-relaxed text-(--color-ink-soft)">
          <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-(--color-ink)">
            Обратная связь от ИИ
          </div>
          {result.feedback}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setResult(null);
            setValue("");
          }}
        >
          <RotateCcw className="h-4 w-4" /> Написать заново
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={8}
        placeholder="Напиши здесь свой ответ…"
        disabled={busy}
        className="w-full rounded-2xl border border-black/10 bg-(--color-paper-dim) p-4 text-sm outline-none focus:border-(--color-brand-blue) dark:border-white/10"
      />
      <Button type="button" variant="outline" onClick={handleSubmit} disabled={!value.trim() || busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {busy ? "ИИ проверяет…" : "Отправить на проверку"}
      </Button>
      {error && <p className="text-xs font-semibold text-(--color-brand-pink)">{error}</p>}
      <p className="text-xs text-(--color-ink-soft)">
        Максимум за задание: {maxScore} {maxScore === 1 ? "балл" : "баллов"}.
      </p>
    </div>
  );
}

"use client";

import { useState } from "react";
import { submitAttempt } from "@/lib/actions/attempts";
import { AiChat } from "@/components/app/ai-chat";
import { PhotoAnswer, type PhotoGradeResult } from "@/components/app/photo-answer";
import { TextAnswer } from "@/components/app/text-answer";
import { XpToast } from "@/components/app/xp-toast";
import { TaskDiagram } from "@/components/app/task-diagram";
import type { TaskDiagram as TaskDiagramSpec } from "@/lib/task-diagram-types";
import { Badge } from "@/components/ui/card";
import { Button, LinkButton } from "@/components/ui/button";
import { CheckCircle2, XCircle, Sparkles, ArrowRight, Clock, Keyboard, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

type Task = {
  id: string;
  number: number;
  type: "SHORT_ANSWER" | "CHOICE" | "MULTI_CHOICE" | "MATCHING" | "DETAILED_ANSWER" | "ESSAY";
  statement: string;
  options: unknown;
  diagram: TaskDiagramSpec | null;
  explanation: string;
  correctAnswer: string;
  maxScore: number;
};

const typeLabel: Record<Task["type"], string> = {
  SHORT_ANSWER: "Краткий ответ",
  CHOICE: "Выбор ответа",
  MULTI_CHOICE: "Выбор нескольких",
  MATCHING: "Соответствие",
  DETAILED_ANSWER: "Развёрнутый ответ",
  ESSAY: "Сочинение",
};

const isFreeform = (t: Task["type"]) => t === "DETAILED_ANSWER" || t === "ESSAY";

export function PracticeTask({
  task,
  nextTaskId,
  backHref,
}: {
  task: Task;
  nextTaskId: string | null;
  backHref: string;
}) {
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ isCorrect: boolean | null } | null>(null);
  const [aiGradeResult, setAiGradeResult] = useState<PhotoGradeResult | null>(null);
  const [answerMode, setAnswerMode] = useState<"photo" | "text">("photo");
  const [showAi, setShowAi] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const [xpToast, setXpToast] = useState({ trigger: 0, xp: 0, isCorrect: null as boolean | null });

  const options = Array.isArray(task.options) ? (task.options as string[]) : null;
  const graded = result || aiGradeResult;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!answer.trim() || submitting) return;
    setSubmitting(true);
    try {
      const timeSpentSec = Math.round((Date.now() - startedAt) / 1000);
      const res = await submitAttempt({ taskId: task.id, givenAnswer: answer, timeSpentSec });
      setResult({ isCorrect: res.isCorrect });
      setXpToast((s) => ({ trigger: s.trigger + 1, xp: res.xpGain, isCorrect: res.isCorrect }));
    } finally {
      setSubmitting(false);
    }
  }

  function handleAiGraded(graded: PhotoGradeResult) {
    setAiGradeResult(graded);
    setXpToast((s) => ({ trigger: s.trigger + 1, xp: graded.xpGain, isCorrect: graded.isCorrect }));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div>
        <div className="card-surface p-6 sm:p-8">
          <div className="mb-4 flex items-center gap-2">
            <Badge>Задание {task.number}</Badge>
            <Badge>{typeLabel[task.type]}</Badge>
          </div>

          {task.diagram && <TaskDiagram spec={task.diagram} />}
          <p className="whitespace-pre-wrap text-[1.05rem] leading-relaxed">{task.statement}</p>

          {options ? (
            !result && (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="space-y-2">
                  {options.map((opt) => (
                    <label
                      key={opt}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors",
                        answer === opt
                          ? "border-(--color-brand-blue) bg-(--color-sky-2)"
                          : "border-black/10 hover:border-black/20"
                      )}
                    >
                      <input
                        type="radio"
                        name="answer"
                        value={opt}
                        checked={answer === opt}
                        onChange={() => setAnswer(opt)}
                        className="accent-(--color-brand-blue)"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
                <Button type="submit" disabled={!answer.trim() || submitting}>
                  {submitting ? "Проверяю…" : "Ответить"}
                </Button>
              </form>
            )
          ) : isFreeform(task.type) ? (
            <div className="mt-6">
              {!graded && (
                <div className="mb-3 inline-flex gap-1 rounded-full bg-(--color-paper-dim) p-1 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setAnswerMode("photo")}
                    className={cn(
                      "flex items-center gap-1 rounded-full px-3 py-1.5 transition-colors",
                      answerMode === "photo" ? "bg-(--color-surface) shadow-(--shadow-soft)" : "text-(--color-ink-soft)"
                    )}
                  >
                    <Camera className="h-3.5 w-3.5" /> Фото
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnswerMode("text")}
                    className={cn(
                      "flex items-center gap-1 rounded-full px-3 py-1.5 transition-colors",
                      answerMode === "text" ? "bg-(--color-surface) shadow-(--shadow-soft)" : "text-(--color-ink-soft)"
                    )}
                  >
                    <Keyboard className="h-3.5 w-3.5" /> Текст
                  </button>
                </div>
              )}

              {answerMode === "photo" ? (
                <PhotoAnswer taskId={task.id} maxScore={task.maxScore} onGraded={handleAiGraded} />
              ) : (
                <TextAnswer taskId={task.id} maxScore={task.maxScore} onGraded={handleAiGraded} />
              )}
            </div>
          ) : (
            !result && (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <input
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Введи ответ"
                  className="w-full rounded-full border border-black/10 bg-(--color-paper-dim) px-5 py-3.5 text-sm outline-none focus:border-(--color-brand-blue)"
                />
                <Button type="submit" disabled={!answer.trim() || submitting}>
                  {submitting ? "Проверяю…" : "Ответить"}
                </Button>
              </form>
            )
          )}

          {graded && (
            <div className="mt-6 space-y-4">
              {result?.isCorrect === true && (
                <div className="flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
                  <CheckCircle2 className="h-5 w-5" /> Верно! Отличная работа.
                </div>
              )}
              {result?.isCorrect === false && (
                <div className="flex items-center gap-2 rounded-2xl bg-pink-50 px-4 py-3 text-sm font-bold text-pink-700">
                  <XCircle className="h-5 w-5" /> Пока не совсем. Правильный ответ: {task.correctAnswer}
                </div>
              )}
              {result?.isCorrect === null && (
                <div className="flex items-center gap-2 rounded-2xl bg-(--color-sky-2) px-4 py-3 text-sm font-bold text-(--color-brand-blue)">
                  <Sparkles className="h-5 w-5" /> Ответ сохранён — такие задания оценивает ИИ-репетитор, не автомат.
                </div>
              )}

              {/* aiGradeResult's own score+feedback is already shown inside
                  PhotoAnswer/TextAnswer above — this is just the task's
                  official explanation, complementary context either way. */}
              <div className="rounded-2xl bg-(--color-paper-dim) p-5 text-sm leading-relaxed text-(--color-ink-soft)">
                <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-(--color-ink)">
                  Объяснение
                </div>
                {task.explanation}
              </div>

              <div className="flex flex-wrap gap-3">
                {!showAi && !aiGradeResult && (
                  <Button variant="outline" onClick={() => setShowAi(true)} type="button">
                    <Sparkles className="h-4 w-4" /> Разобрать с ИИ
                  </Button>
                )}
                {nextTaskId ? (
                  <LinkButton href={`/app/practice/${nextTaskId}`} variant="primary">
                    Следующее задание <ArrowRight className="h-4 w-4" />
                  </LinkButton>
                ) : (
                  <LinkButton href={backHref} variant="primary">
                    Вернуться к теме <ArrowRight className="h-4 w-4" />
                  </LinkButton>
                )}
              </div>
            </div>
          )}
        </div>

        {!result && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-(--color-ink-soft)">
            <Clock className="h-3.5 w-3.5" /> Время решения засчитывается в статистику
          </div>
        )}
      </div>

      {showAi && result && (
        <div>
          <AiChat
            taskId={task.id}
            autoStartMessage={
              result.isCorrect === false
                ? `Я ответил "${answer}", но правильный ответ — "${task.correctAnswer}". Объясни, в чём моя ошибка.`
                : result.isCorrect === null
                  ? `Вот мой ответ на задание: "${answer}". Разбери его по критериям и дай обратную связь.`
                  : `Я решил это задание верно, но хочу разобрать его подробнее — объясни логику решения ещё раз.`
            }
          />
        </div>
      )}

      {!showAi && !aiGradeResult && (
        <div className="hidden lg:block">
          <div className="card-surface p-6 text-sm text-(--color-ink-soft)">
            После ответа здесь появится ИИ-репетитор, который разберёт задание вместе с тобой.
          </div>
        </div>
      )}

      <XpToast trigger={xpToast.trigger} xp={xpToast.xp} isCorrect={xpToast.isCorrect} />
    </div>
  );
}

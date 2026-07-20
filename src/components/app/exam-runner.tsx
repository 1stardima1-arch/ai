"use client";

import { useEffect, useState } from "react";
import { submitAttempt } from "@/lib/actions/attempts";
import { finishMockExam } from "@/lib/actions/mock-exam";
import { PhotoAnswer, type PhotoGradeResult } from "@/components/app/photo-answer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Timer, CheckCircle2, Flag } from "lucide-react";

type ExamTask = {
  id: string;
  number: number;
  type: "SHORT_ANSWER" | "CHOICE" | "MULTI_CHOICE" | "MATCHING" | "DETAILED_ANSWER" | "ESSAY";
  statement: string;
  options: string[] | null;
  maxScore: number;
  answered: boolean;
};

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ExamRunner({
  attemptId,
  title,
  remainingSec,
  tasks,
  initialPhotoResults = {},
}: {
  attemptId: string;
  title: string;
  remainingSec: number;
  tasks: ExamTask[];
  initialPhotoResults?: Record<string, PhotoGradeResult>;
}) {
  const [index, setIndex] = useState(() => {
    const firstUnanswered = tasks.findIndex((t) => !t.answered);
    return firstUnanswered === -1 ? 0 : firstUnanswered;
  });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [answeredIds, setAnsweredIds] = useState<Set<string>>(
    () => new Set(tasks.filter((t) => t.answered).map((t) => t.id))
  );
  const [photoResults, setPhotoResults] =
    useState<Record<string, PhotoGradeResult>>(initialPhotoResults);
  const [timeLeft, setTimeLeft] = useState(remainingSec);
  const [finishing, setFinishing] = useState(false);

  const task = tasks[index];
  const allAnswered = answeredIds.size >= tasks.length;

  useEffect(() => {
    if (remainingSec <= 0) {
      finishMockExam(attemptId);
      return;
    }
    const id = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          finishMockExam(attemptId);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId]);

  async function saveAnswer(taskId: string, value: string) {
    if (!value.trim()) return;
    await submitAttempt({ taskId, givenAnswer: value, mockExamAttemptId: attemptId });
    setAnsweredIds((prev) => new Set(prev).add(taskId));
  }

  async function handleFinish() {
    setFinishing(true);
    await finishMockExam(attemptId);
  }

  const low = timeLeft < 300;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-extrabold sm:text-2xl">{title}</h1>
          <p className="text-sm text-(--color-ink-soft)">
            Задание {index + 1} из {tasks.length}
          </p>
        </div>
        <div
          className={cn(
            "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold",
            low ? "bg-pink-50 text-pink-700" : "bg-(--color-paper-dim)"
          )}
        >
          <Timer className="h-4 w-4" /> {formatTime(Math.max(0, timeLeft))}
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-1.5">
        {tasks.map((t, i) => (
          <button
            key={t.id}
            onClick={() => setIndex(i)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors",
              i === index
                ? "btn-gradient"
                : answeredIds.has(t.id)
                  ? "bg-(--color-brand-green)/15 text-(--color-brand-green)"
                  : "bg-black/5 text-(--color-ink-soft)"
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <TaskCard
        key={task.id}
        task={task}
        attemptId={attemptId}
        value={answers[task.id] ?? ""}
        onChange={(v) => setAnswers((a) => ({ ...a, [task.id]: v }))}
        onSave={(v) => saveAnswer(task.id, v)}
        answered={answeredIds.has(task.id)}
        photoResult={photoResults[task.id]}
        onPhotoGraded={(result) => {
          setPhotoResults((p) => ({ ...p, [task.id]: result }));
          setAnsweredIds((prev) => new Set(prev).add(task.id));
        }}
      />

      <div className="mt-5 flex items-center justify-between">
        <Button
          variant="outline"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          Назад
        </Button>

        {index < tasks.length - 1 ? (
          <Button onClick={() => setIndex((i) => Math.min(tasks.length - 1, i + 1))}>
            Следующее
          </Button>
        ) : (
          <Button onClick={handleFinish} disabled={finishing}>
            <Flag className="h-4 w-4" /> Завершить экзамен
          </Button>
        )}
      </div>

      {allAnswered && index === tasks.length - 1 && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
          <CheckCircle2 className="h-4 w-4" /> Все задания отвечены — можно завершать экзамен.
        </div>
      )}
    </div>
  );
}

function TaskCard({
  task,
  attemptId,
  value,
  onChange,
  onSave,
  answered,
  photoResult,
  onPhotoGraded,
}: {
  task: ExamTask;
  attemptId: string;
  value: string;
  onChange: (v: string) => void;
  onSave: (v: string) => void;
  answered: boolean;
  photoResult?: PhotoGradeResult;
  onPhotoGraded: (result: PhotoGradeResult) => void;
}) {
  const isFreeform = task.type === "DETAILED_ANSWER" || task.type === "ESSAY";
  const [mode, setMode] = useState<"photo" | "text">("photo");

  return (
    <div className="card-surface p-6 sm:p-8">
      <p className="whitespace-pre-wrap text-[1.05rem] leading-relaxed">{task.statement}</p>

      <div className="mt-6 space-y-4">
        {task.options ? (
          <div className="space-y-2">
            {task.options.map((opt) => (
              <label
                key={opt}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors",
                  value === opt
                    ? "border-(--color-brand-blue) bg-(--color-sky-2)"
                    : "border-black/10 hover:border-black/20"
                )}
              >
                <input
                  type="radio"
                  name={`answer-${task.id}`}
                  checked={value === opt}
                  onChange={() => {
                    onChange(opt);
                    onSave(opt);
                  }}
                  className="accent-(--color-brand-blue)"
                />
                {opt}
              </label>
            ))}
          </div>
        ) : isFreeform ? (
          <div>
            <div className="mb-3 inline-flex gap-1 rounded-full bg-(--color-paper-dim) p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setMode("photo")}
                className={cn(
                  "rounded-full px-3 py-1.5 transition-colors",
                  mode === "photo" ? "bg-(--color-surface) shadow-(--shadow-soft)" : "text-(--color-ink-soft)"
                )}
              >
                Фото
              </button>
              <button
                type="button"
                onClick={() => setMode("text")}
                className={cn(
                  "rounded-full px-3 py-1.5 transition-colors",
                  mode === "text" ? "bg-(--color-surface) shadow-(--shadow-soft)" : "text-(--color-ink-soft)"
                )}
              >
                Текст
              </button>
            </div>

            {mode === "photo" ? (
              <PhotoAnswer
                taskId={task.id}
                maxScore={task.maxScore}
                mockExamAttemptId={attemptId}
                initialResult={photoResult}
                onGraded={onPhotoGraded}
              />
            ) : (
              <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onBlur={() => onSave(value)}
                rows={8}
                placeholder="Напиши здесь свой ответ…"
                className="w-full rounded-2xl border border-black/10 bg-(--color-paper-dim) p-4 text-sm outline-none focus:border-(--color-brand-blue)"
              />
            )}
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSave(value);
            }}
            className="flex gap-2"
          >
            <input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Введи ответ"
              className="flex-1 rounded-full border border-black/10 bg-(--color-paper-dim) px-5 py-3.5 text-sm outline-none focus:border-(--color-brand-blue)"
            />
            <Button type="submit" size="md">
              Сохранить
            </Button>
          </form>
        )}

        {answered && !photoResult && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-(--color-brand-green)">
            <CheckCircle2 className="h-3.5 w-3.5" /> Ответ сохранён
          </div>
        )}
      </div>
    </div>
  );
}

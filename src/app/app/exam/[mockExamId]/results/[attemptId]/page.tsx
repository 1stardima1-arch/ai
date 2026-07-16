import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { LinkButton } from "@/components/ui/button";
import { CheckCircle2, XCircle, RotateCcw, LayoutDashboard, Sparkles } from "lucide-react";
import { isAutoGraded } from "@/lib/grading";

export default async function ExamResultsPage({
  params,
}: {
  params: Promise<{ mockExamId: string; attemptId: string }>;
}) {
  const { mockExamId, attemptId } = await params;
  const session = await auth();

  const attempt = await prisma.mockExamAttempt.findUnique({
    where: { id: attemptId },
    include: {
      mockExam: { include: { subject: true } },
      attempts: { include: { task: { include: { topic: true } } } },
    },
  });
  if (!attempt || attempt.userId !== session!.user.id) notFound();

  const percent = attempt.maxPrimaryScore > 0
    ? Math.round((attempt.primaryScore / attempt.maxPrimaryScore) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="card-surface p-8 text-center">
        <div className="font-display text-6xl font-extrabold">
          <span className="gradient-text">{attempt.primaryScore}</span>
          <span className="text-2xl text-(--color-ink-soft)">/{attempt.maxPrimaryScore}</span>
        </div>
        <p className="mt-2 text-(--color-ink-soft)">{attempt.mockExam.title} · {percent}% правильных</p>

        <div className="mt-8 flex justify-center gap-3">
          <LinkButton href={`/app/exam/${mockExamId}`} variant="outline">
            <RotateCcw className="h-4 w-4" /> Пройти ещё раз
          </LinkButton>
          <LinkButton href="/app" variant="primary">
            <LayoutDashboard className="h-4 w-4" /> На дашборд
          </LinkButton>
        </div>
      </div>

      <div className="mt-6 space-y-2.5">
        {attempt.attempts.map((a) => (
          <div key={a.id} className="card-surface flex items-center gap-3 p-4">
            {!isAutoGraded(a.task.type) ? (
              <Sparkles className="h-5 w-5 shrink-0 text-(--color-brand-blue)" />
            ) : a.isCorrect ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-(--color-brand-green)" />
            ) : (
              <XCircle className="h-5 w-5 shrink-0 text-(--color-brand-pink)" />
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{a.task.topic.name}</div>
              <div className="text-xs text-(--color-ink-soft)">
                Задание {a.task.number}
                {!isAutoGraded(a.task.type) && " · разбери с ИИ-репетитором"}
              </div>
            </div>
            <span className="shrink-0 text-sm font-bold text-(--color-ink-soft)">
              {isAutoGraded(a.task.type) ? `${a.scoreAwarded}/${a.task.maxScore}` : "на проверке"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

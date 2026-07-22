import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AiChat } from "@/components/app/ai-chat";
import { TaskDiagram } from "@/components/app/task-diagram";
import type { TaskDiagram as TaskDiagramSpec } from "@/lib/task-diagram-types";
import { LinkButton } from "@/components/ui/button";
import { XCircle, CheckCircle2, RotateCcw } from "lucide-react";

export default async function MistakeDetailPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const session = await auth();

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: { task: { include: { subject: true, topic: true } } },
  });
  if (!attempt || attempt.userId !== session!.user.id) notFound();

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div>
        <div className="mb-5 text-sm font-semibold text-(--color-ink-soft)">
          <Link href={`/app/subjects/${attempt.task.subject.slug}`} className="hover:text-(--color-ink)">
            {attempt.task.subject.name}
          </Link>{" "}
          / {attempt.task.topic.name}
        </div>

        <div className="card-surface p-6 sm:p-8">
          {attempt.task.diagram && <TaskDiagram spec={attempt.task.diagram as TaskDiagramSpec} />}
          <p className="whitespace-pre-wrap text-[1.05rem] leading-relaxed">{attempt.task.statement}</p>

          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-2 rounded-2xl bg-pink-50 px-4 py-3 text-sm font-bold text-pink-700">
              <XCircle className="h-5 w-5" /> Твой ответ: {attempt.givenAnswer}
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
              <CheckCircle2 className="h-5 w-5" /> Правильный ответ: {attempt.task.correctAnswer}
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-(--color-paper-dim) p-5 text-sm leading-relaxed text-(--color-ink-soft)">
            <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-(--color-ink)">
              Официальное объяснение
            </div>
            {attempt.task.explanation}
          </div>

          <LinkButton href={`/app/practice/${attempt.taskId}`} variant="outline" className="mt-6">
            <RotateCcw className="h-4 w-4" /> Попробовать снова
          </LinkButton>
        </div>
      </div>

      <AiChat
        taskId={attempt.taskId}
        autoStartMessage={`Я ответил "${attempt.givenAnswer}", но правильный ответ — "${attempt.task.correctAnswer}". Объясни по-дружески, в чём именно моя ошибка и как рассуждать правильно в следующий раз.`}
      />
    </div>
  );
}

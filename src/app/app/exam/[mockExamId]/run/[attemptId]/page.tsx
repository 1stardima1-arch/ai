import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ExamRunner } from "@/components/app/exam-runner";

export default async function ExamRunPage({
  params,
}: {
  params: Promise<{ mockExamId: string; attemptId: string }>;
}) {
  const { mockExamId, attemptId } = await params;
  const session = await auth();

  const attempt = await prisma.mockExamAttempt.findUnique({
    where: { id: attemptId },
    include: {
      mockExam: {
        include: { tasks: { orderBy: { order: "asc" }, include: { task: true } } },
      },
      attempts: true,
    },
  });
  if (!attempt || attempt.mockExamId !== mockExamId) notFound();
  if (attempt.userId !== session!.user.id) notFound();
  if (attempt.status === "completed") redirect(`/app/exam/${mockExamId}/results/${attemptId}`);

  // Server-rendered once per request from the real wall clock — deliberately
  // impure (there's no pure way to compute "time remaining until a deadline").
  // eslint-disable-next-line react-hooks/purity
  const elapsedSec = Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000);
  const remainingSec = Math.max(0, attempt.mockExam.durationMin * 60 - elapsedSec);

  const answeredTaskIds = new Set(attempt.attempts.map((a) => a.taskId));

  return (
    <ExamRunner
      attemptId={attemptId}
      title={attempt.mockExam.title}
      remainingSec={remainingSec}
      tasks={attempt.mockExam.tasks.map((mt) => ({
        id: mt.task.id,
        number: mt.task.number,
        type: mt.task.type,
        statement: mt.task.statement,
        options: mt.task.options as string[] | null,
        answered: answeredTaskIds.has(mt.task.id),
      }))}
    />
  );
}

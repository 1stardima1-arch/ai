"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function startMockExam(mockExamId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Не авторизован");
  const userId = session.user.id;

  const existing = await prisma.mockExamAttempt.findFirst({
    where: { userId, mockExamId, status: "in_progress" },
  });
  if (existing) redirect(`/app/exam/${mockExamId}/run/${existing.id}`);

  const mockExam = await prisma.mockExam.findUniqueOrThrow({
    where: { id: mockExamId },
    include: { tasks: true },
  });

  const maxPrimaryScore = await prisma.task.aggregate({
    where: { id: { in: mockExam.tasks.map((t) => t.taskId) } },
    _sum: { maxScore: true },
  });

  const attempt = await prisma.mockExamAttempt.create({
    data: {
      userId,
      mockExamId,
      maxPrimaryScore: maxPrimaryScore._sum.maxScore ?? mockExam.tasks.length,
      status: "in_progress",
    },
  });

  redirect(`/app/exam/${mockExamId}/run/${attempt.id}`);
}

export async function finishMockExam(mockExamAttemptId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Не авторизован");
  const userId = session.user.id;

  const attempt = await prisma.mockExamAttempt.findUniqueOrThrow({
    where: { id: mockExamAttemptId },
    include: { attempts: true },
  });
  if (attempt.userId !== userId) throw new Error("Доступ запрещён");

  const primaryScore = attempt.attempts.reduce((sum, a) => sum + a.scoreAwarded, 0);

  await prisma.mockExamAttempt.update({
    where: { id: mockExamAttemptId },
    data: { finishedAt: new Date(), primaryScore, status: "completed" },
  });

  const already = await prisma.userAchievement.findFirst({
    where: { userId, achievement: { slug: "mock-exam-done" } },
  });
  if (!already) {
    const achievement = await prisma.achievement.findUnique({ where: { slug: "mock-exam-done" } });
    if (achievement) {
      await prisma.userAchievement.create({ data: { userId, achievementId: achievement.id } });
      await prisma.user.update({ where: { id: userId }, data: { xp: { increment: achievement.xpReward } } });
    }
  }

  revalidatePath("/app");
  revalidatePath("/app/analytics");

  redirect(`/app/exam/${attempt.mockExamId}/results/${mockExamAttemptId}`);
}

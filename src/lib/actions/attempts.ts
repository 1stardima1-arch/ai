"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gradeAnswer, isAutoGraded } from "@/lib/grading";
import { computeStreak, xpForAttempt } from "@/lib/gamification";

export async function submitAttempt({
  taskId,
  givenAnswer,
  timeSpentSec = 0,
  mockExamAttemptId,
}: {
  taskId: string;
  givenAnswer: string;
  timeSpentSec?: number;
  mockExamAttemptId?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Не авторизован");
  const userId = session.user.id;

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("Задание не найдено");

  const isCorrect = gradeAnswer(task, givenAnswer);
  // Essays/detailed answers aren't auto-graded — never auto-award their points,
  // even though isCorrect is true (so they don't count as a "mistake" either).
  const scoreAwarded = isAutoGraded(task.type) && isCorrect ? task.maxScore : 0;

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const now = new Date();
  const newStreak = computeStreak(user.lastPracticeDate, user.streak, now);
  const xpGain = xpForAttempt({ isCorrect, difficulty: task.difficulty });

  const [attempt] = await prisma.$transaction([
    prisma.attempt.create({
      data: {
        userId,
        taskId,
        givenAnswer,
        isCorrect,
        scoreAwarded,
        timeSpentSec,
        mockExamAttemptId,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        xp: { increment: xpGain },
        streak: newStreak,
        longestStreak: Math.max(user.longestStreak, newStreak),
        lastPracticeDate: now,
      },
    }),
  ]);

  const unlocked = await checkAchievements(userId, task.topicId);

  revalidatePath("/app");
  revalidatePath("/app/subjects");
  revalidatePath(`/app/subjects/${task.subjectId}`);
  revalidatePath("/app/analytics");
  revalidatePath("/app/mistakes");

  return {
    attemptId: attempt.id,
    isCorrect: isAutoGraded(task.type) ? isCorrect : null,
    xpGain,
    unlocked,
  };
}

async function checkAchievements(userId: string, topicId: string) {
  const unlockedSlugs: string[] = [];

  const already = await prisma.userAchievement.findMany({
    where: { userId },
    select: { achievement: { select: { slug: true } } },
  });
  const have = new Set(already.map((a) => a.achievement.slug));

  const totalAttempts = await prisma.attempt.count({ where: { userId } });
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const candidates: { slug: string; unlocked: boolean }[] = [
    { slug: "first-step", unlocked: totalAttempts >= 1 },
    { slug: "fifty-attempts", unlocked: totalAttempts >= 50 },
    { slug: "week-streak", unlocked: user.streak >= 7 },
  ];

  const topicTasks = await prisma.task.findMany({ where: { topicId }, select: { id: true } });
  if (topicTasks.length > 0) {
    const wrongInTopic = await prisma.attempt.count({
      where: { userId, isCorrect: false, task: { topicId } },
    });
    const correctTaskIds = await prisma.attempt.findMany({
      where: { userId, isCorrect: true, task: { topicId } },
      select: { taskId: true },
      distinct: ["taskId"],
    });
    const topicMastered = wrongInTopic === 0 && correctTaskIds.length === topicTasks.length;
    candidates.push({ slug: "topic-master", unlocked: topicMastered });
  }

  for (const c of candidates) {
    if (c.unlocked && !have.has(c.slug)) {
      const achievement = await prisma.achievement.findUnique({ where: { slug: c.slug } });
      if (!achievement) continue;
      await prisma.userAchievement.create({
        data: { userId, achievementId: achievement.id },
      });
      await prisma.user.update({
        where: { id: userId },
        data: { xp: { increment: achievement.xpReward } },
      });
      unlockedSlugs.push(c.slug);
    }
  }

  return unlockedSlugs;
}

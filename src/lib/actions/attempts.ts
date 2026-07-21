"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Task } from "@prisma/client";
import { gradeAnswer, isAutoGraded } from "@/lib/grading";
import { computeStreak, xpForAttempt } from "@/lib/gamification";
import { gradeAnswerPhoto, gradeAnswerText } from "@/lib/ai";

// Shared by submitAttempt and submitAttemptPhoto: writes the Attempt row,
// updates streak/XP, and checks achievements — the only thing that differs
// between a text answer and a photo-graded one is how isCorrect/scoreAwarded
// were arrived at.
async function finalizeAttempt({
  userId,
  task,
  givenAnswer,
  isCorrect,
  scoreAwarded,
  aiFeedback,
  timeSpentSec,
  mockExamAttemptId,
}: {
  userId: string;
  task: Task;
  givenAnswer: string;
  isCorrect: boolean;
  scoreAwarded: number;
  aiFeedback?: string;
  timeSpentSec: number;
  mockExamAttemptId?: string;
}) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const now = new Date();
  const newStreak = computeStreak(user.lastPracticeDate, user.streak, now);
  const xpGain = xpForAttempt({ isCorrect, difficulty: task.difficulty });

  const [attempt] = await prisma.$transaction([
    prisma.attempt.create({
      data: {
        userId,
        taskId: task.id,
        givenAnswer,
        isCorrect,
        scoreAwarded,
        aiFeedback,
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

  return { attemptId: attempt.id, xpGain, unlocked };
}

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
  // Photo-based AI grading (submitAttemptPhoto) is the path that actually
  // scores them; this plain-text path stays for students who'd rather type.
  const scoreAwarded = isAutoGraded(task.type) && isCorrect ? task.maxScore : 0;

  const { attemptId, xpGain, unlocked } = await finalizeAttempt({
    userId,
    task,
    givenAnswer,
    isCorrect,
    scoreAwarded,
    timeSpentSec,
    mockExamAttemptId,
  });

  return {
    attemptId,
    isCorrect: isAutoGraded(task.type) ? isCorrect : null,
    xpGain,
    unlocked,
  };
}

// Grades a DETAILED_ANSWER/ESSAY task from a photo of the handwritten
// answer via a vision-capable AI call — the image is only ever held in
// memory for this one request (sent as a base64 data URL to the model) and
// never written to disk or the database, only the resulting score/feedback.
export async function submitAttemptPhoto({
  taskId,
  imageBase64,
  mimeType,
  timeSpentSec = 0,
  mockExamAttemptId,
}: {
  taskId: string;
  imageBase64: string;
  mimeType: string;
  timeSpentSec?: number;
  mockExamAttemptId?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Не авторизован");
  const userId = session.user.id;

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("Задание не найдено");
  if (isAutoGraded(task.type)) {
    throw new Error("Это задание проверяется автоматически — фото не нужно");
  }

  const { score, feedback } = await gradeAnswerPhoto({
    taskStatement: task.statement,
    referenceAnswer: task.correctAnswer,
    explanation: task.explanation,
    maxScore: task.maxScore,
    imageBase64,
    mimeType,
  });

  // A partial score still counts as "correct" for streak/mistakes purposes
  // once it clears a majority-credit bar — matches how a human checker would
  // read "got the gist, lost a few points" versus "missed the task".
  const isCorrect = task.maxScore > 0 ? score >= task.maxScore * 0.6 : score > 0;

  const { attemptId, xpGain, unlocked } = await finalizeAttempt({
    userId,
    task,
    givenAnswer: "[фото ответа]",
    isCorrect,
    scoreAwarded: score,
    aiFeedback: feedback,
    timeSpentSec,
    mockExamAttemptId,
  });

  return {
    attemptId,
    score,
    maxScore: task.maxScore,
    feedback,
    xpGain,
    unlocked,
  };
}

// Same as submitAttemptPhoto but for a typed answer — a student who'd
// rather write than photograph gets the same real score + written
// feedback instead of the old "saved, on review" placeholder.
export async function submitAttemptText({
  taskId,
  answerText,
  timeSpentSec = 0,
  mockExamAttemptId,
}: {
  taskId: string;
  answerText: string;
  timeSpentSec?: number;
  mockExamAttemptId?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Не авторизован");
  const userId = session.user.id;

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("Задание не найдено");
  if (isAutoGraded(task.type)) {
    throw new Error("Это задание проверяется автоматически");
  }
  if (!answerText.trim()) throw new Error("Ответ пустой");

  const { score, feedback } = await gradeAnswerText({
    taskStatement: task.statement,
    referenceAnswer: task.correctAnswer,
    explanation: task.explanation,
    maxScore: task.maxScore,
    answerText,
  });

  const isCorrect = task.maxScore > 0 ? score >= task.maxScore * 0.6 : score > 0;

  const { attemptId, xpGain, unlocked } = await finalizeAttempt({
    userId,
    task,
    givenAnswer: answerText,
    isCorrect,
    scoreAwarded: score,
    aiFeedback: feedback,
    timeSpentSec,
    mockExamAttemptId,
  });

  return {
    attemptId,
    score,
    maxScore: task.maxScore,
    feedback,
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

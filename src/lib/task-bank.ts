import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { generatePracticeTasks, isAiEnabled } from "@/lib/ai";
import { levelFromXp, difficultyBand } from "@/lib/gamification";
import { estimateExamDurationMin } from "@/lib/exam-format";

const AUTO_GRADED = ["SHORT_ANSWER", "CHOICE", "MULTI_CHOICE"] as const;
const FREEFORM = ["ESSAY", "DETAILED_ANSWER"] as const;

export async function difficultyForUser(userId: string): Promise<[number, number]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { xp: true, prepLevel: true },
  });
  return difficultyBand(user?.prepLevel ?? null, levelFromXp(user?.xp ?? 0));
}

// Keeps a mock exam's duration in step with however many tasks it actually
// has right now — called after any change to its task list.
async function recomputeExamDuration(mockExamId: string) {
  const rows = await prisma.mockExamTask.findMany({
    where: { mockExamId },
    select: { task: { select: { type: true } } },
  });
  const freeformCount = rows.filter((r) => (FREEFORM as readonly string[]).includes(r.task.type)).length;
  const autoGradedCount = rows.length - freeformCount;
  await prisma.mockExam.update({
    where: { id: mockExamId },
    data: { durationMin: estimateExamDurationMin(autoGradedCount, freeformCount) },
  });
}

// Links auto-graded tasks into a subject's mock exam that aren't already
// there, up to `limit` additions, and keeps the exam's duration in sync.
async function addTasksToExam(mockExamId: string, taskIds: string[], limit: number) {
  let order = await prisma.mockExamTask.count({ where: { mockExamId } });
  let added = 0;
  for (const taskId of taskIds) {
    if (added >= limit) break;
    const exists = await prisma.mockExamTask.findFirst({ where: { mockExamId, taskId } });
    if (exists) continue;
    await prisma.mockExamTask.create({ data: { mockExamId, taskId, order: order++ } });
    added++;
  }
  if (added > 0) await recomputeExamDuration(mockExamId);
  return added;
}

// Grows a topic's task pool on demand and persists the result, so the cost
// of generating is paid once per depletion event rather than on every
// visit. Deliberately never throws — a dashboard render or a "practice
// more" click shouldn't break because the AI call failed; callers just get
// an empty array back and fall back to whatever already exists.
export async function topUpTopic(topicId: string, difficulty: number, count = 4) {
  if (!isAiEnabled()) return [];

  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: { subject: true, tasks: { orderBy: { createdAt: "asc" } } },
  });
  if (!topic) return [];

  const existingAutoGraded = topic.tasks.filter((t) =>
    (AUTO_GRADED as readonly string[]).includes(t.type)
  );
  // Every topic ships with at least one seed task — reuse its FIPI task
  // number for generated ones, since number is tied to exam-position/skill,
  // not to a specific instance of the task.
  const referenceTask = existingAutoGraded[0] ?? topic.tasks[0];
  if (!referenceTask) return [];

  let generated;
  try {
    generated = await generatePracticeTasks({
      subjectName: topic.subject.name,
      examType: topic.subject.examType,
      topicName: topic.name,
      topicSummary: topic.summary,
      difficulty,
      count,
      exampleTasks: existingAutoGraded.slice(0, 3),
    });
  } catch {
    return [];
  }
  if (generated.length === 0) return [];

  const created = await prisma.$transaction(
    generated.map((t) =>
      prisma.task.create({
        data: {
          subjectId: topic.subjectId,
          topicId: topic.id,
          // "ai-<uuid>" so re-seeding (which only ever touches slugs t1..tN
          // and backfills null slugs) never collides with or reclaims these.
          slug: `ai-${randomUUID()}`,
          number: referenceTask.number,
          type: t.type,
          statement: t.statement,
          options: t.options ?? undefined,
          correctAnswer: t.correctAnswer,
          explanation: t.explanation,
          difficulty: t.difficulty,
          maxScore: 1,
          source: "Сгенерировано ИИ по аналогии с ФИПИ",
        },
      })
    )
  );

  // Keep the subject's mock exam realistic: give this topic an entry there
  // if it didn't already have an auto-graded one.
  if (existingAutoGraded.length === 0 && created.length > 0) {
    const mockExam = await prisma.mockExam.findFirst({ where: { subjectId: topic.subjectId } });
    if (mockExam) {
      await addTasksToExam(mockExam.id, [created[0].id], 1);
    }
  }

  return created;
}

// Gives a topic extra weight in its subject's mock exam — used to make
// today's daily-rotation topic more represented in the exam, so a student
// who just studied it fresh can stress-test it under exam conditions, not
// just as an isolated topic page. Never throws; a no-op if AI is
// unavailable or the topic/exam can't be found.
export async function emphasizeTopicInExam(topicId: string, targetCount: number, difficulty: number) {
  const topic = await prisma.topic.findUnique({ where: { id: topicId }, select: { subjectId: true } });
  if (!topic) return;

  const mockExam = await prisma.mockExam.findFirst({ where: { subjectId: topic.subjectId } });
  if (!mockExam) return;

  const currentCount = await prisma.mockExamTask.count({
    where: { mockExamId: mockExam.id, task: { topicId } },
  });
  if (currentCount >= targetCount) return;

  const needed = targetCount - currentCount;
  const autoGradedInTopic = await prisma.task.findMany({
    where: { topicId, type: { in: [...AUTO_GRADED] } },
    select: { id: true },
  });
  const alreadyInExam = await prisma.mockExamTask.findMany({
    where: { mockExamId: mockExam.id, task: { topicId } },
    select: { taskId: true },
  });
  const alreadyInExamIds = new Set(alreadyInExam.map((t) => t.taskId));
  const candidates = autoGradedInTopic.filter((t) => !alreadyInExamIds.has(t.id));

  let addedFromExisting = 0;
  if (candidates.length > 0) {
    addedFromExisting = await addTasksToExam(
      mockExam.id,
      candidates.map((t) => t.id),
      needed
    );
  }

  const stillNeeded = needed - addedFromExisting;
  if (stillNeeded > 0) {
    const created = await topUpTopic(topicId, difficulty, stillNeeded);
    const autoGradedNew = created.filter((t) => (AUTO_GRADED as readonly string[]).includes(t.type));
    if (autoGradedNew.length > 0) {
      await addTasksToExam(
        mockExam.id,
        autoGradedNew.map((t) => t.id),
        stillNeeded
      );
    }
  }
}

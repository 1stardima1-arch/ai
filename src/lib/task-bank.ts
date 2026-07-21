import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { generatePracticeTasks, isAiEnabled } from "@/lib/ai";
import { levelFromXp, difficultyBand } from "@/lib/gamification";

const AUTO_GRADED = ["SHORT_ANSWER", "CHOICE", "MULTI_CHOICE"] as const;

export async function difficultyForUser(userId: string): Promise<[number, number]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { xp: true, prepLevel: true },
  });
  return difficultyBand(user?.prepLevel ?? null, levelFromXp(user?.xp ?? 0));
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
      const already = await prisma.mockExamTask.findFirst({
        where: { mockExamId: mockExam.id, task: { topicId: topic.id } },
      });
      if (!already) {
        const order = await prisma.mockExamTask.count({ where: { mockExamId: mockExam.id } });
        await prisma.mockExamTask.create({ data: { mockExamId: mockExam.id, taskId: created[0].id, order } });
      }
    }
  }

  return created;
}

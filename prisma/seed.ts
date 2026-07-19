import { PrismaClient } from "@prisma/client";
import { subjects as coreSubjects, achievements } from "./seed-data";
import { extraSubjects } from "./seed-data-extra";

const prisma = new PrismaClient();
const subjects = [...coreSubjects, ...extraSubjects];

async function main() {
  console.log("Seeding subjects, topics and tasks...");

  for (const [subjectOrder, subject] of subjects.entries()) {
    const dbSubject = await prisma.subject.upsert({
      where: { slug: subject.slug },
      update: {
        name: subject.name,
        examType: subject.examType,
        description: subject.description,
        icon: subject.icon,
        color: subject.color,
        order: subjectOrder,
      },
      create: {
        slug: subject.slug,
        name: subject.name,
        examType: subject.examType,
        description: subject.description,
        icon: subject.icon,
        color: subject.color,
        order: subjectOrder,
      },
    });

    const mockExamTaskIds: string[] = [];

    for (const [topicOrder, topic] of subject.topics.entries()) {
      const dbTopic = await prisma.topic.upsert({
        where: { subjectId_slug: { subjectId: dbSubject.id, slug: topic.slug } },
        update: {
          name: topic.name,
          summary: topic.summary,
          theory: topic.theory,
          order: topicOrder,
        },
        create: {
          subjectId: dbSubject.id,
          slug: topic.slug,
          name: topic.name,
          summary: topic.summary,
          theory: topic.theory,
          order: topicOrder,
        },
      });

      // Backfill slugs for tasks created before this field existed, in their
      // original creation order — matches how they were originally seeded,
      // so the upsert below updates them in place instead of duplicating.
      const unslugged = await prisma.task.findMany({
        where: { topicId: dbTopic.id, slug: null },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
      for (const [i, t] of unslugged.entries()) {
        await prisma.task.update({ where: { id: t.id }, data: { slug: `t${i + 1}` } });
      }

      // Upsert each task by its stable position in the seed array (slug =
      // "t1", "t2", ...) instead of delete+recreate: this runs automatically
      // on every deploy (see package.json's build script), and deleting
      // tasks would cascade-delete every user's Attempt history for them.
      const createdTasks = [];
      for (const [taskIndex, task] of topic.tasks.entries()) {
        const slug = `t${taskIndex + 1}`;
        const data = {
          subjectId: dbSubject.id,
          topicId: dbTopic.id,
          number: task.number,
          type: task.type,
          statement: task.statement,
          options: task.options ?? undefined,
          correctAnswer: task.correctAnswer,
          explanation: task.explanation,
          difficulty: task.difficulty,
          maxScore: task.maxScore ?? 1,
        };
        const created = await prisma.task.upsert({
          where: { topicId_slug: { topicId: dbTopic.id, slug } },
          update: data,
          create: { ...data, slug },
        });
        createdTasks.push(created);
      }
      // Tasks removed from the seed data (index beyond what's left) become
      // orphaned rather than deleted, for the same Attempt-safety reason.

      const firstAutoGraded = createdTasks.find(
        (t) => t.type !== "ESSAY" && t.type !== "DETAILED_ANSWER"
      );
      if (firstAutoGraded) {
        mockExamTaskIds.push(firstAutoGraded.id);
      }
    }

    // Build a compact mock exam from one auto-graded task per topic (essays/detailed
    // answers need the AI tutor, not an instant score, so they're practiced separately).
    const existingMock = await prisma.mockExam.findFirst({ where: { subjectId: dbSubject.id } });
    const mockExam = existingMock
      ? existingMock
      : await prisma.mockExam.create({
          data: {
            subjectId: dbSubject.id,
            title: `Мини-вариант — ${subject.name}`,
            durationMin: Math.max(20, mockExamTaskIds.length * 6),
          },
        });

    await prisma.mockExamTask.deleteMany({ where: { mockExamId: mockExam.id } });
    for (const [i, taskId] of mockExamTaskIds.entries()) {
      await prisma.mockExamTask.create({
        data: { mockExamId: mockExam.id, taskId, order: i },
      });
    }

    console.log(`  ✓ ${subject.name}: ${subject.topics.length} тем, ${subject.topics.reduce((n, t) => n + t.tasks.length, 0)} заданий`);
  }

  console.log("Seeding achievements...");
  for (const a of achievements) {
    await prisma.achievement.upsert({
      where: { slug: a.slug },
      update: a,
      create: a,
    });
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

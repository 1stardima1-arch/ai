import { PrismaClient } from "@prisma/client";
import { subjects, achievements } from "./seed-data";

const prisma = new PrismaClient();

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

      // Re-seeding replaces this topic's tasks (dev-friendly, idempotent).
      await prisma.task.deleteMany({ where: { topicId: dbTopic.id } });

      const createdTasks = [];
      for (const task of topic.tasks) {
        const created = await prisma.task.create({
          data: {
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
          },
        });
        createdTasks.push(created);
      }

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

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
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
    let freeformCount = 0;

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
          diagram: task.diagram ?? undefined,
          hints: task.hints ?? undefined,
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
      const firstManualGraded = createdTasks.find(
        (t) => t.type === "ESSAY" || t.type === "DETAILED_ANSWER"
      );
      if (firstAutoGraded) {
        mockExamTaskIds.push(firstAutoGraded.id);
      }
      if (firstManualGraded) {
        mockExamTaskIds.push(firstManualGraded.id);
        freeformCount++;
      }
    }

    // Build a compact mock exam from one task per topic (plus its
    // essay/detailed-answer task where the topic has one) — matches the real
    // ФИПИ exam shape of an auto-graded "часть 1" and a written "часть 2"
    // that a photo/text-graded AI check resolves inside the exam itself.
    //
    // Duration is a proportional approximation (auto-graded items get a few
    // quick minutes each, the written part gets the bulk of the time) —
    // NOT sourced from an official ФИПИ time allocation, which this app
    // has no way to verify from here and which is revised periodically
    // anyway; see estimateExamDurationMin in src/lib/exam-format.ts (same
    // formula, duplicated here since this script runs outside the Next app).
    const autoGradedCount = mockExamTaskIds.length - freeformCount;
    const durationMin = Math.max(20, autoGradedCount * 3 + freeformCount * 40);

    // Only set durationMin when the exam is first created — once it exists,
    // leave it alone on every later reseed. The exam bank can grow after
    // seeding (AI top-up for thin/today's topics — see task-bank.ts), and
    // this script has no visibility into how many tasks got added that
    // way, so recomputing here on every deploy would silently shrink an
    // already-grown exam's duration back down to the static seed count.
    const existingMock = await prisma.mockExam.findFirst({ where: { subjectId: dbSubject.id } });
    const mockExam =
      existingMock ??
      (await prisma.mockExam.create({
        data: {
          subjectId: dbSubject.id,
          title: `Мини-вариант — ${subject.name}`,
          durationMin,
        },
      }));

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

  // Runs on every deploy alongside everything else above, so setting
  // ADMIN_USERNAME + ADMIN_PASSWORD in Vercel is enough to get admin
  // access — no separate script to run by hand. Safe to leave both set
  // permanently (re-running just keeps the password in sync); ADMIN_PASSWORD
  // can also be removed from the environment after the first deploy that
  // picks it up, since the hash is already stored by then.
  if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
    const username = process.env.ADMIN_USERNAME.trim();
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    await prisma.user.upsert({
      where: { username },
      update: { passwordHash },
      create: { username, name: username, passwordHash },
    });
    console.log(`  ✓ Админ-аккаунт «${username}» готов.`);
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

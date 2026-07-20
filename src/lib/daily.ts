import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// "Задания дня": a small set that deterministically rotates every day, so
// students see fresh tasks daily without any cron — the pick is a pure
// function of (date, task bank). Everyone gets the same daily set, which
// keeps the leaderboard fair.

// Day key in Moscow time (UTC+3, no DST) — the audience is RU students.
export function moscowDayKey(now = new Date()): number {
  const msk = new Date(now.getTime() + 3 * 3600_000);
  return msk.getUTCFullYear() * 10_000 + (msk.getUTCMonth() + 1) * 100 + msk.getUTCDate();
}

// mulberry32 — tiny deterministic PRNG, good enough for shuffling.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Difficulty band (1–5 scale) matching the student's self-assessed level.
function difficultyRange(prepLevel: string | null): [number, number] {
  switch (prepLevel) {
    case "BEGINNER":
      return [1, 2];
    case "ADVANCED":
      return [3, 5];
    default:
      return [2, 4];
  }
}

export async function getDailyTasks(userId: string, count = 8) {
  const dayKey = moscowDayKey();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { prepLevel: true, enrollments: { select: { subjectId: true } } },
  });
  const enrolledIds = user?.enrollments.map((e) => e.subjectId) ?? [];
  const [minD, maxD] = difficultyRange(user?.prepLevel ?? null);

  // Auto-graded tasks only: the daily set should be quickly solvable solo.
  // Personalised: the student's chosen subjects and a difficulty band for
  // their level — with graceful fallback if those filters empty the pool.
  const baseWhere: Prisma.TaskWhereInput = {
    type: { in: ["SHORT_ANSWER", "CHOICE", "MULTI_CHOICE", "MATCHING"] },
  };
  const select = {
    id: true,
    number: true,
    difficulty: true,
    subject: { select: { id: true, name: true, slug: true, color: true, icon: true } },
    topic: { select: { id: true, name: true, slug: true, summary: true } },
  } as const;
  const orderBy = { id: "asc" as const }; // stable base order → deterministic shuffle

  let tasks = await prisma.task.findMany({
    where: {
      ...baseWhere,
      difficulty: { gte: minD, lte: maxD },
      ...(enrolledIds.length > 0 ? { subjectId: { in: enrolledIds } } : {}),
    },
    select,
    orderBy,
  });
  if (tasks.length < count && enrolledIds.length > 0) {
    // not enough at this difficulty in the chosen subjects — drop the difficulty filter
    tasks = await prisma.task.findMany({
      where: { ...baseWhere, subjectId: { in: enrolledIds } },
      select,
      orderBy,
    });
  }
  if (tasks.length < count) {
    tasks = await prisma.task.findMany({ where: baseWhere, select, orderBy });
  }
  if (tasks.length === 0) return { dayKey, tasks: [], topics: [] };

  // Seeded shuffle of the whole bank, then take the first task of each
  // TOPIC in shuffle order (spreads the set across as many distinct topics
  // as possible — finer-grained than spreading across subjects, so the
  // daily set covers more genuinely different material out of a bank
  // that's still fairly thin per topic), topping up with remaining tasks if
  // there are fewer topics than `count`.
  const rand = mulberry32(dayKey * 2654435761);
  const shuffled = [...tasks];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const pickedTopics = new Set<string>();
  const picked: typeof shuffled = [];
  for (const t of shuffled) {
    if (picked.length >= count) break;
    if (!pickedTopics.has(t.topic.id)) {
      pickedTopics.add(t.topic.id);
      picked.push(t);
    }
  }
  for (const t of shuffled) {
    if (picked.length >= count) break;
    if (!picked.includes(t)) picked.push(t);
  }

  // Which of today's tasks the student already solved today (any attempt today counts).
  const startOfDayMsk = new Date();
  const msk = new Date(startOfDayMsk.getTime() + 3 * 3600_000);
  msk.setUTCHours(0, 0, 0, 0);
  const dayStart = new Date(msk.getTime() - 3 * 3600_000);

  const attempts = await prisma.attempt.findMany({
    where: {
      userId,
      taskId: { in: picked.map((t) => t.id) },
      createdAt: { gte: dayStart },
    },
    select: { taskId: true, isCorrect: true },
  });
  const attemptedIds = new Map(attempts.map((a) => [a.taskId, a.isCorrect]));

  // "Теория дня": the topics behind today's tasks, deduplicated — so the
  // theory shown on the dashboard always matches whichever tasks the daily
  // rotation picked, and rotates right along with them.
  const seenTopics = new Set<string>();
  const topics = picked
    .filter((t) => {
      if (seenTopics.has(t.topic.id)) return false;
      seenTopics.add(t.topic.id);
      return true;
    })
    .map((t) => ({
      id: t.topic.id,
      name: t.topic.name,
      summary: t.topic.summary,
      subjectSlug: t.subject.slug,
      subjectName: t.subject.name,
      subjectColor: t.subject.color,
      topicSlug: t.topic.slug,
    }));

  return {
    dayKey,
    tasks: picked.map((t) => ({
      ...t,
      attempted: attemptedIds.has(t.id),
      solvedCorrect: attemptedIds.get(t.id) === true,
    })),
    topics,
  };
}

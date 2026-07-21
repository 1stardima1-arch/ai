import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { levelFromXp, difficultyBand } from "@/lib/gamification";
import { topUpTopic } from "@/lib/task-bank";

// "Задания дня": a small set that deterministically rotates every day, so
// students see fresh tasks daily without any cron — the pick is a pure
// function of (date, task bank). Everyone gets the same daily set, which
// keeps the leaderboard fair.

const AUTO_GRADED = ["SHORT_ANSWER", "CHOICE", "MULTI_CHOICE", "MATCHING"] as const;

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

// Finds the single thinnest topic among a set of subjects and asks the
// task bank to grow it, once. Deliberately bounded to one topic per call —
// this only runs when the pool is already confirmed too thin for the day,
// so it pays a one-time AI-generation cost rather than one on every
// dashboard render once a subject's bank has grown enough.
async function topUpThinnestTopic(subjectIds: string[], difficulty: number) {
  const topics = await prisma.topic.findMany({
    where: { subjectId: { in: subjectIds } },
    select: { id: true },
  });
  if (topics.length === 0) return;

  const counts = await prisma.task.groupBy({
    by: ["topicId"],
    where: { subjectId: { in: subjectIds }, type: { in: [...AUTO_GRADED] } },
    _count: true,
  });
  const countByTopic = new Map(counts.map((c) => [c.topicId, c._count]));
  const thinnest = topics
    .map((t) => ({ id: t.id, count: countByTopic.get(t.id) ?? 0 }))
    .sort((a, b) => a.count - b.count)[0];

  await topUpTopic(thinnest.id, difficulty, 4);
}

export async function getDailyTasks(userId: string, count = 8) {
  const dayKey = moscowDayKey();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      prepLevel: true,
      xp: true,
      enrollments: { select: { subject: { select: { id: true, examType: true } } } },
    },
  });
  const enrolledIds = user?.enrollments.map((e) => e.subject.id) ?? [];
  // A student always enrolls within a single exam track (see onboarding),
  // so the first enrollment's examType is the student's track — every
  // fallback below stays inside it, so an ОГЭ student never sees ЕГЭ tasks
  // (or vice versa) just because their subject's bank ran thin.
  const examType = user?.enrollments[0]?.subject.examType ?? null;
  const [minD, maxD] = difficultyBand(user?.prepLevel ?? null, levelFromXp(user?.xp ?? 0));

  const baseWhere: Prisma.TaskWhereInput = {
    type: { in: [...AUTO_GRADED] },
  };
  const examScope: Prisma.TaskWhereInput = examType ? { subject: { examType } } : {};
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
  if (tasks.length < count && enrolledIds.length > 0) {
    // still thin — grow the bank itself instead of reaching outside the
    // student's chosen subjects/exam track.
    await topUpThinnestTopic(enrolledIds, Math.round((minD + maxD) / 2));
    tasks = await prisma.task.findMany({
      where: { ...baseWhere, subjectId: { in: enrolledIds } },
      select,
      orderBy,
    });
  }
  if (tasks.length < count) {
    // same exam track, any subject — only reached if the student hasn't
    // enrolled in enough subjects yet to fill a day on their own.
    tasks = await prisma.task.findMany({ where: { ...baseWhere, ...examScope }, select, orderBy });
  }
  if (tasks.length === 0) {
    // no exam track known at all (enrollment somehow empty) — whole bank.
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

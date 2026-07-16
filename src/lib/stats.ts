import { prisma } from "@/lib/prisma";

export async function getSubjectsWithProgress(userId: string) {
  const subjects = await prisma.subject.findMany({
    orderBy: { order: "asc" },
    include: {
      _count: { select: { tasks: true } },
    },
  });

  const attempts = await prisma.attempt.findMany({
    where: { userId },
    select: { taskId: true, isCorrect: true, task: { select: { subjectId: true } } },
  });

  return subjects.map((s) => {
    const subjectAttempts = attempts.filter((a) => a.task.subjectId === s.id);
    const solvedTaskIds = new Set(subjectAttempts.filter((a) => a.isCorrect).map((a) => a.taskId));
    return {
      ...s,
      totalTasks: s._count.tasks,
      solvedTasks: solvedTaskIds.size,
      progressPercent: s._count.tasks > 0 ? Math.round((solvedTaskIds.size / s._count.tasks) * 100) : 0,
    };
  });
}

export async function getTopicsWithProgress(userId: string, subjectId: string) {
  const topics = await prisma.topic.findMany({
    where: { subjectId },
    orderBy: { order: "asc" },
    include: { tasks: { select: { id: true } } },
  });

  const attempts = await prisma.attempt.findMany({
    where: { userId, task: { subjectId } },
    select: { taskId: true, isCorrect: true, task: { select: { topicId: true } } },
  });

  return topics.map((t) => {
    const topicAttempts = attempts.filter((a) => a.task.topicId === t.id);
    const solvedTaskIds = new Set(topicAttempts.filter((a) => a.isCorrect).map((a) => a.taskId));
    return {
      ...t,
      totalTasks: t.tasks.length,
      solvedTasks: solvedTaskIds.size,
      progressPercent: t.tasks.length > 0 ? Math.round((solvedTaskIds.size / t.tasks.length) * 100) : 0,
    };
  });
}

export async function getDashboardOverview(userId: string) {
  const [totalAttempts, correctAttempts, subjects, recentAttempts] = await Promise.all([
    prisma.attempt.count({ where: { userId } }),
    prisma.attempt.count({ where: { userId, isCorrect: true } }),
    getSubjectsWithProgress(userId),
    prisma.attempt.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { task: { include: { subject: true, topic: true } } },
    }),
  ]);

  const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

  return { totalAttempts, correctAttempts, accuracy, subjects, recentAttempts };
}

export async function getAnalytics(userId: string) {
  const attempts = await prisma.attempt.findMany({
    where: { userId },
    select: {
      isCorrect: true,
      createdAt: true,
      task: { select: { subjectId: true, topicId: true, subject: { select: { name: true } }, topic: { select: { name: true } } } },
    },
  });

  const subjects = await prisma.subject.findMany({ orderBy: { order: "asc" } });

  const accuracyBySubject = subjects
    .map((s) => {
      const subjectAttempts = attempts.filter((a) => a.task.subjectId === s.id);
      const correct = subjectAttempts.filter((a) => a.isCorrect).length;
      return {
        name: s.name.replace("ЕГЭ ", "").replace("ОГЭ ", ""),
        exam: s.examType,
        attempts: subjectAttempts.length,
        accuracy: subjectAttempts.length > 0 ? Math.round((correct / subjectAttempts.length) * 100) : 0,
      };
    })
    .filter((s) => s.attempts > 0);

  const errorsByTopic = new Map<string, number>();
  for (const a of attempts) {
    if (a.isCorrect) continue;
    const key = a.task.topic.name;
    errorsByTopic.set(key, (errorsByTopic.get(key) ?? 0) + 1);
  }
  const topErrorTopics = [...errorsByTopic.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const days: { date: string; label: string; attempts: number }[] = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, label: d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }), attempts: 0 });
  }
  const dayIndex = new Map(days.map((d, i) => [d.date, i]));
  for (const a of attempts) {
    const key = a.createdAt.toISOString().slice(0, 10);
    const idx = dayIndex.get(key);
    if (idx !== undefined) days[idx].attempts++;
  }

  const totalCorrect = attempts.filter((a) => a.isCorrect).length;
  const totalWrong = attempts.length - totalCorrect;

  return {
    accuracyBySubject,
    topErrorTopics,
    dailyActivity: days,
    accuracyBreakdown: [
      { name: "Верно", value: totalCorrect },
      { name: "Ошибка", value: totalWrong },
    ],
    totalAttempts: attempts.length,
  };
}

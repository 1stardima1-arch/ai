import { prisma } from "@/lib/prisma";

// Aggregate, app-wide statistics for the admin dashboard — unlike everything
// in stats.ts (all scoped to a single userId), these queries look across the
// whole users table. The "funnel" here models the stages a student actually
// passes through: signs up -> finishes onboarding (picks prepLevel) -> solves
// a first task -> stays active in the following week/month. Comparing the
// counts stage-to-stage is what answers "at what point do people leave".
export async function getAdminOverview() {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const [
    totalUsers,
    onboardedUsers,
    practicedUsers,
    active7d,
    active30d,
    unreadMessages,
    unreadThreadRows,
    recentSignups,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { prepLevel: { not: null } } }),
    prisma.user.count({ where: { attempts: { some: {} } } }),
    prisma.user.count({ where: { lastPracticeDate: { gte: sevenDaysAgo } } }),
    prisma.user.count({ where: { lastPracticeDate: { gte: thirtyDaysAgo } } }),
    prisma.supportMessage.count({ where: { fromAdmin: false, read: false } }),
    prisma.supportMessage.findMany({
      where: { fromAdmin: false, read: false },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: fourteenDaysAgo } },
      select: { createdAt: true },
    }),
  ]);

  const funnel = [
    { key: "signed_up", label: "Зарегистрировались", count: totalUsers },
    { key: "onboarded", label: "Прошли настройку", count: onboardedUsers },
    { key: "practiced", label: "Решили первое задание", count: practicedUsers },
    { key: "active7d", label: "Активны за 7 дней", count: active7d },
    { key: "active30d", label: "Активны за 30 дней", count: active30d },
  ].map((stage, i, arr) => ({
    ...stage,
    percentOfTotal: totalUsers > 0 ? Math.round((stage.count / totalUsers) * 100) : 0,
    droppedFromPrev: i === 0 ? 0 : arr[i - 1].count - stage.count,
  }));

  const days: { date: string; label: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, label: d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }), count: 0 });
  }
  const dayIndex = new Map(days.map((d, i) => [d.date, i]));
  for (const u of recentSignups) {
    const key = u.createdAt.toISOString().slice(0, 10);
    const idx = dayIndex.get(key);
    if (idx !== undefined) days[idx].count++;
  }

  return {
    totalUsers,
    onboardedUsers,
    practicedUsers,
    active7d,
    active30d,
    unreadMessages,
    unreadThreads: unreadThreadRows.length,
    funnel,
    signupTrend: days,
  };
}

import { auth } from "@/auth";
import { getAnalytics } from "@/lib/stats";
import {
  AccuracyBySubjectChart,
  TopErrorTopicsChart,
  ActivityChart,
  AccuracyDonut,
} from "@/components/app/analytics-charts";

export default async function AnalyticsPage() {
  const session = await auth();
  const { accuracyBySubject, topErrorTopics, dailyActivity, accuracyBreakdown, totalAttempts } =
    await getAnalytics(session!.user.id);

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Аналитика</h1>
      <p className="mt-1 text-(--color-ink-soft)">Реальные цифры по твоим попыткам — без прикрас.</p>

      {totalAttempts === 0 ? (
        <div className="card-surface mt-8 p-10 text-center text-sm text-(--color-ink-soft)">
          Как только решишь первое задание, здесь появится подробная аналитика.
        </div>
      ) : (
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <div className="card-surface p-6">
            <h2 className="font-display text-lg font-bold">Точность по предметам</h2>
            <p className="mt-1 text-sm text-(--color-ink-soft)">Доля верных ответов, %</p>
            <div className="mt-4">
              <AccuracyBySubjectChart data={accuracyBySubject} />
            </div>
          </div>

          <div className="card-surface p-6">
            <h2 className="font-display text-lg font-bold">Активность за 14 дней</h2>
            <p className="mt-1 text-sm text-(--color-ink-soft)">Количество решённых заданий по дням</p>
            <div className="mt-4">
              <ActivityChart data={dailyActivity} />
            </div>
          </div>

          <div className="card-surface p-6">
            <h2 className="font-display text-lg font-bold">Темы с наибольшим числом ошибок</h2>
            <p className="mt-1 text-sm text-(--color-ink-soft)">Куда стоит направить внимание в первую очередь</p>
            <div className="mt-4">
              <TopErrorTopicsChart data={topErrorTopics} />
            </div>
          </div>

          <div className="card-surface p-6">
            <h2 className="font-display text-lg font-bold">Верно / ошибка</h2>
            <p className="mt-1 text-sm text-(--color-ink-soft)">Соотношение по всем попыткам</p>
            <div className="mt-4">
              <AccuracyDonut data={accuracyBreakdown} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import { auth } from "@/auth";
import { getDashboardOverview } from "@/lib/stats";
import { getDailyTasks } from "@/lib/daily";
import { SubjectIcon } from "@/lib/subject-icon";
import { LinkButton } from "@/components/ui/button";
import { AnimatedBar } from "@/components/motion/animated-bar";
import { ArrowRight, Target, TrendingUp, ListChecks, CalendarDays, CheckCircle2 } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const [{ totalAttempts, accuracy, subjects, recentAttempts }, daily] = await Promise.all([
    getDashboardOverview(session!.user.id),
    getDailyTasks(session!.user.id),
  ]);

  const firstName = session!.user.name?.split(" ")[0] ?? "";
  const inProgress = subjects.filter((s) => s.solvedTasks > 0 && s.progressPercent < 100);
  const continueSubject = inProgress[0] ?? subjects[0];

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold sm:text-3xl">
        Привет{firstName ? `, ${firstName}` : ""} 👋
      </h1>
      <p className="mt-1 text-(--color-ink-soft)">Вот как идёт подготовка сегодня.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card-surface p-5">
          <div className="flex items-center gap-2 text-(--color-ink-soft)">
            <ListChecks className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wide">Решено заданий</span>
          </div>
          <div className="font-display mt-2 text-3xl font-extrabold">{totalAttempts}</div>
        </div>
        <div className="card-surface p-5">
          <div className="flex items-center gap-2 text-(--color-ink-soft)">
            <Target className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wide">Точность</span>
          </div>
          <div className="font-display mt-2 text-3xl font-extrabold">{accuracy}%</div>
        </div>
        <div className="card-surface p-5">
          <div className="flex items-center gap-2 text-(--color-ink-soft)">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wide">Предметов в работе</span>
          </div>
          <div className="font-display mt-2 text-3xl font-extrabold">
            {subjects.filter((s) => s.solvedTasks > 0).length}
          </div>
        </div>
      </div>

      {continueSubject && (
        <Link
          href={`/app/subjects/${continueSubject.slug}`}
          className="mt-6 flex items-center justify-between gap-4 rounded-[1.75rem] p-6 text-white shadow-(--shadow-glow) transition-transform hover:-translate-y-0.5"
          style={{ background: `linear-gradient(135deg, ${continueSubject.color}, #4f6bff)` }}
        >
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
              <SubjectIcon icon={continueSubject.icon} className="h-6 w-6" />
            </span>
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-white/80">
                Продолжить подготовку
              </div>
              <div className="font-display text-lg font-bold">{continueSubject.name}</div>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0" />
        </Link>
      )}

      {daily.tasks.length > 0 && (
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-(--color-ink-soft)">
              <CalendarDays className="h-4 w-4" />
              Задания дня
            </h2>
            <span className="text-xs font-semibold text-(--color-ink-soft)">
              Новый набор каждый день
            </span>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-3">
            {daily.tasks.map((t) => (
              <Link
                key={t.id}
                href={`/app/practice/${t.id}`}
                className="card-surface press-spring flex items-center gap-3 p-4"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `${t.subject.color}1a` }}
                >
                  <SubjectIcon icon={t.subject.icon} className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">
                    №{t.number} · {t.topic.name}
                  </div>
                  <div className="truncate text-xs text-(--color-ink-soft)">{t.subject.name}</div>
                </div>
                {t.attempted ? (
                  <CheckCircle2
                    className={`h-5 w-5 shrink-0 ${
                      t.solvedCorrect ? "text-(--color-brand-green)" : "text-(--color-brand-amber)"
                    }`}
                  />
                ) : (
                  <ArrowRight className="h-4 w-4 shrink-0 text-(--color-ink-soft)" />
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-(--color-ink-soft)">Предметы</h2>
            <Link href="/app/subjects" className="text-sm font-semibold text-(--color-brand-blue)">
              Все предметы
            </Link>
          </div>
          <div className="space-y-2.5">
            {subjects.map((s) => (
              <Link
                key={s.id}
                href={`/app/subjects/${s.slug}`}
                className="card-surface flex items-center gap-3 p-4"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `${s.color}1a` }}
                >
                  <SubjectIcon icon={s.icon} className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{s.name}</div>
                  <AnimatedBar percent={s.progressPercent} color={s.color} trackClassName="mt-1 h-1.5" />
                </div>
                <span className="shrink-0 text-xs font-bold text-(--color-ink-soft)">{s.progressPercent}%</span>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-(--color-ink-soft)">
              Последние попытки
            </h2>
            <Link href="/app/mistakes" className="text-sm font-semibold text-(--color-brand-blue)">
              Разбор ошибок
            </Link>
          </div>

          {recentAttempts.length === 0 ? (
            <div className="card-surface p-6 text-sm text-(--color-ink-soft)">
              Пока пусто — реши первое задание, и здесь появится история.
              <LinkButton href="/app/subjects" size="sm" className="mt-4">
                Начать тренировку <ArrowRight className="h-4 w-4" />
              </LinkButton>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentAttempts.map((a) => (
                <div key={a.id} className="card-surface flex items-center gap-3 p-4">
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                      a.isCorrect ? "bg-(--color-brand-green)" : "bg-(--color-brand-pink)"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{a.task.topic.name}</div>
                    <div className="text-xs text-(--color-ink-soft)">{a.task.subject.name}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

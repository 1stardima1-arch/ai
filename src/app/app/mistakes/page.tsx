import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ChevronRight, Target, PartyPopper } from "lucide-react";

export default async function MistakesPage() {
  const session = await auth();

  const wrongAttempts = await prisma.attempt.findMany({
    where: { userId: session!.user.id, isCorrect: false },
    orderBy: { createdAt: "desc" },
    include: { task: { include: { subject: true, topic: true } } },
    take: 100,
  });

  // Only the latest wrong attempt per task, so a since-fixed mistake doesn't linger.
  const seen = new Set<string>();
  const latestWrong = wrongAttempts.filter((a) => {
    if (seen.has(a.taskId)) return false;
    seen.add(a.taskId);
    return true;
  });

  const stillWrong = await prisma.attempt.findMany({
    where: { userId: session!.user.id, taskId: { in: latestWrong.map((a) => a.taskId) } },
    orderBy: { createdAt: "desc" },
    distinct: ["taskId"],
    select: { taskId: true, isCorrect: true },
  });
  const stillWrongIds = new Set(stillWrong.filter((a) => !a.isCorrect).map((a) => a.taskId));
  const openMistakes = latestWrong.filter((a) => stillWrongIds.has(a.taskId));

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Разбор ошибок</h1>
      <p className="mt-1 text-(--color-ink-soft)">
        Каждая ошибка — это тема, которую стоит закрыть. ИИ объяснит, что пошло не так.
      </p>

      {openMistakes.length === 0 ? (
        <div className="card-surface mt-8 flex flex-col items-center gap-3 p-10 text-center">
          <PartyPopper className="h-10 w-10 text-(--color-brand-amber)" />
          <p className="font-semibold">Пока нет открытых ошибок — отличная работа!</p>
          <p className="text-sm text-(--color-ink-soft)">
            Реши больше заданий, и если что-то пойдёт не так, разбор появится здесь.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-2.5">
          {openMistakes.map((a) => (
            <Link
              key={a.id}
              href={`/app/mistakes/${a.id}`}
              className="card-surface flex items-center gap-3 p-4 transition-colors hover:border-black/10"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pink-50 text-(--color-brand-pink)">
                <Target className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{a.task.topic.name}</div>
                <div className="text-xs text-(--color-ink-soft)">
                  {a.task.subject.name} · Задание {a.task.number}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-(--color-ink-soft)" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

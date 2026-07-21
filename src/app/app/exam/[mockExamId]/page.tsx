import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { startMockExam } from "@/lib/actions/mock-exam";
import { difficultyForUser, topUpTopic } from "@/lib/task-bank";
import { Button } from "@/components/ui/button";
import { Timer, ListChecks, Sparkles } from "lucide-react";

export default async function MockExamStartPage({
  params,
}: {
  params: Promise<{ mockExamId: string }>;
}) {
  const { mockExamId } = await params;
  const session = await auth();
  const userId = session!.user.id;

  let mockExam = await prisma.mockExam.findUnique({
    where: { id: mockExamId },
    include: { subject: true, tasks: { select: { task: { select: { topicId: true } } } } },
  });
  if (!mockExam) notFound();

  // A topic only ever misses the exam if it has zero auto-graded tasks at
  // all (see the seeding logic in prisma/seed.ts and topUpTopic) — grow
  // those once here so a thin subject's exam actually covers every topic,
  // the same "как ФИПИ" shape the auto-graded half is meant to have.
  const coveredTopicIds = new Set(mockExam.tasks.map((mt) => mt.task.topicId));
  const allTopics = await prisma.topic.findMany({
    where: { subjectId: mockExam.subjectId },
    select: { id: true },
  });
  const missingTopics = allTopics.filter((t) => !coveredTopicIds.has(t.id));
  if (missingTopics.length > 0) {
    const [lo, hi] = await difficultyForUser(userId);
    const difficulty = Math.round((lo + hi) / 2);
    await Promise.all(missingTopics.map((t) => topUpTopic(t.id, difficulty, 3)));
    mockExam = await prisma.mockExam.findUnique({
      where: { id: mockExamId },
      include: { subject: true, tasks: { select: { task: { select: { topicId: true } } } } },
    });
    if (!mockExam) notFound();
  }

  const previousAttempts = await prisma.mockExamAttempt.findMany({
    where: { userId, mockExamId, status: "completed" },
    orderBy: { finishedAt: "desc" },
    take: 3,
  });

  async function start() {
    "use server";
    await startMockExam(mockExamId);
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="card-surface p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl btn-gradient">
          <Timer className="h-7 w-7" />
        </span>
        <h1 className="font-display mt-5 text-2xl font-extrabold">{mockExam.title}</h1>
        <p className="mt-2 text-(--color-ink-soft)">{mockExam.subject.name}</p>

        <div className="mt-6 grid grid-cols-2 gap-3 text-left">
          <div className="rounded-2xl bg-(--color-paper-dim) p-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-(--color-ink-soft)">
              <ListChecks className="h-3.5 w-3.5" /> Заданий
            </div>
            <div className="font-display mt-1 text-xl font-extrabold">{mockExam.tasks.length}</div>
          </div>
          <div className="rounded-2xl bg-(--color-paper-dim) p-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-(--color-ink-soft)">
              <Timer className="h-3.5 w-3.5" /> Время
            </div>
            <div className="font-display mt-1 text-xl font-extrabold">{mockExam.durationMin} мин</div>
          </div>
        </div>

        <div className="mt-6 flex items-start gap-2 rounded-2xl bg-(--color-sky-2) p-4 text-left text-sm text-(--color-ink-soft)">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-(--color-brand-blue)" />
          Таймер запустится сразу после старта. Ответы сохраняются по ходу — можно вернуться и продолжить,
          если случайно закроешь вкладку.
        </div>

        <form action={start}>
          <Button type="submit" size="lg" className="mt-7 w-full">
            Начать пробный экзамен
          </Button>
        </form>

        {previousAttempts.length > 0 && (
          <div className="mt-8 text-left">
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-(--color-ink-soft)">
              Прошлые попытки
            </div>
            <div className="space-y-2">
              {previousAttempts.map((a) => (
                <a
                  key={a.id}
                  href={`/app/exam/${mockExamId}/results/${a.id}`}
                  className="flex items-center justify-between rounded-xl bg-(--color-paper-dim) px-4 py-2.5 text-sm hover:bg-black/5"
                >
                  <span>{a.finishedAt?.toLocaleDateString("ru-RU")}</span>
                  <span className="font-bold">{a.primaryScore}/{a.maxPrimaryScore}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

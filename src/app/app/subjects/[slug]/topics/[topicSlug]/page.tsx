import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Markdown } from "@/components/app/markdown";
import { GenerateMoreTasks } from "@/components/app/generate-more-tasks";
import { CheckCircle2, XCircle, Circle, ChevronRight, BookOpen } from "lucide-react";

const typeLabel: Record<string, string> = {
  SHORT_ANSWER: "Краткий ответ",
  CHOICE: "Выбор ответа",
  MULTI_CHOICE: "Выбор нескольких",
  MATCHING: "Соответствие",
  DETAILED_ANSWER: "Развёрнутый ответ",
  ESSAY: "Сочинение",
};

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string; topicSlug: string }>;
}) {
  const { slug, topicSlug } = await params;
  const session = await auth();

  const subject = await prisma.subject.findUnique({ where: { slug } });
  if (!subject) notFound();

  const topic = await prisma.topic.findUnique({
    where: { subjectId_slug: { subjectId: subject.id, slug: topicSlug } },
    include: { tasks: { orderBy: { id: "asc" } } },
  });
  if (!topic) notFound();

  const attempts = await prisma.attempt.findMany({
    where: { userId: session!.user.id, task: { topicId: topic.id } },
    orderBy: { createdAt: "desc" },
    select: { taskId: true, isCorrect: true },
  });

  const statusByTask = new Map<string, boolean>();
  for (const a of attempts) {
    if (!statusByTask.has(a.taskId)) statusByTask.set(a.taskId, a.isCorrect);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div>
        <div className="text-sm font-semibold text-(--color-ink-soft)">
          <Link href={`/app/subjects/${subject.slug}`} className="hover:text-(--color-ink)">
            {subject.name}
          </Link>{" "}
          / {topic.name}
        </div>
        <h1 className="font-display mt-2 text-2xl font-extrabold sm:text-3xl">{topic.name}</h1>

        <div className="card-surface mt-6 p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-bold text-(--color-brand-violet)">
            <BookOpen className="h-4 w-4" /> Теория простыми словами
          </div>
          <Markdown>{topic.theory}</Markdown>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-(--color-ink-soft)">
          Задания ({topic.tasks.length})
        </h2>
        <div className="space-y-2.5">
          {topic.tasks.map((task, i) => {
            const status = statusByTask.get(task.id);
            return (
              <Link
                key={task.id}
                href={`/app/practice/${task.id}`}
                className="card-surface flex items-center gap-3 p-4 transition-colors hover:border-black/10"
              >
                {status === true && <CheckCircle2 className="h-5 w-5 shrink-0 text-(--color-brand-green)" />}
                {status === false && <XCircle className="h-5 w-5 shrink-0 text-(--color-brand-pink)" />}
                {status === undefined && <Circle className="h-5 w-5 shrink-0 text-(--color-ink-soft)/40" />}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">
                    Задание {task.number} · вариант {i + 1}
                  </div>
                  <div className="text-xs text-(--color-ink-soft)">{typeLabel[task.type]}</div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-(--color-ink-soft)" />
              </Link>
            );
          })}
        </div>
        <div className="mt-2.5">
          <GenerateMoreTasks topicId={topic.id} />
        </div>
      </div>
    </div>
  );
}

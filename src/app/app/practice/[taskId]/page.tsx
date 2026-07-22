import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PracticeTask } from "@/components/app/practice-task";
import type { TaskDiagram } from "@/lib/task-diagram-types";

export default async function PracticeTaskPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { subject: true, topic: { include: { tasks: { orderBy: { id: "asc" } } } } },
  });
  if (!task) notFound();

  const idx = task.topic.tasks.findIndex((t) => t.id === task.id);
  const nextTaskId = task.topic.tasks[idx + 1]?.id ?? null;
  const backHref = `/app/subjects/${task.subject.slug}/topics/${task.topic.slug}`;

  return (
    <div>
      <div className="mb-5 text-sm font-semibold text-(--color-ink-soft)">
        <Link href={`/app/subjects/${task.subject.slug}`} className="hover:text-(--color-ink)">
          {task.subject.name}
        </Link>{" "}
        /{" "}
        <Link href={backHref} className="hover:text-(--color-ink)">
          {task.topic.name}
        </Link>
      </div>

      <PracticeTask
        task={{
          id: task.id,
          number: task.number,
          type: task.type,
          statement: task.statement,
          options: task.options,
          diagram: task.diagram as TaskDiagram | null,
          explanation: task.explanation,
          correctAnswer: task.correctAnswer,
          maxScore: task.maxScore,
        }}
        nextTaskId={nextTaskId}
        backHref={backHref}
      />
    </div>
  );
}

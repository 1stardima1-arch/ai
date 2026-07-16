import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTopicsWithProgress } from "@/lib/stats";
import { SubjectIcon } from "@/lib/subject-icon";
import { LinkButton } from "@/components/ui/button";
import { AnimatedBar } from "@/components/motion/animated-bar";
import { ChevronRight, Timer, CheckCircle2 } from "lucide-react";

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();

  const subject = await prisma.subject.findUnique({ where: { slug } });
  if (!subject) notFound();

  const [topics, mockExam] = await Promise.all([
    getTopicsWithProgress(session!.user.id, subject.id),
    prisma.mockExam.findFirst({ where: { subjectId: subject.id } }),
  ]);

  return (
    <div>
      <div className="card-surface flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: `${subject.color}1a` }}
          >
            <SubjectIcon icon={subject.icon} className="h-7 w-7" />
          </span>
          <div>
            <h1 className="font-display text-xl font-extrabold sm:text-2xl">{subject.name}</h1>
            <p className="mt-1 text-sm text-(--color-ink-soft)">{subject.description}</p>
          </div>
        </div>

        {mockExam && (
          <LinkButton href={`/app/exam/${mockExam.id}`} variant="secondary" size="md" className="shrink-0">
            <Timer className="h-4 w-4" /> Пробный экзамен
          </LinkButton>
        )}
      </div>

      <div className="mt-8 space-y-3">
        {topics.map((t) => (
          <Link
            key={t.id}
            href={`/app/subjects/${subject.slug}/topics/${t.slug}`}
            className="card-surface flex items-center justify-between gap-4 p-5 transition-colors hover:border-black/10"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-bold">{t.name}</h3>
                {t.progressPercent === 100 && (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-(--color-brand-green)" />
                )}
              </div>
              <p className="mt-0.5 truncate text-sm text-(--color-ink-soft)">{t.summary}</p>
              <AnimatedBar
                percent={t.progressPercent}
                color={subject.color}
                trackClassName="mt-2 h-1.5 w-full max-w-xs"
              />
            </div>
            <div className="flex shrink-0 items-center gap-2 text-sm font-semibold text-(--color-ink-soft)">
              {t.solvedTasks}/{t.totalTasks}
              <ChevronRight className="h-4 w-4" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

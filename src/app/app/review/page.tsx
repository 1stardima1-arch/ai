import { prisma } from "@/lib/prisma";
import { ReviewBrowser } from "@/components/app/review-browser";

export default async function ReviewPage() {
  // Deliberately every subject, not just the ones the student enrolled in —
  // unlike "Предметы" (their active study plan), this page's whole point is
  // "any topic, right now", per the copy below.
  const subjects = await prisma.subject.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      color: true,
      icon: true,
      topics: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          summary: true,
          _count: { select: { tasks: true } },
        },
      },
    },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Повторение</h1>
      <p className="mt-1 text-(--color-ink-soft)">
        Любая тема с теорией и заданиями — открывай что угодно, не дожидаясь дня в расписании.
      </p>

      <div className="mt-6">
        <ReviewBrowser subjects={subjects} />
      </div>
    </div>
  );
}

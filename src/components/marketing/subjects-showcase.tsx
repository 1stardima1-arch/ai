import Link from "next/link";
import { Container } from "@/components/ui/card";
import { Reveal } from "@/components/motion/reveal";
import { SubjectIcon } from "@/lib/subject-icon";
import { prisma } from "@/lib/prisma";

const examLabel: Record<string, string> = { EGE: "ЕГЭ", OGE: "ОГЭ" };

export async function SubjectsShowcase() {
  const subjects = await prisma.subject.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { topics: true, tasks: true } } },
  });

  return (
    <section id="subjects" className="py-20 sm:py-28">
      <Container>
        <Reveal className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            {subjects.length} направлений, готовых прямо сейчас
          </h2>
          <p className="mt-4 text-(--color-ink-soft)">
            Полный банк тем, заданий и теории по каждому предмету — и он постоянно растёт.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {subjects.map((s, i) => (
            <Reveal key={s.id} delay={(i % 8) * 0.06}>
              <Link
                href="/login"
                className="group block overflow-hidden rounded-[1.75rem] border border-black/5 bg-white shadow-(--shadow-soft) transition-transform duration-300 hover:-translate-y-1.5 hover:shadow-(--shadow-lift)"
              >
                <div
                  className="relative flex h-40 items-center justify-center"
                  style={{ background: `linear-gradient(160deg, ${s.color}bb, ${s.color})` }}
                >
                  <SubjectIcon icon={s.icon} className="h-14 w-14 text-white/90" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                  <span className="absolute right-3 top-3 rounded-full bg-black/15 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
                    {examLabel[s.examType] ?? s.examType}
                  </span>
                </div>
                <div className="p-5">
                  <div className="font-display text-lg font-bold">{s.name.replace(/^ЕГЭ |^ОГЭ /, "")}</div>
                  <div className="mt-1 line-clamp-1 text-sm text-(--color-ink-soft)">{s.description}</div>
                  <div className="mt-3 inline-flex rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-(--color-ink-soft)">
                    {s._count.tasks} заданий · {s._count.topics} тем
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

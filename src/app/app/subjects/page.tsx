import Link from "next/link";
import { auth } from "@/auth";
import { getSubjectsWithProgress } from "@/lib/stats";
import { SubjectIcon } from "@/lib/subject-icon";
import { Badge } from "@/components/ui/card";
import { AnimatedBar } from "@/components/motion/animated-bar";

const examLabel = { EGE: "ЕГЭ", OGE: "ОГЭ" } as const;

export default async function SubjectsPage() {
  const session = await auth();
  const subjects = await getSubjectsWithProgress(session!.user.id);

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Предметы</h1>
      <p className="mt-1 text-(--color-ink-soft)">Выбери направление и продолжай с того места, где остановился.</p>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {subjects.map((s) => (
          <Link
            key={s.id}
            href={`/app/subjects/${s.slug}`}
            className="card-surface group flex flex-col gap-4 border-l-[3px] p-6 transition-transform hover:-translate-y-1 hover:shadow-(--shadow-lift)"
            style={{ borderLeftColor: s.color }}
          >
            <div className="flex items-start justify-between">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: `${s.color}1a`, color: s.color }}
              >
                <SubjectIcon icon={s.icon} className="h-6 w-6" />
              </span>
              <Badge>{examLabel[s.examType]}</Badge>
            </div>

            <div>
              <h2 className="font-display text-lg font-bold">{s.name}</h2>
              <p className="mt-1 text-sm text-(--color-ink-soft)">{s.description}</p>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-(--color-ink-soft)">
                <span>{s.solvedTasks} из {s.totalTasks} решено</span>
                <span>{s.progressPercent}%</span>
              </div>
              <AnimatedBar percent={s.progressPercent} color={s.color} trackClassName="mt-1.5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

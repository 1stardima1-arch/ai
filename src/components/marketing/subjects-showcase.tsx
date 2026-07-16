import Link from "next/link";
import { Container } from "@/components/ui/card";
import { Reveal } from "@/components/motion/reveal";
import { Calculator, BookOpenText, Sigma, PenLine } from "lucide-react";

const subjects = [
  {
    title: "ЕГЭ Математика",
    subtitle: "профильный уровень",
    tasks: "35 заданий · 12 тем",
    icon: Sigma,
    bg: "linear-gradient(160deg,#c7d2fe,#a5b4fc 45%,#818cf8)",
  },
  {
    title: "ЕГЭ Русский язык",
    subtitle: "тест + сочинение",
    tasks: "20 заданий · 11 тем",
    icon: PenLine,
    bg: "linear-gradient(160deg,#fbcfe8,#f9a8d4 45%,#f472b6)",
  },
  {
    title: "ОГЭ Математика",
    subtitle: "алгебра и геометрия",
    tasks: "23 задания · 10 тем",
    icon: Calculator,
    bg: "linear-gradient(160deg,#bbf7d0,#86efac 45%,#4ade80)",
  },
  {
    title: "ОГЭ Русский язык",
    subtitle: "изложение + тест",
    tasks: "9 заданий · 7 тем",
    icon: BookOpenText,
    bg: "linear-gradient(160deg,#fde68a,#fcd34d 45%,#fbbf24)",
  },
];

export function SubjectsShowcase() {
  return (
    <section id="subjects" className="py-20 sm:py-28">
      <Container>
        <Reveal className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Четыре направления, готовые прямо сейчас
          </h2>
          <p className="mt-4 text-(--color-ink-soft)">
            Полный банк тем, заданий и теории. Остальные предметы добавляются по той же структуре.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {subjects.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.08}>
              <Link
                href="/login"
                className="group block overflow-hidden rounded-[1.75rem] border border-black/5 bg-white shadow-(--shadow-soft) transition-transform duration-300 hover:-translate-y-1.5 hover:shadow-(--shadow-lift)"
              >
                <div
                  className="relative flex h-40 items-center justify-center"
                  style={{ background: s.bg }}
                >
                  <s.icon className="h-14 w-14 text-white/90" strokeWidth={1.5} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                </div>
                <div className="p-5">
                  <div className="font-display text-lg font-bold">{s.title}</div>
                  <div className="mt-1 text-sm text-(--color-ink-soft)">{s.subtitle}</div>
                  <div className="mt-3 inline-flex rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-(--color-ink-soft)">
                    {s.tasks}
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

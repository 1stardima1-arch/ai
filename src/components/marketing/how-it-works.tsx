import { Container } from "@/components/ui/card";
import { Reveal } from "@/components/motion/reveal";

const steps = [
  {
    n: "01",
    title: "Выбери экзамен и предмет",
    desc: "ЕГЭ или ОГЭ, профиль — мы сразу покажем нужные темы и задания.",
  },
  {
    n: "02",
    title: "Решай и получай честный разбор",
    desc: "Каждая попытка сохраняется. Ошибся — ИИ объяснит именно твою ошибку.",
  },
  {
    n: "03",
    title: "Следи за прогрессом",
    desc: "Аналитика показывает слабые темы и рост баллов — занимайся тем, что реально нужно.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <Reveal className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Начать можно за одну минуту
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-8 sm:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.1} className="relative">
              <span className="font-display gradient-text text-5xl font-extrabold opacity-70">
                {s.n}
              </span>
              <h3 className="font-display mt-4 text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-sm text-(--color-ink-soft)">{s.desc}</p>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

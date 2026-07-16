import { Container } from "@/components/ui/card";
import { Reveal } from "@/components/motion/reveal";
import { Star } from "lucide-react";

const items = [
  {
    name: "Аня, 11 класс",
    text: "Наконец-то понятно объяснили производные — до этого три репетитора не смогли.",
  },
  {
    name: "Данил, 9 класс",
    text: "Разбор ошибок реально помогает — видно не «неправильно», а что именно перепутал.",
  },
  {
    name: "Марина, 11 класс",
    text: "Стрик не даёт забить на подготовку. Плюс приятно, что не выглядит как скучный учебник.",
  },
];

export function Testimonials() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <Reveal className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Ученикам заходит
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {items.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08}>
              <div className="card-surface h-full p-6">
                <div className="flex gap-0.5 text-(--color-brand-amber)">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star key={idx} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-(--color-ink-soft)">
                  «{t.text}»
                </p>
                <div className="mt-4 text-sm font-bold">{t.name}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

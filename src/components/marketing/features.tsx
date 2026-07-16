import { Container } from "@/components/ui/card";
import { Reveal } from "@/components/motion/reveal";
import {
  Brain,
  Target,
  BookOpen,
  LineChart,
  Trophy,
  SearchCheck,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "ИИ-репетитор без переплат",
    desc: "Объясняет тему простыми словами и по шагам, пока не станет понятно. Спрашивай что угодно, хоть в 2 часа ночи — вместо репетитора за деньги.",
    color: "#4f6bff",
  },
  {
    icon: Target,
    title: "Настоящие задания ФИПИ",
    desc: "Банк собран в точном формате открытого банка ФИПИ: те же номера, типы и критерии оценивания.",
    color: "#ec4899",
  },
  {
    icon: BookOpen,
    title: "Теория без «воды»",
    desc: "Каждая тема объяснена простым языком с примерами — понятно даже если тема совсем не идёт.",
    color: "#22c55e",
  },
  {
    icon: SearchCheck,
    title: "Разбор ошибок",
    desc: "После каждой ошибки — не просто «неверно», а честный разбор: что пошло не так и как исправить.",
    color: "#f59e0b",
  },
  {
    icon: LineChart,
    title: "Аналитика прогресса",
    desc: "Видно рост по темам, слабые места и динамику баллов — реальные цифры по твоим попыткам.",
    color: "#8b5cf6",
  },
  {
    icon: Trophy,
    title: "Не скучно",
    desc: "Стрики, опыт, уровни и достижения — готовиться к экзамену как в игре, а не как в рутине.",
    color: "#0ea5e9",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <Container>
        <Reveal className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Всё, что нужно для реальной подготовки
          </h2>
          <p className="mt-4 text-(--color-ink-soft)">
            Без хаоса из десятка вкладок и учебников. Один сервис, который правда помогает.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.06}>
              <div className="card-surface h-full p-7 transition-transform duration-300 hover:-translate-y-1">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ background: `${f.color}1a` }}
                >
                  <f.icon className="h-6 w-6" style={{ color: f.color }} strokeWidth={2} />
                </div>
                <h3 className="mt-5 font-display text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-(--color-ink-soft)">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Container } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/motion/animated-number";

const avatars = [
  "linear-gradient(135deg,#fca5a5,#f472b6)",
  "linear-gradient(135deg,#93c5fd,#818cf8)",
  "linear-gradient(135deg,#86efac,#22d3ee)",
];

const quickSubjects = [
  { label: "ЕГЭ Математика", href: "/app/subjects/ege-math" },
  { label: "ЕГЭ Русский язык", href: "/app/subjects/ege-russian" },
  { label: "ОГЭ Математика", href: "/app/subjects/oge-math" },
  { label: "ОГЭ Русский язык", href: "/app/subjects/oge-russian" },
];

export function Hero() {
  return (
    <section className="dreamy-hero-bg relative rounded-b-[3rem] pb-28 pt-16 sm:pb-36">
      <div className="blob blob-blue" />
      <div className="blob blob-pink" />
      <div className="blob blob-green" />
      <div className="hill" />
      <div className="noise-overlay" />

      <Container className="relative flex flex-col items-center text-center">
        <Link
          href="/#ai"
          className="pill-badge animate-[fadeIn_.6s_ease]"
        >
          <span className="flex -space-x-2">
            {avatars.map((g, i) => (
              <span
                key={i}
                className="h-6 w-6 rounded-full ring-2 ring-white"
                style={{ background: g }}
              />
            ))}
          </span>
          <span className="gradient-text font-bold">
            Уже готовятся <AnimatedNumber value={12000} />+ учеников
          </span>
        </Link>

        <h1 className="font-display mt-7 max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl">
          Готовься к ЕГЭ и ОГЭ
          <br />
          вместе с ИИ, который
          <br />
          объясняет как <span className="gradient-text">друг</span>
        </h1>

        <p className="mt-6 max-w-xl text-balance text-base text-(--color-ink-soft) sm:text-lg">
          Реальные задания в формате открытого банка ФИПИ, понятная теория без «воды»
          и умный ИИ-репетитор, который разбирает каждую твою ошибку. Бесплатно.
        </p>

        <div className="mt-10 w-full max-w-2xl rounded-[2rem] border border-black/5 bg-white/90 p-3 shadow-(--shadow-lift) backdrop-blur">
          <div className="rounded-3xl bg-(--color-paper-dim) px-5 py-4 text-left text-(--color-ink-soft)">
            Выбери экзамен и предмет — начнём с диагностики за 5 минут
          </div>
          <div className="mt-3 flex flex-wrap gap-2 px-1">
            {quickSubjects.map((s) => (
              <Link
                key={s.href}
                href="/login"
                className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold transition-colors hover:border-(--color-brand-blue) hover:text-(--color-brand-blue)"
              >
                {s.label}
              </Link>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between px-1 pb-1">
            <div className="hidden items-center gap-1.5 text-xs text-(--color-ink-soft) sm:flex">
              <CheckCircle2 className="h-4 w-4 text-(--color-brand-green)" />
              Без карты, без подписки
            </div>
            <LinkButton href="/login" size="md" className="ml-auto">
              Начать бесплатно <ArrowRight className="h-4 w-4" />
            </LinkButton>
          </div>
        </div>
      </Container>
    </section>
  );
}

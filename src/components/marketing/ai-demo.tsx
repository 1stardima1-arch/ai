import { Container } from "@/components/ui/card";
import { Reveal } from "@/components/motion/reveal";
import { Sparkles, User } from "lucide-react";

export function AiDemo() {
  return (
    <section id="ai" className="py-20 sm:py-28">
      <Container className="grid items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <span className="pill-badge">
            <Sparkles className="h-4 w-4 text-(--color-brand-violet)" />
            <span className="font-bold">ИИ-репетитор</span>
          </span>
          <h2 className="font-display mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            Спроси так, как спросил бы
            <br />
            друга, который топ по предмету
          </h2>
          <p className="mt-5 text-(--color-ink-soft)">
            ИИ-репетитор помнит, какие задания ты решал, видит твои типичные ошибки
            и объясняет тему заново — терпеливо, простыми словами и без занудства.
            Работает на бесплатной и быстрой модели, поэтому отвечает почти мгновенно.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {[
              "Разбирает именно твою ошибку в конкретном задании",
              "Объясняет теорию по-новому, если не зашло с первого раза",
              "Подсказывает следующий шаг, а не просто выдаёт ответ",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-(--color-brand-blue)" />
                <span className="text-(--color-ink-soft)">{t}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="card-surface overflow-hidden p-0">
            <div className="flex items-center gap-2 border-b border-black/5 px-5 py-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full btn-gradient">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <div className="text-sm font-bold">Тьютор Гото</div>
                <div className="text-xs text-(--color-brand-green)">● на связи</div>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <div className="ml-auto flex max-w-[85%] items-start gap-2">
                <div className="rounded-2xl rounded-tr-sm bg-(--color-paper-dim) px-4 py-3 text-sm">
                  Опять не решил №9 с тригонометрией. Почему у меня минус вместо плюса?
                </div>
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/5">
                  <User className="h-3.5 w-3.5" />
                </span>
              </div>

              <div className="flex max-w-[90%] items-start gap-2">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full btn-gradient">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <div className="rounded-2xl rounded-tl-sm bg-(--color-sky-2) px-4 py-3 text-sm leading-relaxed">
                  Смотри: ты потерял знак при переходе через вторую четверть — там косинус
                  отрицательный. Это частая ошибка, я такое вижу у тебя третий раз, поэтому
                  дам мини-тренажёр just на знаки тригонометрии. Погнали?
                </div>
              </div>

              <div className="ml-auto flex max-w-[70%] items-start gap-2">
                <div className="rounded-2xl rounded-tr-sm bg-(--color-paper-dim) px-4 py-3 text-sm">
                  Погнали 🔥
                </div>
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/5">
                  <User className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>

            <div className="border-t border-black/5 p-4">
              <div className="flex items-center gap-2 rounded-full bg-(--color-paper-dim) px-4 py-2.5 text-sm text-(--color-ink-soft)">
                Спроси что угодно про эту тему…
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

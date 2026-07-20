import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Container } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export const metadata = { title: "Пользовательское соглашение — Балл" };

export default function TermsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1 py-16">
        <Container className="max-w-3xl">
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">
            Пользовательское соглашение
          </h1>
          <p className="mt-2 text-sm text-(--color-ink-soft)">Последнее обновление: {new Date().toLocaleDateString("ru-RU")}</p>

          <div className="mt-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p>
              Это черновик документа общего характера. Перед публичным запуском (в том числе
              в RuStore) замените плейсхолдеры на реальные реквизиты и покажите текст юристу.
            </p>
          </div>

          <div className="prose-theory mt-8 space-y-6 text-sm leading-relaxed text-(--color-ink-soft)">
            <section>
              <h2 className="font-display text-lg font-bold text-(--color-ink)">1. Предмет соглашения</h2>
              <p className="mt-2">
                Настоящее соглашение регулирует отношения между [укажите наименование
                организации / ИП] (далее — «Сервис») и пользователем сервиса «Балл»
                в связи с использованием функций подготовки к ЕГЭ и ОГЭ: банка заданий,
                теории, ИИ-репетитора, аналитики прогресса и пробных экзаменов.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-(--color-ink)">2. Регистрация и аккаунт</h2>
              <p className="mt-2">
                Доступ к Сервису предоставляется после входа по почте или через демо-режим.
                Пользователь несёт ответственность за сохранность доступа к своему аккаунту.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-(--color-ink)">3. Образовательный характер сервиса</h2>
              <p className="mt-2">
                Задания составлены в формате, приближённом к открытому банку заданий ФИПИ,
                в учебных целях и не являются официальными материалами ФИПИ или Рособрнадзора.
                Ответы и объяснения ИИ-репетитора носят вспомогательный характер и могут
                содержать неточности — Сервис не гарантирует конкретный результат на реальном экзамене.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-(--color-ink)">4. Правила использования</h2>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>Запрещено использовать Сервис для действий, нарушающих законодательство РФ.</li>
                <li>Запрещены попытки нарушить работу Сервиса, автоматизированный сбор данных без разрешения.</li>
                <li>Один аккаунт предназначен для использования одним человеком.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-(--color-ink)">5. Стоимость</h2>
              <p className="mt-2">
                На момент публикации основной функционал Сервиса предоставляется бесплатно.
                Сервис вправе в будущем ввести платные функции, уведомив об этом пользователей заранее.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-(--color-ink)">6. Ограничение ответственности</h2>
              <p className="mt-2">
                Сервис предоставляется «как есть». Оператор не несёт ответственности за
                результаты экзаменов, а также за временную недоступность Сервиса по
                техническим причинам.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-(--color-ink)">7. Прекращение доступа</h2>
              <p className="mt-2">
                Пользователь может удалить аккаунт в любой момент, обратившись по контактам
                в Политике конфиденциальности. Оператор вправе ограничить доступ при нарушении
                настоящего соглашения.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-(--color-ink)">8. Изменения соглашения</h2>
              <p className="mt-2">
                Оператор может обновлять условия соглашения. Продолжение использования
                Сервиса после изменений означает согласие с новой редакцией.
              </p>
            </section>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}

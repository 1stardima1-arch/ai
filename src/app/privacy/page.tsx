import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Container } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export const metadata = { title: "Политика конфиденциальности — Балл" };

export default function PrivacyPage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1 py-16">
        <Container className="max-w-3xl">
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">
            Политика конфиденциальности
          </h1>
          <p className="mt-2 text-sm text-(--color-ink-soft)">Последнее обновление: {new Date().toLocaleDateString("ru-RU")}</p>

          <div className="mt-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p>
              Это черновик документа общего характера. Перед публичным запуском (в том числе
              в RuStore) замените плейсхолдеры на реальные реквизиты и покажите текст юристу —
              обработка персональных данных в РФ регулируется 152-ФЗ, и точные формулировки
              зависят от организационно-правовой формы владельца сервиса.
            </p>
          </div>

          <div className="prose-theory mt-8 space-y-6 text-sm leading-relaxed text-(--color-ink-soft)">
            <section>
              <h2 className="font-display text-lg font-bold text-(--color-ink)">1. Общие положения</h2>
              <p className="mt-2">
                Настоящая Политика конфиденциальности определяет порядок обработки и защиты
                персональных данных пользователей сервиса «Балл» (далее — «Сервис»),
                владельцем которого является [укажите наименование организации / ИП, ИНН]
                (далее — «Оператор»). Используя Сервис, пользователь соглашается с условиями
                настоящей Политики.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-(--color-ink)">2. Какие данные мы собираем</h2>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>Email — при входе по почте, либо имя — при демо-входе.</li>
                <li>Данные об учебном прогрессе: решённые задания, ответы, баллы, серии дней занятий (стрики), достижения.</li>
                <li>История переписки с ИИ-репетитором — для сохранения контекста диалога.</li>
                <li>Технические данные: файлы cookie для авторизации (сессия), базовые логи сервера.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-(--color-ink)">3. Цели обработки данных</h2>
              <p className="mt-2">
                Данные используются исключительно для работы Сервиса: авторизации, сохранения
                прогресса обучения, отображения аналитики и рейтинга пользователей, работы
                ИИ-репетитора. Данные не используются для показа рекламы и не продаются третьим лицам.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-(--color-ink)">4. Передача данных третьим лицам</h2>
              <p className="mt-2">Для работы Сервиса данные могут передаваться следующим сторонам:</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>Resend — при входе по почте, для отправки письма со ссылкой для входа.</li>
                <li>Хостинг-провайдеру и провайдеру базы данных — для технической работы Сервиса.</li>
                <li>Провайдеру ИИ-модели — тексту запроса, отправленного ИИ-репетитору, для получения ответа.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-(--color-ink)">5. Права пользователя</h2>
              <p className="mt-2">
                Пользователь вправе запросить просмотр, исправление или удаление своих
                персональных данных, а также отозвать согласие на их обработку, написав на
                [укажите контактный email]. При удалении аккаунта весь учебный прогресс удаляется безвозвратно.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-(--color-ink)">6. Хранение и защита данных</h2>
              <p className="mt-2">
                Данные хранятся в базе данных с ограниченным доступом. Оператор принимает
                разумные технические и организационные меры для защиты данных от
                несанкционированного доступа, изменения или утраты.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-(--color-ink)">7. Изменения Политики</h2>
              <p className="mt-2">
                Оператор может обновлять настоящую Политику. Актуальная версия всегда доступна
                на этой странице.
              </p>
            </section>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}

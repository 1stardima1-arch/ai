import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Container } from "@/components/ui/card";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-black/5 py-12">
      <Container className="flex flex-col items-start justify-between gap-8 sm:flex-row">
        <div>
          <div className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-full btn-gradient">
              <Sparkles className="h-4 w-4" strokeWidth={2.5} />
            </span>
            Балл
          </div>
          <p className="mt-3 max-w-xs text-sm text-(--color-ink-soft)">
            Умная подготовка к ЕГЭ и ОГЭ: реальные задания, понятная теория и ИИ-репетитор,
            который объясняет как друг.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          <div>
            <div className="mb-3 text-sm font-semibold">Продукт</div>
            <ul className="space-y-2 text-sm text-(--color-ink-soft)">
              <li><Link href="/#features" className="hover:text-(--color-ink)">Возможности</Link></li>
              <li><Link href="/#subjects" className="hover:text-(--color-ink)">Предметы</Link></li>
              <li><Link href="/#ai" className="hover:text-(--color-ink)">ИИ-репетитор</Link></li>
            </ul>
          </div>
          <div>
            <div className="mb-3 text-sm font-semibold">Аккаунт</div>
            <ul className="space-y-2 text-sm text-(--color-ink-soft)">
              <li><Link href="/login" className="hover:text-(--color-ink)">Войти</Link></li>
              <li><Link href="/login" className="hover:text-(--color-ink)">Регистрация</Link></li>
            </ul>
          </div>
        </div>
      </Container>

      <Container className="mt-10 flex flex-col gap-2 border-t border-black/5 pt-6 text-xs text-(--color-ink-soft) sm:flex-row sm:items-center sm:justify-between">
        <span>© {new Date().getFullYear()} Балл. Все права защищены.</span>
        <span>Задания составлены в формате открытого банка ФИПИ, в учебных целях.</span>
      </Container>
    </footer>
  );
}

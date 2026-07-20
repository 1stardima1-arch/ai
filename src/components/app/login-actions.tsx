"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";

export function LoginActions({
  hasEmail,
  hasDemo,
  emailAction,
  demoAction,
}: {
  hasEmail: boolean;
  hasDemo: boolean;
  emailAction: (formData: FormData) => Promise<void>;
  demoAction: (formData: FormData) => Promise<void>;
}) {
  const [consent, setConsent] = useState(false);
  const checkboxId = useId();

  return (
    <>
      <div className="mt-7 space-y-3">
        {hasEmail ? (
          <form action={emailAction} className="flex gap-2">
            <input
              name="email"
              type="email"
              placeholder="Почта"
              required
              className="flex-1 rounded-full border border-black/10 bg-(--color-paper-dim) px-4 py-3 text-sm outline-none focus:border-(--color-brand-blue)"
            />
            <button
              type="submit"
              disabled={!consent}
              className="flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-black/10 dark:border-white/10 bg-(--color-surface) px-4 py-3 text-sm font-semibold shadow-(--shadow-soft) disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Mail className="h-4 w-4" />
              Войти по почте
            </button>
          </form>
        ) : (
          <div className="rounded-full border border-dashed border-black/15 px-5 py-3.5 text-center text-sm text-(--color-ink-soft)">
            Вход по почте не настроен
          </div>
        )}
      </div>

      {hasDemo && (
        <>
          <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-(--color-ink-soft)">
            <span className="h-px flex-1 bg-black/10" />
            или демо-вход
            <span className="h-px flex-1 bg-black/10" />
          </div>

          <form action={demoAction} className="flex gap-2">
            <input
              name="name"
              placeholder="Как тебя зовут?"
              required
              className="flex-1 rounded-full border border-black/10 bg-(--color-paper-dim) px-4 py-3 text-sm outline-none focus:border-(--color-brand-blue)"
            />
            <button
              type="submit"
              disabled={!consent}
              className="flex shrink-0 items-center justify-center gap-1.5 rounded-full btn-gradient px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
            >
              Войти <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </>
      )}

      <label
        htmlFor={checkboxId}
        className="mt-6 flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-(--color-ink-soft)"
      >
        <input
          id={checkboxId}
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-(--color-brand-blue)"
        />
        <span>
          Я согласен(на) с{" "}
          <Link href="/terms" target="_blank" className="font-semibold text-(--color-ink) underline underline-offset-2">
            пользовательским соглашением
          </Link>{" "}
          и{" "}
          <Link href="/privacy" target="_blank" className="font-semibold text-(--color-ink) underline underline-offset-2">
            политикой конфиденциальности
          </Link>
          , включая обработку персональных данных
        </span>
      </label>
    </>
  );
}

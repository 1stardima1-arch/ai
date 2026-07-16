"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

function GoogleG({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18v6h7.73c4.51-4.18 7.09-10.36 7.09-17.65z" fill="#4285F4"/>
      <path d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91H2.51v6.19C6.44 42.66 14.62 48 24 48z" fill="#34A853"/>
      <path d="M10.53 28.58c-.48-1.45-.76-2.99-.76-4.58s.27-3.13.76-4.58v-6.19H2.51A23.93 23.93 0 000 24c0 3.86.93 7.52 2.51 10.77l8.02-6.19z" fill="#FBBC05"/>
      <path d="M24 9.52c3.53 0 6.69 1.21 9.18 3.59l6.85-6.85C35.9 2.38 30.45 0 24 0 14.62 0 6.44 5.34 2.51 13.23l8.02 6.19c1.9-5.69 7.21-9.9 13.47-9.9z" fill="#EA4335"/>
    </svg>
  );
}

function YandexLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="24" fill="#FC3F1D" />
      <path
        d="M26.6 12.5h-2.9c-4.6 0-7.9 2.9-7.9 7.6 0 3.4 1.6 5.3 4.1 6.8L15.4 35h3.7l4.5-8.1v8.1h3.2V12.5h-.2zm-.2 11.5h-1.8c-2.6 0-4.5-1.4-4.5-4.1 0-2.6 1.7-4 4.5-4h1.8v8.1z"
        fill="#fff"
      />
    </svg>
  );
}

export function LoginActions({
  hasGoogle,
  hasYandex,
  hasVk,
  hasDemo,
  googleAction,
  yandexAction,
  vkAction,
  demoAction,
}: {
  hasGoogle: boolean;
  hasYandex: boolean;
  hasVk: boolean;
  hasDemo: boolean;
  googleAction: () => Promise<void>;
  yandexAction: () => Promise<void>;
  vkAction: () => Promise<void>;
  demoAction: (formData: FormData) => Promise<void>;
}) {
  const [consent, setConsent] = useState(false);
  const checkboxId = useId();

  return (
    <>
      <div className="mt-7 space-y-3">
        {hasGoogle ? (
          <form action={googleAction}>
            <button
              type="submit"
              disabled={!consent}
              className="flex w-full items-center justify-center gap-2.5 rounded-full border border-black/10 bg-white px-5 py-3.5 text-sm font-semibold shadow-(--shadow-soft) transition-colors hover:border-black/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <GoogleG className="h-4.5 w-4.5" />
              Продолжить с Google
            </button>
          </form>
        ) : (
          <div className="rounded-full border border-dashed border-black/15 px-5 py-3.5 text-center text-sm text-(--color-ink-soft)">
            Вход через Google не настроен
          </div>
        )}

        {hasYandex ? (
          <form action={yandexAction}>
            <button
              type="submit"
              disabled={!consent}
              className="flex w-full items-center justify-center gap-2.5 rounded-full border border-black/10 bg-white px-5 py-3.5 text-sm font-semibold shadow-(--shadow-soft) transition-colors hover:border-black/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <YandexLogo className="h-4.5 w-4.5" />
              Продолжить с Яндекс ID
            </button>
          </form>
        ) : (
          <div className="rounded-full border border-dashed border-black/15 px-5 py-3.5 text-center text-sm text-(--color-ink-soft)">
            Вход через Яндекс не настроен
          </div>
        )}

        {hasVk ? (
          <form action={vkAction}>
            <button
              type="submit"
              disabled={!consent}
              className="flex w-full items-center justify-center gap-2.5 rounded-full px-5 py-3.5 text-sm font-semibold text-white shadow-(--shadow-soft) transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: "#0077FF" }}
            >
              VK
              <span className="sr-only">Продолжить с VK</span>
              Продолжить с VK
            </button>
          </form>
        ) : (
          <div className="rounded-full border border-dashed border-black/15 px-5 py-3.5 text-center text-sm text-(--color-ink-soft)">
            Вход через VK не настроен
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

import Link from "next/link";
import { signIn } from "@/auth";
import { Sparkles, ArrowRight } from "lucide-react";

const providers = {
  google: !!process.env.GOOGLE_CLIENT_ID,
  vk: !!process.env.VK_CLIENT_ID,
  demo: process.env.ENABLE_DEMO_LOGIN === "true",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const redirectTo = callbackUrl || "/app";

  async function googleSignIn() {
    "use server";
    await signIn("google", { redirectTo });
  }

  async function vkSignIn() {
    "use server";
    await signIn("vk", { redirectTo });
  }

  async function demoSignIn(formData: FormData) {
    "use server";
    const name = (formData.get("name") as string) || "Гость";
    await signIn("demo", { name, redirectTo });
  }

  return (
    <div className="dreamy-hero-bg relative flex min-h-screen items-center justify-center px-4 py-16">
      <div className="hill" />
      <div className="noise-overlay" />

      <div className="relative w-full max-w-md">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2 font-display text-xl font-bold"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full btn-gradient">
            <Sparkles className="h-4 w-4" strokeWidth={2.5} />
          </span>
          Готово
        </Link>

        <div className="card-surface p-8">
          <h1 className="font-display text-center text-2xl font-extrabold">
            С возвращением 👋
          </h1>
          <p className="mt-2 text-center text-sm text-(--color-ink-soft)">
            Войди, чтобы сохранять прогресс и получать разбор ошибок от ИИ
          </p>

          <div className="mt-7 space-y-3">
            {providers.google ? (
              <form action={googleSignIn}>
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2.5 rounded-full border border-black/10 bg-white px-5 py-3.5 text-sm font-semibold shadow-(--shadow-soft) transition-colors hover:border-black/20"
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

            {providers.vk ? (
              <form action={vkSignIn}>
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2.5 rounded-full px-5 py-3.5 text-sm font-semibold text-white shadow-(--shadow-soft) transition-opacity hover:opacity-90"
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

          {providers.demo && (
            <>
              <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-(--color-ink-soft)">
                <span className="h-px flex-1 bg-black/10" />
                или демо-вход
                <span className="h-px flex-1 bg-black/10" />
              </div>

              <form action={demoSignIn} className="flex gap-2">
                <input
                  name="name"
                  placeholder="Как тебя зовут?"
                  required
                  className="flex-1 rounded-full border border-black/10 bg-(--color-paper-dim) px-4 py-3 text-sm outline-none focus:border-(--color-brand-blue)"
                />
                <button
                  type="submit"
                  className="flex shrink-0 items-center justify-center gap-1.5 rounded-full btn-gradient px-4 py-3 text-sm font-semibold"
                >
                  Войти <ArrowRight className="h-4 w-4" />
                </button>
              </form>
              <p className="mt-3 text-center text-xs text-(--color-ink-soft)">
                Демо-вход — для быстрого теста без регистрации. Прогресс сохраняется по имени.
              </p>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-(--color-ink-soft)">
          Продолжая, ты соглашаешься с тем, что это учебный проект и данные
          используются только для сохранения твоего прогресса.
        </p>
      </div>
    </div>
  );
}

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

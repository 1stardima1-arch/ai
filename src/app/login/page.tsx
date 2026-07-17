import Link from "next/link";
import { signIn } from "@/auth";
import { Sparkles } from "lucide-react";
import { LoginActions } from "@/components/app/login-actions";
import { PageTransition } from "@/components/motion/page-transition";

const providers = {
  google: !!process.env.GOOGLE_CLIENT_ID,
  yandex: !!process.env.YANDEX_CLIENT_ID,
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

  async function yandexSignIn() {
    "use server";
    await signIn("yandex", { redirectTo });
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
      <div className="blob blob-blue" />
      <div className="blob blob-pink" />
      <div className="hill" />
      <div className="noise-overlay" />

      <PageTransition>
      <div className="relative w-full max-w-md">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2 font-display text-xl font-bold"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full btn-gradient">
            <Sparkles className="h-4 w-4" strokeWidth={2.5} />
          </span>
          Балл
        </Link>

        <div className="card-surface p-8">
          <h1 className="font-display text-center text-2xl font-extrabold">
            С возвращением 👋
          </h1>
          <p className="mt-2 text-center text-sm text-(--color-ink-soft)">
            Войди, чтобы сохранять прогресс и получать разбор ошибок от ИИ
          </p>

          <LoginActions
            hasGoogle={providers.google}
            hasYandex={providers.yandex}
            hasVk={providers.vk}
            hasDemo={providers.demo}
            googleAction={googleSignIn}
            yandexAction={yandexSignIn}
            vkAction={vkSignIn}
            demoAction={demoSignIn}
          />
        </div>
      </div>
      </PageTransition>
    </div>
  );
}

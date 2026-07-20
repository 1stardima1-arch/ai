import Link from "next/link";
import { signIn } from "@/auth";
import { Sparkles } from "lucide-react";
import { AuthPanel } from "@/components/app/auth-panel";
import { PageTransition } from "@/components/motion/page-transition";

const providers = {
  email: !!process.env.RESEND_API_KEY,
  demo: process.env.ENABLE_DEMO_LOGIN === "true",
};

const errorMessages: Record<string, string> = {
  Verification: "Ссылка для входа устарела или уже использована. Запроси новую.",
  CredentialsSignin: "Неверный ник или пароль.",
  Default: "Не получилось войти. Попробуй ещё раз.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;
  const redirectTo = callbackUrl || "/app";
  const errorMessage = error ? errorMessages[error] || errorMessages.Default : null;

  async function signinAction(formData: FormData) {
    "use server";
    const username = (formData.get("username") as string)?.trim();
    const password = formData.get("password") as string;
    await signIn("username-password", { username, password, redirectTo });
  }

  async function emailSignIn(formData: FormData) {
    "use server";
    const email = (formData.get("email") as string)?.trim();
    await signIn("resend", { email, redirectTo });
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

      <PageTransition glow="never">
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
          {errorMessage && (
            <div className="mb-5 rounded-2xl bg-(--color-brand-pink)/10 px-4 py-3 text-center text-sm font-semibold text-(--color-brand-pink)">
              {errorMessage}
            </div>
          )}

          <AuthPanel
            hasEmail={providers.email}
            hasDemo={providers.demo}
            redirectTo={redirectTo}
            signinAction={signinAction}
            emailAction={emailSignIn}
            demoAction={demoSignIn}
          />
        </div>
      </div>
      </PageTransition>
    </div>
  );
}

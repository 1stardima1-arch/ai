import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NavLinks } from "@/components/app/nav-links";
import { MobileNav } from "@/components/app/mobile-nav";
import { UserAvatar } from "@/components/app/user-avatar";
import { Onboarding } from "@/components/app/onboarding";
import { SignOutButton } from "@/components/app/sign-out-button";
import { isAdminSession } from "@/lib/admin";
import { Activity as ActivityIcon, LifeBuoy } from "lucide-react";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const isAdmin = isAdminSession(session);

  const [user, profile, todayMetric] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, image: true, avatarKey: true } }),
    prisma.athleteProfile.findUnique({ where: { userId: session.user.id } }),
    prisma.dailyMetric.findUnique({ where: { userId_date: { userId: session.user.id, date: new Date(new Date().toISOString().slice(0, 10)) } }, select: { recoveryScore: true } }),
  ]);
  if (!user) redirect("/login");

  const needsSetup = !isAdmin && !profile?.onboardingCompletedAt;

  const score = todayMetric?.recoveryScore ?? null;
  const scoreColor = score == null ? "var(--color-ink-soft)" : score >= 67 ? "var(--color-brand-green)" : score >= 34 ? "var(--color-brand-amber)" : "var(--color-brand-pink)";

  return (
    <div className="min-h-screen bg-(--color-paper)">
      <Onboarding needsSetup={needsSetup} />
      <div className="app-ambient" aria-hidden>
        <div className="blob blob-blue" />
        <div className="blob blob-pink" />
        <div className="blob blob-green" />
        <div className="blob blob-amber" />
      </div>
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 pb-6 pt-[calc(1.5rem+env(safe-area-inset-top))] sm:px-6">
        <aside
          className="liquid-glass glass-sheen sticky top-6 hidden h-[calc(100vh-3rem)] w-64 shrink-0 flex-col rounded-[1.75rem] p-5 lg:flex"
          style={{ viewTransitionName: "app-shell-sidebar" } as React.CSSProperties}
        >
          <Link href="/app" className="flex items-center gap-2 px-1 font-display text-lg font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-full btn-gradient">
              <ActivityIcon className="h-4 w-4" strokeWidth={2.5} />
            </span>
            Pulse Coach
          </Link>

          <div className="mt-8 flex-1">
            <NavLinks isAdmin={isAdmin} />
          </div>

          <Link href="/app" className="rounded-2xl bg-(--color-paper-dim) p-4 transition-colors hover:bg-black/5 dark:hover:bg-white/5">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-(--color-ink-soft)">
              Готовность сегодня
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: scoreColor }} />
              <span className="font-display text-2xl font-extrabold" style={{ color: scoreColor }}>
                {score ?? "—"}
              </span>
              <span className="text-sm text-(--color-ink-soft)">/ 100</span>
            </div>
          </Link>
        </aside>

        <div className="min-w-0 flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">
          <div
            className="mb-6 flex items-center justify-end gap-3"
            style={{ viewTransitionName: "app-shell-topbar" } as React.CSSProperties}
          >
            <div
              className="liquid-glass flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold lg:hidden"
              style={{ color: scoreColor }}
            >
              {score ?? "—"}
            </div>
            <Link
              href="/app/support"
              className="liquid-glass press-spring flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-bold text-(--color-ink-soft)"
              title="Поддержка"
            >
              <LifeBuoy className="h-4 w-4" />
              Поддержка
            </Link>
            <Link href="/app/profile" className="liquid-glass press-spring flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3">
              <UserAvatar avatarKey={user.avatarKey} image={user.image} name={user.name} className="h-7 w-7 text-xs" emojiClassName="text-base" />
              <span className="hidden text-sm font-semibold sm:inline">{user.name}</span>
            </Link>
            <SignOutButton />
          </div>

          {children}
        </div>
      </div>

      <MobileNav isAdmin={isAdmin} />
    </div>
  );
}

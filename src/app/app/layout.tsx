import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NavLinks } from "@/components/app/nav-links";
import { MobileNav } from "@/components/app/mobile-nav";
import { UserAvatar } from "@/components/app/user-avatar";
import { Onboarding } from "@/components/app/onboarding";
import { SignOutButton } from "@/components/app/sign-out-button";
import { levelFromXp, xpProgress } from "@/lib/gamification";
import { AnimatedBar } from "@/components/motion/animated-bar";
import { Sparkles, Flame } from "lucide-react";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [user, allSubjects] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, image: true, avatarKey: true, xp: true, streak: true, prepLevel: true },
    }),
    prisma.subject.findMany({
      orderBy: { order: "asc" },
      select: { id: true, name: true, examType: true, color: true, icon: true },
    }),
  ]);
  if (!user) redirect("/login");

  const level = levelFromXp(user.xp);
  const progress = xpProgress(user.xp);

  return (
    <div className="min-h-screen bg-(--color-paper)">
      <Onboarding needsSetup={!user.prepLevel} subjects={allSubjects} />
      <div className="app-ambient" aria-hidden>
        <div className="blob blob-blue" />
        <div className="blob blob-pink" />
        <div className="blob blob-green" />
      </div>
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6 sm:px-6">
        <aside className="liquid-glass glass-sheen sticky top-6 hidden h-[calc(100vh-3rem)] w-64 shrink-0 flex-col rounded-[1.75rem] p-5 lg:flex">
          <Link href="/" className="flex items-center gap-2 px-1 font-display text-lg font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-full btn-gradient">
              <Sparkles className="h-4 w-4" strokeWidth={2.5} />
            </span>
            Балл
          </Link>

          <div className="mt-8 flex-1">
            <NavLinks />
          </div>

          <div className="rounded-2xl bg-(--color-paper-dim) p-4">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Flame className="h-4 w-4 text-(--color-brand-amber)" />
              {user.streak} {streakWord(user.streak)} подряд
            </div>
            <div className="mt-3 flex items-center justify-between text-xs font-semibold text-(--color-ink-soft)">
              <span>Уровень {level}</span>
              <span>{progress.current}/{progress.needed} XP</span>
            </div>
            <AnimatedBar percent={progress.percent} className="btn-gradient" trackClassName="mt-1.5" />
          </div>
        </aside>

        <div className="min-w-0 flex-1 pb-20 lg:pb-0">
          <div className="mb-6 flex items-center justify-end gap-3">
            <div className="liquid-glass flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold lg:hidden">
              <Flame className="h-4 w-4 text-(--color-brand-amber)" />
              {user.streak}
            </div>
            <Link href="/app/profile" className="liquid-glass press-spring flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3">
              <UserAvatar
                avatarKey={user.avatarKey}
                image={user.image}
                name={user.name}
                className="h-7 w-7 text-xs"
                emojiClassName="text-base"
              />
              <span className="hidden text-sm font-semibold sm:inline">{user.name}</span>
            </Link>
            <SignOutButton />
          </div>

          {children}
        </div>
      </div>

      <MobileNav />
    </div>
  );
}

function streakWord(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return "дней";
  if (mod10 === 1) return "день";
  if (mod10 >= 2 && mod10 <= 4) return "дня";
  return "дней";
}

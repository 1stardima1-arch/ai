import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NavLinks } from "@/components/app/nav-links";
import { MobileNav } from "@/components/app/mobile-nav";
import { SignOutButton } from "@/components/app/sign-out-button";
import { levelFromXp, xpProgress } from "@/lib/gamification";
import { Sparkles, Flame } from "lucide-react";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, image: true, xp: true, streak: true },
  });
  if (!user) redirect("/login");

  const level = levelFromXp(user.xp);
  const progress = xpProgress(user.xp);

  return (
    <div className="min-h-screen bg-(--color-paper)">
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6 sm:px-6">
        <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-64 shrink-0 flex-col rounded-[1.75rem] border border-black/5 bg-white p-5 shadow-(--shadow-soft) lg:flex">
          <Link href="/" className="flex items-center gap-2 px-1 font-display text-lg font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-full btn-gradient">
              <Sparkles className="h-4 w-4" strokeWidth={2.5} />
            </span>
            Готово
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
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-black/10">
              <div
                className="h-full rounded-full btn-gradient"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 pb-20 lg:pb-0">
          <div className="mb-6 flex items-center justify-end gap-3">
            <div className="flex items-center gap-2 rounded-full border border-black/5 bg-white px-3 py-1.5 text-sm font-bold shadow-(--shadow-soft) lg:hidden">
              <Flame className="h-4 w-4 text-(--color-brand-amber)" />
              {user.streak}
            </div>
            <div className="flex items-center gap-2 rounded-full border border-black/5 bg-white py-1.5 pl-1.5 pr-3 shadow-(--shadow-soft)">
              <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-(--color-paper-dim) text-xs font-bold">
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  (user.name ?? "?").slice(0, 1).toUpperCase()
                )}
              </span>
              <span className="hidden text-sm font-semibold sm:inline">{user.name}</span>
            </div>
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

import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { levelFromXp, xpProgress } from "@/lib/gamification";
import { AnimatedBar } from "@/components/motion/animated-bar";
import { ProfileEditor } from "@/components/app/profile-editor";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { NAME_CHANGE_COOLDOWN_DAYS } from "@/lib/avatars";
import { isAdminSession } from "@/lib/admin";
import { WebAuthnEnroll } from "@/components/app/webauthn-enroll";
import { DeleteAccountCard } from "@/components/app/delete-account-button";
import { Flame, Star, Lock, Moon, LifeBuoy, ChevronRight, ShieldCheck, Fingerprint } from "lucide-react";

export default async function ProfilePage() {
  const session = await auth();
  const userId = session!.user.id;
  const admin = isAdminSession(session);

  const [user, achievements, unlocked, totalAttempts, adminUnread, authenticators] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.achievement.findMany(),
    prisma.userAchievement.findMany({ where: { userId }, select: { achievementId: true } }),
    prisma.attempt.count({ where: { userId } }),
    admin ? prisma.supportMessage.count({ where: { fromAdmin: false, read: false } }) : Promise.resolve(0),
    prisma.authenticator.findMany({ where: { userId }, select: { id: true, createdAt: true }, orderBy: { createdAt: "desc" } }),
  ]);

  const unlockedIds = new Set(unlocked.map((u) => u.achievementId));
  const level = levelFromXp(user.xp);
  const progress = xpProgress(user.xp);

  // Server component: reading the real clock here is intentional — the lock
  // countdown must reflect "now" at request time.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const nameLockedDaysLeft = user.nameChangedAt
    ? Math.max(
        0,
        Math.ceil(
          NAME_CHANGE_COOLDOWN_DAYS - (now - user.nameChangedAt.getTime()) / 86_400_000
        )
      )
    : 0;

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Профиль</h1>

      <div className="mt-6">
        <ProfileEditor
          initialName={user.name ?? ""}
          initialAvatarKey={user.avatarKey}
          image={user.image}
          nameLockedDaysLeft={nameLockedDaysLeft}
        />
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-3">
        <div className="card-surface p-6 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-(--color-brand-amber)">
            <Flame className="h-7 w-7" />
          </span>
          <div className="font-display mt-3 text-2xl font-extrabold">{user.streak}</div>
          <div className="text-xs font-semibold text-(--color-ink-soft)">дней подряд</div>
        </div>
        <div className="card-surface p-6 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-(--color-sky-2) text-(--color-brand-blue)">
            <Star className="h-7 w-7" />
          </span>
          <div className="font-display mt-3 text-2xl font-extrabold">{level}</div>
          <div className="text-xs font-semibold text-(--color-ink-soft)">уровень · {user.xp} XP</div>
        </div>
        <div className="card-surface p-6 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-(--color-brand-green)">
            <Flame className="h-7 w-7" />
          </span>
          <div className="font-display mt-3 text-2xl font-extrabold">{totalAttempts}</div>
          <div className="text-xs font-semibold text-(--color-ink-soft)">заданий решено</div>
        </div>
      </div>

      <div className="card-surface mt-5 p-6">
        <div className="flex items-center justify-between text-sm font-semibold">
          <span>Уровень {level}</span>
          <span className="text-(--color-ink-soft)">{progress.current}/{progress.needed} XP до след. уровня</span>
        </div>
        <AnimatedBar percent={progress.percent} className="btn-gradient" trackClassName="mt-2 h-2.5" />
      </div>

      <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-(--color-ink-soft)">Настройки</h2>
      <div className="mt-3 space-y-2.5">
        <div className="card-surface flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--color-sky-2) text-(--color-brand-blue)">
              <Moon className="h-4.5 w-4.5" />
            </span>
            <div>
              <div className="text-sm font-bold">Тёмная тема</div>
              <div className="text-xs text-(--color-ink-soft)">Переключается сразу, запоминается на этом устройстве</div>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <div className="card-surface p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--color-sky-2) text-(--color-brand-blue)">
              <Fingerprint className="h-4.5 w-4.5" />
            </span>
            <div>
              <div className="text-sm font-bold">Вход по отпечатку</div>
              <div className="text-xs text-(--color-ink-soft)">Быстрый вход без пароля на этом устройстве</div>
            </div>
          </div>
          <div className="mt-3.5 pl-[3.25rem]">
            <WebAuthnEnroll
              devices={authenticators.map((a) => ({ id: a.id, createdAt: a.createdAt.toISOString() }))}
            />
          </div>
        </div>

        <Link
          href="/app/support"
          className="card-surface press-spring flex items-center justify-between gap-3 p-4"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-(--color-brand-green)">
              <LifeBuoy className="h-4.5 w-4.5" />
            </span>
            <div>
              <div className="text-sm font-bold">Поддержка</div>
              <div className="text-xs text-(--color-ink-soft)">Вопрос, идея или что-то не работает — напиши нам</div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-(--color-ink-soft)" />
        </Link>

        {admin && (
          <Link
            href="/app/admin/support"
            className="card-surface press-spring flex items-center justify-between gap-3 p-4"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--color-sky-2) text-(--color-brand-violet)">
                <ShieldCheck className="h-4.5 w-4.5" />
              </span>
              <div>
                <div className="flex items-center gap-2 text-sm font-bold">
                  Сообщения студентов
                  {adminUnread > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-(--color-brand-pink) px-1.5 text-[0.65rem] font-bold text-white">
                      {adminUnread}
                    </span>
                  )}
                </div>
                <div className="text-xs text-(--color-ink-soft)">Админ-режим — видно только тебе</div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-(--color-ink-soft)" />
          </Link>
        )}

        <DeleteAccountCard confirmTarget={user.username ?? user.email ?? ""} />
      </div>

      <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-(--color-ink-soft)">Достижения</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {achievements.map((a) => {
          const isUnlocked = unlockedIds.has(a.id);
          return (
            <div
              key={a.id}
              className={`card-surface flex flex-col items-center gap-2 p-5 text-center ${
                isUnlocked ? "" : "opacity-50"
              }`}
            >
              <div className="text-3xl">{isUnlocked ? a.icon : <Lock className="h-7 w-7 text-(--color-ink-soft)" />}</div>
              <div className="text-sm font-bold">{a.title}</div>
              <div className="text-xs text-(--color-ink-soft)">{a.description}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

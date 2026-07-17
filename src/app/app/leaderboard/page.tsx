import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { levelFromXp } from "@/lib/gamification";
import { UserAvatar } from "@/components/app/user-avatar";
import { Trophy, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

const medalColor = ["#f59e0b", "#94a3b8", "#b45309"];

export default async function LeaderboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const top = await prisma.user.findMany({
    orderBy: { xp: "desc" },
    take: 50,
    select: { id: true, name: true, image: true, avatarKey: true, xp: true, streak: true },
  });

  const isInTop = top.some((u) => u.id === userId);

  let me: (typeof top)[number] & { rank: number } | null = null;
  if (!isInTop) {
    const meRow = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, image: true, avatarKey: true, xp: true, streak: true },
    });
    if (meRow) {
      const higherCount = await prisma.user.count({ where: { xp: { gt: meRow.xp } } });
      me = { ...meRow, rank: higherCount + 1 };
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Рейтинг</h1>
      <p className="mt-1 text-(--color-ink-soft)">
        Реальный топ учеников по опыту (XP) — набирается за решённые задания и стрики.
      </p>

      <div className="mt-8 space-y-2">
        {top.length === 0 && (
          <div className="card-surface p-8 text-center text-sm text-(--color-ink-soft)">
            Пока в рейтинге пусто — реши первое задание и появись здесь одним из первых.
          </div>
        )}

        {top.map((u, i) => (
          <div
            key={u.id}
            className={cn(
              "card-surface flex items-center gap-4 p-4",
              u.id === userId && "border-2 border-(--color-brand-blue)"
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center">
              {i < 3 ? (
                <Trophy className="h-5 w-5" style={{ color: medalColor[i] }} />
              ) : (
                <span className="text-sm font-bold text-(--color-ink-soft)">{i + 1}</span>
              )}
            </div>

            <UserAvatar
              avatarKey={u.avatarKey}
              image={u.image}
              name={u.name}
              className="h-9 w-9 shrink-0 text-xs"
              emojiClassName="text-lg"
            />

            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">
                {u.name ?? "Без имени"} {u.id === userId && <span className="text-(--color-brand-blue)">(ты)</span>}
              </div>
              <div className="text-xs text-(--color-ink-soft)">Уровень {levelFromXp(u.xp)}</div>
            </div>

            <div className="flex shrink-0 items-center gap-1 text-xs font-semibold text-(--color-ink-soft)">
              <Flame className="h-3.5 w-3.5 text-(--color-brand-amber)" />
              {u.streak}
            </div>

            <span className="shrink-0 text-sm font-bold">{u.xp} XP</span>
          </div>
        ))}
      </div>

      {me && (
        <>
          <div className="mt-6 text-center text-xs font-semibold text-(--color-ink-soft)">⋯</div>
          <div className="mt-2 card-surface flex items-center gap-4 border-2 border-(--color-brand-blue) p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center">
              <span className="text-sm font-bold text-(--color-ink-soft)">{me.rank}</span>
            </div>
            <UserAvatar
              avatarKey={me.avatarKey}
              image={me.image}
              name={me.name}
              className="h-9 w-9 shrink-0 text-xs"
              emojiClassName="text-lg"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">
                {me.name ?? "Без имени"} <span className="text-(--color-brand-blue)">(ты)</span>
              </div>
              <div className="text-xs text-(--color-ink-soft)">Уровень {levelFromXp(me.xp)}</div>
            </div>
            <span className="shrink-0 text-sm font-bold">{me.xp} XP</span>
          </div>
        </>
      )}
    </div>
  );
}

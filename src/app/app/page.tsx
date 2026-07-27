import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/lib/admin";
import { ensureDailyMetricRow, computeAndSaveDailyMetric, ensureTodayPlanItem } from "@/lib/engine";
import { sportLabel, formatDuration } from "@/lib/sports";
import { Ring, recoveryColor } from "@/components/app/rings";
import { LinkButton } from "@/components/ui/button";
import { ArrowRight, Moon, Zap, Dumbbell, Info, Watch } from "lucide-react";

function today() {
  return new Date().toISOString().slice(0, 10);
}

const SEVERITY_COLOR: Record<string, string> = { POSITIVE: "var(--color-brand-green)", WARNING: "var(--color-brand-pink)", INFO: "var(--color-brand-blue)" };

export default async function DashboardPage() {
  const session = await auth();
  if (isAdminSession(session)) redirect("/app/admin");
  const userId = session!.user.id;
  const date = today();

  const profile = await prisma.athleteProfile.findUnique({ where: { userId } });
  if (!profile?.onboardingCompletedAt) {
    // Onboarding modal (in the layout) handles this — nothing meaningful to show yet.
    return (
      <div className="card-surface p-8 text-center text-(--color-ink-soft)">Заверши настройку профиля, чтобы увидеть дашборд.</div>
    );
  }

  try {
    await ensureDailyMetricRow(userId, date);
    await computeAndSaveDailyMetric(userId, date);
    await ensureTodayPlanItem(userId);
  } catch (e) {
    console.error("dashboard recompute failed", e);
  }

  const [metric, planItem, insights, deviceCount] = await Promise.all([
    prisma.dailyMetric.findUnique({ where: { userId_date: { userId, date: new Date(date) } } }),
    prisma.planItem.findFirst({ where: { userId, date: new Date(date) } }),
    prisma.insight.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.deviceConnection.count({ where: { userId, status: "CONNECTED" } }),
  ]);

  const firstName = session!.user.name?.split(" ")[0] ?? "";
  const sleepHours = metric?.sleepDurationSec ? Math.round((metric.sleepDurationSec / 3600) * 10) / 10 : null;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Привет{firstName ? `, ${firstName}` : ""} 👋</h1>
          <p className="mt-1 text-(--color-ink-soft)">{sportLabel(profile.primarySport)} · вот твоя готовность на сегодня.</p>
        </div>
        {deviceCount === 0 && (
          <LinkButton href="/app/devices" variant="outline" size="sm">
            <Watch className="h-4 w-4" /> Подключить устройство
          </LinkButton>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card-surface flex flex-col items-center gap-2 p-6">
          <Ring value={metric?.recoveryScore ?? 0} color={recoveryColor(metric?.recoveryScore)} label={metric?.recoveryScore != null ? String(metric.recoveryScore) : "—"} sublabel="Готовность" />
          <Link href="/app/training#why" className="flex items-center gap-1 text-xs font-semibold text-(--color-brand-blue)">
            <Info className="h-3.5 w-3.5" /> Почему?
          </Link>
        </div>
        <div className="card-surface flex flex-col items-center gap-2 p-6">
          <Ring value={metric?.strain ?? 0} max={21} color="var(--color-brand-violet)" label={metric?.strain != null ? metric.strain.toFixed(1) : "—"} sublabel="Нагрузка (Strain)" />
        </div>
        <div className="card-surface flex flex-col items-center gap-2 p-6">
          <Ring value={sleepHours ?? 0} max={profile.sleepGoalHours} color="var(--color-brand-blue)" label={sleepHours != null ? `${sleepHours}ч` : "—"} sublabel="Сон" />
          <Link href="/app/sleep" className="flex items-center gap-1 text-xs font-semibold text-(--color-brand-blue)">
            <Moon className="h-3.5 w-3.5" /> Подробнее
          </Link>
        </div>
      </div>

      {planItem && (
        <div className="mt-6 card-surface p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-(--color-ink-soft)">
              <Dumbbell className="h-4 w-4" /> Тренировка на сегодня
            </div>
            <Link href="/app/training" className="text-sm font-semibold text-(--color-brand-blue)">Весь план</Link>
          </div>
          <div className="mt-2 font-display text-xl font-bold">{planItem.title}</div>
          <p className="mt-1 text-sm text-(--color-ink-soft)">{planItem.description}</p>
          {planItem.targetDurationSec && (
            <div className="mt-2 text-sm font-semibold">{formatDuration(planItem.targetDurationSec)}</div>
          )}
          <div id="why" className="mt-4 rounded-2xl bg-(--color-paper-dim) p-4 text-sm">
            <div className="flex items-center gap-1.5 font-bold"><Zap className="h-4 w-4 text-(--color-brand-amber)" /> Почему именно так</div>
            <p className="mt-1.5 text-(--color-ink-soft)">{planItem.adjustReason ?? planItem.explanation}</p>
          </div>
        </div>
      )}

      {insights.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-(--color-ink-soft)">Лента изменений</h2>
          <div className="space-y-2.5">
            {insights.map((i) => (
              <div key={i.id} className="card-surface flex items-start gap-3 p-4">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: SEVERITY_COLOR[i.severity] ?? SEVERITY_COLOR.INFO }} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold">{i.title}</div>
                  <p className="mt-0.5 text-sm text-(--color-ink-soft)">{i.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { href: "/app/training", label: "Тренировки", icon: Dumbbell },
          { href: "/app/sleep", label: "Сон", icon: Moon },
          { href: "/app/nutrition", label: "Питание", icon: Zap },
          { href: "/app/coach", label: "Спросить тренера", icon: ArrowRight },
        ].map((l) => (
          <Link key={l.href} href={l.href} className="card-surface press-spring flex flex-col items-center gap-2 p-5 text-center">
            <l.icon className="h-5 w-5 text-(--color-brand-blue)" />
            <span className="text-sm font-semibold">{l.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

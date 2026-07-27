"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { computeAndSaveThresholds, ensureActivePlan } from "@/lib/engine";
import { WEEKDAYS } from "@/lib/sports";
import type { Sex } from "@prisma/client";

export type OnboardingInput = {
  primarySport: string;
  sex: Sex | null;
  birthDate: string | null; // YYYY-MM-DD
  heightCm: number | null;
  weightKg: number | null;
  restingHrManual: number | null;
  maxHrManual: number | null;
  goalType: string | null;
  goalEventName: string | null;
  goalEventDate: string | null;
  experienceYears: number | null;
  weeklyAvailabilityMin: Partial<Record<(typeof WEEKDAYS)[number], number>>;
  sleepGoalHours: number;
  dietType: string | null;
  allergies: string | null;
};

export async function completeOnboarding(input: OnboardingInput): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Нужно войти в аккаунт." };
  const userId = session.user.id;

  if (!input.primarySport) return { ok: false, error: "Выбери основной вид спорта." };
  const hasAnyAvailability = Object.values(input.weeklyAvailabilityMin).some((v) => (v ?? 0) > 0);
  if (!hasAnyAvailability) return { ok: false, error: "Отметь хотя бы один день, когда ты можешь тренироваться." };

  await prisma.athleteProfile.upsert({
    where: { userId },
    update: {
      primarySport: input.primarySport, sex: input.sex ?? undefined,
      birthDate: input.birthDate ? new Date(input.birthDate) : null,
      heightCm: input.heightCm, weightKg: input.weightKg,
      restingHrManual: input.restingHrManual, maxHrManual: input.maxHrManual,
      goalType: input.goalType, goalEventName: input.goalEventName,
      goalEventDate: input.goalEventDate ? new Date(input.goalEventDate) : null,
      experienceYears: input.experienceYears, weeklyAvailabilityMin: input.weeklyAvailabilityMin,
      sleepGoalHours: input.sleepGoalHours, dietType: input.dietType, allergies: input.allergies,
      onboardingCompletedAt: new Date(),
    },
    create: {
      userId, primarySport: input.primarySport, sex: input.sex ?? undefined,
      birthDate: input.birthDate ? new Date(input.birthDate) : null,
      heightCm: input.heightCm, weightKg: input.weightKg,
      restingHrManual: input.restingHrManual, maxHrManual: input.maxHrManual,
      goalType: input.goalType, goalEventName: input.goalEventName,
      goalEventDate: input.goalEventDate ? new Date(input.goalEventDate) : null,
      experienceYears: input.experienceYears, weeklyAvailabilityMin: input.weeklyAvailabilityMin,
      sleepGoalHours: input.sleepGoalHours, dietType: input.dietType, allergies: input.allergies,
      onboardingCompletedAt: new Date(),
    },
  });

  await prisma.nutritionProfile.upsert({ where: { userId }, update: {}, create: { userId } });

  // Best-effort initial computation so the dashboard isn't empty the moment
  // onboarding finishes — a manual max/resting HR is already enough for a
  // first (low-confidence) threshold snapshot and a starter plan.
  try {
    await computeAndSaveThresholds(userId, input.primarySport);
    await ensureActivePlan(userId);
  } catch {
    // Non-fatal — the dashboard/cron will retry these on next load.
  }

  revalidatePath("/app", "layout");
  return { ok: true };
}

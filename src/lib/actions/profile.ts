"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { avatarByKey, NAME_CHANGE_COOLDOWN_DAYS } from "@/lib/avatars";

export type ProfileUpdateResult = { ok: true } | { ok: false; error: string };

export async function updateProfile(formData: FormData): Promise<ProfileUpdateResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Нужно войти в аккаунт." };
  const userId = session.user.id;

  const rawName = (formData.get("name") as string | null)?.trim() ?? "";
  const rawAvatar = (formData.get("avatarKey") as string | null) ?? "";

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { name: true, nameChangedAt: true },
  });

  const data: { name?: string; nameChangedAt?: Date; avatarKey?: string } = {};

  if (rawAvatar && avatarByKey(rawAvatar)) {
    data.avatarKey = rawAvatar;
  }

  if (rawName && rawName !== user.name) {
    if (rawName.length < 2 || rawName.length > 24) {
      return { ok: false, error: "Ник должен быть от 2 до 24 символов." };
    }
    if (user.nameChangedAt) {
      const daysSince = (Date.now() - user.nameChangedAt.getTime()) / 86_400_000;
      if (daysSince < NAME_CHANGE_COOLDOWN_DAYS) {
        const daysLeft = Math.ceil(NAME_CHANGE_COOLDOWN_DAYS - daysSince);
        return {
          ok: false,
          error: `Ник можно менять раз в ${NAME_CHANGE_COOLDOWN_DAYS} дней. Следующая смена через ${daysLeft} дн.`,
        };
      }
    }
    data.name = rawName;
    data.nameChangedAt = new Date();
  }

  if (Object.keys(data).length === 0) return { ok: true };

  await prisma.user.update({ where: { id: userId }, data });
  revalidatePath("/app", "layout");
  return { ok: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { topUpTopic, difficultyForUser } from "@/lib/task-bank";
import { isAiEnabled } from "@/lib/ai";

export type GenerateMoreResult = { ok: true; created: number } | { ok: false; error: string };

export async function generateMoreTasksForTopic(topicId: string): Promise<GenerateMoreResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Не авторизован" };
  if (!isAiEnabled()) return { ok: false, error: "ИИ временно недоступен — попробуй позже." };

  const topic = await prisma.topic.findUnique({ where: { id: topicId }, select: { subject: { select: { slug: true } }, slug: true } });
  if (!topic) return { ok: false, error: "Тема не найдена" };

  const [lo, hi] = await difficultyForUser(session.user.id);
  const difficulty = Math.round((lo + hi) / 2);

  const created = await topUpTopic(topicId, difficulty, 5);
  if (created.length === 0) {
    return { ok: false, error: "Не получилось сгенерировать новые задания — попробуй ещё раз." };
  }

  revalidatePath(`/app/subjects/${topic.subject.slug}/topics/${topic.slug}`);
  revalidatePath("/app");
  return { ok: true, created: created.length };
}

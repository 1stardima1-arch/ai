"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PREP_LEVELS } from "@/lib/prep-level";

// Saves the student's onboarding choices: which subjects they're taking and
// their self-assessed level. Subjects replace previous enrollments (the flow
// can be re-run from the profile later if we add that).
export async function completeSetup(input: {
  subjectIds: string[];
  prepLevel: string;
}): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false };
  const userId = session.user.id;

  const prepLevel = (PREP_LEVELS as readonly string[]).includes(input.prepLevel)
    ? input.prepLevel
    : "INTERMEDIATE";

  // Validate ids against real subjects; ignore anything unknown.
  const valid = await prisma.subject.findMany({
    where: { id: { in: input.subjectIds } },
    select: { id: true },
  });

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { prepLevel } }),
    prisma.userSubject.deleteMany({ where: { userId } }),
    ...valid.map((s) =>
      prisma.userSubject.create({ data: { userId, subjectId: s.id } })
    ),
  ]);

  revalidatePath("/app", "layout");
  return { ok: true };
}

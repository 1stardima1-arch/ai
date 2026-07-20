// Deletes every student account and everything tied to it (progress,
// attempts, achievements, AI chat history, support messages) — the
// User.* relations are all `onDelete: Cascade`, so removing User rows is
// enough. Subjects/topics/tasks/achievements (the actual exam content,
// not user-specific) are untouched.
//
// Irreversible. Requires RESET_USERS_CONFIRM=yes so it can't run by accident
// (e.g. from a copy-pasted command missing the flag).
//
// Usage:
//   RESET_USERS_CONFIRM=yes DATABASE_URL="<prod-url>" npx tsx scripts/reset-users.ts

import { PrismaClient } from "@prisma/client";

async function main() {
  if (process.env.RESET_USERS_CONFIRM !== "yes") {
    console.error(
      "Refusing to run without RESET_USERS_CONFIRM=yes — this permanently deletes every student account."
    );
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const before = await prisma.user.count();
    console.log(`Deleting ${before} user(s) and all their data (attempts, progress, chat, support messages)...`);

    const result = await prisma.user.deleteMany({});

    console.log(`Done. Deleted ${result.count} user(s).`);
    console.log("Subjects/topics/tasks/achievements were not touched.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

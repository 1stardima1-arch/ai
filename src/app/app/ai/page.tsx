import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AiChat } from "@/components/app/ai-chat";

export default async function AiTutorPage() {
  const session = await auth();
  const userId = session!.user.id;

  const history = await prisma.aiMessage.findMany({
    where: { userId, taskId: null },
    orderBy: { createdAt: "asc" },
    take: 40,
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-extrabold sm:text-3xl">
        <span className="gradient-text">ИИ-репетитор</span>
      </h1>
      <p className="mt-1 text-(--color-ink-soft)">
        Спрашивай про любую тему из школьной программы — объясню по-дружески, без занудства.
      </p>

      <div className="mt-6">
        <AiChat
          variant="siri"
          placeholder="Спроси Макса о чём угодно…"
          initialMessages={history.map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content,
          }))}
          suggestions={[
            "Объясни производную простыми словами",
            "Как отличить метафору от сравнения?",
            "Помоги с сочинением по русскому",
          ]}
        />
      </div>
    </div>
  );
}

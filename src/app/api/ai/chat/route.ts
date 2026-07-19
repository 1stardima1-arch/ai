import { NextRequest } from "next/server";
import { APIError } from "groq-sdk";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAiEnabled, streamTutorReply, type ChatMessage } from "@/lib/ai";

function describeGroqError(err: unknown): string {
  if (err instanceof APIError) {
    if (err.status === 401) {
      return "Ключ GROQ_API_KEY недействителен (ошибка 401 от Groq). Проверь, что ключ скопирован полностью, без пробелов и кавычек, и что после его добавления в Vercel сделан redeploy.";
    }
    if (err.status === 404) {
      return `Groq не нашёл модель "${process.env.GROQ_MODEL || "llama-3.3-70b-versatile"}" (ошибка 404). Возможно, модель переименована/снята с поддержки — проверь актуальный список на console.groq.com/docs/models и обнови GROQ_MODEL.`;
    }
    if (err.status === 429) {
      return "Groq вернул ошибку 429 — превышен лимит запросов (бесплатный тариф). Подожди немного и попробуй снова.";
    }
    return `Groq вернул ошибку ${err.status ?? ""}: ${err.message}`;
  }
  return "Не получилось получить ответ от ИИ. Попробуй ещё раз через минуту.";
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;

  const { message, taskId } = (await req.json()) as {
    message: string;
    taskId?: string;
  };

  if (!message?.trim()) {
    return new Response("Message is required", { status: 400 });
  }

  let context: string | undefined;
  if (taskId) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (task) {
      context = `Задание №${task.number}: ${task.statement}\nПравильный ответ: ${task.correctAnswer}\nОбъяснение: ${task.explanation}`;
    }
  }

  const { prepLevel } = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { prepLevel: true },
  });

  await prisma.aiMessage.create({
    data: { userId, role: "user", content: message, taskId },
  });

  const recent = await prisma.aiMessage.findMany({
    where: { userId, ...(taskId ? { taskId } : {}) },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  const history: ChatMessage[] = recent.map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content,
  }));

  const encoder = new TextEncoder();

  if (!isAiEnabled()) {
    const fallback =
      "ИИ-репетитор пока не настроен: добавь бесплатный ключ GROQ_API_KEY в .env (см. README.md — это займёт 2 минуты на console.groq.com/keys).";
    await prisma.aiMessage.create({
      data: { userId, role: "assistant", content: fallback, taskId },
    });
    return new Response(fallback, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }

  const stream = new ReadableStream({
    async start(controller) {
      let full = "";
      try {
        for await (const chunk of streamTutorReply(history, context, prepLevel)) {
          full += chunk;
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (err) {
        const msg = describeGroqError(err);
        controller.enqueue(encoder.encode(msg));
        full = msg;
        console.error("Groq stream error", err);
      } finally {
        await prisma.aiMessage.create({
          data: { userId, role: "assistant", content: full, taskId },
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

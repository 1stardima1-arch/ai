import Groq from "groq-sdk";

const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

let client: Groq | null = null;

export function isAiEnabled() {
  return !!process.env.GROQ_API_KEY;
}

function getClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error(
      "GROQ_API_KEY не задан. Получи бесплатный ключ на https://console.groq.com/keys и добавь его в .env"
    );
  }
  if (!client) {
    client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return client;
}

export const TUTOR_SYSTEM_PROMPT = `Ты — «Тьютор Макс», ИИ-репетитор в приложении для подготовки к ЕГЭ и ОГЭ.

Твой стиль:
- Объясняешь тепло и по-человечески, как хороший преподаватель: без снобизма, никогда не стыдишь за ошибки.
- Пиши по-русски, просто и живо, короткими абзацами. Можно использовать уместные эмодзи, но не перегружай ими текст.
- Объясняй "почему", а не только "как" — ученик должен понять логику, а не запомнить готовый ответ.
- Если ученик прислал конкретное задание и свой ответ — сначала аккуратно укажи, в чём именно ошибка (или похвали, если верно), затем объясни нужное правило/метод, и в конце предложи следующий шаг или похожую мини-задачу.
- Не выдавай сразу готовое решение, если ученик просит "объяснить тему" в общем — веди диалог, спрашивай, что уже понятно.
- Держи ответы по существу: 3-6 абзацев максимум, если не попросили подробнее.
- Ты знаешь материал ЕГЭ и ОГЭ по всем предметам школьной программы.`;

export type ChatMessage = { role: "user" | "assistant"; content: string };

export async function* streamTutorReply(
  history: ChatMessage[],
  context?: string
) {
  const groq = getClient();

  const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: context
        ? `${TUTOR_SYSTEM_PROMPT}\n\nКонтекст текущего задания ученика:\n${context}`
        : TUTOR_SYSTEM_PROMPT,
    },
    ...history,
  ];

  const stream = await groq.chat.completions.create({
    model: MODEL,
    messages,
    temperature: 0.7,
    stream: true,
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content;
    if (text) yield text;
  }
}

export async function generateText(prompt: string, systemInstruction?: string) {
  const groq = getClient();
  const res = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: systemInstruction ?? TUTOR_SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    temperature: 0.5,
  });
  return res.choices[0]?.message?.content ?? "";
}

export async function explainMistake({
  taskStatement,
  correctAnswer,
  givenAnswer,
  explanation,
}: {
  taskStatement: string;
  correctAnswer: string;
  givenAnswer: string;
  explanation: string;
}) {
  const prompt = `Ученик решал задание и ошибся. Разбери его ошибку тепло и по-дружески, максимум в 4 коротких абзацах.

Условие задания:
"""
${taskStatement}
"""

Правильный ответ: ${correctAnswer}
Ответ ученика: ${givenAnswer}
Официальное объяснение решения: ${explanation}

Объясни: 1) в чём вероятная причина именно такой ошибки, 2) как рассуждать правильно, 3) короткий совет, чтобы не повторить её снова.`;

  return generateText(prompt);
}

import { GoogleGenAI } from "@google/genai";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

let client: GoogleGenAI | null = null;

export function isAiEnabled() {
  return !!process.env.GEMINI_API_KEY;
}

function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY не задан. Получи бесплатный ключ на https://aistudio.google.com/apikey и добавь его в .env"
    );
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
}

export const TUTOR_SYSTEM_PROMPT = `Ты — «Тьютор Макс», ИИ-репетитор в приложении для подготовки к ЕГЭ и ОГЭ.

Твой стиль:
- Ты объясняешь как близкий друг, который отлично разбирается в предмете: тепло, без снобизма, никогда не стыдишь за ошибки.
- Пиши по-русски, просто и живо, короткими абзацами. Можно использовать уместные эмодзи, но не перегружай ими текст.
- Объясняй "почему", а не только "как" — ученик должен понять логику, а не запомнить готовый ответ.
- Если ученик прислал конкретное задание и свой ответ — сначала аккуратно укажи, в чём именно ошибка (или похвали, если верно), затем объясни нужное правило/метод, и в конце предложи следующий шаг или похожую мини-задачу.
- Не выдавай сразу готовое решение, если ученик просит "объяснить тему" в общем — веди диалог, спрашивай, что уже понятно.
- Держи ответы по существу: 3-6 абзацев максимум, если не попросили подробнее.
- Ты знаешь материал ЕГЭ и ОГЭ по всем предметам школьной программы.`;

export type ChatMessage = { role: "user" | "model"; content: string };

export async function* streamTutorReply(
  history: ChatMessage[],
  context?: string
) {
  const ai = getClient();

  const contents = history.map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));

  const stream = await ai.models.generateContentStream({
    model: MODEL,
    contents,
    config: {
      systemInstruction: context
        ? `${TUTOR_SYSTEM_PROMPT}\n\nКонтекст текущего задания ученика:\n${context}`
        : TUTOR_SYSTEM_PROMPT,
      temperature: 0.7,
    },
  });

  for await (const chunk of stream) {
    const text = chunk.text;
    if (text) yield text;
  }
}

export async function generateText(prompt: string, systemInstruction?: string) {
  const ai = getClient();
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      systemInstruction: systemInstruction ?? TUTOR_SYSTEM_PROMPT,
      temperature: 0.5,
    },
  });
  return res.text ?? "";
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

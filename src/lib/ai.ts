import Groq from "groq-sdk";

const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
// A vision-capable model, needed only for grading photos of handwritten
// detailed-answer/essay tasks (submitAttemptPhoto) — separate from MODEL
// since not every model Groq hosts can see images.
const VISION_MODEL = process.env.GROQ_VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct";

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

// How the tutor should adapt to the student's self-assessed level (from onboarding).
export function levelInstruction(prepLevel: string | null | undefined): string {
  switch (prepLevel) {
    case "BEGINNER":
      return "Уровень ученика: НОВИЧОК, готовится с нуля. Объясняй максимально просто, маленькими шагами, с бытовыми примерами. Избегай терминов без расшифровки, чаще подбадривай.";
    case "ADVANCED":
      return "Уровень ученика: ПРОДВИНУТЫЙ, целится в высокие баллы. Можно говорить компактно и по делу, разбирать тонкости, ловушки экзамена и сложные случаи. Предлагай задачи посложнее.";
    case "INTERMEDIATE":
      return "Уровень ученика: СРЕДНИЙ — база есть, но есть пробелы. Объясняй ясно, сверяйся, что базовые шаги понятны, и закрывай типичные пробелы.";
    default:
      return "";
  }
}

export async function* streamTutorReply(
  history: ChatMessage[],
  context?: string,
  prepLevel?: string | null
) {
  const groq = getClient();

  const levelNote = levelInstruction(prepLevel);
  const systemParts = [TUTOR_SYSTEM_PROMPT];
  if (levelNote) systemParts.push(levelNote);
  if (context) systemParts.push(`Контекст текущего задания ученика:\n${context}`);

  const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemParts.join("\n\n") },
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

// Grades a photo of a handwritten answer to a DETAILED_ANSWER/ESSAY task —
// the ФИПИ-style "часть 2" tasks that have no single string answer to
// string-compare against. Asks the model to act as an exam expert and
// return a strict score + written feedback, the same way a human checker
// would mark a scanned answer sheet.
export async function gradeAnswerPhoto({
  taskStatement,
  referenceAnswer,
  explanation,
  maxScore,
  imageBase64,
  mimeType,
}: {
  taskStatement: string;
  referenceAnswer: string;
  explanation: string;
  maxScore: number;
  imageBase64: string;
  mimeType: string;
}): Promise<{ score: number; feedback: string }> {
  const groq = getClient();

  const prompt = `Ты — опытный эксперт ЕГЭ/ОГЭ, проверяющий развёрнутый ответ ученика по фотографии его рукописного решения.

Условие задания:
"""
${taskStatement}
"""

Критерии/эталонный ответ:
"""
${referenceAnswer}
"""

Разбор правильного решения:
"""
${explanation}
"""

Максимальный балл за задание: ${maxScore}.

Внимательно прочитай текст на фотографии (почерк может быть неровным, могут быть зачёркивания — старайся распознать максимально точно). Сравни с критериями и оцени объективно и справедливо, как настоящий эксперт: не завышай баллы из вежливости и не занижай из излишней строгости. Если на фото вообще не видно решения по теме задания, ставь 0.

Ответь СТРОГО в виде JSON без какого-либо текста до или после:
{"score": <целое число от 0 до ${maxScore}>, "feedback": "<обратная связь на русском, тепло и по делу, 3-5 предложений: что верно, чего не хватает, как улучшить>"}`;

  const res = await groq.chat.completions.create({
    model: VISION_MODEL,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
        ],
      },
    ],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const raw = res.choices[0]?.message?.content ?? "{}";
  let parsed: { score?: unknown; feedback?: unknown };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("ИИ вернул ответ в неожиданном формате при проверке фото");
  }

  const scoreNum = typeof parsed.score === "number" ? parsed.score : Number(parsed.score);
  const score = Number.isFinite(scoreNum) ? Math.max(0, Math.min(maxScore, Math.round(scoreNum))) : 0;
  const feedback =
    typeof parsed.feedback === "string" && parsed.feedback.trim()
      ? parsed.feedback.trim().slice(0, 2000)
      : "Не получилось сформировать обратную связь — попробуй переснять фото почётче и отправить ещё раз.";

  return { score, feedback };
}

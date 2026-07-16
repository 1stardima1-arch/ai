import type { Task } from "@prisma/client";

function normalize(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/,/g, ".")
    .replace(/\s+/g, " ")
    .replace(/[.!?]+$/, "");
}

function asNumber(s: string) {
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** Free-form (essay / detailed answer) tasks are reviewed by the AI tutor, not auto-graded. */
export function isAutoGraded(type: Task["type"]) {
  return type === "SHORT_ANSWER" || type === "CHOICE" || type === "MULTI_CHOICE" || type === "MATCHING";
}

export function gradeAnswer(task: Pick<Task, "type" | "correctAnswer">, givenAnswer: string): boolean {
  if (!isAutoGraded(task.type)) return true;

  const a = normalize(givenAnswer);
  const b = normalize(task.correctAnswer);
  if (a === b) return true;

  const na = asNumber(a);
  const nb = asNumber(b);
  if (na !== null && nb !== null) return Math.abs(na - nb) < 1e-6;

  return false;
}

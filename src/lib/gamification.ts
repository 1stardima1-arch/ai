export const XP_PER_LEVEL = 150;

export function levelFromXp(xp: number) {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function xpProgress(xp: number) {
  const inLevel = xp % XP_PER_LEVEL;
  return { current: inLevel, needed: XP_PER_LEVEL, percent: Math.round((inLevel / XP_PER_LEVEL) * 100) };
}

export function xpForAttempt({
  isCorrect,
  difficulty,
}: {
  isCorrect: boolean;
  difficulty: number;
}) {
  if (!isCorrect) return 2; // small XP just for trying, keeps momentum
  return 8 + difficulty * 4;
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isYesterday(a: Date, b: Date) {
  const y = new Date(b);
  y.setDate(y.getDate() - 1);
  return isSameDay(a, y);
}

/** Returns the updated streak count given the last practice date. */
export function computeStreak(lastPracticeDate: Date | null, streak: number, now = new Date()) {
  if (!lastPracticeDate) return 1;
  if (isSameDay(lastPracticeDate, now)) return streak || 1;
  if (isYesterday(lastPracticeDate, now)) return (streak || 0) + 1;
  return 1;
}

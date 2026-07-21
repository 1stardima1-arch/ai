export const XP_PER_LEVEL = 150;

export function levelFromXp(xp: number) {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function xpProgress(xp: number) {
  const inLevel = xp % XP_PER_LEVEL;
  return { current: inLevel, needed: XP_PER_LEVEL, percent: Math.round((inLevel / XP_PER_LEVEL) * 100) };
}

// Task difficulty band (1-5) for a student — starts from their self-reported
// onboarding level, then genuinely ramps up as their XP level climbs (which
// itself only grows meaningfully from correct answers — xpForAttempt below
// gives 8+ XP for a correct answer vs. 2 for a wrong one), so a student who
// keeps answering correctly gets harder tasks over time without needing a
// separate accuracy-tracking pass.
export function difficultyBand(prepLevel: string | null | undefined, xpLevel: number): [number, number] {
  const base = prepLevel === "BEGINNER" ? 1 : prepLevel === "ADVANCED" ? 3 : 2;
  const bump = Math.floor((xpLevel - 1) / 3);
  const lo = Math.min(5, base + bump);
  const hi = Math.min(5, lo + 2);
  return [lo, hi];
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

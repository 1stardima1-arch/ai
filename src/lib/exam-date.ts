// Next real exam wave — the main ЕГЭ/ОГЭ period in Russia opens in late May
// (the early wave typically starts around May 23-26). Used for the dashboard
// countdown. When the current date is past this year's exam, roll to next year.
export function nextExamDate(now = new Date()): Date {
  const year = now.getFullYear();
  const thisYear = new Date(year, 4, 25); // May 25 (month is 0-indexed)
  return now < thisYear ? thisYear : new Date(year + 1, 4, 25);
}

export function daysUntil(target: Date, now = new Date()): number {
  const msPerDay = 86_400_000;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.ceil((target.getTime() - startOfToday.getTime()) / msPerDay);
}

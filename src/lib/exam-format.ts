// Duration is a deliberate proportional approximation — not sourced from an
// official ФИПИ time allocation for every subject/year (that's set by
// Рособрнадзор/ФИПИ and revised periodically; this app has no way to
// verify current figures from this environment, and guessing at "the
// official number" and being wrong would misinform students about their
// actual exam pacing, which is worse than an honest approximation). Auto-
// graded items get a quick few minutes each; the written part gets the
// bulk of the time, matching how real ЕГЭ/ОГЭ exams are actually paced.
export function estimateExamDurationMin(autoGradedCount: number, freeformCount: number): number {
  return Math.max(20, autoGradedCount * 3 + freeformCount * 40);
}

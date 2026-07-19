// Shared constant, importable from both server actions ("use server" files may
// only export async functions, so this can't live in actions/onboarding.ts)
// and client components.
export const PREP_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
export type PrepLevel = (typeof PREP_LEVELS)[number];

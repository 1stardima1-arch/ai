"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PartyPopper, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// Fired right after a task is graded, in both the correct/incorrect sense —
// wrong answers still earn a small "for trying" XP (see xpForAttempt in
// gamification.ts), so this always has something encouraging to say rather
// than only celebrating correct answers. Self-contained: each call site
// mounts its own instance and controls it via the `trigger` key, no shared
// toast queue/provider needed since at most one of these is visible per
// task at a time.
export function XpToast({
  trigger,
  xp,
  isCorrect,
}: {
  trigger: number;
  xp: number;
  isCorrect: boolean | null;
}) {
  const [visible, setVisible] = useState(false);
  const [seenTrigger, setSeenTrigger] = useState(0);
  const reduceMotion = useReducedMotion();

  // Adjusting state in response to a prop change belongs during render, not
  // in an effect (see react.dev/learn/you-might-not-need-an-effect) — this
  // is the one-render "catch up" pattern React explicitly endorses for it.
  if (trigger !== seenTrigger && trigger !== 0) {
    setSeenTrigger(trigger);
    setVisible(true);
  }

  useEffect(() => {
    if (seenTrigger === 0) return;
    const timer = setTimeout(() => setVisible(false), 2800);
    return () => clearTimeout(timer);
  }, [seenTrigger]);

  const success = isCorrect !== false;
  const title = success ? "Поздравляем!" : "Получится в другой раз";
  const subtitle = success ? `Ты получил +${xp} XP` : `+${xp} XP за попытку`;
  const Icon = success ? PartyPopper : Sparkles;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4"
      style={{ bottom: "calc(6.5rem + env(safe-area-inset-bottom))" }}
    >
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className={cn(
              "pointer-events-auto flex items-center gap-3 rounded-full py-3 pl-3 pr-5 shadow-(--shadow-lift)",
              success ? "btn-gradient" : "bg-(--color-surface) border border-black/10 dark:border-white/10"
            )}
          >
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                success ? "bg-white/20" : "bg-(--color-sky-2)"
              )}
            >
              <Icon className={cn("h-5 w-5", success ? "text-white" : "text-(--color-brand-blue)")} />
            </span>
            <div className="text-left">
              <div className={cn("text-sm font-bold", success ? "text-white" : "text-(--color-ink)")}>
                {title}
              </div>
              <div className={cn("text-xs font-semibold", success ? "text-white/85" : "text-(--color-ink-soft)")}>
                {subtitle}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { IntroParticles, StaggerTitle } from "@/components/app/intro-fx";

// A real native-style launch screen — shown briefly every time the app is
// cold-started (opened fresh, not on in-app navigation), not just once ever
// like <Onboarding>. Mounted in the root layout (not just app/layout.tsx) so
// it plays on the very first cold start too, before the user has signed in —
// the installed TWA's start_url is /app, which redirects straight to /login
// for a logged-out user, so without this the very first launch went from the
// native OS splash straight to a static login page with no transition at
// all. Next.js keeps the root layout mounted across client-side navigations,
// so this only remounts on a real reload/cold start — exactly a launch
// screen's job, no flags needed. Restricted to /login and /app so a regular
// browser visit to the marketing site doesn't get hijacked by a 3s overlay.
export function AppSplash() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);
  const eligible = pathname === "/login" || pathname?.startsWith("/app") === true;

  useEffect(() => {
    if (!eligible) return;
    // Slow, deliberate on purpose — this is the one moment that should read
    // as "a real app is starting up", not a flash students barely register
    // before the dashboard appears.
    const timer = setTimeout(() => setVisible(false), reduceMotion ? 250 : 3000);
    return () => clearTimeout(timer);
  }, [reduceMotion, eligible]);

  return (
    <AnimatePresence>
      {eligible && visible && (
        <motion.div
          className="fixed inset-0 z-100 flex flex-col items-center justify-center overflow-hidden text-white"
          style={{
            background:
              "radial-gradient(120% 90% at 20% 0%, rgba(90,141,255,0.35), transparent 55%), radial-gradient(120% 90% at 90% 100%, rgba(176,107,255,0.3), transparent 55%), linear-gradient(165deg, #101019 0%, #0b0b14 60%, #0d0c18 100%)",
          }}
          exit={{ opacity: 0, scale: reduceMotion ? 1 : 1.04 }}
          transition={{ duration: reduceMotion ? 0.15 : 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <IntroParticles />

          <motion.span
            className="siri-orb relative h-20 w-20"
            initial={reduceMotion ? false : { scale: 0.35, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />

          <motion.div
            className="relative z-10 mt-7"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.3 }}
          >
            <StaggerTitle text="Балл" className="font-display text-4xl font-extrabold" />
          </motion.div>

          <motion.p
            className="relative z-10 mt-2 max-w-xs px-8 text-center text-sm text-white/55"
            initial={reduceMotion ? { opacity: 0.55 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.7, duration: 0.6 }}
          >
            ИИ-репетитор для ЕГЭ и ОГЭ — понятная теория и разбор ошибок
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

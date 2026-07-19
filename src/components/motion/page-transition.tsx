"use client";

import { useEffect, useState, ViewTransition } from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

const ENTRY_FLAG = "ball-app-entered";

// Route content is wrapped in React's native <ViewTransition> (browser View
// Transitions API, enabled via experimental.viewTransition in next.config.ts)
// so every navigation gets a GPU-composited crossfade instead of a hard cut —
// this is what actually fixes "переход очень резкий": native transitions are
// smooth even on slower phones, unlike a JS-driven fade that competes with
// the rest of the page for the main thread during a route change.
// The Siri rainbow edge glow plays only on the first entry into the app this
// session and whenever the AI assistant tab is opened (it's the "AI moment",
// not an every-page effect).
export function PageTransition({ children, glow = "auto" }: { children: ReactNode; glow?: "auto" | "never" }) {
  const reduceMotion = useReducedMotion();
  const pathname = usePathname();
  const [showGlow, setShowGlow] = useState(false);

  useEffect(() => {
    if (glow === "never" || reduceMotion) return;
    const isAi = pathname?.startsWith("/app/ai") ?? false;
    const firstEntry = !sessionStorage.getItem(ENTRY_FLAG);
    if (firstEntry) sessionStorage.setItem(ENTRY_FLAG, "1");
    if (!isAi && !firstEntry) return;
    const id = requestAnimationFrame(() => setShowGlow(true));
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {showGlow && (
        <motion.div
          className="siri-glow"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.25, times: [0, 0.18, 0.55, 1], ease: "easeInOut" }}
          onAnimationComplete={() => setShowGlow(false)}
        />
      )}
      <ViewTransition default={reduceMotion ? "none" : "auto"}>{children}</ViewTransition>
    </>
  );
}

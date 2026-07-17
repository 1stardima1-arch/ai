"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

const ENTRY_FLAG = "ball-app-entered";

// iOS-style page enter: content springs in quickly; the Siri rainbow edge glow
// plays only on the first entry into the app this session and whenever the AI
// assistant tab is opened (it's the "AI moment", not a every-page effect).
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
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 32, mass: 0.7 }}
      >
        {children}
      </motion.div>
    </>
  );
}

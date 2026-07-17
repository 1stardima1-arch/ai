"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

// iOS-style page enter: the content springs in with a soft blur-up, while a
// Siri/Apple-Intelligence rainbow glow sweeps around the screen edges and fades.
export function PageTransition({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  const [glowDone, setGlowDone] = useState(false);

  return (
    <>
      {!reduceMotion && !glowDone && (
        <motion.div
          className="siri-glow"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.25, times: [0, 0.18, 0.55, 1], ease: "easeInOut" }}
          onAnimationComplete={() => setGlowDone(true)}
        />
      )}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.985, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        transition={{ type: "spring", stiffness: 240, damping: 30, mass: 0.9 }}
      >
        {children}
      </motion.div>
    </>
  );
}

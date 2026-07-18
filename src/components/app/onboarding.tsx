"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const SEEN_FLAG = "ball-onboarded-v1";

// How We Feel-inspired welcome: full-screen saturated color slides, big soft
// morphing blobs floating behind, one large friendly message per screen and
// springy transitions. Shown once, on the first open of the app.
const SLIDES = [
  {
    color: "#4f6bff",
    emoji: "👋",
    title: "Привет! Это Балл",
    text: "Подготовка к ЕГЭ и ОГЭ — без репетиторов и лишнего стресса.",
  },
  {
    color: "#8b5cf6",
    emoji: "📚",
    title: "Реальные задания",
    text: "Формат ФИПИ и простая теория, которую реально понять.",
  },
  {
    color: "#22c55e",
    emoji: "✨",
    title: "ИИ всегда рядом",
    text: "Тьютор Макс объяснит тему и разберёт любую твою ошибку.",
  },
  {
    color: "#f59e0b",
    emoji: "🚀",
    title: "Расти каждый день",
    text: "Новые задания дня, XP, стрики и рейтинг. Погнали!",
  },
];

export function Onboarding() {
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem(SEEN_FLAG)) {
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
  }, []);

  if (!visible) return null;

  const slide = SLIDES[step];
  const last = step === SLIDES.length - 1;

  function finish() {
    localStorage.setItem(SEEN_FLAG, "1");
    setVisible(false);
  }

  function next() {
    if (last) finish();
    else setStep((s) => s + 1);
  }

  return (
    <motion.div
      className="fixed inset-0 z-90 flex flex-col overflow-hidden text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, backgroundColor: slide.color }}
      exit={{ opacity: 0 }}
      transition={{ backgroundColor: { duration: 0.7, ease: "easeInOut" }, opacity: { duration: 0.4 } }}
      style={{ backgroundColor: slide.color }}
    >
      {/* squishy morphing blobs, HWF-style */}
      <div className="blob-morph absolute left-[-18%] top-[-12%] h-[55vw] w-[55vw] max-h-[420px] max-w-[420px]" />
      <div className="blob-morph blob-morph-2 absolute right-[-15%] top-[30%] h-[48vw] w-[48vw] max-h-[380px] max-w-[380px]" />
      <div className="blob-morph blob-morph-3 absolute bottom-[-16%] left-[10%] h-[50vw] w-[50vw] max-h-[400px] max-w-[400px]" />

      <button
        onClick={finish}
        className="press-spring absolute right-5 top-5 z-10 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur-sm"
      >
        Пропустить
      </button>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-8 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="flex flex-col items-center"
          >
            <motion.span
              className="blob-morph relative mb-8 flex h-32 w-32 items-center justify-center bg-white/25 text-6xl"
              initial={reduceMotion ? false : { scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
            >
              {slide.emoji}
            </motion.span>
            <h1 className="font-display max-w-sm text-3xl font-extrabold sm:text-4xl">
              {slide.title}
            </h1>
            <p className="mt-4 max-w-xs text-lg leading-relaxed text-white/85">{slide.text}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 pb-10">
        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <motion.span
              key={i}
              className="h-2 rounded-full bg-white"
              animate={{ width: i === step ? 24 : 8, opacity: i === step ? 1 : 0.45 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          ))}
        </div>
        <motion.button
          onClick={next}
          whileTap={{ scale: 0.94 }}
          className="flex items-center gap-2 rounded-full bg-white px-10 py-4 font-display text-base font-bold shadow-[0_12px_32px_rgba(0,0,0,0.18)]"
          style={{ color: slide.color }}
        >
          {last ? "Погнали" : "Дальше"}
          <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
        </motion.button>
      </div>
    </motion.div>
  );
}

"use client";

import { useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { completeSetup } from "@/lib/actions/onboarding";
import { SubjectIcon } from "@/lib/subject-icon";
import { cn } from "@/lib/utils";

const SEEN_FLAG = "ball-onboarded-v1";

export type OnboardingSubject = {
  id: string;
  name: string;
  examType: "EGE" | "OGE";
  color: string;
  icon: string;
};

// How We Feel-inspired welcome slides…
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
];

// …followed by setup steps: exam → subjects → level (saved to the DB).
const LEVELS = [
  { key: "BEGINNER", emoji: "🌱", title: "Только начинаю", text: "Готовлюсь с нуля, нужна база" },
  { key: "INTERMEDIATE", emoji: "📈", title: "База есть", text: "Что-то знаю, но есть пробелы" },
  { key: "ADVANCED", emoji: "🔥", title: "Иду на максимум", text: "Хочу самые высокие баллы" },
];

const STEP_COLORS: Record<string, string> = {
  exam: "#ec4899",
  subjects: "#4f6bff",
  level: "#8b5cf6",
};

export function Onboarding({
  needsSetup,
  subjects,
}: {
  needsSetup: boolean;
  subjects: OnboardingSubject[];
}) {
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  // setup state
  const [phase, setPhase] = useState<"slides" | "exam" | "subjects" | "level">("slides");
  const [examType, setExamType] = useState<"EGE" | "OGE" | null>(null);
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const slidesNeeded = !localStorage.getItem(SEEN_FLAG);
    if (slidesNeeded || needsSetup) {
      const id = requestAnimationFrame(() => {
        setPhase(slidesNeeded ? "slides" : "exam");
        setVisible(true);
      });
      return () => cancelAnimationFrame(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  const slide = SLIDES[step];
  const bg = phase === "slides" ? slide.color : STEP_COLORS[phase];
  const lastSlide = step === SLIDES.length - 1;

  function closeAll() {
    localStorage.setItem(SEEN_FLAG, "1");
    setVisible(false);
  }

  function nextFromSlides() {
    if (!lastSlide) return setStep((s) => s + 1);
    localStorage.setItem(SEEN_FLAG, "1");
    if (needsSetup) setPhase("exam");
    else setVisible(false);
  }

  function toggleSubject(id: string) {
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function pickLevel(levelKey: string) {
    startTransition(async () => {
      await completeSetup({ subjectIds: [...chosen], prepLevel: levelKey });
      closeAll();
    });
  }

  const examSubjects = subjects.filter((s) => s.examType === examType);

  return (
    <motion.div
      className="fixed inset-0 z-90 flex flex-col overflow-hidden text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, backgroundColor: bg }}
      transition={{ backgroundColor: { duration: 0.7, ease: "easeInOut" }, opacity: { duration: 0.4 } }}
      style={{ backgroundColor: bg }}
    >
      <div className="blob-morph absolute left-[-18%] top-[-12%] h-[55vw] w-[55vw] max-h-[420px] max-w-[420px]" />
      <div className="blob-morph blob-morph-2 absolute right-[-15%] top-[30%] h-[48vw] w-[48vw] max-h-[380px] max-w-[380px]" />
      <div className="blob-morph blob-morph-3 absolute bottom-[-16%] left-[10%] h-[50vw] w-[50vw] max-h-[400px] max-w-[400px]" />

      {phase === "slides" && !needsSetup && (
        <button
          onClick={closeAll}
          className="press-spring absolute right-5 top-5 z-10 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur-sm"
        >
          Пропустить
        </button>
      )}

      {/* items-center + my-auto on the child (instead of justify-center) so tall
          steps (subject list, level list) scroll into view from the top instead
          of being clipped above the viewport. */}
      <div className="relative z-10 flex flex-1 flex-col items-center overflow-y-auto px-6 py-16 text-center">
        <AnimatePresence mode="wait">
          {phase === "slides" && (
            <motion.div
              key={`slide-${step}`}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -30, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="my-auto flex flex-col items-center"
            >
              <motion.span
                className="blob-morph relative mb-8 flex h-32 w-32 items-center justify-center bg-white/25 text-6xl"
                initial={reduceMotion ? false : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
              >
                {slide.emoji}
              </motion.span>
              <h1 className="font-display max-w-sm text-3xl font-extrabold sm:text-4xl">{slide.title}</h1>
              <p className="mt-4 max-w-xs text-lg leading-relaxed text-white/85">{slide.text}</p>
            </motion.div>
          )}

          {phase === "exam" && (
            <motion.div
              key="exam"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -30, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="my-auto flex w-full max-w-sm flex-col items-center"
            >
              <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Что сдаёшь?</h1>
              <p className="mt-3 text-white/80">Выбери свой экзамен — настроим всё под него.</p>
              <div className="mt-8 grid w-full gap-4">
                {(
                  [
                    { key: "EGE", emoji: "🎓", title: "ЕГЭ", text: "11 класс" },
                    { key: "OGE", emoji: "✏️", title: "ОГЭ", text: "9 класс" },
                  ] as const
                ).map((e) => (
                  <motion.button
                    key={e.key}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      setExamType(e.key);
                      setChosen(new Set());
                      setPhase("subjects");
                    }}
                    className="flex items-center gap-4 rounded-3xl bg-white/15 p-5 text-left backdrop-blur-sm transition-colors hover:bg-white/25"
                  >
                    <span className="text-4xl">{e.emoji}</span>
                    <span>
                      <span className="font-display block text-xl font-extrabold">{e.title}</span>
                      <span className="text-sm text-white/75">{e.text}</span>
                    </span>
                    <ArrowRight className="ml-auto h-5 w-5 shrink-0" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {phase === "subjects" && (
            <motion.div
              key="subjects"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -30, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="my-auto flex w-full max-w-md flex-col items-center"
            >
              <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Твои предметы</h1>
              <p className="mt-3 text-white/80">Отметь всё, что сдаёшь — можно несколько.</p>
              <div className="mt-7 grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2">
                {examSubjects.map((s) => {
                  const active = chosen.has(s.id);
                  return (
                    <motion.button
                      key={s.id}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => toggleSubject(s.id)}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl p-3.5 text-left backdrop-blur-sm transition-colors",
                        active ? "bg-white text-(--color-ink)" : "bg-white/15 hover:bg-white/25"
                      )}
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: active ? `${s.color}22` : "rgba(255,255,255,0.2)" }}
                      >
                        <SubjectIcon icon={s.icon} className="h-4.5 w-4.5" />
                      </span>
                      <span className="flex-1 text-sm font-bold">
                        {s.name.replace(/^ЕГЭ |^ОГЭ /, "")}
                      </span>
                      {active && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-(--color-brand-green) text-white">
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
              <motion.button
                whileTap={{ scale: 0.94 }}
                disabled={chosen.size === 0}
                onClick={() => setPhase("level")}
                className="mt-8 flex items-center gap-2 rounded-full bg-white px-10 py-4 font-display text-base font-bold shadow-[0_12px_32px_rgba(0,0,0,0.18)] disabled:opacity-40"
                style={{ color: bg }}
              >
                Дальше <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
              </motion.button>
            </motion.div>
          )}

          {phase === "level" && (
            <motion.div
              key="level"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -30, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="my-auto flex w-full max-w-sm flex-col items-center"
            >
              <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Твой уровень</h1>
              <p className="mt-3 text-white/80">
                Подстроим сложность заданий и объяснения ИИ. Это всегда можно поменять решая задания.
              </p>
              <div className="mt-8 grid w-full gap-3.5">
                {LEVELS.map((l) => (
                  <motion.button
                    key={l.key}
                    whileTap={{ scale: 0.96 }}
                    disabled={isPending}
                    onClick={() => pickLevel(l.key)}
                    className="flex items-center gap-4 rounded-3xl bg-white/15 p-5 text-left backdrop-blur-sm transition-colors hover:bg-white/25 disabled:opacity-60"
                  >
                    <span className="text-3xl">{l.emoji}</span>
                    <span>
                      <span className="font-display block text-lg font-extrabold">{l.title}</span>
                      <span className="text-sm text-white/75">{l.text}</span>
                    </span>
                  </motion.button>
                ))}
              </div>
              {isPending && <p className="mt-4 text-sm text-white/75">Сохраняю…</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {phase === "slides" && (
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
            onClick={nextFromSlides}
            whileTap={{ scale: 0.94 }}
            className="flex items-center gap-2 rounded-full bg-white px-10 py-4 font-display text-base font-bold shadow-[0_12px_32px_rgba(0,0,0,0.18)]"
            style={{ color: bg }}
          >
            {lastSlide ? (needsSetup ? "Настроить под себя" : "Погнали") : "Дальше"}
            <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}

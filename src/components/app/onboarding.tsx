"use client";

import { useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { completeOnboarding, type OnboardingInput } from "@/lib/actions/onboarding";
import { SPORTS, GOAL_TYPES, DIET_TYPES, WEEKDAYS, WEEKDAY_LABELS } from "@/lib/sports";
import { cn } from "@/lib/utils";
import { IntroParticles, IntroBadge, StaggerTitle } from "@/components/app/intro-fx";

const SEEN_FLAG = "pulse-onboarded-v1";

const SLIDES = [
  { color: "#4f6bff", emoji: "👋", title: "Привет! Это Pulse Coach", text: "ИИ-тренер, который строит план сна, тренировок и питания под тебя — как Whoop, но с объяснением каждого решения." },
  { color: "#22c55e", emoji: "🔋", title: "Готовность каждый день", text: "ВСР, пульс покоя и сон превращаются в понятную оценку восстановления — и план подстраивается под неё." },
  { color: "#8b5cf6", emoji: "🔗", title: "Garmin, Polar, Athyx", text: "Подключи устройства или загрузи .fit-файл — приложение само определит твои пороги и VO2max." },
];

const STEP_COLOR: Record<string, string> = { sport: "#4f6bff", details: "#8b5cf6" };

const AVAILABILITY_PRESETS = [0, 30, 45, 60, 90, 120];

export function Onboarding({ needsSetup }: { needsSetup: boolean }) {
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<"slides" | "sport" | "details">("slides");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [sport, setSport] = useState<string | null>(null);
  const [sex, setSex] = useState<OnboardingInput["sex"]>(null);
  const [birthDate, setBirthDate] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [restingHr, setRestingHr] = useState("");
  const [maxHr, setMaxHr] = useState("");
  const [goalType, setGoalType] = useState<string | null>(null);
  const [goalEventName, setGoalEventName] = useState("");
  const [goalEventDate, setGoalEventDate] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [availability, setAvailability] = useState<Record<string, number>>({ mon: 45, tue: 0, wed: 45, thu: 0, fri: 45, sat: 60, sun: 0 });
  const [sleepGoal, setSleepGoal] = useState(8);
  const [dietType, setDietType] = useState<string | null>(null);
  const [allergies, setAllergies] = useState("");

  useEffect(() => {
    const slidesNeeded = !localStorage.getItem(SEEN_FLAG);
    if (slidesNeeded || needsSetup) {
      const id = requestAnimationFrame(() => {
        setPhase("slides");
        setVisible(true);
      });
      return () => cancelAnimationFrame(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  const slide = SLIDES[step];
  const bg = phase === "slides" ? slide.color : STEP_COLOR[phase];
  const lastSlide = step === SLIDES.length - 1;

  function closeAll() {
    localStorage.setItem(SEEN_FLAG, "1");
    setVisible(false);
  }

  function nextFromSlides() {
    if (!lastSlide) return setStep((s) => s + 1);
    localStorage.setItem(SEEN_FLAG, "1");
    if (needsSetup) setPhase("sport");
    else setVisible(false);
  }

  function submit() {
    if (!sport) return;
    setError(null);
    const input: OnboardingInput = {
      primarySport: sport, sex, birthDate: birthDate || null,
      heightCm: heightCm ? Number(heightCm) : null, weightKg: weightKg ? Number(weightKg) : null,
      restingHrManual: restingHr ? Number(restingHr) : null, maxHrManual: maxHr ? Number(maxHr) : null,
      goalType, goalEventName: goalEventName || null, goalEventDate: goalEventDate || null,
      experienceYears: experienceYears ? Number(experienceYears) : null,
      weeklyAvailabilityMin: availability, sleepGoalHours: sleepGoal, dietType, allergies: allergies || null,
    };
    startTransition(async () => {
      const res = await completeOnboarding(input);
      if (res.ok) closeAll();
      else setError(res.error ?? "Не получилось сохранить — попробуй ещё раз.");
    });
  }

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
      {phase === "slides" && <IntroParticles />}

      {phase === "slides" && !needsSetup && (
        <button onClick={closeAll} className="press-spring absolute right-5 top-5 z-10 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
          Пропустить
        </button>
      )}

      <div className="relative z-10 flex flex-1 flex-col items-center overflow-y-auto px-6 py-16 text-center">
        <AnimatePresence mode="wait">
          {phase === "slides" && (
            <motion.div key={`slide-${step}`} initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -30, scale: 0.95 }} transition={{ type: "spring", stiffness: 260, damping: 24 }} className="my-auto flex flex-col items-center">
              <IntroBadge emoji={slide.emoji} />
              <StaggerTitle text={slide.title} className="font-display max-w-sm text-3xl font-extrabold sm:text-4xl" />
              <motion.p initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }} className="mt-4 max-w-sm text-lg leading-relaxed text-white/85">
                {slide.text}
              </motion.p>
            </motion.div>
          )}

          {phase === "sport" && (
            <motion.div key="sport" initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -30, scale: 0.95 }} transition={{ type: "spring", stiffness: 260, damping: 24 }} className="my-auto flex w-full max-w-md flex-col items-center">
              <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Твой основной вид спорта?</h1>
              <p className="mt-3 text-white/80">Определит зоны, план и терминологию.</p>
              <div className="mt-7 grid w-full grid-cols-2 gap-2.5">
                {SPORTS.map((s) => (
                  <motion.button key={s.slug} whileTap={{ scale: 0.96 }} onClick={() => { setSport(s.slug); setPhase("details"); }} className={cn("flex flex-col items-center gap-1.5 rounded-2xl p-4 text-center backdrop-blur-sm transition-colors", sport === s.slug ? "bg-white text-(--color-ink)" : "bg-white/15 hover:bg-white/25")}>
                    <span className="text-3xl">{s.emoji}</span>
                    <span className="text-sm font-bold">{s.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {phase === "details" && (
            <motion.div key="details" initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 40 } } animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="my-auto w-full max-w-lg text-left">
              <button onClick={() => setPhase("sport")} className="press-spring mb-4 flex items-center gap-1 text-sm font-semibold text-white/70">
                <ArrowLeft className="h-4 w-4" /> Назад
              </button>
              <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Расскажи о себе</h1>
              <p className="mt-2 text-sm text-white/75">Всё необязательно, кроме доступности по дням — можно уточнить позже в профиле.</p>

              <div className="mt-6 space-y-5 rounded-3xl bg-white/10 p-5 backdrop-blur-sm">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Пол">
                    <select value={sex ?? ""} onChange={(e) => setSex((e.target.value || null) as OnboardingInput["sex"])} className="onboarding-input">
                      <option value="">Не указано</option>
                      <option value="MALE">Мужской</option>
                      <option value="FEMALE">Женский</option>
                      <option value="OTHER">Другое</option>
                    </select>
                  </Field>
                  <Field label="Дата рождения"><input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="onboarding-input" /></Field>
                  <Field label="Рост, см"><input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className="onboarding-input" placeholder="175" /></Field>
                  <Field label="Вес, кг"><input type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} className="onboarding-input" placeholder="70" /></Field>
                  <Field label="Пульс покоя"><input type="number" value={restingHr} onChange={(e) => setRestingHr(e.target.value)} className="onboarding-input" placeholder="если знаешь" /></Field>
                  <Field label="Макс. пульс"><input type="number" value={maxHr} onChange={(e) => setMaxHr(e.target.value)} className="onboarding-input" placeholder="если знаешь" /></Field>
                </div>

                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-white/60">Цель</div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {GOAL_TYPES.map((g) => (
                      <button key={g.key} type="button" onClick={() => setGoalType(g.key)} className={cn("rounded-xl px-3 py-2 text-left text-xs font-semibold", goalType === g.key ? "bg-white text-(--color-ink)" : "bg-white/10 hover:bg-white/20")}>
                        {g.emoji} {g.title}
                      </button>
                    ))}
                  </div>
                  {goalType === "RACE" && (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <Field label="Название старта"><input value={goalEventName} onChange={(e) => setGoalEventName(e.target.value)} className="onboarding-input" placeholder="Марафон..." /></Field>
                      <Field label="Дата старта"><input type="date" value={goalEventDate} onChange={(e) => setGoalEventDate(e.target.value)} className="onboarding-input" /></Field>
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-white/60">Когда можешь тренироваться</div>
                  <div className="mt-2 grid grid-cols-7 gap-1.5">
                    {WEEKDAYS.map((d) => (
                      <button key={d} type="button" onClick={() => setAvailability((prev) => ({ ...prev, [d]: AVAILABILITY_PRESETS[(AVAILABILITY_PRESETS.indexOf(prev[d] ?? 0) + 1) % AVAILABILITY_PRESETS.length] }))} className={cn("flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-bold", (availability[d] ?? 0) > 0 ? "bg-white text-(--color-ink)" : "bg-white/10 text-white/60")}>
                        {WEEKDAY_LABELS[d]}
                        <span className="text-[0.65rem] font-semibold">{availability[d] ?? 0}м</span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[0.7rem] text-white/50">Нажимай, чтобы менять минуты (0→30→45→60→90→120)</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Цель сна, часов">
                    <input type="number" step="0.5" value={sleepGoal} onChange={(e) => setSleepGoal(Number(e.target.value))} className="onboarding-input" />
                  </Field>
                  <Field label="Стаж, лет"><input type="number" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} className="onboarding-input" /></Field>
                </div>

                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-white/60">Питание</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {DIET_TYPES.map((d) => (
                      <button key={d.key} type="button" onClick={() => setDietType(d.key)} className={cn("rounded-full px-3 py-1.5 text-xs font-semibold", dietType === d.key ? "bg-white text-(--color-ink)" : "bg-white/10 hover:bg-white/20")}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                  <input value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="Аллергии/непереносимости (необязательно)" className="onboarding-input mt-2 w-full" />
                </div>
              </div>

              {error && <p className="mt-3 text-sm font-semibold text-white">{error}</p>}
              <motion.button whileTap={{ scale: 0.96 }} disabled={isPending} onClick={submit} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-white px-8 py-4 font-display text-base font-bold text-(--color-ink) shadow-[0_12px_32px_rgba(0,0,0,0.25)] disabled:opacity-60">
                {isPending ? "Настраиваю…" : "Начать"} <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {phase === "slides" && (
        <div className="relative z-10 flex flex-col items-center gap-6 pb-10">
          <div className="flex gap-2">
            {SLIDES.map((_, i) => (
              <motion.span key={i} className="h-2 rounded-full bg-white" animate={{ width: i === step ? 24 : 8, opacity: i === step ? 1 : 0.45 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} />
            ))}
          </div>
          <motion.button onClick={nextFromSlides} whileTap={{ scale: 0.94 }} className="flex items-center gap-2 rounded-full bg-white px-10 py-4 font-display text-base font-bold shadow-[0_12px_32px_rgba(0,0,0,0.18)]" style={{ color: bg }}>
            {lastSlide ? (needsSetup ? "Настроить под себя" : "Погнали") : "Дальше"}
            <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
          </motion.button>
        </div>
      )}

      <style>{`.onboarding-input{width:100%;border-radius:0.9rem;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.18);padding:0.55rem 0.8rem;font-size:0.85rem;color:white;outline:none}.onboarding-input::placeholder{color:rgba(255,255,255,0.45)}.onboarding-input option{color:black}`}</style>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[0.7rem] font-bold uppercase tracking-wide text-white/60">{label}</span>
      {children}
    </label>
  );
}

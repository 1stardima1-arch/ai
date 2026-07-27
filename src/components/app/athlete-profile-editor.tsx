"use client";

import { useState, useTransition } from "react";
import { updateAthleteProfile, type AthleteProfileInput } from "@/lib/actions/profile";
import { SPORTS, GOAL_TYPES, DIET_TYPES, WEEKDAYS, WEEKDAY_LABELS } from "@/lib/sports";
import { cn } from "@/lib/utils";
import type { Sex } from "@prisma/client";

const AVAILABILITY_PRESETS = [0, 30, 45, 60, 90, 120];

export function AthleteProfileEditor({ initial }: { initial: AthleteProfileInput }) {
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof AthleteProfileInput>(key: K, value: AthleteProfileInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function save() {
    startTransition(async () => {
      const res = await updateAthleteProfile(form);
      setStatus(res.ok ? { kind: "ok", text: "Сохранено — пороги пересчитаны." } : { kind: "error", text: res.error });
    });
  }

  return (
    <div className="card-surface space-y-5 p-6">
      <div className="text-sm font-bold">Спортивный профиль</div>

      <div>
        <label className="text-xs font-bold uppercase tracking-wide text-(--color-ink-soft)">Основной вид спорта</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {SPORTS.map((s) => (
            <button key={s.slug} type="button" onClick={() => set("primarySport", s.slug)} className={cn("rounded-full px-3 py-1.5 text-xs font-bold", form.primarySport === s.slug ? "btn-gradient" : "bg-black/5 dark:bg-white/10")}>
              {s.emoji} {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <F label="Пол">
          <select value={form.sex ?? ""} onChange={(e) => set("sex", (e.target.value || null) as Sex | null)} className="in">
            <option value="">—</option><option value="MALE">Мужской</option><option value="FEMALE">Женский</option><option value="OTHER">Другое</option>
          </select>
        </F>
        <F label="Дата рождения"><input type="date" value={form.birthDate ?? ""} onChange={(e) => set("birthDate", e.target.value || null)} className="in" /></F>
        <F label="Рост, см"><input type="number" value={form.heightCm ?? ""} onChange={(e) => set("heightCm", e.target.value ? Number(e.target.value) : null)} className="in" /></F>
        <F label="Вес, кг"><input type="number" value={form.weightKg ?? ""} onChange={(e) => set("weightKg", e.target.value ? Number(e.target.value) : null)} className="in" /></F>
        <F label="% жира (если знаешь)"><input type="number" value={form.bodyFatPercent ?? ""} onChange={(e) => set("bodyFatPercent", e.target.value ? Number(e.target.value) : null)} className="in" /></F>
        <F label="Стаж, лет"><input type="number" value={form.experienceYears ?? ""} onChange={(e) => set("experienceYears", e.target.value ? Number(e.target.value) : null)} className="in" /></F>
        <F label="Пульс покоя"><input type="number" value={form.restingHrManual ?? ""} onChange={(e) => set("restingHrManual", e.target.value ? Number(e.target.value) : null)} className="in" /></F>
        <F label="Макс. пульс"><input type="number" value={form.maxHrManual ?? ""} onChange={(e) => set("maxHrManual", e.target.value ? Number(e.target.value) : null)} className="in" /></F>
        <F label="Порог ЧСС (LTHR)"><input type="number" value={form.lthrManual ?? ""} onChange={(e) => set("lthrManual", e.target.value ? Number(e.target.value) : null)} className="in" /></F>
      </div>

      <div>
        <label className="text-xs font-bold uppercase tracking-wide text-(--color-ink-soft)">Цель</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {GOAL_TYPES.map((g) => (
            <button key={g.key} type="button" onClick={() => set("goalType", g.key)} className={cn("rounded-full px-3 py-1.5 text-xs font-bold", form.goalType === g.key ? "btn-gradient" : "bg-black/5 dark:bg-white/10")}>{g.emoji} {g.title}</button>
          ))}
        </div>
        {form.goalType === "RACE" && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <F label="Название старта"><input value={form.goalEventName ?? ""} onChange={(e) => set("goalEventName", e.target.value)} className="in" /></F>
            <F label="Дата старта"><input type="date" value={form.goalEventDate ?? ""} onChange={(e) => set("goalEventDate", e.target.value || null)} className="in" /></F>
          </div>
        )}
      </div>

      <div>
        <label className="text-xs font-bold uppercase tracking-wide text-(--color-ink-soft)">Доступность по дням (минуты)</label>
        <div className="mt-2 grid grid-cols-7 gap-1.5">
          {WEEKDAYS.map((d) => (
            <button key={d} type="button" onClick={() => set("weeklyAvailabilityMin", { ...form.weeklyAvailabilityMin, [d]: AVAILABILITY_PRESETS[(AVAILABILITY_PRESETS.indexOf(form.weeklyAvailabilityMin[d] ?? 0) + 1) % AVAILABILITY_PRESETS.length] })} className={cn("flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-bold", (form.weeklyAvailabilityMin[d] ?? 0) > 0 ? "btn-gradient" : "bg-black/5 text-(--color-ink-soft) dark:bg-white/10")}>
              {WEEKDAY_LABELS[d]}<span className="text-[0.65rem]">{form.weeklyAvailabilityMin[d] ?? 0}м</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <F label="Цель сна, ч"><input type="number" step="0.5" value={form.sleepGoalHours} onChange={(e) => set("sleepGoalHours", Number(e.target.value))} className="in" /></F>
        <F label="Единицы"><select value={form.unitPreference} onChange={(e) => set("unitPreference", e.target.value)} className="in"><option value="METRIC">Метрические</option><option value="IMPERIAL">Имперские</option></select></F>
      </div>

      <div>
        <label className="text-xs font-bold uppercase tracking-wide text-(--color-ink-soft)">Питание</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {DIET_TYPES.map((d) => (
            <button key={d.key} type="button" onClick={() => set("dietType", d.key)} className={cn("rounded-full px-3 py-1.5 text-xs font-bold", form.dietType === d.key ? "btn-gradient" : "bg-black/5 dark:bg-white/10")}>{d.label}</button>
          ))}
        </div>
        <input value={form.allergies ?? ""} onChange={(e) => set("allergies", e.target.value)} placeholder="Аллергии/непереносимости" className="in mt-2 w-full" />
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={isPending} className="press-spring rounded-full btn-gradient px-6 py-2.5 text-sm font-bold disabled:opacity-50">{isPending ? "Сохраняю…" : "Сохранить"}</button>
        {status && <span className={cn("text-sm font-semibold", status.kind === "ok" ? "text-(--color-brand-green)" : "text-(--color-brand-pink)")}>{status.text}</span>}
      </div>

      <style>{`.in{width:100%;border-radius:0.9rem;border:1px solid rgba(0,0,0,0.1);background:var(--color-surface);padding:0.5rem 0.75rem;font-size:0.85rem}.dark .in{border-color:rgba(255,255,255,0.1)}`}</style>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[0.7rem] font-bold uppercase tracking-wide text-(--color-ink-soft)">{label}</span>
      {children}
    </label>
  );
}

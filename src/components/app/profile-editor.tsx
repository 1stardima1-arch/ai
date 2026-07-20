"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Check, Pencil } from "lucide-react";
import { AVATARS, NAME_CHANGE_COOLDOWN_DAYS } from "@/lib/avatars";
import { updateProfile, type ProfileUpdateResult } from "@/lib/actions/profile";
import { UserAvatar } from "@/components/app/user-avatar";
import { cn } from "@/lib/utils";

export function ProfileEditor({
  initialName,
  initialAvatarKey,
  image,
  nameLockedDaysLeft,
}: {
  initialName: string;
  initialAvatarKey: string | null;
  image: string | null;
  nameLockedDaysLeft: number; // 0 = can rename now
}) {
  const [name, setName] = useState(initialName);
  const [avatarKey, setAvatarKey] = useState<string | null>(initialAvatarKey);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const nameLocked = nameLockedDaysLeft > 0;

  function save() {
    const fd = new FormData();
    fd.set("name", name);
    if (avatarKey) fd.set("avatarKey", avatarKey);
    startTransition(async () => {
      const res: ProfileUpdateResult = await updateProfile(fd);
      setStatus(
        res.ok
          ? { kind: "ok", text: "Сохранено!" }
          : { kind: "error", text: res.error }
      );
    });
  }

  return (
    <div className="card-surface p-6">
      <div className="flex items-center gap-2 text-sm font-bold">
        <Pencil className="h-4 w-4 text-(--color-brand-blue)" />
        Аватар и ник
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        {AVATARS.map((a) => (
          <motion.button
            key={a.key}
            type="button"
            whileTap={{ scale: 0.88 }}
            onClick={() => setAvatarKey(a.key)}
            className={cn(
              "relative flex h-11 w-11 items-center justify-center rounded-full text-xl transition-shadow",
              avatarKey === a.key
                ? "shadow-[0_0_0_3px_var(--color-brand-blue)]"
                : "shadow-[0_0_0_1px_rgba(11,11,18,0.08)] hover:shadow-[0_0_0_2px_rgba(79,107,255,0.5)]"
            )}
            style={{ background: a.gradient }}
            aria-label={a.key}
          >
            {a.emoji}
            {avatarKey === a.key && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-(--color-brand-blue) text-white">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
            )}
          </motion.button>
        ))}
        {!avatarKey && (
          <div className="flex items-center gap-2 text-xs text-(--color-ink-soft)">
            <UserAvatar image={image} name={initialName} className="h-11 w-11 text-sm" />
            текущий
          </div>
        )}
      </div>

      <div className="mt-5">
        <label className="text-xs font-bold uppercase tracking-wide text-(--color-ink-soft)">
          Ник
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={nameLocked}
          maxLength={24}
          className="mt-1.5 w-full rounded-2xl border border-black/10 dark:border-white/10 bg-(--color-surface) px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-(--color-brand-blue) disabled:opacity-60"
        />
        <p className="mt-1.5 text-xs text-(--color-ink-soft)">
          {nameLocked
            ? `Ник недавно менялся — следующая смена через ${nameLockedDaysLeft} дн.`
            : `Менять ник можно раз в ${NAME_CHANGE_COOLDOWN_DAYS} дней, аватар — когда угодно.`}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={save}
          disabled={isPending}
          className="press-spring rounded-full btn-gradient px-6 py-2.5 text-sm font-bold disabled:opacity-50"
        >
          {isPending ? "Сохраняю…" : "Сохранить"}
        </button>
        {status && (
          <span
            className={cn(
              "text-sm font-semibold",
              status.kind === "ok" ? "text-(--color-brand-green)" : "text-(--color-brand-pink)"
            )}
          >
            {status.text}
          </span>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useSyncExternalStore } from "react";

const VISITED_KEY = "ball-visited-login";
const noop = () => () => {};

export function AuthHeadline({ mode }: { mode: "signin" | "signup" }) {
  // "С возвращением" only makes sense once this device has actually been
  // here before — a brand-new visitor gets a plain welcome instead.
  // useSyncExternalStore (not useState+useEffect) reads localStorage
  // without a hydration-mismatch flash: server always assumes "first
  // visit" via getServerSnapshot, client corrects itself immediately.
  const hasVisited = useSyncExternalStore(
    noop,
    () => localStorage.getItem(VISITED_KEY) === "1",
    () => false
  );

  useEffect(() => {
    localStorage.setItem(VISITED_KEY, "1");
  }, []);

  if (mode === "signup") {
    return (
      <>
        <h1 className="font-display text-center text-2xl font-extrabold">Создать аккаунт</h1>
        <p className="mt-2 text-center text-sm text-(--color-ink-soft)">
          Придумай ник и пароль — прогресс сохранится за тобой
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="font-display text-center text-2xl font-extrabold">
        {hasVisited ? "С возвращением 👋" : "Добро пожаловать 👋"}
      </h1>
      <p className="mt-2 text-center text-sm text-(--color-ink-soft)">
        Войди, чтобы сохранять прогресс и получать разбор ошибок от ИИ
      </p>
    </>
  );
}

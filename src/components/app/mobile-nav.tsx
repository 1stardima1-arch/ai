"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Dumbbell, Moon, Apple, Sparkles, ShieldCheck } from "lucide-react";

const links = [
  { href: "/app", label: "Дашборд", icon: LayoutDashboard, exact: true },
  { href: "/app/training", label: "Тренировки", icon: Dumbbell },
  { href: "/app/sleep", label: "Сон", icon: Moon },
  { href: "/app/nutrition", label: "Питание", icon: Apple },
  { href: "/app/coach", label: "Тренер", icon: Sparkles },
];

const adminLink = { href: "/app/admin", label: "Админ", icon: ShieldCheck, exact: false };

export function MobileNav({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const items = isAdmin ? [adminLink, ...links] : links;

  return (
    <nav
      className="liquid-glass liquid-glass-vivid glass-sheen fixed inset-x-2 z-40 flex items-center justify-between rounded-full px-1 py-1.5 lg:hidden"
      style={
        {
          viewTransitionName: "app-shell-mobilenav",
          bottom: "calc(0.75rem + env(safe-area-inset-bottom))",
        } as React.CSSProperties
      }
    >
      {items.map((l) => {
        const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} className="relative flex flex-1 flex-col items-center">
            {active && (
              <motion.span
                layoutId="mobilenav-active-bubble"
                className="absolute inset-x-1 inset-y-0 rounded-full bg-(--color-brand-blue)/10"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            <motion.span
              whileTap={{ scale: 0.86 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className={cn(
                "relative z-10 flex flex-col items-center gap-0.5 whitespace-nowrap px-0.5 py-1.5 text-[0.58rem] font-semibold transition-colors duration-300",
                active ? "text-(--color-brand-blue)" : "text-(--color-ink-soft)"
              )}
            >
              <l.icon className="h-4.5 w-4.5" strokeWidth={2.2} />
              {l.label}
            </motion.span>
          </Link>
        );
      })}
    </nav>
  );
}

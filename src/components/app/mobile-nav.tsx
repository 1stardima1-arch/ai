"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  Target,
  Trophy,
  Sparkles,
} from "lucide-react";

const links = [
  { href: "/app", label: "Дашборд", icon: LayoutDashboard, exact: true },
  { href: "/app/subjects", label: "Предметы", icon: BookOpen },
  { href: "/app/mistakes", label: "Ошибки", icon: Target },
  { href: "/app/leaderboard", label: "Рейтинг", icon: Trophy },
  { href: "/app/ai", label: "ИИ", icon: Sparkles },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="liquid-glass glass-sheen fixed inset-x-3 bottom-3 z-40 flex items-center justify-between rounded-full px-2 py-2 lg:hidden">
      {links.map((l) => {
        const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "press-spring relative flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 text-[0.65rem] font-semibold transition-colors duration-300",
              active ? "text-(--color-brand-blue)" : "text-(--color-ink-soft)"
            )}
          >
            {active && (
              <motion.span
                layoutId="mobilenav-active-bubble"
                className="absolute inset-x-1 inset-y-0 rounded-full bg-(--color-brand-blue)/10"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            <l.icon className="relative z-10 h-5 w-5" strokeWidth={2.2} />
            <span className="relative z-10">{l.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

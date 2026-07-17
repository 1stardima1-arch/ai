"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  Target,
  LineChart,
  Sparkles,
  Trophy,
  User,
} from "lucide-react";

const links = [
  { href: "/app", label: "Дашборд", icon: LayoutDashboard, exact: true },
  { href: "/app/subjects", label: "Предметы", icon: BookOpen },
  { href: "/app/mistakes", label: "Разбор ошибок", icon: Target },
  { href: "/app/analytics", label: "Аналитика", icon: LineChart },
  { href: "/app/leaderboard", label: "Рейтинг", icon: Trophy },
  { href: "/app/ai", label: "ИИ-репетитор", icon: Sparkles },
  { href: "/app/profile", label: "Профиль", icon: User },
];

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {links.map((l) => {
        const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={onNavigate}
            className={cn(
              "press-spring relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors duration-300",
              active
                ? "text-white"
                : "text-(--color-ink-soft) hover:bg-black/5 hover:text-(--color-ink)"
            )}
          >
            {active && (
              <motion.span
                layoutId="sidebar-active-pill"
                className="absolute inset-0 rounded-2xl bg-(--color-ink)"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <l.icon className="relative z-10 h-4.5 w-4.5" strokeWidth={2.2} />
            <span className="relative z-10">{l.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

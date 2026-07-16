"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
    <nav className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-between rounded-full border border-black/5 bg-white/95 px-2 py-2 shadow-(--shadow-lift) backdrop-blur lg:hidden">
      {links.map((l) => {
        const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 text-[0.65rem] font-semibold",
              active ? "text-(--color-brand-blue)" : "text-(--color-ink-soft)"
            )}
          >
            <l.icon className="h-5 w-5" strokeWidth={2.2} />
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

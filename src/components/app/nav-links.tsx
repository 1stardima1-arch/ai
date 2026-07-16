"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  Target,
  LineChart,
  Sparkles,
  User,
} from "lucide-react";

const links = [
  { href: "/app", label: "Дашборд", icon: LayoutDashboard, exact: true },
  { href: "/app/subjects", label: "Предметы", icon: BookOpen },
  { href: "/app/mistakes", label: "Разбор ошибок", icon: Target },
  { href: "/app/analytics", label: "Аналитика", icon: LineChart },
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
              "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors",
              active
                ? "bg-(--color-ink) text-white"
                : "text-(--color-ink-soft) hover:bg-black/5 hover:text-(--color-ink)"
            )}
          >
            <l.icon className="h-4.5 w-4.5" strokeWidth={2.2} />
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

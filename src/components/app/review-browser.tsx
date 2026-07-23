"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SubjectIcon } from "@/lib/subject-icon";
import { Search, ChevronRight, BookOpen } from "lucide-react";

type Topic = {
  id: string;
  name: string;
  slug: string;
  summary: string;
  _count: { tasks: number };
};

type Subject = {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
  topics: Topic[];
};

export function ReviewBrowser({ subjects }: { subjects: Subject[] }) {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return subjects;
    return subjects
      .map((s) => ({
        ...s,
        topics: s.topics.filter(
          (t) => t.name.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
        ),
      }))
      .filter((s) => s.topics.length > 0 || s.name.toLowerCase().includes(q));
  }, [subjects, q]);

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-(--color-ink-soft)" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Найти тему или предмет…"
          className="w-full rounded-full border border-black/10 bg-(--color-paper-dim) py-3 pl-11 pr-4 text-sm outline-none focus:border-(--color-brand-blue) dark:border-white/10"
        />
      </div>

      {filtered.length === 0 && (
        <p className="mt-6 text-sm text-(--color-ink-soft)">Ничего не нашлось — попробуй по-другому.</p>
      )}

      <div className="mt-6 space-y-8">
        {filtered.map((s) => (
          <div key={s.id}>
            <div className="mb-3 flex items-center gap-2.5">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                style={{ background: `${s.color}1a`, color: s.color }}
              >
                <SubjectIcon icon={s.icon} className="h-4 w-4" />
              </span>
              <h2 className="font-display text-lg font-bold">{s.name}</h2>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {s.topics.map((t) => (
                <Link
                  key={t.id}
                  href={`/app/subjects/${s.slug}/topics/${t.slug}`}
                  className="card-surface press-spring flex items-center gap-3 border-l-[3px] p-4"
                  style={{ borderLeftColor: s.color }}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: `${s.color}1a`, color: s.color }}
                  >
                    <BookOpen className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{t.name}</div>
                    <div className="truncate text-xs text-(--color-ink-soft)">
                      {t._count.tasks} {taskWord(t._count.tasks)} · теория
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-(--color-ink-soft)" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function taskWord(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return "заданий";
  if (mod10 === 1) return "задание";
  if (mod10 >= 2 && mod10 <= 4) return "задания";
  return "заданий";
}

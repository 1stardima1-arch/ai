"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Sparkles, User, Send } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string };

export function AiChat({
  taskId,
  initialMessages = [],
  placeholder = "Спроси что угодно про эту тему…",
  suggestions = [],
  autoStartMessage,
}: {
  taskId?: string;
  initialMessages?: Message[];
  placeholder?: string;
  suggestions?: string[];
  autoStartMessage?: string;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const autoStarted = useRef(false);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollToBottom() {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }

  async function send(text: string) {
    if (!text.trim() || isPending) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }, { role: "assistant", content: "" }]);
    scrollToBottom();

    startTransition(async () => {
      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, taskId }),
        });

        if (!res.body) throw new Error("no body");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = { role: "assistant", content: acc };
            return next;
          });
          scrollToBottom();
        }
      } catch {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: "assistant",
            content: "Не получилось связаться с ИИ. Проверь соединение и попробуй снова.",
          };
          return next;
        });
      }
    });
  }

  useEffect(() => {
    if (autoStartMessage && messages.length === 0 && !autoStarted.current) {
      autoStarted.current = true;
      send(autoStartMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStartMessage]);

  return (
    <div className="card-surface flex h-[560px] flex-col overflow-hidden p-0">
      <div className="flex items-center gap-2 border-b border-black/5 px-5 py-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-full btn-gradient">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <div className="text-sm font-bold">Тьютор Гото</div>
          <div className="text-xs text-(--color-brand-green)">● на связи</div>
        </div>
      </div>

      <div ref={scrollRef} className="scrollbar-thin flex-1 space-y-4 overflow-y-auto p-5">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-sm text-(--color-ink-soft)">
            <Sparkles className="h-8 w-8 text-(--color-brand-violet)" />
            <p>Спроси о теме, попроси объяснить ошибку или разобрать задание — отвечу дружелюбно и по делу.</p>
            {suggestions.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold hover:border-(--color-brand-blue)"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "flex max-w-[90%] items-start gap-2",
              m.role === "user" ? "ml-auto flex-row-reverse" : ""
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                m.role === "user" ? "bg-black/5" : "btn-gradient"
              )}
            >
              {m.role === "user" ? <User className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
            </span>
            <div
              className={cn(
                "whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed",
                m.role === "user"
                  ? "rounded-tr-sm bg-(--color-paper-dim)"
                  : "rounded-tl-sm bg-(--color-sky-2)"
              )}
            >
              {m.content || (isPending && i === messages.length - 1 ? "…" : "")}
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-black/5 p-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-full bg-(--color-paper-dim) px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-(--color-brand-blue)"
        />
        <button
          type="submit"
          disabled={isPending || !input.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full btn-gradient disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateMoreTasksForTopic } from "@/lib/actions/task-generation";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";

export function GenerateMoreTasks({ topicId }: { topicId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await generateMoreTasksForTopic(topicId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="card-surface p-4 text-center">
      <Button type="button" variant="outline" size="sm" onClick={handleClick} disabled={isPending}>
        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
        {isPending ? "ИИ придумывает задания…" : "Ещё задания по теме"}
      </Button>
      {error && <p className="mt-2 text-xs font-semibold text-(--color-brand-pink)">{error}</p>}
    </div>
  );
}

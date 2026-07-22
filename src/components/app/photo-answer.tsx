"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { submitAttemptPhoto } from "@/lib/actions/attempts";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, RotateCcw, Sparkles } from "lucide-react";

// A phone camera photo is routinely 3-8 MB — sent as-is, base64-encoded,
// that alone can blow past Next's Server Action body limit, and even where
// it doesn't, it's a slow, flaky upload on mobile data for no benefit (the
// vision model doesn't need full sensor resolution to read handwriting).
// Downscale to a sane max dimension and re-encode as JPEG before it ever
// leaves the device — this is the fix, the raised server limit is just
// headroom for whatever this doesn't shrink enough.
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas 2D context unavailable"));
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Не удалось открыть фото"));
    };
    img.src = objectUrl;
  });
}

export type PhotoGradeResult = {
  score: number;
  maxScore: number;
  feedback: string;
  xpGain: number;
  isCorrect: boolean;
};

// Camera-first answer flow for DETAILED_ANSWER/ESSAY tasks — the student
// photographs their handwritten solution instead of retyping it, matching
// how they'd actually write it on the real exam. The photo never leaves
// this request: submitAttemptPhoto sends it straight to the AI for grading
// and doesn't persist it anywhere.
export function PhotoAnswer({
  taskId,
  maxScore,
  mockExamAttemptId,
  initialResult,
  onGraded,
}: {
  taskId: string;
  maxScore: number;
  mockExamAttemptId?: string;
  initialResult?: PhotoGradeResult;
  onGraded?: (result: PhotoGradeResult) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PhotoGradeResult | null>(initialResult ?? null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file after a retry
    if (!file) return;

    setError(null);
    setResult(null);
    setBusy(true);
    try {
      const dataUrl = await compressImage(file);
      setPreview(dataUrl);
      const commaIdx = dataUrl.indexOf(",");
      const base64 = dataUrl.slice(commaIdx + 1);
      const res = await submitAttemptPhoto({
        taskId,
        imageBase64: base64,
        mimeType: "image/jpeg",
        mockExamAttemptId,
      });
      const graded = {
        score: res.score,
        maxScore: res.maxScore,
        feedback: res.feedback,
        xpGain: res.xpGain,
        isCorrect: res.isCorrect,
      };
      setResult(graded);
      onGraded?.(graded);
    } catch {
      setError("Не получилось проверить фото — попробуй переснять и отправить ещё раз.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />

      {preview && (
        <div className="mb-3 overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
          {/* Local blob/data URL from the student's own camera — not an
              optimizable remote asset, so next/image's loader is skipped. */}
          <Image
            src={preview}
            alt="Фото ответа"
            width={800}
            height={600}
            unoptimized
            className="max-h-72 w-full object-contain bg-(--color-paper-dim)"
          />
        </div>
      )}

      {busy && (
        <div className="flex items-center gap-2 rounded-2xl bg-(--color-sky-2) px-4 py-3 text-sm font-semibold text-(--color-brand-blue)">
          <Loader2 className="h-4 w-4 animate-spin" /> ИИ проверяет фото…
        </div>
      )}

      {!busy && result && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-2xl bg-(--color-sky-2) px-4 py-3 text-sm font-bold text-(--color-brand-blue)">
            <Sparkles className="h-5 w-5 shrink-0" />
            {result.score}/{result.maxScore} баллов
          </div>
          <div className="rounded-2xl bg-(--color-paper-dim) p-5 text-sm leading-relaxed text-(--color-ink-soft)">
            <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-(--color-ink)">
              Обратная связь от ИИ
            </div>
            {result.feedback}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            <RotateCcw className="h-4 w-4" /> Переснять и отправить заново
          </Button>
        </div>
      )}

      {!busy && !result && (
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
          <Camera className="h-4 w-4" /> Сфотографировать ответ
        </Button>
      )}

      {error && <p className="mt-2 text-xs font-semibold text-(--color-brand-pink)">{error}</p>}

      {!busy && !result && (
        <p className="mt-2 text-xs text-(--color-ink-soft)">
          Максимум за задание: {maxScore} {maxScore === 1 ? "балл" : "баллов"}. Фото нигде не сохраняется — уходит только на проверку.
        </p>
      )}
    </div>
  );
}

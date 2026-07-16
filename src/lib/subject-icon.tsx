import { Sigma, PenLine, Calculator, BookOpenText, BookOpen } from "lucide-react";
import type { ComponentType } from "react";

const map: Record<string, ComponentType<{ className?: string; strokeWidth?: number }>> = {
  sigma: Sigma,
  "pen-line": PenLine,
  calculator: Calculator,
  "book-open-text": BookOpenText,
};

export function SubjectIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = map[icon] ?? BookOpen;
  return <Icon className={className} strokeWidth={1.75} />;
}

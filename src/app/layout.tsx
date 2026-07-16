import type { Metadata } from "next";
import { Manrope, Unbounded } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Готово — подготовка к ЕГЭ и ОГЭ с ИИ",
  description:
    "Готово — умная подготовка к ЕГЭ и ОГЭ: реальные задания, понятная теория и ИИ-репетитор, который объясняет как друг. Прогресс, разбор ошибок и аналитика в одном месте.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${manrope.variable} ${unbounded.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-(--color-paper) text-(--color-ink)">
        {children}
      </body>
    </html>
  );
}

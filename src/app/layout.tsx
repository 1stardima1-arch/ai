import type { Metadata, Viewport } from "next";
import { Manrope, Unbounded } from "next/font/google";
import { SwRegister } from "@/components/pwa/sw-register";
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
  title: "Балл — готовься к ЕГЭ и ОГЭ без репетиторов",
  description:
    "Балл — подготовка к ЕГЭ и ОГЭ без репетиторов: простая теория, реальные задания из открытого банка ФИПИ и ИИ, который понятно объясняет. Прогресс, разбор ошибок и аналитика в одном месте.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Балл",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f6bff",
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
        <SwRegister />
        {children}
      </body>
    </html>
  );
}

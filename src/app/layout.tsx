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
  // Lets the app draw under the notch/home-indicator area instead of
  // leaving a hard browser-chrome band there — required for the
  // safe-area-inset-* CSS vars below to resolve to anything but 0.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      data-scroll-behavior="smooth"
      className={`${manrope.variable} ${unbounded.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-(--color-paper) text-(--color-ink)">
        {/* Runs before first paint so the page never flashes light-then-dark
            (or vice versa) — the alternative, applying the class from a
            client component after hydration, would always show a flash.
            Dark is the default theme: only an explicit "light" choice
            (saved by ThemeToggle) turns it off. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('ball-theme')!=='light')document.documentElement.classList.add('dark')}catch(e){}",
          }}
        />
        <SwRegister />
        {children}
      </body>
    </html>
  );
}

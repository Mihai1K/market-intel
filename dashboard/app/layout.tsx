import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "market-intel",
  description: "Поиск бизнес-возможностей: рынки, боли, процессы, скоринг",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-screen">
        <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3">
            <Link href="/" className="text-sm font-semibold tracking-tight text-zinc-100">
              market<span className="text-emerald-400">·</span>intel
            </Link>
            <Link href="/rating" className="text-sm text-zinc-400 hover:text-zinc-100">
              Рейтинг
            </Link>
            <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-100">
              Рынки
            </Link>
            <Link href="/pains" className="text-sm text-zinc-400 hover:text-zinc-100">
              База болей
            </Link>
            <Link href="/experiments" className="text-sm text-zinc-400 hover:text-zinc-100">
              Эксперименты
            </Link>
            <span className="ml-auto hidden text-[11px] text-zinc-600 sm:block">
              каждая цифра — со ссылкой на источник
            </span>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-6 pb-10 text-[11px] text-zinc-700">
          Цель: каждую неделю — минимум одна возможность, проверяемая за 7 дней, первые деньги ≤ 30 дней.
        </footer>
      </body>
    </html>
  );
}

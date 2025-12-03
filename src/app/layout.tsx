import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppProviders from "@/components/providers/AppProviders";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: {
    default: "Anonymous Chat — безопасные и быстрые комьюнити",
    template: "%s | Anonymous Chat"
  },
  description:
    "Заранее настроенный фронтенд на Next.js + TypeScript для мгновенного запуска приватных чатов с анимациями, SEO и интеграциями.",
  keywords: [
    "next.js",
    "tailwind",
    "anonymous chat",
    "secure messaging",
    "framer motion",
    "redux",
    "tanstack query"
  ],
  authors: [{ name: "Anonymous Team" }],
  metadataBase: new URL("https://anonymouschat.example"),
  icons: {
    icon: "/favicon.svg"
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://anonymouschat.example",
    siteName: "Anonymous Chat",
    title: "Anonymous Chat — безопасные и быстрые комьюнити",
    description:
      "Заранее настроенный фронтенд на Next.js + TypeScript для мгновенного запуска приватных чатов с анимациями, SEO и интеграциями.",
    images: [
      {
        url: "https://anonymouschat.example/og.jpg",
        width: 1200,
        height: 630,
        alt: "Anonymous Chat Preview"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Anonymous Chat — безопасные и быстрые комьюнити",
    description:
      "Заранее настроенный фронтенд на Next.js + TypeScript для мгновенного запуска приватных чатов с анимациями, SEO и интеграциями.",
    creator: "@anonymouschat",
    site: "@anonymouschat"
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={inter.className}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}


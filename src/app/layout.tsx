import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppProviders from "@/components/providers/AppProviders";
import SeoHead from "@/components/seo/SeoHead";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: {
    default: "Anonymous Chat",
    template: "%s | Anonymous Chat"
  },
  description:
    "Готовый к продакшену стек Next.js + Tailwind + Redux + Framer Motion для анонимных сообществ и лендингов.",
  keywords: [
    "Next.js",
    "Tailwind CSS",
    "Redux Toolkit",
    "Framer Motion",
    "TanStack Query",
    "SEO"
  ],
  authors: [{ name: "Anonymous Team" }],
  metadataBase: new URL("https://anonymouschat.example"),
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <SeoHead />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}


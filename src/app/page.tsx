import type { Metadata } from "next";
import WelcomeServer from "@/components/pages/WelcomeServer";

// ISR: Перегенерируем страницу каждые 60 секунд
export const revalidate = 60;

// Метаданные для SEO (статические)
export const metadata: Metadata = {
  title: "feed Back — Анонимные отзывы для компаний",
  description: "Отправляйте анонимные отзывы в свою компанию. Безопасная платформа для честной обратной связи, жалоб, похвал и предложений.",
  keywords: "анонимные отзывы, обратная связь, HR, жалобы, предложения, анонимность, конфиденциальность, feedback",
  openGraph: {
    title: "feed Back — Анонимные отзывы для компаний",
    description: "Отправляйте анонимные отзывы в свою компанию. Безопасная платформа для честной обратной связи.",
    type: "website",
    locale: "ru_RU",
    siteName: "feed Back",
  },
  twitter: {
    card: "summary_large_image",
    title: "feed Back — Анонимные отзывы для компаний",
    description: "Отправляйте анонимные отзывы в свою компанию. Безопасная платформа для честной обратной связи.",
  },
  alternates: {
    canonical: "/",
    languages: {
      "ru": "/?lang=ru",
      "en": "/?lang=en",
      "kk": "/?lang=kk",
    },
  },
};

export default async function HomePage({
  searchParams,
}: {
  searchParams?: { code?: string; lang?: string };
}) {
  return <WelcomeServer searchParams={searchParams} />;
}


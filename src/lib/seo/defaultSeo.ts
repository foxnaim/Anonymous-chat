import type { DefaultSeoProps } from "next-seo";

const defaultSeo: DefaultSeoProps = {
  title: "Anonymous Chat — безопасные и быстрые комьюнити",
  description:
    "Заранее настроенный фронтенд на Next.js + TypeScript для мгновенного запуска приватных чатов с анимациями, SEO и интеграциями.",
  canonical: "https://anonymouschat.example",
  additionalMetaTags: [
    {
      name: "keywords",
      content:
        "next.js, tailwind, anonymous chat, secure messaging, framer motion, redux, tanstack query"
    }
  ],
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://anonymouschat.example",
    siteName: "Anonymous Chat",
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
    handle: "@anonymouschat",
    site: "@anonymouschat",
    cardType: "summary_large_image"
  }
};

export default defaultSeo;


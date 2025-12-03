import type { DefaultSeoProps } from "next-seo";
import { APP_CONFIG } from "./constants";

const defaultSeo: DefaultSeoProps = {
  title: `${APP_CONFIG.NAME} — безопасные и быстрые комьюнити`,
  description:
    "Заранее настроенный фронтенд на Next.js + TypeScript для мгновенного запуска приватных чатов с анимациями, SEO и интеграциями.",
  canonical: APP_CONFIG.SITE_URL,
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
    url: APP_CONFIG.SITE_URL,
    siteName: APP_CONFIG.NAME,
    images: [
      {
        url: `${APP_CONFIG.SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: `${APP_CONFIG.NAME} Preview`
      }
    ]
  },
  twitter: {
    handle: "@feedbackhub",
    site: "@feedbackhub",
    cardType: "summary_large_image"
  }
};

export default defaultSeo;


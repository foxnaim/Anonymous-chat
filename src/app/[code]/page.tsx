import type { Metadata } from "next";
import { notFound } from "next/navigation";
import WelcomeServer from "@/components/pages/WelcomeServer";
import { serverApiClient } from "@/lib/api/server";

// ISR: Перегенерируем страницу каждые 60 секунд
export const revalidate = 60;

// Генерируем метаданные для каждой компании
export async function generateMetadata({
  params,
}: {
  params: { code: string };
}): Promise<Metadata> {
  const code = params.code?.toUpperCase();
  
  if (!code || code.length !== 8) {
    return {
      title: "Компания не найдена | feed Back",
      description: "Компания с указанным кодом не найдена.",
    };
  }

  try {
    const company = await serverApiClient.getCompanyByCode(code);
    
    if (!company) {
      return {
        title: "Компания не найдена | feed Back",
        description: "Компания с указанным кодом не найдена.",
      };
    }

    const companyName = company.name || "Компания";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://feedbackhub.com";
    
    return {
      title: `Отправить отзыв в ${companyName} | feed Back`,
      description: `Отправьте анонимный отзыв в ${companyName}. Безопасная платформа для честной обратной связи, жалоб, похвал и предложений.`,
      keywords: `отзыв, ${companyName}, обратная связь, анонимные отзывы, feedback, жалобы, предложения`,
      openGraph: {
        title: `Отправить отзыв в ${companyName}`,
        description: `Отправьте анонимный отзыв в ${companyName}. Безопасная платформа для честной обратной связи.`,
        type: "website",
        locale: "ru_RU",
        siteName: "feed Back",
        url: `${siteUrl}/${code}`,
        images: company.logoUrl ? [
          {
            url: company.logoUrl,
            width: 1200,
            height: 630,
            alt: `${companyName} Logo`,
          }
        ] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: `Отправить отзыв в ${companyName}`,
        description: `Отправьте анонимный отзыв в ${companyName}. Безопасная платформа для честной обратной связи.`,
        images: company.logoUrl ? [company.logoUrl] : undefined,
      },
      alternates: {
        canonical: `/${code}`,
        languages: {
          "ru": `/${code}?lang=ru`,
          "en": `/${code}?lang=en`,
          "kk": `/${code}?lang=kk`,
        },
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "feed Back — Анонимные отзывы для компаний",
      description: "Отправляйте анонимные отзывы в свою компанию. Безопасная платформа для честной обратной связи.",
    };
  }
}

// Генерируем статические пути для известных компаний (опционально)
export async function generateStaticParams() {
  try {
    const companies = await serverApiClient.getPublicCompanies();
    // Ограничиваем количество для билда (можно увеличить)
    return companies.slice(0, 100).map((company) => ({
      code: company.code,
    }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

export default async function CompanyPage({
  params,
}: {
  params: { code: string };
}) {
  const code = params.code?.toUpperCase();
  
  // Валидация кода
  if (!code || code.length !== 8) {
    notFound();
  }

  // Проверяем существование компании на сервере
  const company = await serverApiClient.getCompanyByCode(code);
  
  if (!company) {
    notFound();
  }

  // Используем Server Component для загрузки данных
  return <WelcomeServer initialCompanyCode={code} />;
}


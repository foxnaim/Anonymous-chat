import type { MetadataRoute } from "next";
import { serverApiClient } from "@/lib/api/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://feedbackhub.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Статические маршруты
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  // Динамические маршруты для компаний
  try {
    const companies = await serverApiClient.getPublicCompanies();
    
    // Ограничиваем количество для производительности (первые 1000)
    const companyRoutes: MetadataRoute.Sitemap = companies.slice(0, 1000).map((company) => ({
      url: `${SITE_URL}/${company.code}`,
      lastModified: company.updatedAt ? new Date(company.updatedAt) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    return [...staticRoutes, ...companyRoutes];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    // В случае ошибки возвращаем только статические маршруты
    return staticRoutes;
  }
}


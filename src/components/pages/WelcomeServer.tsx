/**
 * Server Component обертка для Welcome
 * Загружает данные на сервере и передает в клиентский компонент
 */

import Welcome from "./Welcome";
import { serverApiClient } from "@/lib/api/server";
import type { Company } from "@/types";

interface WelcomeServerProps {
  initialCompanyCode?: string;
  searchParams?: { code?: string; lang?: string };
}

/**
 * Server Component - загружает данные на сервере
 */
export default async function WelcomeServer({
  initialCompanyCode,
  searchParams,
}: WelcomeServerProps) {
  // Определяем код компании из параметров
  const code = initialCompanyCode || searchParams?.code?.toUpperCase();
  const isValidCode = code && code.length === 8;

  // Загружаем данные компании на сервере, если код валиден
  // Ошибки обрабатываются внутри serverApiClient, возвращается null при ошибке
  let initialCompany: Company | null = null;
  if (isValidCode) {
    initialCompany = await serverApiClient.getCompanyByCode(code);
    // serverApiClient уже обрабатывает ошибки и возвращает null
  }

  // Передаем данные в клиентский компонент
  // Suspense не нужен здесь, так как Welcome - клиентский компонент
  // и данные уже загружены на сервере
  return (
    <Welcome 
      initialCompanyCode={code || undefined}
      initialCompany={initialCompany}
    />
  );
}


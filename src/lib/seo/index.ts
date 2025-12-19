/**
 * SEO конфигурация, утилиты и компоненты
 */

export { default as defaultSeo } from './defaultSeo';
export type { DefaultSeoProps } from 'next-seo';
export * from './constants';

// SEO утилиты
import { APP_CONFIG } from './constants';

export const seoUtils = {
  /**
   * Генерирует полный title с названием приложения
   */
  getFullTitle: (title?: string, appName: string = APP_CONFIG.NAME): string => {
    return title ? `${title} | ${appName}` : appName;
  },

  /**
   * Генерирует canonical URL
   */
  getCanonicalUrl: (path: string, baseUrl: string = APP_CONFIG.SITE_URL): string => {
    return `${baseUrl}${path}`;
  },

  /**
   * Генерирует Open Graph изображение URL
   */
  getOgImageUrl: (path: string = '/og-image.png', baseUrl: string = APP_CONFIG.SITE_URL): string => {
    return `${baseUrl}${path}`;
  },
};

// SEO компоненты
export { SEO, StructuredData, WebsiteStructuredData, OrganizationStructuredData } from './components/SEO';
export { SeoHead } from './components/SeoHead';


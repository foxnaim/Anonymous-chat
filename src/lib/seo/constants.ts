/**
 * Константы для SEO
 */

// App Configuration
export const APP_CONFIG = {
  NAME: 'FeedbackHub',
  VERSION: '1.0.0',
  SITE_URL: typeof window !== 'undefined' ? window.location.origin : 'https://feedbackhub.com',
  DEFAULT_LANGUAGE: 'ru',
  SUPPORTED_LANGUAGES: ['ru', 'en', 'kk'] as const,
} as const;


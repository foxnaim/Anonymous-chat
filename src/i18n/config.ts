'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import type { InitOptions } from 'i18next';

import en from './locales/en.json';
import ru from './locales/ru.json';
import kk from './locales/kk.json';

if (!i18n.isInitialized) {
  // CRITICAL: Always use 'ru' for initial render to prevent hydration mismatches
  // Language detection will happen AFTER hydration is complete
  const initOptions: InitOptions = {
    resources: {
      en: { translation: en },
      ru: { translation: ru },
      kk: { translation: kk },
    },
    lng: 'ru', // Always start with 'ru' to match server-side rendering
    fallbackLng: 'ru',
    supportedLngs: ['en', 'ru', 'kk'],
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,
      formatSeparator: ',',
      format: function(value: any, format?: string) {
        if (format === 'uppercase') return value.toUpperCase();
        if (format === 'lowercase') return value.toLowerCase();
        return value;
      }
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      // Disable automatic detection on init to prevent hydration issues
      checkWhitelist: false,
    } as any,
    react: {
      useSuspense: false, // Disable suspense to prevent hydration issues
    },
  };

  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init(initOptions);

  // Apply language from localStorage AFTER initialization and hydration
  // This ensures server and client render the same initial content
  if (typeof window !== 'undefined') {
    // Use requestAnimationFrame to ensure this runs after React hydration
    requestAnimationFrame(() => {
      try {
        const stored = localStorage.getItem('i18nextLng');
        if (stored && ['en', 'ru', 'kk'].includes(stored) && stored !== i18n.language) {
          i18n.changeLanguage(stored);
        } else {
          // If no stored language, try to detect from navigator
          const browserLang = navigator.language?.split('-')[0] || 'ru';
          if (['en', 'ru', 'kk'].includes(browserLang) && browserLang !== 'ru') {
            i18n.changeLanguage(browserLang);
            localStorage.setItem('i18nextLng', browserLang);
          }
        }
      } catch (error) {
        // Ignore localStorage errors (private mode, etc.)
        console.warn('Failed to load language from localStorage:', error);
      }
    });
  }
}

export default i18n;


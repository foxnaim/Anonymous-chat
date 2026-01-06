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
      // Disable automatic detection to prevent hydration mismatches
      // Language will be applied manually after hydration
      order: [],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
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
    // Wait for DOM to be ready and React hydration to complete
    const applyLanguage = () => {
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
    };

    // Use multiple strategies to ensure this runs after React hydration
    // React hydration typically completes within 100-500ms after DOMContentLoaded
    const waitForHydration = () => {
      // Wait longer to ensure React has fully hydrated
      setTimeout(applyLanguage, 300);
    };

    if (document.readyState === 'loading') {
      // Document is still loading, wait for DOMContentLoaded then hydration
      document.addEventListener('DOMContentLoaded', waitForHydration, { once: true });
    } else if (document.readyState === 'interactive' || document.readyState === 'complete') {
      // Document is ready, just wait for React hydration
      waitForHydration();
    }
  }
}

export default i18n;


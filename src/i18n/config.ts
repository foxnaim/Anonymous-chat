'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import ru from './locales/ru.json';
import kk from './locales/kk.json';

if (!i18n.isInitialized) {
  // Determine initial language: always 'ru' on server, 'ru' on client for first render
  // This ensures server and client match during hydration
  const getInitialLanguage = (): string => {
    if (typeof window === 'undefined') {
      return 'ru'; // Server-side: always use 'ru'
    }
    // Client-side: use 'ru' initially to match server, then detect after mount
    return 'ru';
  };

  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        ru: { translation: ru },
        kk: { translation: kk },
      },
      lng: getInitialLanguage(),
      fallbackLng: 'ru',
      defaultNS: 'translation',
      interpolation: {
        escapeValue: false,
        formatSeparator: ',',
        format: function(value, format) {
          if (format === 'uppercase') return value.toUpperCase();
          if (format === 'lowercase') return value.toLowerCase();
          return value;
        }
      },
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
        lookupLocalStorage: 'i18nextLng',
      },
      react: {
        useSuspense: false, // Disable suspense to prevent hydration issues
      },
    });

  // After initialization, detect and change language if needed (client-side only)
  // This runs after the initial render to prevent hydration mismatch
  if (typeof window !== 'undefined') {
    // Use requestAnimationFrame to ensure this runs after React hydration
    requestAnimationFrame(() => {
      const stored = localStorage.getItem('i18nextLng');
      if (stored && ['en', 'ru', 'kk'].includes(stored) && stored !== 'ru') {
        i18n.changeLanguage(stored);
      } else {
        const browserLang = navigator.language.split('-')[0];
        if (['en', 'ru', 'kk'].includes(browserLang) && browserLang !== 'ru') {
          i18n.changeLanguage(browserLang);
        }
      }
    });
  }
}

export default i18n;


'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import ru from './locales/ru.json';
import kk from './locales/kk.json';

if (!i18n.isInitialized) {
  // Determine initial language: always 'ru' on server, detect on client
  const getInitialLanguage = (): string => {
    if (typeof window === 'undefined') {
      return 'ru'; // Server-side: always use 'ru' to match layout
    }
    // Client-side: check localStorage first, then browser, then default to 'ru'
    const stored = localStorage.getItem('i18nextLng');
    if (stored && ['en', 'ru', 'kk'].includes(stored)) {
      return stored;
    }
    const browserLang = navigator.language.split('-')[0];
    if (['en', 'ru', 'kk'].includes(browserLang)) {
      return browserLang;
    }
    return 'ru'; // Default fallback
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
}

export default i18n;


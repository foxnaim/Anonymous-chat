'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import ru from './locales/ru.json';
import kk from './locales/kk.json';

if (!i18n.isInitialized) {
  // Determine initial language: always 'ru' on server, detect from localStorage on client
  const getInitialLanguage = (): string => {
    if (typeof window === 'undefined') {
      return 'ru'; // Server-side: always use 'ru'
    }
    // Client-side: try to get from localStorage immediately (synchronously)
    const stored = localStorage.getItem('i18nextLng');
    if (stored && ['en', 'ru', 'kk'].includes(stored)) {
      return stored;
    }
    // Fallback to browser language or 'ru'
    const browserLang = navigator.language.split('-')[0];
    if (['en', 'ru', 'kk'].includes(browserLang)) {
      return browserLang;
    }
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

  // Ensure language is persisted in localStorage after initialization
  // Используем setTimeout чтобы избежать проблем с SSR и hydration
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      try {
        const currentLang = i18n.language?.split('-')[0] || 'ru';
        if (['en', 'ru', 'kk'].includes(currentLang)) {
          const stored = localStorage.getItem('i18nextLng');
          // Сохраняем только если еще не сохранен или отличается
          if (!stored || stored !== currentLang) {
            localStorage.setItem('i18nextLng', currentLang);
          }
        }
      } catch (error) {
        // Игнорируем ошибки localStorage (например, в приватном режиме)
        console.warn('Failed to persist language to localStorage:', error);
      }
    }, 0);
  }
}

export default i18n;


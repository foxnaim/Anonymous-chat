'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import type { InitOptions } from 'i18next';

import en from './locales/en.json';
import ru from './locales/ru.json';
import kk from './locales/kk.json';

if (!i18n.isInitialized) {
  // Helper function to normalize language code (e.g., 'ru-RU' -> 'ru')
  const normalizeLang = (lang: string | null | undefined): string => {
    if (!lang) return 'ru';
    const code = lang.split('-')[0].toLowerCase();
    return ['en', 'ru', 'kk'].includes(code) ? code : 'ru';
  };

  // Get initial language: read from localStorage on client, default to 'ru' on server
  // This ensures consistent initial render while preserving user preference
  let initialLanguage = 'ru';
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('i18nextLng');
      if (stored) {
        initialLanguage = normalizeLang(stored);
      }
    } catch (error) {
      // Ignore localStorage errors (private mode, etc.)
      console.warn('Failed to read language from localStorage:', error);
    }
  }

  const initOptions: InitOptions = {
    resources: {
      en: { translation: en },
      ru: { translation: ru },
      kk: { translation: kk },
    },
    lng: initialLanguage, // Use stored language or 'ru' as fallback
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
      // Language is set manually from localStorage
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

  // Listen for language changes and save to localStorage
  if (typeof window !== 'undefined') {
    const normalizeLang = (lang: string | null | undefined): string => {
      if (!lang) return 'ru';
      const code = lang.split('-')[0].toLowerCase();
      return ['en', 'ru', 'kk'].includes(code) ? code : 'ru';
    };

    i18n.on('languageChanged', (lng) => {
      try {
        const langCode = normalizeLang(lng);
        localStorage.setItem('i18nextLng', langCode);
      } catch (error) {
        console.warn('Failed to save language to localStorage:', error);
      }
    });

    // Ensure language is saved if not already saved
    try {
      const currentLang = normalizeLang(i18n.language);
      const stored = localStorage.getItem('i18nextLng');
      const normalizedStored = normalizeLang(stored);
      
      // Save if not stored or if stored language doesn't match current
      if (!stored || normalizedStored !== currentLang) {
        localStorage.setItem('i18nextLng', currentLang);
      }
    } catch (error) {
      console.warn('Failed to save initial language to localStorage:', error);
    }
  }
}

export default i18n;


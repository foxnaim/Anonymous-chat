'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { InitOptions } from 'i18next';

import en from './locales/en.json';
import ru from './locales/ru.json';
import kk from './locales/kk.json';

// Helper function to normalize language code (e.g., 'ru-RU' -> 'ru')
const normalizeLang = (lang: string | null | undefined): string => {
  if (!lang) return 'ru';
  const code = lang.split('-')[0].toLowerCase();
  return ['en', 'ru', 'kk'].includes(code) ? code : 'ru';
};

if (!i18n.isInitialized) {
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
    react: {
      useSuspense: false, // Disable suspense to prevent hydration issues
    },
  };

  // Initialize i18n WITHOUT LanguageDetector to have full control
  i18n
    .use(initReactI18next)
    .init(initOptions);

  // Ensure language is saved to localStorage after initialization
  if (typeof window !== 'undefined') {
    // Save initial language immediately
    try {
      const currentLang = normalizeLang(initialLanguage);
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

  // Listen for language changes and save to localStorage
  if (typeof window !== 'undefined') {
    // Set up listener for language changes - this ensures language is always saved
    i18n.on('languageChanged', (lng) => {
      try {
        const langCode = normalizeLang(lng);
        // Always save to localStorage when language changes
        localStorage.setItem('i18nextLng', langCode);
      } catch (error) {
        console.warn('Failed to save language to localStorage:', error);
      }
    });

    // Override changeLanguage to ensure language is always saved
    const originalChangeLanguage = i18n.changeLanguage.bind(i18n);
    i18n.changeLanguage = function(lng: string | string[], ...args: any[]) {
      const result = originalChangeLanguage(lng, ...args);
      // Ensure language is saved after change
      if (typeof window !== 'undefined') {
        try {
          const langCode = normalizeLang(typeof lng === 'string' ? lng : lng[0]);
          localStorage.setItem('i18nextLng', langCode);
        } catch (error) {
          console.warn('Failed to save language to localStorage:', error);
        }
      }
      return result;
    };
  }
}

export default i18n;


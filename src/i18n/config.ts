'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { InitOptions } from 'i18next';

import en from './locales/en.json';
import ru from './locales/ru.json';
import kk from './locales/kk.json';

// Helper function to normalize language code (e.g., 'ru-RU' -> 'ru')
export const normalizeLang = (lang: string | null | undefined): string => {
  if (!lang) return 'ru';
  const code = lang.split('-')[0].toLowerCase();
  return ['en', 'ru', 'kk'].includes(code) ? code : 'ru';
};

// Flag to track if language was restored after hydration
let languageRestored = false;

if (!i18n.isInitialized) {
  // CRITICAL: Always use 'ru' for initial render to prevent hydration mismatches
  // The actual language from localStorage will be applied AFTER hydration via useEffect
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
    react: {
      useSuspense: false, // Disable suspense to prevent hydration issues
    },
  };

  // Initialize i18n WITHOUT LanguageDetector to have full control
  i18n
    .use(initReactI18next)
    .init(initOptions);

  // Listen for language changes and save to localStorage
  if (typeof window !== 'undefined') {
    i18n.on('languageChanged', (lng) => {
      try {
        const langCode = normalizeLang(lng);
        localStorage.setItem('i18nextLng', langCode);
      } catch (error) {
        console.warn('Failed to save language to localStorage:', error);
      }
    });
  }
}

// Function to restore language from localStorage - call this AFTER hydration
export const restoreLanguageFromStorage = (): void => {
  if (typeof window === 'undefined' || languageRestored) return;
  
  try {
    const stored = localStorage.getItem('i18nextLng');
    if (stored) {
      const normalizedStored = normalizeLang(stored);
      if (normalizedStored !== i18n.language) {
        i18n.changeLanguage(normalizedStored);
      }
    }
    languageRestored = true;
  } catch (error) {
    console.warn('Failed to restore language from localStorage:', error);
  }
};

export default i18n;


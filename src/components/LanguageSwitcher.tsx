'use client';

import { memo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Listbox, Transition } from '@headlessui/react';
import { FiCheck, FiChevronDown, FiGlobe } from 'react-icons/fi';
import { Fragment } from 'react';
import { cn } from '@/lib/utils';

const languages = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'kk', name: 'Қазақша', flag: '🇰🇿' },
];

export const LanguageSwitcher = memo(() => {
  const { i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use 'ru' as default on server to match layout, then use detected language after mount
  // This prevents hydration mismatch between server (always 'ru') and client (might detect different language)
  const currentLanguageCode = mounted 
    ? (i18n.language || 'ru')
    : 'ru'; // Default to 'ru' on server to prevent hydration mismatch
  
  const currentLanguage = languages.find((lang) => lang.code === currentLanguageCode) || languages[0];

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('i18nextLng', code);
  };

  return (
    <Listbox value={currentLanguage.code} onChange={changeLanguage}>
      {({ open }) => (
        <div className="relative w-full min-w-0 max-w-full">
          <Listbox.Button
            className={cn(
              "relative w-full cursor-pointer rounded-lg bg-white dark:bg-card border border-border py-1.5 sm:py-2 pl-2 sm:pl-3 pr-8 sm:pr-10 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 text-xs sm:text-sm",
              "hover:bg-muted/50 transition-colors h-8 sm:h-9 md:h-10 w-full"
            )}
          >
            <span className="flex items-center gap-1 sm:gap-2 min-w-0">
              <FiGlobe className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
              <span className="block truncate font-medium text-foreground min-w-0 max-w-full">
                <span className="hidden sm:inline">{currentLanguage.flag} {currentLanguage.name}</span>
                <span className="sm:hidden">{currentLanguage.flag}</span>
              </span>
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5 sm:pr-2">
              <FiChevronDown
                className={cn(
                  "h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground transition-transform flex-shrink-0",
                  open && "rotate-180"
                )}
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-card border border-border py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none min-w-[140px]">
              {languages.map((language) => (
                <Listbox.Option
                  key={language.code}
                  className={({ active }) =>
                    cn(
                      "relative cursor-pointer select-none py-2 pl-3 pr-9",
                      active ? "bg-primary text-white" : "text-foreground"
                    )
                  }
                  value={language.code}
                >
                  {({ selected, active }) => (
                    <>
                      <span
                        className={cn(
                          "block truncate",
                          selected ? "font-semibold" : "font-normal"
                        )}
                      >
                        {language.flag} {language.name}
                      </span>
                      {selected ? (
                        <span
                          className={cn(
                            "absolute inset-y-0 right-0 flex items-center pr-4",
                            active ? "text-white" : "text-primary"
                          )}
                        >
                          <FiCheck className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      )}
    </Listbox>
  );
});
LanguageSwitcher.displayName = 'LanguageSwitcher';


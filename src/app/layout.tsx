import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import AppProviders from "@/components/providers/AppProviders";
import { PerformanceMonitorComponent } from "@/components/PerformanceMonitor";

// Оптимизация загрузки шрифтов
const inter = Inter({ 
  subsets: ["latin", "cyrillic"],
  display: 'swap', // Показывать fallback шрифт пока загружается основной
  preload: true, // Предзагрузка шрифта
  variable: '--font-inter', // CSS переменная для использования
});

export const metadata: Metadata = {
  title: {
    default: "feed Back — Анонимные отзывы для компаний",
    template: "%s | feed Back"
  },
  description:
    "Отправляйте анонимные отзывы в свою компанию. Безопасная платформа для честной обратной связи, жалоб, похвал и предложений.",
  keywords: [
    "анонимные отзывы",
    "обратная связь",
    "HR",
    "жалобы",
    "предложения",
    "анонимность",
    "конфиденциальность",
    "feedback",
    "отзывы о компании"
  ],
  authors: [{ name: "feed Back Team" }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://feedbackhub.com"),
  icons: {
    icon: "/feedBack.svg"
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://feedbackhub.com",
    siteName: "feed Back",
    title: "feed Back — Анонимные отзывы для компаний",
    description:
      "Отправляйте анонимные отзывы в свою компанию. Безопасная платформа для честной обратной связи.",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://feedbackhub.com"}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "feed Back — Анонимные отзывы для компаний"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "feed Back — Анонимные отзывы для компаний",
    description:
      "Отправляйте анонимные отзывы в свою компанию. Безопасная платформа для честной обратной связи.",
    creator: "@feedbackhub",
    site: "@feedbackhub"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
    languages: {
      "ru": "/?lang=ru",
      "en": "/?lang=en",
      "kk": "/?lang=kk",
    },
  },
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        {/* Service Worker для агрессивного кэширования */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {
                    // Silent fail - SW registration errors are not critical
                  });
                });
              }
            `,
          }}
        />
        {/* Resource hints для ускорения загрузки */}
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'} />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'} />
        {/* Preload критичных ресурсов */}
        <link rel="preload" href="/feedBack.svg" as="image" />
        {/* Ранняя загрузка утилиты для подавления ошибок расширений */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                'use strict';
                if (typeof window === 'undefined') return;
                
                const EXTENSION_IDS = ['pejdijmoenmkgeppbflobdenhhabjlaj'];
                const EXT_PATTERNS = [
                  'chrome-extension://',
                  'content_script.js',
                  'completion_list.html',
                  'utils.js',
                  'extensionstate.js',
                  'heuristicsredefinitions.js',
                  'err_file_not_found',
                  'failed to load resource',
                  'cannot read properties',
                  'reading control',
                  'permissions-policy',
                  'browsing-topics',
                  'unexpected identifier',
                  'unexpected token'
                ];
                
                const isExtError = function(msg, src) {
                  if (!msg && !src) return false;
                  const text = (String(msg || '') + ' ' + String(src || '')).toLowerCase();
                  // Проверяем паттерны расширений
                  if (EXT_PATTERNS.some(p => text.includes(p)) ||
                      EXTENSION_IDS.some(id => text.includes(id))) {
                    return true;
                  }
                  // Дополнительная проверка для ошибок с 'control' в content_script.js
                  if (text.includes('control') && (text.includes('content_script') || text.includes('undefined') || text.includes('unexpected'))) {
                    return true;
                  }
                  // Проверка на ошибки синтаксиса в расширениях
                  if ((text.includes('unexpected identifier') || text.includes('unexpected token')) && 
                      (text.includes('content_script') || text.includes('chrome-extension'))) {
                    return true;
                  }
                  return false;
                };
                
                // Перехватываем все методы console
                const consoleMethods = ['error', 'warn', 'log', 'info', 'debug'];
                const originalMethods = {};
                consoleMethods.forEach(method => {
                  originalMethods[method] = console[method];
                  console[method] = function(...args) {
                    const msg = String(args[0] || '');
                    const src = String(args[1] || '');
                    if (!isExtError(msg, src)) {
                      originalMethods[method].apply(console, args);
                    }
                  };
                });
                
                // Перехватываем глобальные ошибки
                const origOnError = window.onerror;
                window.onerror = function(msg, src, line, col, err) {
                  if (isExtError(msg, src)) {
                    return true;
                  }
                  if (origOnError) {
                    return origOnError.call(this, msg, src, line, col, err);
                  }
                  return false;
                };
                
                // Перехватываем через addEventListener
                window.addEventListener('error', function(e) {
                  if (isExtError(e.message || '', e.filename || '')) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    return true;
                  }
                }, true);
                
                // Перехватываем необработанные промисы
                window.addEventListener('unhandledrejection', function(e) {
                  const reason = e.reason;
                  const msg = reason?.message || String(reason || '');
                  const stack = reason?.stack || '';
                  if (isExtError(msg, stack)) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                  }
                }, true);
                
                // Перехватываем fetch для блокировки запросов к расширениям
                const origFetch = window.fetch;
                window.fetch = function(...args) {
                  const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
                  if (url.includes('chrome-extension://')) {
                    // Блокируем запрос, возвращая пустой ответ
                    return Promise.resolve(new Response('', { status: 404, statusText: 'Not Found' }));
                  }
                  return origFetch.apply(this, args).catch(function(err) {
                    if (isExtError(err.message || '', url)) {
                      // Подавляем ошибку
                      return Promise.resolve(new Response('', { status: 404 }));
                    }
                    throw err;
                  });
                };
                
                // Перехватываем XMLHttpRequest
                const origXHROpen = XMLHttpRequest.prototype.open;
                XMLHttpRequest.prototype.open = function(method, url, ...rest) {
                  if (typeof url === 'string' && url.includes('chrome-extension://')) {
                    // Блокируем запрос
                    this.addEventListener('load', function() {
                      Object.defineProperty(this, 'status', { value: 404, writable: false });
                      Object.defineProperty(this, 'statusText', { value: 'Not Found', writable: false });
                    });
                  }
                  return origXHROpen.apply(this, [method, url, ...rest]);
                };
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} overflow-x-hidden`}>
        <AppProviders>
          <PerformanceMonitorComponent />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}


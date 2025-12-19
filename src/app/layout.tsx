import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import AppProviders from "@/components/providers/AppProviders";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: {
    default: "feed Back",
    template: "%s | Anonymous Chat"
  },
  description:
    "Заранее настроенный фронтенд на Next.js + TypeScript для мгновенного запуска приватных чатов с анимациями, SEO и интеграциями.",
  keywords: [
    "next.js",
    "tailwind",
    "anonymous chat",
    "secure messaging",
    "framer motion",
    "redux",
    "tanstack query"
  ],
  authors: [{ name: "Anonymous Team" }],
  metadataBase: new URL("https://anonymouschat.example"),
  icons: {
    icon: "/feedBack.svg"
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://anonymouschat.example",
    siteName: "Anonymous Chat",
    title: "Anonymous Chat — безопасные и быстрые комьюнити",
    description:
      "Заранее настроенный фронтенд на Next.js + TypeScript для мгновенного запуска приватных чатов с анимациями, SEO и интеграциями.",
    images: [
      {
        url: "https://anonymouschat.example/og.jpg",
        width: 1200,
        height: 630,
        alt: "Anonymous Chat Preview"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Anonymous Chat — безопасные и быстрые комьюнити",
    description:
      "Заранее настроенный фронтенд на Next.js + TypeScript для мгновенного запуска приватных чатов с анимациями, SEO и интеграциями.",
    creator: "@anonymouschat",
    site: "@anonymouschat"
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
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
                  'reading \'control\'',
                  'permissions-policy',
                  'browsing-topics'
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
                  if (text.includes('control') && (text.includes('content_script') || text.includes('undefined'))) {
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
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}


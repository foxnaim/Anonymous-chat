'use client';

import type { ReactNode } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import { useEffect, useRef } from "react";
import ReduxProvider from "./ReduxProvider";
import QueryProvider from "./QueryProvider";
// AuthProvider удален - используем Redux auth
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "@/i18n/config";
// Подавление ошибок Chrome-расширений
import "@/lib/utils/suppressExtensionErrors";
// WebSocket debug tools (только в development)
if (process.env.NODE_ENV === 'development') {
  import("@/lib/websocket/debug");
}

// Компонент для принудительной установки светлой темы при первой загрузке
const ThemeInitializer = ({ children }: { children: ReactNode }) => {
  const { theme, setTheme } = useTheme();
  const initialized = useRef(false);
  
  useEffect(() => {
    // При первой загрузке принудительно устанавливаем светлую тему
    // Используем requestIdleCallback для неблокирующей установки темы
    if (!initialized.current && theme !== 'light') {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          setTheme('light');
          initialized.current = true;
        });
      } else {
        // Fallback для браузеров без requestIdleCallback
        setTimeout(() => {
          setTheme('light');
          initialized.current = true;
        }, 0);
      }
    } else if (!initialized.current) {
      initialized.current = true;
    }
  }, [theme, setTheme]);

  return <>{children}</>;
};

interface AppProvidersProps {
  children: ReactNode;
}
const AppProviders = ({ children }: AppProvidersProps) => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <ThemeInitializer>
      <ReduxProvider>
        <QueryProvider>
            <TooltipProvider>
              {children}
              <Toaster />
            </TooltipProvider>
        </QueryProvider>
      </ReduxProvider>
    </ThemeInitializer>
  </ThemeProvider>
);
export default AppProviders;

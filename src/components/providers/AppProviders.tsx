'use client';

import type { ReactNode } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import { useEffect } from "react";
import ReduxProvider from "./ReduxProvider";
import QueryProvider from "./QueryProvider";
// AuthProvider удален - используем Redux auth
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "@/i18n/config";

// Компонент для принудительной установки светлой темы при первой загрузке
const ThemeInitializer = ({ children }: { children: ReactNode }) => {
  const { theme, setTheme } = useTheme();
  
  useEffect(() => {
    // При первой загрузке принудительно устанавливаем светлую тему
    if (theme !== 'light') {
      setTheme('light');
    }
    // Удаляем сохраненную темную тему из localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored === 'dark') {
        localStorage.removeItem('theme');
      }
    }
  }, []); // Только при монтировании

  return <>{children}</>;
};

interface AppProvidersProps {
  children: ReactNode;
}
const AppProviders = ({ children }: AppProvidersProps) => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="theme">
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

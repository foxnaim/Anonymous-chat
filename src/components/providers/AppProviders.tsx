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

// Компонент для принудительной установки светлой темы при первой загрузке
const ThemeInitializer = ({ children }: { children: ReactNode }) => {
  const { theme, setTheme } = useTheme();
  const initialized = useRef(false);
  
  useEffect(() => {
    // При первой загрузке принудительно устанавливаем светлую тему
    if (!initialized.current && theme !== 'light') {
      setTheme('light');
      initialized.current = true;
    }
    // next-themes управляет темой, убеждаемся что тема светлая
  }, [theme, setTheme]); // Добавлены зависимости

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

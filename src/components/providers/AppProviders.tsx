'use client';

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import ReduxProvider from "./ReduxProvider";
import QueryProvider from "./QueryProvider";
// AuthProvider удален - используем Redux auth
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "@/i18n/config";
interface AppProvidersProps {
  children: ReactNode;
}
const AppProviders = ({ children }: AppProvidersProps) => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <ReduxProvider>
      <QueryProvider>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
      </QueryProvider>
    </ReduxProvider>
  </ThemeProvider>
);
export default AppProviders;

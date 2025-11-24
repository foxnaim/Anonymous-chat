'use client';

import type { ReactNode } from "react";
import ReduxProvider from "./ReduxProvider";
import QueryProvider from "./QueryProvider";

interface AppProvidersProps {
  children: ReactNode;
}

const AppProviders = ({ children }: AppProvidersProps) => (
  <ReduxProvider>
    <QueryProvider>{children}</QueryProvider>
  </ReduxProvider>
);

export default AppProviders;


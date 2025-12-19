'use client';

import { QueryClientProvider } from "@tanstack/react-query";
import { useState, lazy, Suspense, type ReactNode } from "react";
import { makeQueryClient } from "@/lib";

// Ленивая загрузка DevTools для оптимизации производительности
const ReactQueryDevtools = lazy(() =>
  import("@tanstack/react-query-devtools").then((d) => ({
    default: d.ReactQueryDevtools,
  }))
);

interface QueryProviderProps {
  children: ReactNode;
}

const QueryProvider = ({ children }: QueryProviderProps) => {
  const [client] = useState(() => makeQueryClient());
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <QueryClientProvider client={client}>
      {children}
      {isDevelopment && (
        <Suspense fallback={null}>
          <ReactQueryDevtools 
            initialIsOpen={false}
            buttonPosition="bottom-left"
          />
        </Suspense>
      )}
    </QueryClientProvider>
  );
};

export default QueryProvider;

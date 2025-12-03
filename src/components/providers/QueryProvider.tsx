'use client';

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { makeQueryClient } from "@/lib";
interface QueryProviderProps {
  children: ReactNode;
}
const QueryProvider = ({ children }: QueryProviderProps) => {
  const [client] = useState(() => makeQueryClient());
  return (
    <QueryClientProvider client={client}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};
export default QueryProvider;

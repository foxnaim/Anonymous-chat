'use client';

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { ReactNode } from "react";

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider = ({ children }: SessionProviderProps) => {
  return (
    <NextAuthSessionProvider>
      {children}
    </NextAuthSessionProvider>
  );
};


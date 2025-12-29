import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AzureADProvider from "next-auth/providers/azure-ad";
import CredentialsProvider from "next-auth/providers/credentials";
import { API_CONFIG } from "@/lib/query/constants";

/**
 * Конфигурация NextAuth
 * Поддерживает: Google OAuth, Microsoft OAuth, Email/Password (Credentials)
 */
export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    // Microsoft OAuth (Azure AD)
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID || "",
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET || "",
      tenantId: process.env.AZURE_AD_TENANT_ID || "common",
    }),
    // Credentials (Email/Password) - для админов и обычных пользователей
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Используем текущий API для авторизации
          const response = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            return null;
          }

          const data = await response.json();
          
          if (data.success && data.data?.user) {
            return {
              id: data.data.user.id,
              email: data.data.user.email,
              name: data.data.user.name || data.data.user.email,
              role: data.data.user.role,
              companyId: data.data.user.companyId,
              // Сохраняем токен для использования в API
              token: data.data.token,
            };
          }

          return null;
        } catch (error) {
          console.error("Credentials auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Для OAuth провайдеров (Google, Microsoft)
      if (account?.provider === "google" || account?.provider === "azure-ad") {
        try {
          // Проверяем/создаем пользователя в БД через API
          const email = user.email;
          if (!email) return false;

          // Проверяем, существует ли пользователь
          const checkResponse = await fetch(`${API_CONFIG.BASE_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${account.access_token}`,
            },
          });

          // Если пользователь не существует, создаем его через API
          // (это можно сделать через отдельный endpoint или здесь)
          // Пока просто разрешаем вход, создание пользователя будет в jwt callback
          return true;
        } catch (error) {
          console.error("OAuth sign in error:", error);
          return false;
        }
      }

      // Для Credentials всегда разрешаем (проверка уже была в authorize)
      return true;
    },
    async jwt({ token, user, account }) {
      // При первом входе через OAuth
      if (account && user) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.id = user.id;
        token.role = (user as any).role;
        token.companyId = (user as any).companyId;
        
        // Для OAuth создаем/обновляем пользователя в БД
        if (account.provider === "google" || account.provider === "azure-ad") {
          try {
            // Синхронизируем пользователя с БД через API
            const syncResponse = await fetch(`${API_CONFIG.BASE_URL}/auth/oauth-sync`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: user.email,
                name: user.name,
                provider: account.provider,
              }),
            });

            if (syncResponse.ok) {
              const syncData = await syncResponse.json();
              if (syncData.success && syncData.data) {
                // Сохраняем данные из API
                token.id = syncData.data.user.id;
                token.role = syncData.data.user.role;
                token.companyId = syncData.data.user.companyId;
                token.apiToken = syncData.data.token; // JWT токен для текущей системы
                token.email = syncData.data.user.email;
                token.name = syncData.data.user.name;
              }
            }
          } catch (error) {
            console.error("OAuth user sync error:", error);
          }
        }
        
        // Для Credentials сохраняем токен из API
        if (account.provider === "credentials" && (user as any).token) {
          token.apiToken = (user as any).token;
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Добавляем данные пользователя в сессию
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.companyId = token.companyId as string | undefined;
        session.accessToken = token.accessToken as string | undefined;
        session.apiToken = token.apiToken as string | undefined;
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      // После OAuth входа перенаправляем на правильную страницу
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 дней
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};


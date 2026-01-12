import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { API_CONFIG } from "@/lib/query/constants";

/**
 * Конфигурация NextAuth
 * Поддерживает: Google OAuth, Email/Password (Credentials)
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
      // Для OAuth провайдеров (Google)
      if (account?.provider === "google") {
        try {
          // Проверяем валидность email
          const email = user.email;
          if (!email) return false;

          // Синхронизируем пользователя с БД через API и проверяем права доступа
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

          if (!syncResponse.ok) {
            const errorText = await syncResponse.text();
            console.error("OAuth sign in denied by API:", errorText);
            
            // Проверяем, заблокирована ли компания
            if (syncResponse.status === 403 && 
                (errorText.includes("COMPANY_BLOCKED") || errorText.includes("company blocked"))) {
              // Если компания заблокирована, отклоняем вход
              // Пользователь увидит ошибку на странице входа
              return false;
            }
            
            // Если доступ запрещен (не зарегистрирован), перенаправляем на главную с параметром открытия регистрации
            // Используем специальный URL, который NextAuth обработает как редирект на ошибку,
            // но мы можем перехватить его на клиенте или использовать query params
            return "/?register=true"; 
          }

          // Если все ок, разрешаем вход
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
      try {
        // При первом входе через OAuth
        if (account && user) {
          token.accessToken = account.access_token;
          token.refreshToken = account.refresh_token;
          token.id = user.id;
          token.role = (user as any).role;
          token.companyId = (user as any).companyId;
          
          // Для OAuth создаем/обновляем пользователя в БД
          if (account.provider === "google") {
            try {
              // Синхронизируем пользователя с БД через API с таймаутом
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 секунд таймаут
              
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
                signal: controller.signal,
              });

              clearTimeout(timeoutId);

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
              // Если это ошибка отмены запроса (таймаут), логируем отдельно
              if (error instanceof Error && error.name === 'AbortError') {
                console.error("OAuth user sync timeout - API не отвечает");
              } else {
                console.error("OAuth user sync error:", error);
              }
              // Продолжаем работу с данными из OAuth провайдера, даже если синхронизация не удалась
            }
          }
          
          // Для Credentials сохраняем токен из API
          if (account.provider === "credentials" && (user as any).token) {
            token.apiToken = (user as any).token;
          }
        }

        return token;
      } catch (error) {
        console.error("JWT callback error:", error);
        // Возвращаем токен даже при ошибке, чтобы не ломать сессию
        return token;
      }
    },
    async session({ session, token }) {
      try {
        // Добавляем данные пользователя в сессию
        if (session.user && token) {
          // Безопасно добавляем данные только если они есть в токене
          if (token.id) {
            session.user.id = token.id as string;
          }
          if (token.role) {
            session.user.role = token.role as string;
          }
          if (token.companyId) {
            session.user.companyId = token.companyId as string | undefined;
          }
          if (token.accessToken) {
            session.accessToken = token.accessToken as string | undefined;
          }
          if (token.apiToken) {
            session.apiToken = token.apiToken as string | undefined;
          }
        }

        return session;
      } catch (error) {
        console.error("Session callback error:", error);
        // Возвращаем сессию без дополнительных данных в случае ошибки
        return session;
      }
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
  useSecureCookies: process.env.NODE_ENV === "production",
};


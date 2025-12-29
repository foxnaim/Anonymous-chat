'use client';

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { setUser, logout } from "@/lib/redux/slices/authSlice";
import { setToken, removeToken } from "@/lib/utils/cookies";
import type { User } from "@/types";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * Хук для интеграции NextAuth с Redux
 * Синхронизирует сессию NextAuth с состоянием Redux
 */
export const useNextAuth = () => {
  const { data: session, status } = useSession();
  const dispatch = useDispatch();
  const router = useRouter();
  const hasSynced = useRef<string | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const userId = session.user.id;
      
      // Синхронизируем сессию NextAuth с Redux
      const user: User = {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role as User['role'],
        companyId: session.user.companyId,
        name: session.user.name || undefined,
      };

      dispatch(setUser(user));

      // Сохраняем API токен в куки (если есть)
      if (session.apiToken) {
        setToken(session.apiToken);
      }

      // Показываем уведомление о успешном входе только один раз для этого пользователя
      if (hasSynced.current !== userId) {
        hasSynced.current = userId;
        // Показываем уведомление только если это новый вход (не при перезагрузке страницы)
        if (typeof window !== 'undefined' && !sessionStorage.getItem('oauth_login_notified')) {
          sessionStorage.setItem('oauth_login_notified', 'true');
          toast.success("Вход выполнен успешно");
        }
      }
    } else if (status === "unauthenticated") {
      // Проверяем, есть ли токен в куках, перед тем как делать логаут
      // Если токен есть, значит мы залогинены через Credentials (не NextAuth)
      // В этом случае НЕ нужно делать logout
      const hasCookieToken = typeof window !== 'undefined' ? document.cookie.includes('feedbackhub_token') : false;
      
      if (!hasCookieToken) {
        // Очищаем состояние при выходе
        hasSynced.current = null;
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('oauth_login_notified');
        }
        dispatch(logout());
        removeToken();
      }
    }
  }, [session, status, dispatch, router]);

  const handleSignIn = async (provider: "google" | "apple" | "credentials", credentials?: { email: string; password: string }) => {
    if (provider === "credentials" && credentials) {
      // Для Credentials используем текущую систему (не NextAuth)
      return;
    }

    await signIn(provider, {
      callbackUrl: "/",
      redirect: true,
    });
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    dispatch(logout());
    removeToken();
    router.push("/");
  };

  return {
    session,
    status,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    signIn: handleSignIn,
    signOut: handleSignOut,
  };
};


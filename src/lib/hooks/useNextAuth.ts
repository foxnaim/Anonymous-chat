'use client';

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setUser, logout } from "@/lib/redux/slices/authSlice";
import { setToken, removeToken } from "@/lib/utils/cookies";
import type { User } from "@/types";
import { useRouter } from "next/navigation";

/**
 * Хук для интеграции NextAuth с Redux
 * Синхронизирует сессию NextAuth с состоянием Redux
 */
export const useNextAuth = () => {
  const { data: session, status } = useSession();
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
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
    } else if (status === "unauthenticated") {
      // Очищаем состояние при выходе
      dispatch(logout());
      removeToken();
    }
  }, [session, status, dispatch]);

  const handleSignIn = async (provider: "google" | "azure-ad" | "credentials", credentials?: { email: string; password: string }) => {
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


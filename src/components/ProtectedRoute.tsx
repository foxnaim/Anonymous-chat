'use client';

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/redux";
import { useNextAuth } from "@/lib/hooks/useNextAuth";
import { UserRole } from "@/types";
import { useEffect } from "react";
import { getToken } from "@/lib/utils/cookies";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { t } = useTranslation();
  const { isAuthenticated, user, isLoading } = useAuth();
  const { isAuthenticated: isNextAuthAuthenticated, session, isLoading: isNextAuthLoading } = useNextAuth();
  const router = useRouter();

  // Проверяем авторизацию через Redux или NextAuth
  const hasAuth = isAuthenticated || isNextAuthAuthenticated;
  const currentUser = user || (session?.user ? {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role as UserRole,
    companyId: session.user.companyId,
    name: session.user.name || undefined,
  } : null);
  const authLoading = isLoading || isNextAuthLoading;

  useEffect(() => {
    // Проверяем наличие токена или NextAuth сессии
    const token = getToken();
    const hasTokenOrSession = token || isNextAuthAuthenticated;
    
    // Если нет ни токена, ни сессии, перенаправляем на главный экран
    if (!hasTokenOrSession && !authLoading) {
      router.replace("/");
      return;
    }

    // Если загрузка завершена и пользователь не аутентифицирован, перенаправляем
    if (!authLoading && !hasAuth) {
      router.replace("/");
      return;
    }

    // Проверяем роль пользователя, если требуется
    if (!authLoading && hasAuth && currentUser && requiredRole) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      if (!roles.includes(currentUser.role)) {
        if (currentUser.role === "company") {
          router.replace("/company");
        } else if (currentUser.role === "admin" || currentUser.role === "super_admin") {
          router.replace("/admin");
        } else {
          router.replace("/");
        }
      }
    }
  }, [hasAuth, currentUser, authLoading, requiredRole, router, isNextAuthAuthenticated]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  // Проверяем токен или NextAuth сессию еще раз перед рендером
  const token = getToken();
  const hasTokenOrSession = token || isNextAuthAuthenticated;
  
  // Если нет авторизации, не рендерим ничего (редирект уже произошел в useEffect)
  if (!hasTokenOrSession || !hasAuth || !currentUser) {
    return null;
  }

  // Проверяем роль пользователя, если требуется
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(currentUser.role)) {
      // Если роль не подходит, не рендерим (редирект уже произошел в useEffect)
      return null;
    }
  }

  return <>{children}</>;
};

'use client';

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/redux";
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
  const router = useRouter();

  useEffect(() => {
    // Проверяем наличие токена
    const token = getToken();
    
    // Если токена нет, сразу перенаправляем на главный экран
    if (!token) {
      router.replace("/");
      return;
    }

    // Если загрузка завершена и пользователь не аутентифицирован, перенаправляем
    if (!isLoading && !isAuthenticated) {
      router.replace("/");
      return;
    }

    // Проверяем роль пользователя, если требуется
    if (!isLoading && isAuthenticated && user && requiredRole) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      if (!roles.includes(user.role)) {
        if (user.role === "company") {
          router.replace("/company");
        } else if (user.role === "admin" || user.role === "super_admin") {
          router.replace("/admin");
        } else {
          router.replace("/");
        }
      }
    }
  }, [isAuthenticated, user, isLoading, requiredRole, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  // Проверяем токен еще раз перед рендером
  const token = getToken();
  if (!token || !isAuthenticated || !user) {
    return null;
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(user.role)) {
      return null;
    }
  }

  return <>{children}</>;
};

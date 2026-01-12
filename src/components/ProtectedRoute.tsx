'use client';

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/redux";
import { useNextAuth } from "@/lib/hooks/useNextAuth";
import { UserRole } from "@/types";
import { useEffect, useMemo } from "react";
import { getToken } from "@/lib/utils/cookies";
import { useCompany } from "@/lib/query";

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
  const currentUser = useMemo(() => {
    return user || (session?.user ? {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role as UserRole,
      companyId: session.user.companyId,
      name: session.user.name || undefined,
    } : null);
  }, [user, session?.user]);
  const authLoading = isLoading || isNextAuthLoading;

  // Загружаем данные компании для проверки блокировки (только для роли company)
  const { data: company, isLoading: companyLoading } = useCompany(
    currentUser?.companyId || 0,
    {
      enabled: !!currentUser?.companyId && currentUser?.role === 'company',
    }
  );

  // Проверяем, заблокирована ли компания
  const isCompanyBlocked = company?.status === "Заблокирована";

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
      // Приводим роли к нижнему регистру для надежного сравнения
      const userRole = String(currentUser.role).toLowerCase();
      const allowedRoles = roles.map(r => String(r).toLowerCase());
      
      if (!allowedRoles.includes(userRole)) {
        if (userRole === "company") {
          router.replace("/company");
        } else if (userRole === "admin" || userRole === "super_admin") {
          router.replace("/admin");
        } else {
          router.replace("/");
        }
      }
    }

    // Если компания заблокирована и пользователь пытается перейти на страницы компании (кроме главной),
    // перенаправляем на главную страницу компании
    if (
      !authLoading &&
      !companyLoading &&
      hasAuth &&
      currentUser?.role === "company" &&
      isCompanyBlocked &&
      requiredRole === "company"
    ) {
      const currentPath = window.location.pathname;
      if (currentPath !== "/company") {
        router.replace("/company");
      }
    }
  }, [hasAuth, currentUser, authLoading, requiredRole, router, isNextAuthAuthenticated, companyLoading, isCompanyBlocked]);

  if (authLoading || (currentUser?.role === "company" && companyLoading)) {
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
    // Приводим роли к нижнему регистру для надежного сравнения
    const userRole = String(currentUser.role).toLowerCase();
    const allowedRoles = roles.map(r => String(r).toLowerCase());
    
    if (!allowedRoles.includes(userRole)) {
      // Если роль не подходит, не рендерим (редирект уже произошел в useEffect)
      return null;
    }
  }

  // Если компания заблокирована и пользователь пытается перейти на страницы компании (кроме главной),
  // не рендерим содержимое (редирект уже произошел в useEffect)
  if (
    currentUser?.role === "company" &&
    isCompanyBlocked &&
    requiredRole === "company"
  ) {
    const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
    if (currentPath !== "/company") {
      return null;
    }
  }

  return <>{children}</>;
};

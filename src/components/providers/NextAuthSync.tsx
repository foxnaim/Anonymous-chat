'use client';

import { useEffect, useRef } from "react";
import { useNextAuth } from "@/lib/hooks/useNextAuth";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

/**
 * Компонент для автоматической синхронизации NextAuth с Redux
 * и редиректа после OAuth входа
 */
export const NextAuthSync = () => {
  const { status, isAuthenticated, session } = useNextAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const hasShownToast = useRef(false);

  useEffect(() => {
    // После успешного OAuth входа перенаправляем на правильную страницу
    if (status === "authenticated" && session?.user) {
      const role = session.user.role;
      const companyId = session.user.companyId;
      
      // Перенаправляем только если мы на главной странице или на странице входа
      if (pathname === "/" || pathname === "/login") {
        // Небольшая задержка, чтобы Redux успел обновиться
        const timeoutId = setTimeout(() => {
          if (role === "admin" || role === "super_admin") {
            router.replace("/admin");
          } else if (role === "company" && companyId) {
            router.replace("/company");
          } else if (role === "user" || (role === "company" && !companyId)) {
            // Пользователь не зарегистрирован как компания
            if (!hasShownToast.current) {
              hasShownToast.current = true;
              toast.error(
                t("auth.notRegisteredAsCompany") || 
                "Ваш аккаунт не зарегистрирован как компания. Пожалуйста, зарегистрируйтесь через форму регистрации.",
                {
                  duration: 5000,
                }
              );
            }
            // Остаемся на главной странице или на странице входа
          }
        }, 200);
        
        return () => clearTimeout(timeoutId);
      }
    } else {
      // Сбрасываем флаг при выходе
      hasShownToast.current = false;
    }
  }, [status, isAuthenticated, session, router, pathname, t]);

  return null; // Этот компонент ничего не рендерит
};


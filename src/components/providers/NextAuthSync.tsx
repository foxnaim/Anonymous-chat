'use client';

import { useEffect } from "react";
import { useNextAuth } from "@/lib/hooks/useNextAuth";
import { useRouter, usePathname } from "next/navigation";

/**
 * Компонент для автоматической синхронизации NextAuth с Redux
 * и редиректа после OAuth входа
 */
export const NextAuthSync = () => {
  const { status, isAuthenticated, session } = useNextAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // После успешного OAuth входа перенаправляем на правильную страницу
    if (status === "authenticated" && session?.user) {
      const role = session.user.role;
      
      // Перенаправляем только если мы на главной странице или на странице входа
      if (pathname === "/" || pathname === "/login") {
        // Небольшая задержка, чтобы Redux успел обновиться
        setTimeout(() => {
          if (role === "admin" || role === "super_admin") {
            router.replace("/admin");
          } else if (role === "company") {
            router.replace("/company");
          }
          // Для role === "user" остаемся на главной странице
        }, 100);
      }
    }
  }, [status, isAuthenticated, session, router, pathname]);

  return null; // Этот компонент ничего не рендерит
};


import { useState, useEffect } from "react";
import type { UserRole } from "@/types";
import { getCookie, setCookie, deleteCookie } from "@/lib/utils/cookies";

const STORAGE_KEY = "feedbackhub_fullscreen_mode";

export const useFullscreen = (userRole: UserRole | null) => {
  // Обрабатываем super_admin как admin для полноэкранного режима
  const normalizedRole = userRole === "super_admin" ? "admin" : (userRole === "company" || userRole === "admin" ? userRole : null);
  const storageKey = normalizedRole ? `${STORAGE_KEY}_${normalizedRole}` : null;
  
  const [isFullscreen, setIsFullscreen] = useState(() => {
    if (typeof window === "undefined" || !storageKey) return false;
    const saved = getCookie(storageKey);
    return saved === "true";
  });

  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;

    // Используем requestAnimationFrame для батчинга изменений DOM и предотвращения forced reflow
    const rafId = requestAnimationFrame(() => {
      // Применяем класс к html и body
      if (isFullscreen) {
        document.documentElement.classList.add("fullscreen-mode");
        document.body.classList.add("fullscreen-mode");
      } else {
        document.documentElement.classList.remove("fullscreen-mode");
        document.body.classList.remove("fullscreen-mode");
      }

      // Сохраняем в куки (используем requestIdleCallback для неблокирующей операции)
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          if (isFullscreen) {
            setCookie(storageKey, isFullscreen.toString(), 365 * 24 * 60 * 60); // 1 год
          } else {
            deleteCookie(storageKey);
          }
        });
      } else {
        // Fallback для браузеров без requestIdleCallback
        setTimeout(() => {
          if (isFullscreen) {
            setCookie(storageKey, isFullscreen.toString(), 365 * 24 * 60 * 60);
          } else {
            deleteCookie(storageKey);
          }
        }, 0);
      }
    });

    // Cleanup при размонтировании - убеждаемся, что классы удалены
    return () => {
      cancelAnimationFrame(rafId);
      if (typeof window !== "undefined") {
        // Используем requestAnimationFrame для cleanup тоже
        requestAnimationFrame(() => {
          document.documentElement.classList.remove("fullscreen-mode");
          document.body.classList.remove("fullscreen-mode");
        });
      }
    };
  }, [isFullscreen, storageKey]);

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  return { isFullscreen, toggleFullscreen };
};


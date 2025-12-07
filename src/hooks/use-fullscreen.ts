import { useState, useEffect } from "react";
import type { UserRole } from "@/types";

const STORAGE_KEY = "feedbackhub_fullscreen_mode";

export const useFullscreen = (userRole: UserRole | null) => {
  // Обрабатываем super_admin как admin для полноэкранного режима
  const normalizedRole = userRole === "super_admin" ? "admin" : (userRole === "company" || userRole === "admin" ? userRole : null);
  const storageKey = normalizedRole ? `${STORAGE_KEY}_${normalizedRole}` : null;
  
  const [isFullscreen, setIsFullscreen] = useState(() => {
    if (typeof window === "undefined" || !storageKey) return false;
    const saved = localStorage.getItem(storageKey);
    return saved === "true";
  });

  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;

    // Применяем класс к html и body
    if (isFullscreen) {
      document.documentElement.classList.add("fullscreen-mode");
      document.body.classList.add("fullscreen-mode");
    } else {
      document.documentElement.classList.remove("fullscreen-mode");
      document.body.classList.remove("fullscreen-mode");
    }

    // Сохраняем в localStorage
    localStorage.setItem(storageKey, isFullscreen.toString());

    // Cleanup при размонтировании - убеждаемся, что классы удалены
    return () => {
      if (typeof window !== "undefined") {
        document.documentElement.classList.remove("fullscreen-mode");
        document.body.classList.remove("fullscreen-mode");
      }
    };
  }, [isFullscreen, storageKey]);

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  return { isFullscreen, toggleFullscreen };
};


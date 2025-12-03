import { useState, useEffect } from "react";

const STORAGE_KEY = "feedbackhub_fullscreen_mode";

export const useFullscreen = (userRole: "company" | "admin" | null) => {
  const storageKey = userRole ? `${STORAGE_KEY}_${userRole}` : null;
  
  const [isFullscreen, setIsFullscreen] = useState(() => {
    if (!storageKey) return false;
    const saved = localStorage.getItem(storageKey);
    return saved === "true";
  });

  useEffect(() => {
    if (!storageKey) return;

    // Применяем класс к body при загрузке
    if (isFullscreen) {
      document.body.classList.add("fullscreen-mode");
    } else {
      document.body.classList.remove("fullscreen-mode");
    }

    // Сохраняем в localStorage
    localStorage.setItem(storageKey, isFullscreen.toString());
  }, [isFullscreen, storageKey]);

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  return { isFullscreen, toggleFullscreen };
};


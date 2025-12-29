'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/redux';
import { useAdminSettings, useCompany } from '@/lib/query';

interface FullscreenContextType {
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  setFullscreen: (value: boolean) => void;
}

const FullscreenContext = createContext<FullscreenContextType | undefined>(undefined);

export const useFullscreenContext = () => {
  const context = useContext(FullscreenContext);
  if (!context) {
    throw new Error('useFullscreenContext must be used within a FullscreenProvider');
  }
  return context;
};

export const FullscreenProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isFullscreen, setIsFullscreenState] = useState(false);
  
  // Определяем роль и контекст (админ или компания)
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isCompany = user?.role === 'company';
  
  // Проверяем, находимся ли мы в админке или в панели компании
  const isAdminRoute = pathname?.startsWith('/admin');
  const isCompanyRoute = pathname?.startsWith('/company');

  // Загружаем настройки админа
  const { data: adminSettings } = useAdminSettings({
    enabled: isAdmin && isAdminRoute,
    refetchOnMount: true, // Всегда обновляем при монтировании
    refetchOnWindowFocus: false, // Не обновляем при фокусе окна
  });

  // Загружаем настройки компании
  const { data: companySettings } = useCompany(user?.companyId || 0, {
    enabled: !!(isCompany && isCompanyRoute && user?.companyId),
    refetchOnMount: true, // Всегда обновляем при монтировании
    refetchOnWindowFocus: false, // Не обновляем при фокусе окна
  });

  // Синхронизируем состояние с настройками из API
  useEffect(() => {
    let shouldBeFullscreen = false;

    if (isAdmin && isAdminRoute) {
      shouldBeFullscreen = adminSettings?.fullscreenMode ?? false;
    } else if (isCompany && isCompanyRoute) {
      shouldBeFullscreen = companySettings?.fullscreenMode ?? false;
    }

    // Принудительно обновляем состояние
    setIsFullscreenState(shouldBeFullscreen);
  }, [isAdmin, isAdminRoute, isCompany, isCompanyRoute, adminSettings?.fullscreenMode, companySettings?.fullscreenMode]);

  // Применяем класс к DOM немедленно
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Применяем классы синхронно для немедленного эффекта
    if (isFullscreen) {
      document.documentElement.classList.add('fullscreen-mode');
      document.body.classList.add('fullscreen-mode');
      
      // Не вызываем requestFullscreen автоматически - это требует жеста пользователя
      // Используем только CSS классы для стилизации
    } else {
      document.documentElement.classList.remove('fullscreen-mode');
      document.body.classList.remove('fullscreen-mode');
      
      // Выходим из нативного полноэкранного режима
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }

    // Дополнительно применяем через RAF для гарантии применения стилей
    const rafId = requestAnimationFrame(() => {
      if (isFullscreen) {
        document.documentElement.classList.add('fullscreen-mode');
        document.body.classList.add('fullscreen-mode');
      } else {
        document.documentElement.classList.remove('fullscreen-mode');
        document.body.classList.remove('fullscreen-mode');
      }
    });

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [isFullscreen]);

  // Функция для ручного переключения (если потребуется в будущем)
  const toggleFullscreen = () => {
    setIsFullscreenState(prev => !prev);
  };

  const setFullscreen = (value: boolean) => {
    setIsFullscreenState(value);
  };

  return (
    <FullscreenContext.Provider value={{ isFullscreen, toggleFullscreen, setFullscreen }}>
      {children}
    </FullscreenContext.Provider>
  );
};


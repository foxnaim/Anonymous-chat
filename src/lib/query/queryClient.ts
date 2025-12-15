import { QueryClient } from "@tanstack/react-query";

/**
 * Конфигурация по умолчанию для React Query
 * Оптимизирована для быстрой работы и эффективного кэширования
 */
const getDefaultOptions = () => ({
  queries: {
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Перезапрашивать при монтировании для актуальных данных
    refetchOnReconnect: true, // Перезапрашивать при переподключении
    retry: 1,
    staleTime: 0, // Данные сразу считаются устаревшими, чтобы всегда получать свежие данные
    gcTime: 1000 * 60 * 15, // 15 минут - данные хранятся в кэше
    // Используем структурное разделение для лучшей производительности
    structuralSharing: true,
    // Улучшенная производительность
    networkMode: 'online' as const,
  },
  mutations: {
    retry: 1,
    // Не показывать ошибки автоматически, пусть компоненты обрабатывают
    throwOnError: false,
    networkMode: 'online' as const,
  },
});

/**
 * Создает новый экземпляр QueryClient с оптимизированными настройками
 */
export const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: getDefaultOptions(),
  });


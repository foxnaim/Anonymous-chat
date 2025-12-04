import { QueryClient } from "@tanstack/react-query";

/**
 * Конфигурация по умолчанию для React Query
 * Оптимизирована для быстрой работы и эффективного кэширования
 */
const getDefaultOptions = () => ({
  queries: {
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Не перезапрашивать при монтировании, если данные свежие
    refetchOnReconnect: false, // Не перезапрашивать при переподключении (данные уже в кэше)
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 минут - данные считаются свежими (увеличено для лучшего кэширования)
    gcTime: 1000 * 60 * 15, // 15 минут - данные хранятся в кэше (увеличено)
    // Используем структурное разделение для лучшей производительности
    structuralSharing: true,
    // Улучшенная производительность
    networkMode: 'online',
  },
  mutations: {
    retry: 1,
    // Не показывать ошибки автоматически, пусть компоненты обрабатывают
    throwOnError: false,
    networkMode: 'online',
  },
});

/**
 * Создает новый экземпляр QueryClient с оптимизированными настройками
 */
export const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: getDefaultOptions(),
  });


import { QueryClient } from "@tanstack/react-query";

/**
 * Конфигурация по умолчанию для React Query
 */
const getDefaultOptions = () => ({
  queries: {
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: 1000 * 60, // 1 минута
    gcTime: 1000 * 60 * 5, // 5 минут (было cacheTime)
  },
  mutations: {
    retry: 1,
  },
});

/**
 * Создает новый экземпляр QueryClient с оптимизированными настройками
 */
export const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: getDefaultOptions(),
  });


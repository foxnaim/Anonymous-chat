/**
 * Кастомные хуки для React Query
 * Упрощают использование query keys и добавляют типизацию
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from "@tanstack/react-query";
import { queryKeys } from "./index";
import type { Message, Company, Stats, MessageDistribution, GrowthMetrics, SubscriptionPlan, AdminUser, AchievementProgress } from "@/types";
import type { PlatformStats } from "./types";
import type { GroupedAchievements } from "../achievements";
import { 
  messageService, 
  companyService, 
  statsService, 
  plansService, 
  adminService 
} from "./services";

/**
 * Хук для получения всех сообщений
 * Если companyCode не передан (undefined) - получает все сообщения (для админа)
 * Если companyCode === null - запрос отключен
 * Если companyCode === string - получает сообщения конкретной компании
 */
export const useMessages = (companyCode?: string | null, options?: Omit<UseQueryOptions<Message[]>, 'queryKey' | 'queryFn'>) => {
  // Нормализуем null в undefined для queryKey
  const normalizedCode = companyCode ?? undefined;
  return useQuery({
    queryKey: queryKeys.messages(normalizedCode),
    queryFn: () => messageService.getAll(normalizedCode),
    enabled: companyCode !== null, // enabled если не null (undefined разрешен для админа)
    ...options,
  });
};

/**
 * Хук для получения сообщения по ID
 */
export const useMessage = (id: string, options?: Omit<UseQueryOptions<Message | null>, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: queryKeys.message(id),
    queryFn: () => messageService.getById(id),
    enabled: !!id,
    ...options,
  });
};

/**
 * Хук для получения всех компаний
 * Оптимизирован для кэширования
 */
export const useCompanies = (options?: Omit<UseQueryOptions<Company[]>, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: queryKeys.companies,
    queryFn: () => companyService.getAll(),
    staleTime: 1000 * 60 * 2, // 2 минуты
    gcTime: 1000 * 60 * 10, // 10 минут в кэше
    ...options,
  });
};

/**
 * Хук для получения компании по ID
 */
export const useCompany = (id: number, options?: Omit<UseQueryOptions<Company | null>, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: queryKeys.company(id),
    queryFn: () => companyService.getById(id),
    enabled: !!id,
    ...options,
  });
};

/**
 * Хук для получения компании по коду
 */
export const useCompanyByCode = (code: string, options?: Omit<UseQueryOptions<Company | null>, 'queryKey' | 'queryFn'>) => {
  // Используем один queryKey для всех неполных кодов, чтобы не создавать лишние кэш-записи
  const isValidCode = !!(code && code.length === 8);
  const queryKey = isValidCode ? queryKeys.companyByCode(code) : ['company-by-code', 'incomplete'] as const;
  
  return useQuery({
    queryKey,
    queryFn: () => companyService.getByCode(code),
    enabled: isValidCode,
    retry: false,
    ...options,
  });
};

/**
 * Хук для получения статистики компании
 * Оптимизирован для быстрой работы и кэширования
 */
export const useCompanyStats = (companyId: number, options?: Omit<UseQueryOptions<Stats>, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: queryKeys.companyStats(companyId),
    queryFn: () => statsService.getCompanyStats(companyId),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 3, // 3 минуты - статистика не меняется часто
    gcTime: 1000 * 60 * 10, // 10 минут в кэше
    ...options,
  });
};

/**
 * Хук для получения распределения сообщений
 * Оптимизирован для быстрой работы и кэширования
 */
export const useMessageDistribution = (companyId: number, options?: Omit<UseQueryOptions<MessageDistribution>, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: queryKeys.messageDistribution(companyId),
    queryFn: () => statsService.getMessageDistribution(companyId),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 3, // 3 минуты - статистика не меняется часто
    gcTime: 1000 * 60 * 10, // 10 минут в кэше
    ...options,
  });
};

/**
 * Хук для получения метрик роста
 * Оптимизирован для быстрой работы и кэширования
 */
export const useGrowthMetrics = (companyId: number, options?: Omit<UseQueryOptions<GrowthMetrics>, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: queryKeys.growthMetrics(companyId),
    queryFn: () => statsService.getGrowthMetrics(companyId),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5, // 5 минут - метрики роста меняются редко
    gcTime: 1000 * 60 * 15, // 15 минут в кэше
    ...options,
  });
};

/**
 * Хук для получения достижений компании
 * Оптимизирован для быстрой работы и кэширования
 */
export const useAchievements = (companyId: number, options?: Omit<UseQueryOptions<AchievementProgress[]>, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: queryKeys.achievements(companyId),
    queryFn: () => statsService.getAchievements(companyId),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5, // 5 минут - достижения меняются редко
    gcTime: 1000 * 60 * 15, // 15 минут в кэше
    ...options,
  });
};

/**
 * Хук для получения сгруппированных достижений компании
 */
export const useGroupedAchievements = (companyId: number, options?: Omit<UseQueryOptions<GroupedAchievements[]>, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: [...queryKeys.achievements(companyId), 'grouped'],
    queryFn: () => statsService.getGroupedAchievements(companyId),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5, // 5 минут - достижения меняются редко
    gcTime: 1000 * 60 * 15, // 15 минут в кэше
    ...options,
  });
};

/**
 * Хук для получения планов подписки
 * Оптимизирован для кэширования (планы меняются редко)
 */
export const usePlans = (options?: Omit<UseQueryOptions<SubscriptionPlan[]>, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: queryKeys.plans,
    queryFn: () => plansService.getAll(),
    staleTime: 1000 * 60 * 10, // 10 минут - планы меняются очень редко
    gcTime: 1000 * 60 * 30, // 30 минут в кэше
    ...options,
  });
};

/**
 * Хук для получения админов
 */
export const useAdmins = (options?: Omit<UseQueryOptions<AdminUser[]>, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: queryKeys.admins,
    queryFn: () => adminService.getAdmins(),
    ...options,
  });
};

/**
 * Хук для получения статистики платформы
 */
export const usePlatformStats = (options?: Omit<UseQueryOptions<PlatformStats>, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: queryKeys.platformStats,
    queryFn: () => statsService.getPlatformStats(),
    ...options,
  });
};

/**
 * Хук для создания сообщения
 */
export const useCreateMessage = (options?: UseMutationOptions<Message, Error, Omit<Message, "id" | "createdAt" | "updatedAt" | "lastUpdate">>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: messageService.create,
    onSuccess: (data) => {
      // Инвалидируем кэш сообщений
      queryClient.invalidateQueries({ queryKey: queryKeys.messages(data.companyCode) });
      // Инвалидируем статистику и достижения для всех компаний (они будут пересчитаны при следующем запросе)
      // Используем более широкую инвалидацию, так как мы не знаем companyId из companyCode напрямую
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['growth-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
    },
    ...options,
  });
};

/**
 * Хук для обновления статуса сообщения
 */
export const useUpdateMessageStatus = (options?: UseMutationOptions<Message, Error, { id: string; status: Message["status"]; response?: string }>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status, response }) => messageService.updateStatus(id, status, response),
    onSuccess: (data) => {
      // Инвалидируем кэш конкретного сообщения и списка
      queryClient.invalidateQueries({ queryKey: queryKeys.message(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.messages(data.companyCode) });
      // Инвалидируем статистику и достижения для всех компаний (они будут пересчитаны при следующем запросе)
      // Используем более широкую инвалидацию, так как мы не знаем companyId из companyCode напрямую
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['message-distribution'] });
      queryClient.invalidateQueries({ queryKey: ['growth-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
    },
    ...options,
  });
};

/**
 * Хук для создания компании
 */
export const useCreateCompany = (options?: UseMutationOptions<Company, Error, Omit<Company, "id" | "registered" | "messages">>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: companyService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies });
    },
    ...options,
  });
};


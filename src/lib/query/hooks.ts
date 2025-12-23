/**
 * Кастомные хуки для React Query
 * Упрощают использование query keys и добавляют типизацию
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from "@tanstack/react-query";
import { queryKeys } from "./index";
import type { Message, Company, Stats, MessageDistribution, GrowthMetrics, SubscriptionPlan, AdminUser, AchievementProgress, PlanType } from "@/types";
import type { PlatformStats } from "./types";
import type { GroupedAchievements } from "../achievements";
import { 
  messageService, 
  companyService, 
  statsService, 
  plansService, 
  adminService 
} from "./services";
import { adminSettingsApi, type AdminSettings, type UpdateAdminSettingsRequest } from "../api/adminSettings";

/**
 * Хук для получения всех сообщений
 * Если companyCode не передан (undefined) - получает все сообщения (для админа)
 * Если companyCode === null - запрос отключен
 * Если companyCode === string - получает сообщения конкретной компании
 */
export const useMessages = (companyCode?: string | null, page?: number, limit?: number, options?: Omit<UseQueryOptions<Message[]>, 'queryKey' | 'queryFn'>) => {
  // Нормализуем null в undefined для queryKey
  const normalizedCode = companyCode ?? undefined;
  return useQuery({
    queryKey: [...queryKeys.messages(normalizedCode), page, limit],
    queryFn: () => messageService.getAll(normalizedCode, page, limit),
    enabled: companyCode !== null, // enabled если не null (undefined разрешен для админа)
    staleTime: 1000 * 10, // 10 секунд - сообщения обновляются часто, уменьшено для более быстрого обновления
    gcTime: 1000 * 60 * 5, // 5 минут в кэше
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
export const useCompanies = (page?: number, limit?: number, options?: Omit<UseQueryOptions<Company[]>, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: [...queryKeys.companies, page, limit],
    queryFn: async () => {
      const result = await companyService.getAll(page, limit);
      // Если результат - объект с пагинацией, возвращаем только data
      if (result && typeof result === 'object' && 'data' in result) {
        return (result as { data: Company[] }).data;
      }
      return result as Company[];
    },
    staleTime: 1000 * 60 * 2, // 2 минуты - компании не меняются часто
    gcTime: 1000 * 60 * 10, // 10 минут в кэше
    refetchOnMount: false, // Используем кэш для быстрого старта
    ...options,
  });
};

/**
 * Хук для получения компании по ID
 */
export const useCompany = (id: string | number, options?: Omit<UseQueryOptions<Company | null>, 'queryKey' | 'queryFn'>) => {
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
export const useCompanyStats = (companyId: string | number, options?: Omit<UseQueryOptions<Stats>, 'queryKey' | 'queryFn'>) => {
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
export const useMessageDistribution = (companyId: string | number, options?: Omit<UseQueryOptions<MessageDistribution>, 'queryKey' | 'queryFn'>) => {
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
export const useGrowthMetrics = (companyId: string | number, options?: Omit<UseQueryOptions<GrowthMetrics>, 'queryKey' | 'queryFn'>) => {
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
export const useAchievements = (companyId: string | number, options?: Omit<UseQueryOptions<AchievementProgress[]>, 'queryKey' | 'queryFn'>) => {
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
export const useGroupedAchievements = (companyId: string | number, options?: Omit<UseQueryOptions<GroupedAchievements[]>, 'queryKey' | 'queryFn'>) => {
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
    staleTime: 1000 * 60 * 15, // 15 минут - планы меняются очень редко
    gcTime: 1000 * 60 * 60, // 1 час в кэше - планы статичны
    refetchOnMount: false, // Используем кэш - планы не меняются часто
    ...options,
  });
};

/**
 * Хук для получения настроек бесплатного плана
 * Используется для получения freePeriodDays и других настроек
 */
export const useFreePlanSettings = (options?: Omit<UseQueryOptions<{ messagesLimit: number; storageLimit: number; freePeriodDays: number }>, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: queryKeys.freePlanSettings,
    queryFn: () => plansService.getFreePlanSettings(),
    staleTime: 1000 * 60 * 5, // 5 минут - настройки могут меняться админом
    gcTime: 1000 * 60 * 15, // 15 минут в кэше
    refetchOnMount: false, // Используем кэш для быстрого старта
    ...options,
  });
};

/**
 * Хук для получения админов
 */
export const useAdmins = (page?: number, limit?: number, options?: Omit<UseQueryOptions<AdminUser[]>, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: [...queryKeys.admins, page, limit],
    queryFn: async () => {
      const result = await adminService.getAdmins(page, limit);
      return result.data;
    },
    staleTime: 1000 * 60 * 2, // 2 минуты - админы не меняются часто
    gcTime: 1000 * 60 * 10, // 10 минут в кэше
    refetchOnMount: false, // Используем кэш для быстрого старта
    ...options,
  });
};

/**
 * Хук для создания админа
 */
export const useCreateAdmin = (options?: UseMutationOptions<AdminUser, Error, { email: string; name: string; role?: 'admin' | 'super_admin' }>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { email: string; name: string; role?: 'admin' | 'super_admin' }) => adminService.createAdmin(data),
    onSuccess: () => {
      // Инвалидируем кэш - компонент сам сделает refetch (как в useCreateCompany)
      queryClient.invalidateQueries({ queryKey: queryKeys.admins });
    },
    ...options,
  });
};

/**
 * Хук для обновления админа
 */
export const useUpdateAdmin = (options?: UseMutationOptions<AdminUser, Error, { id: string; data: { name?: string; role?: 'admin' | 'super_admin' } }>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; role?: 'admin' | 'super_admin' } }) => adminService.updateAdmin(id, data),
    onSuccess: (updatedAdmin) => {
      // Инвалидируем кэш для обновления списка
      queryClient.invalidateQueries({ queryKey: queryKeys.admins });
      // Также обновляем кэш оптимистично
      queryClient.setQueryData<AdminUser[]>(queryKeys.admins, (old = []) => {
        return old.map(admin => admin.id === updatedAdmin.id ? updatedAdmin : admin);
      });
    },
    ...options,
  });
};

/**
 * Хук для удаления админа
 */
export const useDeleteAdmin = (options?: UseMutationOptions<void, Error, string>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => adminService.deleteAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admins });
    },
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

/**
 * Хук для обновления компании
 */
export const useUpdateCompany = (options?: UseMutationOptions<Company, Error, { id: string | number; updates: Partial<Company> }>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }) => companyService.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies });
      queryClient.invalidateQueries({ queryKey: queryKeys.company(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.companyByCode(data.code) });
    },
    ...options,
  });
};

/**
 * Хук для обновления статуса компании
 */
export const useUpdateCompanyStatus = (options?: UseMutationOptions<Company, Error, { id: string | number; status: Company["status"] }>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }) => companyService.updateStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies });
      queryClient.invalidateQueries({ queryKey: queryKeys.company(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.companyByCode(data.code) });
    },
    ...options,
  });
};

/**
 * Хук для обновления плана компании
 */
export const useUpdateCompanyPlan = (options?: UseMutationOptions<Company, Error, { id: string | number; plan: PlanType; planEndDate?: string }>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, plan, planEndDate }) => companyService.updatePlan(id, plan, planEndDate),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies });
      queryClient.invalidateQueries({ queryKey: queryKeys.company(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.companyByCode(data.code) });
    },
    ...options,
  });
};

/**
 * Хук для удаления компании
 */
export const useDeleteCompany = (options?: UseMutationOptions<void, Error, string | number>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => companyService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies });
    },
    ...options,
  });
};

/**
 * Хук для получения настроек админа
 * Всегда активен, так как настройки нужны на странице настроек
 */
export const useAdminSettings = (options?: Omit<UseQueryOptions<AdminSettings>, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: queryKeys.adminSettings,
    queryFn: async () => {
      const response = await adminSettingsApi.get();
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 минут - настройки меняются редко, считаем их свежими
    gcTime: 1000 * 60 * 30, // 30 минут в кэше
    enabled: true, // Всегда активен
    refetchOnMount: false, // Используем кэш для быстрого старта
    ...options,
  });
};

/**
 * Хук для обновления настроек админа
 */
export const useUpdateAdminSettings = (options?: UseMutationOptions<AdminSettings, Error, UpdateAdminSettingsRequest>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: UpdateAdminSettingsRequest) => {
      const response = await adminSettingsApi.update(data);
      return response.data;
    },
    onSuccess: (data) => {
      // Обновляем кэш с новыми данными и помечаем как свежие
      queryClient.setQueryData(queryKeys.adminSettings, data, {
        updatedAt: Date.now(), // Помечаем данные как только что обновленные
      });
      // Инвалидируем запрос, чтобы обновить статус
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.adminSettings,
        exact: true,
      });
    },
    ...options,
  });
};


/**
 * Кастомные хуки для React Query
 * Упрощают использование query keys и добавляют типизацию
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions, type QueryKey } from "@tanstack/react-query";
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
  const userOnSuccess = options?.onSuccess;
  const userOnError = options?.onError;
  const userOnMutate = options?.onMutate;
  const { onSuccess: _, onError: __, onMutate: ___, ...rest } = options ?? {};

  type AdminOptimisticContext = {
    previousData: Array<[QueryKey, AdminUser[] | undefined]>;
    tempId: string;
  };

  return useMutation<AdminUser, Error, { email: string; name: string; role?: 'admin' | 'super_admin' }, AdminOptimisticContext>({
    mutationFn: (data) => adminService.createAdmin(data),

    // Оптимистично добавляем админа в кэш сразу
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.admins, exact: false });
      const previousData = queryClient.getQueriesData<AdminUser[]>({ queryKey: queryKeys.admins, exact: false });

      const tempId = `temp-${Date.now()}`;
      const optimisticAdmin: AdminUser = {
        id: tempId,
        email: variables.email,
        name: variables.name,
        role: variables.role ?? 'admin',
        createdAt: new Date().toISOString(),
        lastLogin: null,
      };

      previousData.forEach(([key, data]) => {
        if (data && Array.isArray(data)) {
          queryClient.setQueryData<AdminUser[]>(key, [...data, optimisticAdmin]);
        }
      });

      // Пользовательский onMutate (если был)
      if (userOnMutate) {
        (userOnMutate as any)(variables);
      }

      return { previousData, tempId };
    },

    onSuccess: (data, variables, context, mutation) => {
      // Заменяем временную запись на реальную (или добавляем, если не нашли)
      const allQueries = queryClient.getQueriesData<AdminUser[]>({ queryKey: queryKeys.admins, exact: false });
      let updatedAny = false;
      allQueries.forEach(([key, admins]) => {
        if (admins && Array.isArray(admins)) {
          const withoutTemp = admins.filter(a => a.id !== context?.tempId);
          const alreadyExists = withoutTemp.some(a => a.id === data.id || a.email.toLowerCase() === data.email.toLowerCase());
          const next = alreadyExists ? withoutTemp.map(a => (a.id === data.id ? data : a)) : [...withoutTemp, data];
          queryClient.setQueryData<AdminUser[]>(key, next);
          updatedAny = true;
        }
      });

      // Если кэша не было (первый запрос), заполняем базовый key
      if (!updatedAny) {
        queryClient.setQueryData<AdminUser[]>(queryKeys.admins, [data]);
      }

      // Инвалидируем + refetch для гарантии
      queryClient.invalidateQueries({ queryKey: queryKeys.admins, exact: false });
      queryClient.refetchQueries({ queryKey: queryKeys.admins, exact: false });

      if (userOnSuccess) {
        (userOnSuccess as any)(data, variables, context, mutation);
      }
    },

    onError: (error, variables, context, mutation) => {
      // Откат кэша, если был оптимистичный апдейт
      if (context?.previousData) {
        context.previousData.forEach(([key, old]) => {
          // key может быть приведён к QueryKey, т.к. вернулся из getQueriesData
          queryClient.setQueryData<AdminUser[] | undefined>(key as QueryKey, old);
        });
      }

      // При ошибке всё равно обновим список, чтобы не оставить мусор
      queryClient.invalidateQueries({ queryKey: queryKeys.admins, exact: false });
      queryClient.refetchQueries({ queryKey: queryKeys.admins, exact: false });

      if (userOnError) {
        (userOnError as any)(error, variables, context, mutation);
      }
    },

    ...rest,
  });
};

/**
 * Хук для обновления админа
 */
export const useUpdateAdmin = (options?: UseMutationOptions<AdminUser, Error, { id: string; data: { name?: string; role?: 'admin' | 'super_admin' } }>) => {
  const queryClient = useQueryClient();
  const userOnSuccess = options?.onSuccess;
  const { onSuccess: _, ...rest } = options ?? {};
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; role?: 'admin' | 'super_admin' } }) => adminService.updateAdmin(id, data),
    onSuccess: (updatedAdmin, variables, context, mutation) => {
      // Оптимистично обновляем кэш - обновляем админа сразу
      const allQueries = queryClient.getQueriesData<AdminUser[]>({ queryKey: queryKeys.admins, exact: false });
      allQueries.forEach(([queryKey, oldData]) => {
        if (oldData) {
          queryClient.setQueryData<AdminUser[]>(queryKey, oldData.map(admin => admin.id === updatedAdmin.id ? updatedAdmin : admin));
        }
      });
      // Инвалидируем и сразу обновляем кэш для гарантии актуальности данных
      queryClient.invalidateQueries({ queryKey: queryKeys.admins, exact: false });
      queryClient.refetchQueries({ queryKey: queryKeys.admins, exact: false });
      if (userOnSuccess) {
        (userOnSuccess as any)(updatedAdmin, variables, context, mutation);
      }
    },
    ...rest,
  });
};

/**
 * Хук для удаления админа
 */
export const useDeleteAdmin = (options?: UseMutationOptions<void, Error, string>) => {
  const queryClient = useQueryClient();
  const userOnSuccess = options?.onSuccess;
  const userOnError = options?.onError;
  const { onSuccess: _, onError: __, ...rest } = options ?? {};
  
  return useMutation({
    mutationFn: (id: string) => adminService.deleteAdmin(id),
    onSuccess: (_, deletedId, context, mutation) => {
      // Оптимистично удаляем админа из кэша сразу для мгновенного обновления UI
      const allQueries = queryClient.getQueriesData<AdminUser[]>({ queryKey: queryKeys.admins, exact: false });
      let updatedAny = false;
      allQueries.forEach(([queryKey, oldData]) => {
        if (oldData && Array.isArray(oldData)) {
          queryClient.setQueryData<AdminUser[]>(queryKey, oldData.filter(admin => admin.id !== deletedId));
          updatedAny = true;
        }
      });
      // Если кэша не было, явно ставим пустой массив по базовому ключу
      if (!updatedAny) {
        queryClient.setQueryData<AdminUser[]>(queryKeys.admins, []);
      }
      // Инвалидируем и сразу обновляем кэш для гарантии актуальности данных
      queryClient.invalidateQueries({ queryKey: queryKeys.admins, exact: false });
      queryClient.refetchQueries({ queryKey: queryKeys.admins, exact: false });
      if (userOnSuccess) {
        (userOnSuccess as any)(_, deletedId, context, mutation);
      }
    },
    onError: (error, variables, context, mutation) => {
      // При ошибке, особенно 404, убираем запись локально по id/email, чтобы не висела карточка
      const deletedId = variables;
      const deletedEmail = (context as any)?.email;
      const allQueries = queryClient.getQueriesData<AdminUser[]>({ queryKey: queryKeys.admins, exact: false });
      let updatedAny = false;
      allQueries.forEach(([queryKey, data]) => {
        if (data && Array.isArray(data)) {
          const filtered = data.filter(
            admin =>
              admin.id !== deletedId &&
              (!deletedEmail || admin.email.toLowerCase() !== String(deletedEmail).toLowerCase())
          );
          queryClient.setQueryData<AdminUser[]>(queryKey, filtered);
          updatedAny = true;
        }
      });
      if (!updatedAny) {
        queryClient.setQueryData<AdminUser[]>(queryKeys.admins, []);
      }
      // Инвалидируем и обновляем кэш, чтобы убедиться, что данные актуальны
      queryClient.invalidateQueries({ queryKey: queryKeys.admins, exact: false });
      queryClient.refetchQueries({ queryKey: queryKeys.admins, exact: false });
      if (userOnError) {
        (userOnError as any)(error, variables, context, mutation);
      }
    },
    ...rest,
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
  const userOnSuccess = options?.onSuccess;
  const userOnError = options?.onError;
  const userOnMutate = options?.onMutate;
  const { onSuccess: _, onError: __, onMutate: ___, ...rest } = options ?? {};

  type MessageOptimisticContext = {
    previousData: Array<[QueryKey, Message[] | undefined]>;
    tempId: string;
    companyCode: string;
  };
  
  return useMutation<Message, Error, Omit<Message, "id" | "createdAt" | "updatedAt" | "lastUpdate">, MessageOptimisticContext>({
    mutationFn: messageService.create,

    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.messages(variables.companyCode), exact: false });
      const previousData = queryClient.getQueriesData<Message[]>({ queryKey: queryKeys.messages(variables.companyCode), exact: false });

      const tempId = `temp-${Date.now()}`;
      const now = new Date().toISOString();
      const optimistic: Message = {
        id: tempId,
        companyCode: variables.companyCode,
        type: variables.type,
        content: variables.content,
        status: variables.status,
        createdAt: now,
        updatedAt: now,
      };

      previousData.forEach(([key, data]) => {
        if (data && Array.isArray(data)) {
          queryClient.setQueryData<Message[]>(key, [optimistic, ...data]);
        }
      });
      // Если кэша ещё не было (первое сообщение/пустой список), создаём запись
      if (previousData.length === 0) {
        queryClient.setQueryData<Message[]>(queryKeys.messages(variables.companyCode), [optimistic]);
      }

      if (userOnMutate) {
        (userOnMutate as any)(variables);
      }

      return { previousData, tempId, companyCode: variables.companyCode };
    },

    onSuccess: (data, variables, context, mutation) => {
      const allQueries = queryClient.getQueriesData<Message[]>({
        queryKey: queryKeys.messages(context?.companyCode || data.companyCode),
        exact: false,
      });
      let updatedAny = false;
      allQueries.forEach(([key, list]) => {
        if (list && Array.isArray(list)) {
          const withoutTemp = list.filter(m => m.id !== context?.tempId);
          const exists = withoutTemp.some(m => m.id === data.id);
          const next = exists
            ? withoutTemp.map(m => (m.id === data.id ? data : m))
            : [data, ...withoutTemp];
          queryClient.setQueryData<Message[]>(key, next);
          updatedAny = true;
        }
      });
      if (!updatedAny) {
        queryClient.setQueryData<Message[]>(queryKeys.messages(data.companyCode), [data]);
      }

      // Инвалидируем кэш сообщений и статистику/достижения
      queryClient.invalidateQueries({ queryKey: queryKeys.messages(data.companyCode) });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['growth-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['achievements'] });

      if (userOnSuccess) {
        (userOnSuccess as any)(data, variables, context, mutation);
      }
    },

    onError: (error, variables, context, mutation) => {
      if (context?.previousData) {
        context.previousData.forEach(([key, old]) => {
          queryClient.setQueryData<Message[] | undefined>(key, old);
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.messages(variables.companyCode) });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['growth-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['achievements'] });

      if (userOnError) {
        (userOnError as any)(error, variables, context, mutation);
      }
    },

    ...rest,
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

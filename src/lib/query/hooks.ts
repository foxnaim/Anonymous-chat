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
 * messageId - опциональный параметр для поиска по ID сообщения
 */
export const useMessages = (companyCode?: string | null, page?: number, limit?: number, messageId?: string, options?: Omit<UseQueryOptions<Message[]>, 'queryKey' | 'queryFn'>) => {
  // Нормализуем null в undefined для queryKey
  const normalizedCode = companyCode ?? undefined;
  return useQuery({
    queryKey: [...queryKeys.messages(normalizedCode), page, limit, messageId],
    queryFn: () => messageService.getAll(normalizedCode, page, limit, messageId),
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
    staleTime: 0, // Всегда считаем данные устаревшими для получения свежих данных
    gcTime: 0, // Не кэшируем данные после unmount
    refetchOnMount: true, // Всегда обновляем при монтировании
    refetchOnWindowFocus: true, // Обновляем при фокусе окна
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

      // Инвалидируем кэш - React Query обновит данные при следующем использовании
      queryClient.invalidateQueries({ queryKey: queryKeys.admins, exact: false });

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

      // При ошибке инвалидируем кэш
      queryClient.invalidateQueries({ queryKey: queryKeys.admins, exact: false });

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
      // Инвалидируем кэш - React Query обновит данные при следующем использовании
      queryClient.invalidateQueries({ queryKey: queryKeys.admins, exact: false });
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
  const userOnMutate = options?.onMutate;
  const { onSuccess: _, onError: __, onMutate: ___, ...rest } = options ?? {};
  
  return useMutation<void, Error, string, { previousData: Array<[QueryKey, AdminUser[] | undefined]> }>({
    mutationFn: (id: string) => adminService.deleteAdmin(id),

    onMutate: async (deletedId) => {
      // Отменяем исходящие запросы, чтобы они не перезаписали наш оптимистичный апдейт
      await queryClient.cancelQueries({ queryKey: queryKeys.admins, exact: false });

      // Сохраняем предыдущее состояние
      const previousData = queryClient.getQueriesData<AdminUser[]>({ queryKey: queryKeys.admins, exact: false });

      // Оптимистично удаляем админа из кэша сразу - обновляем ВСЕ запросы
      previousData.forEach(([key, oldData]) => {
        if (oldData && Array.isArray(oldData)) {
          const filtered = oldData.filter(admin => {
            // Проверяем и id, и _id на случай разных форматов данных
            return admin.id !== deletedId && (admin as any)._id !== deletedId;
          });
          queryClient.setQueryData<AdminUser[]>(key, filtered);
        }
      });
      
      // Если кэша не было, ставим пустой массив
      if (previousData.length === 0) {
        queryClient.setQueryData<AdminUser[]>(queryKeys.admins, []);
      }

      if (userOnMutate) {
        (userOnMutate as any)(deletedId);
      }

      return { previousData };
    },

    onSuccess: (_, deletedId, context, mutation) => {
      // Нормализуем ID для сравнения (приводим к строке)
      const deletedIdStr = String(deletedId).trim();
      
      // Убеждаемся, что админ удален из всех запросов (на случай, если что-то пропустили)
      const allQueries = queryClient.getQueriesData<AdminUser[]>({ queryKey: queryKeys.admins, exact: false });
      allQueries.forEach(([key, data]) => {
        if (data && Array.isArray(data)) {
          const filtered = data.filter(admin => {
            // Проверяем и id, и _id на случай разных форматов данных
            // Также проверяем строковое представление ID для надежности
            const adminId = admin.id ? String(admin.id).trim() : null;
            const admin_id = (admin as any)._id ? String((admin as any)._id).trim() : null;
            
            // Исключаем админа, если любой из его ID совпадает с удаленным ID
            return adminId !== deletedIdStr && admin_id !== deletedIdStr;
          });
          queryClient.setQueryData<AdminUser[]>(key, filtered);
        }
      });
      
      // Инвалидируем и обновляем кэш с сервера для гарантии актуальности данных
      queryClient.invalidateQueries({ queryKey: queryKeys.admins, exact: false });
      // Принудительно обновляем данные с сервера
      queryClient.refetchQueries({ queryKey: queryKeys.admins, exact: false });
      
      if (userOnSuccess) {
        (userOnSuccess as any)(_, deletedId, context, mutation);
      }
    },

    onError: (error, variables, context, mutation) => {
      const errorStatus = (error as any)?.status || (error as any)?.response?.status;
      const deletedIdStr = String(variables).trim();

      // Если ошибка 404, значит админ уже удален. НЕ откатываем кэш.
      if (errorStatus === 404) {
         // Явно удаляем админа из кэша, если он там еще есть
         const allQueries = queryClient.getQueriesData<AdminUser[]>({ queryKey: queryKeys.admins, exact: false });
         allQueries.forEach(([key, data]) => {
           if (data && Array.isArray(data)) {
             const filtered = data.filter(admin => {
               // Проверяем и id, и _id на случай разных форматов данных
               const adminId = admin.id ? String(admin.id).trim() : null;
               const admin_id = (admin as any)._id ? String((admin as any)._id).trim() : null;
               return adminId !== deletedIdStr && admin_id !== deletedIdStr;
             });
             queryClient.setQueryData<AdminUser[]>(key, filtered);
           }
         });
         
         // Обновляем список с сервера, чтобы убедиться, что все синхронизировано
         queryClient.invalidateQueries({ queryKey: queryKeys.admins, exact: false });
      } else {
         // Для других ошибок откатываем изменения
         if (context?.previousData) {
           context.previousData.forEach(([key, old]) => {
             queryClient.setQueryData<AdminUser[] | undefined>(key, old);
           });
         }
      }

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
      const targetCompanyCode = (context?.companyCode || data.companyCode)?.toUpperCase();
      
      // Обновляем все запросы для компании сообщения (включая варианты с page, limit, messageId)
      // Используем только setQueryData - это обновляет кэш БЕЗ запросов в сеть
      const allQueries = queryClient.getQueriesData<Message[]>({
        queryKey: queryKeys.messages(targetCompanyCode),
        exact: false,
      });
      let updatedAny = false;
      allQueries.forEach(([key, list]) => {
        if (list && Array.isArray(list)) {
          // Удаляем временное сообщение, если оно есть
          const withoutTemp = list.filter(m => m.id !== context?.tempId);
          // Проверяем, существует ли уже сообщение с таким ID
          const exists = withoutTemp.some(m => m.id === data.id);
          // Если существует, обновляем его, иначе добавляем в начало
          const next = exists
            ? withoutTemp.map(m => (m.id === data.id ? data : m))
            : [data, ...withoutTemp];
          queryClient.setQueryData<Message[]>(key, next);
          updatedAny = true;
        }
      });
      // Если кэша не было, создаем новую запись
      if (!updatedAny) {
        queryClient.setQueryData<Message[]>(queryKeys.messages(targetCompanyCode), [data]);
      }

      // Инвалидируем только статистику/достижения (они обновятся при следующем запросе)
      // НЕ инвалидируем сообщения - мы уже обновили кэш напрямую, и WebSocket событие придет отдельно
      queryClient.invalidateQueries({ queryKey: ['stats'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['growth-metrics'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['achievements'], refetchType: 'active' });

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
type UpdateMessageStatusVariables = { id: string; status: Message["status"]; response?: string };

type UpdateMessageStatusContext = {
  previousQueries: Array<[QueryKey, Message[] | undefined]>;
  userContext?: any;
  optimisticMessage?: Message | null;
};

// Type guard для проверки типа контекста
function isUpdateMessageStatusContext(context: any): context is UpdateMessageStatusContext {
  return context && typeof context === 'object' && 'previousQueries' in context;
}

export const useUpdateMessageStatus = (options?: Omit<UseMutationOptions<Message, Error, UpdateMessageStatusVariables, UpdateMessageStatusContext>, 'onMutate'> & {
  onMutate?: (variables: UpdateMessageStatusVariables) => Promise<any> | any;
}) => {
  const queryClient = useQueryClient();
  const userOnSuccess = options?.onSuccess;
  const userOnError = options?.onError;
  const userOnMutate = options?.onMutate;
  const { onSuccess: _, onError: __, onMutate: ___, ...rest } = options ?? {};
  
  return useMutation<Message, Error, UpdateMessageStatusVariables, UpdateMessageStatusContext>({
    mutationFn: ({ id, status, response }) => messageService.updateStatus(id, status, response),
    onMutate: async (variables) => {
      // Отменяем исходящие запросы, чтобы они не перезаписали оптимистичное обновление
      await queryClient.cancelQueries({ queryKey: queryKeys.messages() });
      
      // Сохраняем предыдущие данные для отката
      const previousQueries = queryClient.getQueriesData<Message[]>({
        queryKey: queryKeys.messages(),
        exact: false,
      });
      
      // Оптимистично обновляем сообщение ДО отправки запроса
      // Находим текущее сообщение в кэше
      const allMessages = queryClient.getQueriesData<Message[]>({
        queryKey: queryKeys.messages(),
        exact: false,
      });
      
      let currentMessage: Message | null = null;
      for (const [, messages] of allMessages) {
        if (messages && Array.isArray(messages)) {
          const found = messages.find(m => m.id === variables.id);
          if (found) {
            currentMessage = found;
            break;
          }
        }
      }
      
      // Создаем оптимистично обновленное сообщение
      if (currentMessage) {
        const optimisticMessage: Message = {
          ...currentMessage,
          status: variables.status || currentMessage.status,
          companyResponse: variables.response !== undefined ? variables.response : currentMessage.companyResponse,
          updatedAt: new Date().toISOString().split('T')[0],
          lastUpdate: new Date().toISOString().split('T')[0],
        };
        
        // Оптимистично обновляем все запросы сообщений
        queryClient.setQueriesData<Message[]>(
          { queryKey: queryKeys.messages(), exact: false },
          (old) => {
            if (!old) return old;
            return old.map((m) => (m.id === optimisticMessage.id ? optimisticMessage : m));
          }
        );
        
        // Обновляем отдельное сообщение в кэше
        queryClient.setQueryData(queryKeys.message(optimisticMessage.id), optimisticMessage);
      }
      
      // Вызываем пользовательский onMutate если он есть
      let userContext: any;
      if (userOnMutate) {
        userContext = await (userOnMutate as any)(variables);
      }
      
      return { previousQueries, userContext, optimisticMessage: currentMessage };
    },
    onSuccess: (data, variables, context, mutation) => {
      // Оптимистично обновляем все запросы сообщений
      const baseQueryKey = queryKeys.messages(data.companyCode);
      
      queryClient.setQueriesData<Message[]>(
        { queryKey: baseQueryKey, exact: false },
        (old) => {
          if (!old) return old;
          return old.map((m) => (m.id === data.id ? data : m));
        }
      );
      
      // Также обновляем кэш для всех сообщений (для админов)
      queryClient.setQueriesData<Message[]>(
        { queryKey: queryKeys.messages(undefined), exact: false },
        (old) => {
          if (!old) return old;
          return old.map((m) => (m.id === data.id ? data : m));
        }
      );
      
      // Обновляем отдельное сообщение в кэше
      queryClient.setQueryData(queryKeys.message(data.id), data);
      
      // Не инвалидируем кэш сообщений сразу, чтобы избежать мерцания из-за race condition (stale reads)
      // Мы уже обновили кэш вручную выше данными от сервера
      // queryClient.invalidateQueries({ queryKey: queryKeys.message(data.id) });
      // queryClient.invalidateQueries({ queryKey: queryKeys.messages(data.companyCode) });
      
      // Инвалидируем статистику и достижения (это безопасно)
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['message-distribution'] });
      queryClient.invalidateQueries({ queryKey: ['growth-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      
      // Вызываем пользовательский onSuccess если он есть
      if (userOnSuccess) {
        userOnSuccess(data, variables, context, mutation);
      }
    },
    onError: (error: Error, variables: UpdateMessageStatusVariables, context: UpdateMessageStatusContext | undefined, mutation: any) => {
      // Откатываем изменения при ошибке
      if (isUpdateMessageStatusContext(context) && context.previousQueries) {
        context.previousQueries.forEach(([key, old]) => {
          queryClient.setQueryData<Message[] | undefined>(key, old);
        });
      }
      
      // Вызываем пользовательский onError если он есть
      if (userOnError) {
        (userOnError as any)(error, variables, context, mutation);
      }
    },
    ...rest,
  });
};

/**
 * Хук для удаления сообщения
 */
export const useDeleteMessage = (options?: UseMutationOptions<void, Error, { id: string; companyCode?: string }>) => {
  const queryClient = useQueryClient();
  const userOnSuccess = options?.onSuccess;
  const userOnError = options?.onError;
  const userOnMutate = options?.onMutate;
  const { onSuccess: _, onError: __, onMutate: ___, ...rest } = options ?? {};

  type DeleteMessageContext = {
    previousData: Array<[QueryKey, Message[] | undefined]>;
    companyCode?: string;
  };

  return useMutation<void, Error, { id: string; companyCode?: string }, DeleteMessageContext>({
    mutationFn: ({ id }) => messageService.delete(id),

    onMutate: async (variables) => {
      // Отменяем исходящие запросы
      await queryClient.cancelQueries({ queryKey: queryKeys.messages(variables.companyCode), exact: false });
      await queryClient.cancelQueries({ queryKey: queryKeys.messages(undefined), exact: false });

      // Сохраняем предыдущее состояние для всех запросов сообщений
      const previousData = [
        ...queryClient.getQueriesData<Message[]>({ queryKey: queryKeys.messages(variables.companyCode), exact: false }),
        ...queryClient.getQueriesData<Message[]>({ queryKey: queryKeys.messages(undefined), exact: false }),
      ];

      // Оптимистично удаляем сообщение из всех запросов
      const allQueries = [
        ...queryClient.getQueriesData<Message[]>({ queryKey: queryKeys.messages(variables.companyCode), exact: false }),
        ...queryClient.getQueriesData<Message[]>({ queryKey: queryKeys.messages(undefined), exact: false }),
      ];

      allQueries.forEach(([key, data]) => {
        if (data && Array.isArray(data)) {
          queryClient.setQueryData<Message[]>(key, data.filter(m => m.id !== variables.id));
        }
      });

      // Удаляем отдельное сообщение из кэша
      queryClient.removeQueries({ queryKey: queryKeys.message(variables.id) });

      if (userOnMutate) {
        (userOnMutate as any)(variables);
      }

      return { previousData, companyCode: variables.companyCode };
    },

    onSuccess: (_, variables, context, mutation) => {
      // Убеждаемся, что сообщение удалено из всех запросов
      const allQueries = [
        ...queryClient.getQueriesData<Message[]>({ queryKey: queryKeys.messages(context?.companyCode), exact: false }),
        ...queryClient.getQueriesData<Message[]>({ queryKey: queryKeys.messages(undefined), exact: false }),
      ];

      allQueries.forEach(([key, data]) => {
        if (data && Array.isArray(data)) {
          queryClient.setQueryData<Message[]>(key, data.filter(m => m.id !== variables.id));
        }
      });

      // Удаляем отдельное сообщение из кэша
      queryClient.removeQueries({ queryKey: queryKeys.message(variables.id) });

      // Инвалидируем статистику
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['message-distribution'] });
      queryClient.invalidateQueries({ queryKey: ['growth-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['achievements'] });

      if (userOnSuccess) {
        (userOnSuccess as any)(_, variables, context, mutation);
      }
    },

    onError: (error, variables, context, mutation) => {
      const errorStatus = (error as any)?.status || (error as any)?.response?.status;

      // Если ошибка 404, значит сообщение уже удалено. НЕ откатываем кэш.
      if (errorStatus === 404) {
        // Убеждаемся, что сообщение удалено из кэша
        const allQueries = [
          ...queryClient.getQueriesData<Message[]>({ queryKey: queryKeys.messages(variables.companyCode), exact: false }),
          ...queryClient.getQueriesData<Message[]>({ queryKey: queryKeys.messages(undefined), exact: false }),
        ];

        allQueries.forEach(([key, data]) => {
          if (data && Array.isArray(data)) {
            queryClient.setQueryData<Message[]>(key, data.filter(m => m.id !== variables.id));
          }
        });

        // Удаляем отдельное сообщение из кэша
        queryClient.removeQueries({ queryKey: queryKeys.message(variables.id) });
      } else {
        // Для других ошибок откатываем изменения
        if (context?.previousData) {
          context.previousData.forEach(([key, old]) => {
            queryClient.setQueryData<Message[] | undefined>(key, old);
          });
        }

        // Инвалидируем кэш для получения актуальных данных
        queryClient.invalidateQueries({ queryKey: queryKeys.messages(variables.companyCode) });
        queryClient.invalidateQueries({ queryKey: queryKeys.messages(undefined) });
      }

      if (userOnError) {
        (userOnError as any)(error, variables, context, mutation);
      }
    },

    ...rest,
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
  const userOnSuccess = options?.onSuccess;
  const { onSuccess: _, ...rest } = options ?? {};
  
  return useMutation({
    mutationFn: ({ id, updates }) => companyService.update(id, updates),
    onSuccess: (data, variables, context, mutation) => {
      // Обновляем кэш компании с новыми данными
      queryClient.setQueryData(queryKeys.company(data.id), data);
      // Инвалидируем запросы для обновления всех компонентов
      queryClient.invalidateQueries({ queryKey: queryKeys.companies });
      queryClient.invalidateQueries({ queryKey: queryKeys.company(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.companyByCode(data.code) });
      
      if (userOnSuccess) {
        (userOnSuccess as any)(data, variables, context, mutation);
      }
    },
    ...rest,
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
  const userOnSuccess = options?.onSuccess;
  const userOnError = options?.onError;
  const userOnMutate = options?.onMutate;
  const { onSuccess: _, onError: __, onMutate: ___, ...rest } = options ?? {};
  
  return useMutation<void, Error, string | number, { previousData: Array<[QueryKey, Company[] | undefined]> }>({
    mutationFn: (id: string | number) => companyService.delete(id),

    onMutate: async (deletedId) => {
      // Отменяем исходящие запросы
      await queryClient.cancelQueries({ queryKey: queryKeys.companies, exact: false });

      // Сохраняем предыдущее состояние
      const previousData = queryClient.getQueriesData<Company[]>({ queryKey: queryKeys.companies, exact: false });

      // Нормализуем ID
      const deletedIdStr = String(deletedId).trim();

      // Оптимистично удаляем из кэша - обновляем каждый ключ отдельно
      previousData.forEach(([key, oldData]) => {
        if (oldData && Array.isArray(oldData)) {
          const filtered = oldData.filter(company => {
            const companyId = company.id ? String(company.id).trim() : null;
            const company_id = (company as any)._id ? String((company as any)._id).trim() : null;
            return companyId !== deletedIdStr && company_id !== deletedIdStr;
          });
          
          // ВСЕГДА создаем новый массив (для обхода structural sharing)
          queryClient.setQueryData<Company[]>(key, filtered);
        }
      });
      
      // Также обновляем через setQueriesData
      queryClient.setQueriesData<Company[]>(
        { queryKey: queryKeys.companies, exact: false },
        (oldData) => {
          if (!oldData || !Array.isArray(oldData)) {
            return oldData;
          }
          
          const filtered = oldData.filter(company => {
            const companyId = company.id ? String(company.id).trim() : null;
            const company_id = (company as any)._id ? String((company as any)._id).trim() : null;
            return companyId !== deletedIdStr && company_id !== deletedIdStr;
          });
          
          // ВСЕГДА возвращаем новый массив
          return filtered;
        }
      );

      if (userOnMutate) {
        (userOnMutate as any)(deletedId);
      }

      return { previousData };
    },

    onSuccess: (_, deletedId, context, mutation) => {
      // Нормализуем ID
      const deletedIdStr = String(deletedId).trim();
      
      // Получаем все query keys для компаний
      const allQueries = queryClient.getQueriesData<Company[]>({ queryKey: queryKeys.companies, exact: false });
      
      // Обновляем каждый query key отдельно, создавая НОВЫЙ массив
      allQueries.forEach(([key, data]) => {
        if (data && Array.isArray(data)) {
          const filtered = data.filter(company => {
            const companyId = company.id ? String(company.id).trim() : null;
            const company_id = (company as any)._id ? String((company as any)._id).trim() : null;
            return companyId !== deletedIdStr && company_id !== deletedIdStr;
          });
          
          // ВСЕГДА создаем новый массив, даже если длина не изменилась (для обхода structural sharing)
          queryClient.setQueryData<Company[]>(key, filtered);
        }
      });
      
      // Также обновляем через setQueriesData для всех запросов
      queryClient.setQueriesData<Company[]>(
        { queryKey: queryKeys.companies, exact: false },
        (oldData) => {
          if (!oldData || !Array.isArray(oldData)) {
            return oldData;
          }
          
          const filtered = oldData.filter(company => {
            const companyId = company.id ? String(company.id).trim() : null;
            const company_id = (company as any)._id ? String((company as any)._id).trim() : null;
            return companyId !== deletedIdStr && company_id !== deletedIdStr;
          });
          
          // ВСЕГДА возвращаем новый массив
          return filtered;
        }
      );
      
      // Принудительно обновляем компоненты через небольшой refetch с задержкой
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: queryKeys.companies, exact: false });
      }, 100);
      
      if (userOnSuccess) {
        (userOnSuccess as any)(_, deletedId, context, mutation);
      }
    },

    onError: (error, variables, context, mutation) => {
      // console.error('[useDeleteCompany] Error deleting:', error);
      
      const errorStatus = (error as any)?.status || (error as any)?.response?.status;
      const errorMessage = (error as any)?.message || "";
      const deletedIdStr = String(variables).trim();
      
      const isNotFound = 
        errorStatus === 404 || 
        errorMessage.includes("404") || 
        errorMessage.toLowerCase().includes("not found");

      // Если ошибка 404 или "Not Found", значит компания уже удалена. НЕ откатываем кэш.
      if (isNotFound) {
         // Получаем все query keys
         const allQueries = queryClient.getQueriesData<Company[]>({ queryKey: queryKeys.companies, exact: false });
         
         // Обновляем каждый ключ отдельно
         allQueries.forEach(([key, data]) => {
           if (data && Array.isArray(data)) {
             const filtered = data.filter(company => {
               const companyId = company.id ? String(company.id).trim() : null;
               const company_id = (company as any)._id ? String((company as any)._id).trim() : null;
               return companyId !== deletedIdStr && company_id !== deletedIdStr;
             });
             
             // ВСЕГДА создаем новый массив
             queryClient.setQueryData<Company[]>(key, filtered);
           }
         });
         
         // Также обновляем через setQueriesData
         queryClient.setQueriesData<Company[]>(
           { queryKey: queryKeys.companies, exact: false },
           (oldData) => {
             if (!oldData || !Array.isArray(oldData)) {
               return oldData;
             }
             
             const filtered = oldData.filter(company => {
               const companyId = company.id ? String(company.id).trim() : null;
               const company_id = (company as any)._id ? String((company as any)._id).trim() : null;
               return companyId !== deletedIdStr && company_id !== deletedIdStr;
             });
             
             // ВСЕГДА возвращаем новый массив
             return filtered;
           }
         );
      } else {
         // console.log('[useDeleteCompany] Other error - rolling back');
         // Для других ошибок откатываем изменения
         if (context?.previousData) {
           context.previousData.forEach(([key, old]) => {
             queryClient.setQueryData<Company[] | undefined>(key, old);
           });
         }
      }

      if (userOnError) {
        (userOnError as any)(error, variables, context, mutation);
      }
    },
    ...rest,
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
      queryClient.setQueryData(queryKeys.adminSettings, data);
      // Инвалидируем запрос, чтобы обновить статус и заставить все компоненты перечитать данные
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.adminSettings,
        exact: false, // Инвалидируем все запросы с этим ключом
        refetchType: 'active', // Принудительно обновляем активные запросы
      });
    },
    ...options,
  });
};

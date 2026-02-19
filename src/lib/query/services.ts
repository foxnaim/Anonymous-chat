/**
 * API сервисы для React Query
 * Все API вызовы здесь, используются в query hooks
 */

import type { 
  Message, 
  Company, 
  Stats, 
  MessageDistribution, 
  GrowthMetrics, 
  SubscriptionPlan, 
  AdminUser,
  AchievementProgress,
  PlanType
} from "@/types";
import type { PlatformStats } from "./types";
import type { GroupedAchievements } from "../achievements";

// Все данные теперь получаются с реального API бэкенда
// Моковые данные удалены

// ========== MESSAGE SERVICES ==========
// Используем реальный API вместо моковых данных
export const messageService = {
  getAll: async (companyCode?: string, page?: number, limit?: number, messageId?: string, fromDate?: string): Promise<Message[]> => {
    try {
      const params = new URLSearchParams();
      if (companyCode) params.append('companyCode', companyCode);
      if (messageId) params.append('messageId', messageId);
      if (page) params.append('page', page.toString());
      if (limit) params.append('limit', limit.toString());
      if (fromDate) params.append('fromDate', fromDate);
      const queryString = params.toString();
      const response = await apiClient.get<ApiResponse<Message[]>>(`/messages${queryString ? `?${queryString}` : ''}`);
      return response.data;
    } catch (error: any) {
      // Игнорируем ошибки аутентификации (401/403) - пользователь будет перенаправлен на логин
      if (error?.status === 401 || error?.status === 403) {
        // Тихо возвращаем пустой массив, чтобы не показывать ошибку пользователю
        // Аутентификация обрабатывается на уровне ProtectedRoute
        return [];
      }
      // Для других ошибок также возвращаем пустой массив
      return [];
    }
  },

  getById: async (id: string): Promise<Message | null> => {
    try {
      const response = await apiClient.get<ApiResponse<Message>>(`/messages/${id}`);
      return response.data;
    } catch (error) {
      if ((error as { status?: number })?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  create: async (message: Omit<Message, "id" | "createdAt" | "updatedAt" | "lastUpdate">): Promise<Message> => {
    const response = await apiClient.post<ApiResponse<Message>>('/messages', message);
    return response.data;
  },

  update: async (id: string, updates: Partial<Message>): Promise<Message> => {
    // Бэкенд не имеет отдельного эндпоинта для update, используем updateStatus
    // Если нужно обновить другие поля, можно добавить отдельный эндпоинт
    throw new Error('Update message not implemented - use updateStatus instead');
  },

  updateStatus: async (id: string, status: Message["status"], response?: string): Promise<Message> => {
    const body: { status: string; response?: string } = { status };
    if (response) {
      body.response = response;
    }
    const responseData = await apiClient.put<ApiResponse<Message>>(`/messages/${id}/status`, body);
    return responseData.data;
  },

  moderate: async (id: string, action: 'approve' | 'reject'): Promise<Message> => {
    const response = await apiClient.post<ApiResponse<Message>>(`/messages/${id}/moderate`, { action });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/messages/${id}`);
  },
};

// ========== COMPANY SERVICES ==========
// Используем реальный API вместо моковых данных
import { apiClient } from '../api/client';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const companyService = {
  getAll: async (page?: number, limit?: number): Promise<Company[] | { data: Company[]; pagination?: { page: number; limit: number; total: number; totalPages: number } }> => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    const queryString = params.toString();
    const response = await apiClient.get<ApiResponse<Company[]>>(`/companies${queryString ? `?${queryString}` : ''}`);
    // Если есть пагинация, возвращаем объект, иначе массив (для обратной совместимости)
    if ((response as any).pagination) {
      return {
        data: response.data,
        pagination: (response as any).pagination,
      };
    }
    return response.data;
  },

  getById: async (id: string | number): Promise<Company | null> => {
    try {
      const response = await apiClient.get<ApiResponse<Company>>(`/companies/${id}`);
      return response.data;
    } catch (error) {
      if ((error as { status?: number })?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  getByCode: async (code: string): Promise<Company | null> => {
    try {
      const response = await apiClient.get<ApiResponse<Company>>(`/companies/code/${code}`);
      return response.data;
    } catch (error) {
      if ((error as { status?: number })?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  create: async (company: Omit<Company, "id" | "registered" | "messages">): Promise<Company> => {
    const response = await apiClient.post<ApiResponse<Company>>('/companies', company);
    return response.data;
  },

  update: async (id: string | number, updates: Partial<Company>): Promise<Company> => {
    const response = await apiClient.put<ApiResponse<Company>>(`/companies/${id}`, updates);
    return response.data;
  },

  updateStatus: async (id: string | number, status: Company["status"]): Promise<Company> => {
    const response = await apiClient.put<ApiResponse<Company>>(`/companies/${id}/status`, { status });
    return response.data;
  },

  updatePlan: async (id: string | number, plan: PlanType, planEndDate?: string): Promise<Company> => {
    const body: { plan: string; planEndDate?: string } = { plan };
    if (planEndDate) {
      body.planEndDate = planEndDate;
    }
    const response = await apiClient.put<ApiResponse<Company>>(`/companies/${id}/plan`, body);
    return response.data;
  },

  verifyPassword: async (code: string, password: string): Promise<boolean> => {
    try {
      const response = await apiClient.post<ApiResponse<{ isValid: boolean }>>('/auth/verify-password', {
        code,
        password,
      });
      return response.data.isValid;
    } catch {
      return false;
    }
  },

  delete: async (id: string | number, password?: string): Promise<void> => {
    const body = password ? { password } : undefined;
    await apiClient.delete<ApiResponse<void>>(`/companies/${id}`, body);
  },
};

// ========== STATS SERVICES ==========
export const statsService = {
  getCompanyStats: async (companyId: string | number): Promise<Stats> => {
    try {
      const response = await apiClient.get<ApiResponse<Stats>>(`/stats/company/${companyId}`);
      return response.data;
    } catch (error) {
      // Если ошибка, возвращаем пустую статистику
      return { new: 0, inProgress: 0, resolved: 0, total: 0 };
    }
  },

  getMessageDistribution: async (companyId: string | number): Promise<MessageDistribution> => {
    try {
      const response = await apiClient.get<ApiResponse<MessageDistribution>>(`/stats/distribution/${companyId}`);
      return response.data;
    } catch (error) {
      return { complaints: 0, praises: 0, suggestions: 0 };
    }
  },

  getGrowthMetrics: async (companyId: string | number): Promise<GrowthMetrics> => {
    try {
      const response = await apiClient.get<ApiResponse<GrowthMetrics>>(`/stats/growth/${companyId}`);
      return response.data;
    } catch (error) {
      // Возвращаем дефолтные значения при ошибке
      return {
        rating: 0,
        mood: "Нейтральный",
        trend: "stable",
        pointsBreakdown: {
          totalMessages: 0,
          resolvedCases: 0,
          responseSpeed: 0,
          activityBonus: 0,
          achievementsBonus: 0,
          praiseBonus: 0,
        },
      };
    }
  },

  getAchievements: async (companyId: string | number): Promise<AchievementProgress[]> => {
    try {
      const response = await apiClient.get<ApiResponse<AchievementProgress[]>>(`/stats/achievements/${companyId}`);
      return response.data;
    } catch (error) {
      return [];
    }
  },

  getGroupedAchievements: async (companyId: string | number): Promise<GroupedAchievements[]> => {
    try {
      const response = await apiClient.get<ApiResponse<GroupedAchievements[]>>(`/stats/achievements/${companyId}/grouped`);
      return response.data;
    } catch (error) {
      return [];
    }
  },

  getPlatformStats: async (): Promise<PlatformStats> => {
    try {
      const response = await apiClient.get<ApiResponse<PlatformStats>>('/stats/platform');
      return response.data;
    } catch (error) {
      // Возвращаем дефолтные значения при ошибке
      return {
        rooms: 0,
        latency: "0ms",
        retention: "0%"
      };
    }
  },
};

// ========== PLANS SERVICES ==========
// Используем реальный API вместо моковых данных
export const plansService = {
  getAll: async (): Promise<SubscriptionPlan[]> => {
    try {
      const response = await apiClient.get<ApiResponse<SubscriptionPlan[]>>('/plans');
      return response.data;
    } catch (error) {
      // При ошибке возвращаем пустой массив
      return [];
    }
  },

  create: async (plan: Omit<SubscriptionPlan, "id">): Promise<SubscriptionPlan> => {
    const response = await apiClient.post<ApiResponse<SubscriptionPlan>>('/plans', plan);
    return response.data;
  },

  getFreePlanSettings: async () => {
    try {
      const response = await apiClient.get<ApiResponse<{ messagesLimit: number; storageLimit: number; freePeriodDays: number }>>('/plans/free-settings');
      return response.data;
    } catch (error) {
      // Возвращаем дефолтные значения при ошибке
      return {
        messagesLimit: 10,
        storageLimit: 1,
        freePeriodDays: 60,
      };
    }
  },

  updateFreePlanSettings: async (settings: { messagesLimit: number; storageLimit: number; freePeriodDays: number }): Promise<void> => {
    await apiClient.put<ApiResponse<void>>('/plans/free-settings', settings);
  },
};

// Старые моковые данные планов удалены - теперь используется реальный API

// ========== ADMIN SERVICES ==========
// Используем реальный API вместо моковых данных

// Вспомогательная функция для преобразования _id в id
const transformAdminUser = (admin: any): AdminUser => {
  return {
    id: admin._id?.toString() || admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    createdAt: admin.createdAt,
    lastLogin: admin.lastLogin || null,
  };
};

export const adminService = {
  getAdmins: async (page?: number, limit?: number): Promise<{ data: AdminUser[]; pagination?: { page: number; limit: number; total: number; totalPages: number } }> => {
    try {
      const params = new URLSearchParams();
      if (page) params.append('page', page.toString());
      if (limit) params.append('limit', limit.toString());
      const queryString = params.toString();
      const response = await apiClient.get<ApiResponse<any[]>>(`/admins${queryString ? `?${queryString}` : ''}`);
      // Преобразуем _id в id для каждого админа
      return {
        data: response.data.map(transformAdminUser),
        pagination: (response as any).pagination,
      };
    } catch (error) {
      // При ошибке возвращаем пустой массив
      return { data: [] };
    }
  },

  createAdmin: async (data: { email: string; name: string; role?: 'admin' | 'super_admin'; password?: string }): Promise<AdminUser> => {
    const response = await apiClient.post<ApiResponse<any>>('/admins', data);
    return transformAdminUser(response.data);
  },

  updateAdmin: async (id: string, data: { name?: string; email?: string; role?: 'admin' | 'super_admin'; password?: string }): Promise<AdminUser> => {
    const response = await apiClient.put<ApiResponse<any>>(`/admins/${id}`, data);
    const raw = (response as ApiResponse<any>)?.data ?? response;
    return transformAdminUser(raw);
  },

  deleteAdmin: async (id: string): Promise<void> => {
    await apiClient.delete(`/admins/${id}`);
  },
};


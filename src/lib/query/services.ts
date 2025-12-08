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
  getAll: async (companyCode?: string): Promise<Message[]> => {
    try {
      const params = companyCode ? `?companyCode=${encodeURIComponent(companyCode)}` : '';
      const response = await apiClient.get<ApiResponse<Message[]>>(`/messages${params}`);
      return response.data;
    } catch (error) {
      // При ошибке возвращаем пустой массив
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
};

// ========== COMPANY SERVICES ==========
// Используем реальный API вместо моковых данных
import { apiClient } from '../api/client';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const companyService = {
  getAll: async (): Promise<Company[]> => {
    const response = await apiClient.get<ApiResponse<Company[]>>('/companies');
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
      const response = await apiClient.post<ApiResponse<{ valid: boolean }>>('/auth/verify-password', {
        code,
        password,
      });
      return response.data.valid;
    } catch {
      return false;
    }
  },

  delete: async (id: string | number): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/companies/${id}`);
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
export const adminService = {
  getAdmins: async (): Promise<AdminUser[]> => {
    try {
      const response = await apiClient.get<ApiResponse<AdminUser[]>>('/admins');
      return response.data;
    } catch (error) {
      // При ошибке возвращаем пустой массив
      return [];
    }
  },
};


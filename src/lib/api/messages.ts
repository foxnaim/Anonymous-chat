/**
 * API сервисы для работы с сообщениями
 * Использует реальный API бэкенда
 */

import { Message } from "@/types";
import { apiClient } from "./client";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const messageApi = {
  /**
   * Получить все сообщения или по коду компании
   */
  getAll: async (companyCode?: string, page?: number, limit?: number): Promise<{ data: Message[]; pagination?: ApiResponse<Message[]>['pagination'] }> => {
    try {
      const params = new URLSearchParams();
      if (companyCode) params.append('companyCode', companyCode);
      if (page) params.append('page', page.toString());
      if (limit) params.append('limit', limit.toString());
      const queryString = params.toString();
      const response = await apiClient.get<ApiResponse<Message[]>>(`/messages${queryString ? `?${queryString}` : ''}`);
      return {
        data: response.data,
        pagination: response.pagination,
      };
    } catch (error) {
      return { data: [] };
    }
  },

  /**
   * Получить сообщение по ID
   */
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

  /**
   * Создать новое сообщение
   */
  create: async (message: Omit<Message, "id" | "createdAt" | "updatedAt" | "lastUpdate">): Promise<Message> => {
    const response = await apiClient.post<ApiResponse<Message>>('/messages', message);
    return response.data;
  },

  /**
   * Обновить сообщение
   */
  update: async (id: string, updates: Partial<Message>): Promise<Message> => {
    // Бэкенд не имеет отдельного эндпоинта для update, используем updateStatus
    throw new Error('Update message not implemented - use updateStatus instead');
  },

  /**
   * Модерировать сообщение (approve/reject) - только для админов
   */
  moderate: async (id: string, action: 'approve' | 'reject'): Promise<Message> => {
    const response = await apiClient.post<ApiResponse<Message>>(`/messages/${id}/moderate`, { action });
    return response.data;
  },
};

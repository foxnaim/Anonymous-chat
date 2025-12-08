/**
 * API сервисы для работы с сообщениями
 * Использует реальный API бэкенда
 */

import { Message } from "@/types";
import { apiClient } from "./client";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const messageApi = {
  /**
   * Получить все сообщения или по коду компании
   */
  getAll: async (companyCode?: string): Promise<Message[]> => {
    try {
      const params = companyCode ? `?companyCode=${encodeURIComponent(companyCode)}` : '';
      const response = await apiClient.get<ApiResponse<Message[]>>(`/messages${params}`);
      return response.data;
    } catch (error) {
      return [];
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
};

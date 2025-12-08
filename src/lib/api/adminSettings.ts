import { apiClient } from './client';

export interface AdminSettings {
  id: string;
  adminId: string;
  fullscreenMode: boolean;
  language: 'ru' | 'en' | 'kk';
  theme?: 'light' | 'dark' | 'system';
  itemsPerPage?: number;
  notificationsEnabled?: boolean;
  emailNotifications?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminSettingsResponse {
  success: boolean;
  data: AdminSettings;
}

export interface UpdateAdminSettingsRequest {
  fullscreenMode?: boolean;
  language?: 'ru' | 'en' | 'kk';
  theme?: 'light' | 'dark' | 'system';
  itemsPerPage?: number;
  notificationsEnabled?: boolean;
  emailNotifications?: boolean;
}

export const adminSettingsApi = {
  /**
   * Получить настройки админа
   */
  get: async (): Promise<AdminSettingsResponse> => {
    return apiClient.get<AdminSettingsResponse>('/admin-settings');
  },

  /**
   * Обновить настройки админа
   */
  update: async (data: UpdateAdminSettingsRequest): Promise<AdminSettingsResponse> => {
    return apiClient.put<AdminSettingsResponse>('/admin-settings', data);
  },
};


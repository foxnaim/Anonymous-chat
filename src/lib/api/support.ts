import { apiClient } from './client';

export interface SupportInfo {
  supportWhatsAppNumber: string | null;
}

export interface SupportInfoResponse {
  success: boolean;
  data: SupportInfo;
}

export const supportApi = {
  /**
   * Получить публичную информацию о поддержке
   */
  getInfo: async (): Promise<SupportInfoResponse> => {
    return apiClient.get<SupportInfoResponse>('/support');
  },
};

/**
 * Серверный API клиент для SSR/SSG
 * Работает без cookies и токенов (для публичных данных)
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    message: string;
    code?: string;
  };
}

import type { Company } from "@/types";

// Используем тип Company из types, но делаем некоторые поля опциональными
// для совместимости с публичным API
type PublicCompany = Partial<Company> & {
  id: string;
  name: string;
  code: string;
  updatedAt?: string | Date;
  createdAt?: string | Date;
};

/**
 * Серверный клиент для получения публичных данных
 */
class ServerApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        // На сервере не используем кэш по умолчанию для актуальных данных
        cache: 'no-store',
      });

      if (!response.ok) {
        // Для 404 возвращаем null вместо ошибки
        if (response.status === 404) {
          return null as T;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      // Игнорируем ошибки сети на сервере для SEO
      // Ошибки обрабатываются тихо, возвращаем null для graceful degradation
      // В production можно добавить логирование через внешний сервис (Sentry, etc.)
      return null as T;
    }
  }

  /**
   * Получить компанию по коду (публичный endpoint)
   */
  async getCompanyByCode(code: string): Promise<Company | null> {
    try {
      const response = await this.request<ApiResponse<PublicCompany>>(`/companies/code/${code}`);
      if (response?.success && response.data) {
        // Преобразуем в полный тип Company
        return response.data as Company;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Получить список публичных компаний для sitemap
   * Возвращает только публичные поля: code, name, status
   */
  async getPublicCompanies(): Promise<PublicCompany[]> {
    try {
      const response = await this.request<ApiResponse<PublicCompany[]>>('/companies/public');
      if (response?.success && response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      // Ошибки обрабатываются в request(), возвращаем пустой массив для graceful degradation
      return [];
    }
  }
}

// Singleton instance
export const serverApiClient = new ServerApiClient();


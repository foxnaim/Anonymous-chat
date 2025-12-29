/**
 * HTTP клиент для API запросов
 * В реальном приложении здесь будет axios или fetch обертка
 */

import { API_CONFIG } from '../query/constants';
import { getToken } from '../utils/cookies';

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
  }

  /**
   * Базовый метод для GET запросов
   */
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * Базовый метод для POST запросов
   */
  async post<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
  }

  /**
   * Базовый метод для PUT запросов
   */
  async put<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
  }

  /**
   * Базовый метод для DELETE запросов
   */
  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Универсальный метод для запросов
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Убеждаемся, что endpoint начинается с /
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseURL}${normalizedEndpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    // Получаем токен из куки
    const token = getToken();
    
    // Добавляем токен в заголовки, если он есть
    const headers = new Headers(options.headers);
    
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    } else if (!token) {
      // Логируем отсутствие токена для отладки, только в dev режиме или при явной ошибке
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[ApiClient] Token missing for request: ${url}`);
      }
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        let errorCode: string | undefined;

        try {
          const errorData = await response.json();
          // Бэкенд возвращает ошибку в формате: { success: false, error: { message: string, code?: string } }
          if (errorData?.error?.message) {
            errorMessage = errorData.error.message;
          } else if (errorData?.message) {
            errorMessage = errorData.message;
          }
          if (errorData?.error?.code) {
            errorCode = errorData.error.code;
          }
        } catch (parseError) {
          // Если не удалось распарсить JSON, используем стандартное сообщение
          // Для 403 может быть проблема с CORS или аутентификацией
          if (response.status === 403) {
            errorMessage = 'Access forbidden. Please check your authentication.';
            errorCode = 'FORBIDDEN';
          } else if (response.status === 401) {
            errorMessage = 'Authentication required. Please log in.';
            errorCode = 'UNAUTHORIZED';
          } else if (response.status === 429) {
            errorMessage = 'Too many requests. Please try again later.';
            errorCode = 'RATE_LIMIT';
          }
        }

        const error: ApiError = {
          message: errorMessage,
          status: response.status,
          code: errorCode,
        };
        
        throw error;
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }
}

export const apiClient = new ApiClient();


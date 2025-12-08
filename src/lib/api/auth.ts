/**
 * API сервис для аутентификации
 */

import { apiClient, ApiError } from './client';

export type { ApiError };

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      email: string;
      role: string;
      companyId?: string;
      name?: string;
    };
    token: string;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
  role?: string;
  companyName?: string;
  companyCode?: string;
}

export interface RegisterResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      email: string;
      role: string;
      companyId?: string;
      name?: string;
    };
    token: string;
  };
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  resetToken?: string; // Только в development
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface GetMeResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      email: string;
      role: string;
      companyId?: string;
      name?: string;
      lastLogin?: string;
    };
  };
}

class AuthService {
  /**
   * Вход в систему
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>('/auth/login', data);
  }

  /**
   * Регистрация пользователя
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return apiClient.post<RegisterResponse>('/auth/register', data);
  }

  /**
   * Запрос на восстановление пароля
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    return apiClient.post<ForgotPasswordResponse>('/auth/forgot-password', data);
  }

  /**
   * Сброс пароля по токену
   */
  async resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    return apiClient.post<ResetPasswordResponse>('/auth/reset-password', data);
  }

  /**
   * Получить текущего пользователя
   * Токен берется автоматически из куки или заголовков
   */
  async getMe(token?: string): Promise<GetMeResponse> {
    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return apiClient.get<GetMeResponse>('/auth/me', {
      headers,
    });
  }
}

export const authService = new AuthService();


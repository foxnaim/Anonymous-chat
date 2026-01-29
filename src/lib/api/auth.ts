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
    token?: string; // JWT token (теперь опциональный)
    verificationToken?: string; // Токен для подтверждения email
  };
  message?: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface VerifyEmailResponse {
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
  message: string;
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

export interface ChangeEmailRequest {
  newEmail: string;
  password: string;
}

export interface ChangeEmailResponse {
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
  message: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
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
   * Подтверждение email
   */
  async verifyEmail(data: VerifyEmailRequest): Promise<VerifyEmailResponse> {
    return apiClient.post<VerifyEmailResponse>('/auth/verify-email', data);
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

  /**
   * Изменить email пользователя
   * Требует подтверждения текущего пароля
   */
  async changeEmail(data: ChangeEmailRequest): Promise<ChangeEmailResponse> {
    return apiClient.post<ChangeEmailResponse>('/auth/change-email', data);
  }

  /**
   * Изменить пароль пользователя
   * Требует подтверждения текущего пароля
   */
  async changePassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    return apiClient.post<ChangePasswordResponse>('/auth/change-password', data);
  }
}

export const authService = new AuthService();


/**
 * Хуки для работы с аутентификацией через Redux
 */

import { useAppDispatch, useAppSelector } from '../hooks';
import { loginAsync, registerAsync, logout, checkSessionAsync, verifyEmailAsync } from '../slices/authSlice';
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Хук для работы с аутентификацией
 * Заменяет useAuth из AuthContext
 */
export const useAuth = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const queryClient = useQueryClient();
  const hasCheckedSession = useRef(false);

  // Проверяем сессию при монтировании (только один раз)
  useEffect(() => {
    if (typeof window !== 'undefined' && !hasCheckedSession.current && auth.isLoading) {
      hasCheckedSession.current = true;
      dispatch(checkSessionAsync());
    }
  }, [dispatch, auth.isLoading]);

  const login = async (email: string, password: string): Promise<{ success: boolean; user?: any }> => {
    try {
      const result = await dispatch(loginAsync({ email, password }));
      if (loginAsync.fulfilled.match(result)) {
        // Переподключаем WebSocket с новым токеном после успешного логина
        if (typeof window !== 'undefined') {
          // Используем setTimeout для асинхронной загрузки модуля
          setTimeout(() => {
            try {
              const socketModule = require('@/lib/websocket/socket');
              if (socketModule?.reconnectSocket) {
                socketModule.reconnectSocket();
              }
            } catch {
              // Игнорируем ошибки, если модуль не загружен
            }
          }, 0);
        }
        return { success: true, user: result.payload };
      }
      return { success: false };
    } catch {
      return { success: false };
    }
  };

  const register = async (
    email: string,
    password: string,
    name?: string,
    role?: string,
    companyName?: string,
    companyCode?: string
  ): Promise<{ success: boolean; verificationToken?: string }> => {
    try {
      const result = await dispatch(
        registerAsync({ email, password, name, role, companyName, companyCode })
      );
      if (registerAsync.fulfilled.match(result)) {
        // Если есть verificationToken, то не логиним сокеты и т.д., а просто возвращаем токен
        if (result.payload.verificationToken) {
           return { success: true, verificationToken: result.payload.verificationToken };
        }

        // Переподключаем WebSocket с новым токеном после успешной регистрации (если сразу залогинили)
        if (typeof window !== 'undefined') {
          // Используем setTimeout для асинхронной загрузки модуля
          setTimeout(() => {
            try {
              const socketModule = require('@/lib/websocket/socket');
              if (socketModule?.reconnectSocket) {
                socketModule.reconnectSocket();
              }
            } catch {
              // Игнорируем ошибки, если модуль не загружен
            }
          }, 0);
        }
        return { success: true };
      }
      return { success: false };
    } catch {
      return { success: false };
    }
  };

  const verifyEmail = async (token: string): Promise<boolean> => {
    try {
      const result = await dispatch(verifyEmailAsync({ token }));
      if (verifyEmailAsync.fulfilled.match(result)) {
         // Переподключаем сокеты
         if (typeof window !== 'undefined') {
          setTimeout(() => {
            try {
              const socketModule = require('@/lib/websocket/socket');
              if (socketModule?.reconnectSocket) {
                socketModule.reconnectSocket();
              }
            } catch {}
          }, 0);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleLogout = () => {
    // Очищаем Redux state немедленно (синхронно)
    dispatch(logout());
    
    // Отключаем WebSocket при выходе
    if (typeof window !== 'undefined') {
      // Используем setTimeout для асинхронной загрузки модуля
      setTimeout(() => {
        try {
          const socketModule = require('@/lib/websocket/socket');
          if (socketModule?.disconnectSocket) {
            socketModule.disconnectSocket();
          }
        } catch {
          // Игнорируем ошибки, если модуль не загружен
        }
      }, 0);
    }
    
    // Все остальное делаем асинхронно, чтобы не блокировать UI
    if (typeof window !== 'undefined') {
      // Используем requestIdleCallback для неблокирующей очистки кэша
      const clearCache = () => {
        try {
          queryClient.cancelQueries();
          queryClient.clear();
        } catch (error) {
          // Игнорируем ошибки при очистке кэша
        }
      };
      
      if ('requestIdleCallback' in window) {
        requestIdleCallback(clearCache, { timeout: 1000 });
      } else {
        // Fallback для браузеров без requestIdleCallback
        setTimeout(clearCache, 0);
      }
    }
  };

  return {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    login,
    register,
    verifyEmail,
    logout: handleLogout,
  };
};


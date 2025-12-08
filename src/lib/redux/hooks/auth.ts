/**
 * Хуки для работы с аутентификацией через Redux
 */

import { useAppDispatch, useAppSelector } from '../hooks';
import { loginAsync, registerAsync, logout, checkSessionAsync } from '../slices/authSlice';
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

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await dispatch(loginAsync({ email, password }));
      return loginAsync.fulfilled.match(result);
    } catch {
      return false;
    }
  };

  const register = async (
    email: string,
    password: string,
    name?: string,
    role?: string,
    companyName?: string,
    companyCode?: string
  ): Promise<boolean> => {
    try {
      const result = await dispatch(
        registerAsync({ email, password, name, role, companyName, companyCode })
      );
      return registerAsync.fulfilled.match(result);
    } catch {
      return false;
    }
  };

  const handleLogout = () => {
    // Очищаем Redux state немедленно (синхронно)
    dispatch(logout());
    
    // Все остальное делаем асинхронно, чтобы не блокировать UI
    if (typeof window !== 'undefined') {
      // Используем requestIdleCallback для неблокирующей очистки кэша
      const clearCache = () => {
        try {
          queryClient.cancelQueries();
          queryClient.clear();
        } catch (error) {
          // Игнорируем ошибки при очистке кэша
          console.error('Error clearing query cache:', error);
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
    logout: handleLogout,
  };
};


/**
 * Хуки для работы с аутентификацией через Redux
 */

import { useAppDispatch, useAppSelector } from '../hooks';
import { loginAsync, logout, checkSessionAsync } from '../slices/authSlice';
import { useEffect } from 'react';

/**
 * Хук для работы с аутентификацией
 * Заменяет useAuth из AuthContext
 */
export const useAuth = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);

  // Проверяем сессию при монтировании
  useEffect(() => {
    if (typeof window !== 'undefined' && !auth.user && !auth.isLoading) {
      dispatch(checkSessionAsync());
    }
  }, [dispatch, auth.user, auth.isLoading]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await dispatch(loginAsync({ email, password }));
      return loginAsync.fulfilled.match(result);
    } catch {
      return false;
    }
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  return {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    login,
    logout: handleLogout,
  };
};


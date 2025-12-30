'use client';

import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { checkSessionAsync } from '@/lib/redux/slices/authSlice';

/**
 * Компонент для проверки сессии один раз при загрузке приложения
 * Предотвращает дублирование запросов /me
 */
export const SessionChecker = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const hasCheckedSession = useRef(false);

  useEffect(() => {
    // Проверяем сессию только один раз при монтировании компонента
    if (
      typeof window !== 'undefined' &&
      !hasCheckedSession.current &&
      auth.isLoading
    ) {
      hasCheckedSession.current = true;
      dispatch(checkSessionAsync());
    }
  }, [dispatch, auth.isLoading]);

  // Этот компонент не рендерит ничего
  return null;
};


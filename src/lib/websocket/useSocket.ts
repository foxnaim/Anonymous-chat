/**
 * React хук для работы с WebSocket
 */

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
// Исправлено: удален неиспользуемый импорт disconnectSocket
import { getSocket } from './socket';
import { queryKeys } from '../query';
import type { Message } from '@/types';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

/**
 * Проверяет, разрешены ли уведомления браузера
 */
const requestNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  // Запрашиваем разрешение
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

/**
 * Показывает уведомление браузера
 */
const showNotification = (title: string, options?: NotificationOptions) => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/feedBack.svg',
      badge: '/feedBack.svg',
      ...options,
    });
  }
};

/**
 * Хук для подписки на WebSocket события сообщений
 */
export const useSocketMessages = (companyCode?: string | null) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const notificationPermissionRef = useRef<boolean>(false);
  const tRef = useRef(t);
  
  // Обновляем ref при изменении функции перевода
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  useEffect(() => {
    // Запрашиваем разрешение на уведомления при монтировании
    requestNotificationPermission().then((granted) => {
      notificationPermissionRef.current = granted;
    });
  }, []);

  // Мемоизируем обработчики для избежания лишних переподписок
  const handleNewMessage = useCallback((message: Message) => {
    console.log('[WebSocket] Received new message:', message.id, 'for company:', message.companyCode, 'current companyCode:', companyCode);
    
    // Сначала обновляем кэш оптимистично для мгновенного отображения
    const baseQueryKey = queryKeys.messages(companyCode || undefined);
    
    // Обновляем все запросы, которые начинаются с базового ключа
    queryClient.setQueriesData<Message[]>(
      { queryKey: baseQueryKey, exact: false },
      (old) => {
        if (!old) return old;
        const exists = old.some((m) => m.id === message.id);
        if (exists) {
          return old.map((m) => (m.id === message.id ? message : m));
        }
        return [message, ...old];
      }
    );
    
    // Также обновляем кэш для всех сообщений (для админов)
    if (!companyCode && message.companyCode) {
      queryClient.setQueriesData<Message[]>(
        { queryKey: queryKeys.messages(message.companyCode), exact: false },
        (old) => {
          if (!old) return old;
          const exists = old.some((m) => m.id === message.id);
          if (exists) {
            return old.map((m) => (m.id === message.id ? message : m));
          }
          return [message, ...old];
        }
      );
    }
    
    // Обновляем общий список всех сообщений для админов
    if (!companyCode) {
      queryClient.setQueriesData<Message[]>(
        { queryKey: queryKeys.messages(undefined), exact: false },
        (old) => {
          if (!old) return old;
          const exists = old.some((m) => m.id === message.id);
          if (exists) {
            return old.map((m) => (m.id === message.id ? message : m));
          }
          return [message, ...old];
        }
      );
    }
    
    // КРИТИЧЕСКИ ВАЖНО: Принудительно обновляем активные запросы для немедленного отображения
    // Используем refetchQueries для гарантированного обновления UI
    // Это заставит React Query перерисовать компоненты с обновленными данными
    queryClient.refetchQueries({ 
      queryKey: ['messages'],
      exact: false,
      type: 'active', // Только активные запросы (те, что видны на экране)
    });
    
    // Если сообщение для другой компании, также обновляем её запросы
    if (message.companyCode && message.companyCode !== companyCode) {
      queryClient.refetchQueries({ 
        queryKey: queryKeys.messages(message.companyCode),
        exact: false,
        type: 'active',
      });
    }

    // Инвалидируем статистику
    queryClient.invalidateQueries({ 
      queryKey: ['stats'],
      refetchType: 'active',
    });

    // Показываем уведомление браузера, если разрешено и вкладка неактивна
    if (notificationPermissionRef.current && document.hidden) {
      const messageType = message.type === 'complaint' 
        ? tRef.current('sendMessage.complaint') 
        : message.type === 'praise'
        ? tRef.current('sendMessage.praise')
        : tRef.current('sendMessage.suggestion');
      
      showNotification(
        tRef.current('notifications.newMessage') || 'Новое сообщение',
        {
          body: `${messageType}: ${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}`,
          tag: `message-${message.id}`,
          requireInteraction: false,
        }
      );
    }

    // Показываем toast уведомление всегда (даже если вкладка активна)
    toast.success(tRef.current('notifications.newMessageReceived') || 'Получено новое сообщение', {
      duration: 3000,
    });
  }, [companyCode, queryClient]);

  const handleMessageUpdate = useCallback((message: Message) => {
    // Обновляем все запросы сообщений для данного companyCode (включая все варианты page/limit)
    const baseQueryKey = queryKeys.messages(companyCode || message.companyCode || undefined);
    
    queryClient.setQueriesData<Message[]>(
      { queryKey: baseQueryKey, exact: false },
      (old) => {
        if (!old) return old;
        return old.map((m) => (m.id === message.id ? message : m));
      }
    );
    
    // Также обновляем кэш для всех сообщений (для админов)
    if (!companyCode) {
      queryClient.setQueriesData<Message[]>(
        { queryKey: queryKeys.messages(undefined), exact: false },
        (old) => {
          if (!old) return old;
          return old.map((m) => (m.id === message.id ? message : m));
        }
      );
    }
    
    // Обновляем запросы для компании, которой принадлежит сообщение
    if (message.companyCode && message.companyCode !== companyCode) {
      queryClient.setQueriesData<Message[]>(
        { queryKey: queryKeys.messages(message.companyCode), exact: false },
        (old) => {
          if (!old) return old;
          return old.map((m) => (m.id === message.id ? message : m));
        }
      );
    }

    // Обновляем отдельное сообщение в кэше
    queryClient.setQueryData(queryKeys.message(message.id), message);

    // Оптимизация: инвалидируем только активные запросы статистики
    queryClient.invalidateQueries({ 
      queryKey: ['stats'],
      refetchType: 'active',
    });
  }, [companyCode, queryClient]);

  const handleMessageDelete = useCallback((data: { id: string; companyCode: string }) => {
    // Удаляем из всех запросов сообщений для данного companyCode
    const baseQueryKey = queryKeys.messages(companyCode || data.companyCode || undefined);
    
    queryClient.setQueriesData<Message[]>(
      { queryKey: baseQueryKey, exact: false },
      (old) => {
        if (!old) return old;
        return old.filter((m) => m.id !== data.id);
      }
    );
    
    // Также удаляем из общего списка всех сообщений (для админов)
    queryClient.setQueriesData<Message[]>(
      { queryKey: queryKeys.messages(undefined), exact: false },
      (old) => {
        if (!old) return old;
        return old.filter((m) => m.id !== data.id);
      }
    );

    // Удаляем отдельное сообщение из кэша
    queryClient.removeQueries({ queryKey: queryKeys.message(data.id) });

    // Оптимизация: инвалидируем только активные запросы статистики
    queryClient.invalidateQueries({ 
      queryKey: ['stats'],
      refetchType: 'active',
    });
  }, [companyCode, queryClient]);

  useEffect(() => {
    // Переподключаемся при изменении companyCode или при монтировании
    const socket = getSocket(false);
    if (!socket) {
      console.warn('[WebSocket] Cannot connect: no authentication token or socket.io-client not loaded');
      return;
    }
    
    // Функция для подписки на события
    const subscribeToEvents = () => {
      if (!socket) return;
      
      // Подписываемся на события
      socket.on('message:new', handleNewMessage);
      socket.on('message:updated', handleMessageUpdate);
      socket.on('message:deleted', handleMessageDelete);
      
      console.log('[WebSocket] ✅ Subscribed to message events', {
        companyCode: companyCode || 'all',
        connected: socket.connected,
        socketId: socket.id
      });
    };
    
    // Если уже подключен, подписываемся сразу
    if (socket.connected) {
      subscribeToEvents();
    } else {
      // Если не подключен, ждем подключения
      const onConnect = () => {
        console.log('[WebSocket] ✅ Connected, subscribing to messages');
        subscribeToEvents();
      };
      
      socket.once('connect', onConnect);
      
      console.log('[WebSocket] ⏳ Waiting for connection...');
    }

    // Очистка при размонтировании
    return () => {
      if (socket) {
        socket.off('message:new', handleNewMessage);
        socket.off('message:updated', handleMessageUpdate);
        socket.off('message:deleted', handleMessageDelete);
        socket.off('connect');
      }
    };
  }, [companyCode, handleNewMessage, handleMessageUpdate, handleMessageDelete]);
};


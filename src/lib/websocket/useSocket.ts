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
  const roomRef = useRef<string | null>(null);
  
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
    // КРИТИЧЕСКИ ВАЖНО: Сначала инвалидируем ВСЕ запросы сообщений
    // Это заставит React Query перерисовать компоненты
    // Используем refetchType: 'all' чтобы обойти staleTime
    queryClient.invalidateQueries({ 
      queryKey: ['messages'],
      exact: false,
      refetchType: 'all', // Обновляем все запросы, не только активные
    });
    
    // Затем обновляем кэш оптимистично для мгновенного отображения
    const baseQueryKey = queryKeys.messages(companyCode || undefined);
    
    // Обновляем все запросы, которые начинаются с базового ключа
    queryClient.setQueriesData<Message[]>(
      { queryKey: baseQueryKey, exact: false },
      (old) => {
        // Если кэш пустой, создаем новый массив с сообщением
        if (!old || old.length === 0) {
          return [message];
        }
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
          if (!old || old.length === 0) {
            return [message];
          }
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
          if (!old || old.length === 0) {
            return [message];
          }
          const exists = old.some((m) => m.id === message.id);
          if (exists) {
            return old.map((m) => (m.id === message.id ? message : m));
          }
          return [message, ...old];
        }
      );
    }
    
    // ПРИНУДИТЕЛЬНО обновляем активные запросы для гарантированного обновления UI
    // Используем refetchQueries для немедленного обновления, игнорируя staleTime
    queryClient.refetchQueries({ 
      queryKey: ['messages'],
      exact: false,
      type: 'active',
    }, { 
      cancelRefetch: false, // Не отменяем текущие запросы
    });
    
    // Если сообщение для другой компании, также обновляем её запросы
    if (message.companyCode && message.companyCode !== companyCode) {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.messages(message.companyCode),
        exact: false,
        refetchType: 'active',
      });
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
      return;
    }
    
    const joinRoom = (code?: string | null) => {
      if (!socket) return;
      const nextRoom = code || null;
      if (roomRef.current && roomRef.current !== nextRoom) {
        socket.emit('leave', roomRef.current);
      }
      if (nextRoom && roomRef.current !== nextRoom) {
        socket.emit('join', nextRoom);
        roomRef.current = nextRoom;
      }
    };

    // Функция для подписки на события
    const subscribeToEvents = () => {
      if (!socket) return;
      
      // Подписываемся на события
      const onNewMessage = (msg: Message) => {
        handleNewMessage(msg);
      };
      
      socket.on('message:new', onNewMessage);
      socket.on('message:updated', handleMessageUpdate);
      socket.on('message:deleted', handleMessageDelete);
      
      // Входим в комнату компании для получения только своих сообщений
      joinRoom(companyCode);
      
      // Сохраняем обработчик для очистки
      (socket as any)._onNewMessage = onNewMessage;
    };
    
      // Если уже подключен, подписываемся сразу
      if (socket.connected) {
        subscribeToEvents();
      } else {
        // Если не подключен, ждем подключения
        const onConnect = () => {
          subscribeToEvents();
        };
        
        socket.once('connect', onConnect);
      }

    // Очистка при размонтировании
    return () => {
      if (socket) {
        if (roomRef.current) {
          socket.emit('leave', roomRef.current);
          roomRef.current = null;
        }
        const onNewMessage = (socket as any)._onNewMessage;
        if (onNewMessage) {
          socket.off('message:new', onNewMessage);
        } else {
          socket.off('message:new', handleNewMessage);
        }
        socket.off('message:updated', handleMessageUpdate);
        socket.off('message:deleted', handleMessageDelete);
        socket.off('connect');
        socket.off('connect_error');
      }
    };
  }, [companyCode, handleNewMessage, handleMessageUpdate, handleMessageDelete]);
};


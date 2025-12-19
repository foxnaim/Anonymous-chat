/**
 * React хук для работы с WebSocket
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket, disconnectSocket } from './socket';
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

  useEffect(() => {
    // Запрашиваем разрешение на уведомления при монтировании
    requestNotificationPermission().then((granted) => {
      notificationPermissionRef.current = granted;
    });
  }, []);

  useEffect(() => {
    // Переподключаемся при изменении companyCode или при монтировании
    const socket = getSocket(false);
    if (!socket) return;

    // Обработчик нового сообщения
    const handleNewMessage = (message: Message) => {
      // Обновляем кэш React Query для текущего фильтра (companyCode или все для админа)
      const queryKey = [...queryKeys.messages(companyCode || undefined)];
      queryClient.setQueryData<Message[]>(
        queryKey,
        (old = []) => {
          // Проверяем, нет ли уже такого сообщения
          const exists = old.some((m) => m.id === message.id);
          if (exists) {
            return old.map((m) => (m.id === message.id ? message : m));
          }
          // Добавляем новое сообщение в начало списка
          return [message, ...old];
        }
      );
      
      // Также обновляем кэш для всех сообщений (для админов)
      if (!companyCode) {
        queryClient.setQueryData<Message[]>(
          queryKeys.messages(undefined),
          (old = []) => {
            const exists = old.some((m) => m.id === message.id);
            if (exists) {
              return old.map((m) => (m.id === message.id ? message : m));
            }
            return [message, ...old];
          }
        );
      }

      // Инвалидируем другие связанные запросы
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['growth-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['achievements'] });

      // Показываем уведомление браузера, если разрешено и вкладка неактивна
      if (notificationPermissionRef.current && document.hidden) {
        const messageType = message.type === 'complaint' 
          ? t('sendMessage.complaint') 
          : message.type === 'praise'
          ? t('sendMessage.praise')
          : t('sendMessage.suggestion');
        
        showNotification(
          t('notifications.newMessage') || 'Новое сообщение',
          {
            body: `${messageType}: ${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}`,
            tag: `message-${message.id}`,
            requireInteraction: false,
          }
        );
      }

      // Показываем toast уведомление всегда (даже если вкладка активна)
      toast.success(t('notifications.newMessageReceived') || 'Получено новое сообщение', {
        duration: 3000,
      });
    };

    // Обработчик обновления сообщения
    const handleMessageUpdate = (message: Message) => {
      // Обновляем кэш React Query для текущего фильтра
      const queryKey = [...queryKeys.messages(companyCode || undefined)];
      queryClient.setQueryData<Message[]>(
        queryKey,
        (old = []) => {
          return old.map((m) => (m.id === message.id ? message : m));
        }
      );
      
      // Также обновляем кэш для всех сообщений (для админов)
      if (!companyCode) {
        queryClient.setQueryData<Message[]>(
          queryKeys.messages(undefined),
          (old = []) => {
            return old.map((m) => (m.id === message.id ? message : m));
          }
        );
      }

      // Обновляем отдельное сообщение в кэше
      queryClient.setQueryData(queryKeys.message(message.id), message);

      // Инвалидируем связанные запросы
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['message-distribution'] });
      queryClient.invalidateQueries({ queryKey: ['growth-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
    };

    // Обработчик удаления сообщения
    const handleMessageDelete = (data: { id: string; companyCode: string }) => {
      // Удаляем из кэша
      queryClient.setQueryData<Message[]>(
        [...queryKeys.messages(companyCode || undefined)],
        (old = []) => {
          return old.filter((m) => m.id !== data.id);
        }
      );

      // Удаляем отдельное сообщение из кэша
      queryClient.removeQueries({ queryKey: queryKeys.message(data.id) });

      // Инвалидируем связанные запросы
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['message-distribution'] });
      queryClient.invalidateQueries({ queryKey: ['growth-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
    };

    // Подписываемся на события
    socket.on('message:new', handleNewMessage);
    socket.on('message:updated', handleMessageUpdate);
    socket.on('message:deleted', handleMessageDelete);

    // Очистка при размонтировании
    return () => {
      socket?.off('message:new', handleNewMessage);
      socket?.off('message:updated', handleMessageUpdate);
      socket?.off('message:deleted', handleMessageDelete);
    };
  }, [companyCode, queryClient, t]);
};


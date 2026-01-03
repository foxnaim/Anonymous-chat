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
    // Логирование для отладки (только в development)
    if (process.env.NODE_ENV === 'development') {
      console.log('[WebSocket] New message received:', {
        messageId: message.id,
        companyCode: message.companyCode,
        currentCompanyCode: companyCode,
      });
    }
    
    // КРИТИЧЕСКИ ВАЖНО: Обновляем кэш для компании, которой принадлежит сообщение
    // Это гарантирует, что сообщение появится сразу в списке компании
    const messageCompanyCode = message.companyCode?.toUpperCase();
    
    // Функция для обновления кэша сообщений с проверкой на пустой кэш
    const updateMessagesCache = (targetCompanyCode?: string | null): boolean => {
      const targetCode = targetCompanyCode ? targetCompanyCode.toUpperCase() : undefined;
      const baseQueryKey = queryKeys.messages(targetCode);
      
      let wasEmpty = false;
      let wasUpdated = false;
      let newData: Message[] | undefined;
      
      // Обновляем все запросы, которые начинаются с базового ключа (включая варианты с page, limit, messageId)
      queryClient.setQueriesData<Message[]>(
        { queryKey: baseQueryKey, exact: false },
        (old) => {
          // Если кэш пустой, создаем новый массив с сообщением
          if (!old || old.length === 0) {
            wasEmpty = true;
            wasUpdated = true;
            newData = [message];
            return newData;
          }
          // Проверяем, существует ли уже сообщение с таким ID
          const exists = old.some((m) => m.id === message.id);
          if (exists) {
            // Если существует, обновляем его
            wasUpdated = true;
            newData = old.map((m) => (m.id === message.id ? message : m));
            return newData;
          }
          // Если не существует, добавляем в начало списка
          wasUpdated = true;
          newData = [message, ...old];
          return newData;
        }
      );
      
      // КРИТИЧЕСКИ ВАЖНО: Принудительно обновляем все активные запросы
      // Это гарантирует, что React Query перерисует компоненты с новыми данными сразу
      if (wasUpdated && newData) {
        // Находим все активные запросы для этого ключа и обновляем их напрямую
        const queryCache = queryClient.getQueryCache();
        const queries = queryCache.findAll({ queryKey: baseQueryKey, exact: false });
        
        queries.forEach((query) => {
          // Обновляем данные запроса напрямую
          queryClient.setQueryData(query.queryKey, newData);
        });
        
        // Инвалидируем запросы без refetch - это заставит React Query обновить компоненты
        queryClient.invalidateQueries({
          queryKey: baseQueryKey,
          exact: false,
          refetchType: 'none', // Не делаем refetch, просто обновляем компоненты
        });
      }
      
      return wasEmpty;
    };
    
    // 1. ВСЕГДА обновляем кэш для компании, которой принадлежит сообщение
    // Это критически важно для мгновенного отображения
    let needsRefetch = false;
    if (messageCompanyCode) {
      const wasEmpty = updateMessagesCache(messageCompanyCode);
      if (wasEmpty) {
        needsRefetch = true;
      }
    }
    
    // 2. Если текущий companyCode совпадает с companyCode сообщения, также обновляем
    // (это для случая, когда пользователь находится на странице своей компании)
    if (companyCode && companyCode.toUpperCase() === messageCompanyCode) {
      const wasEmpty = updateMessagesCache(companyCode);
      if (wasEmpty) {
        needsRefetch = true;
      }
    }
    
    // 3. Обновляем общий список всех сообщений для админов
    if (!companyCode) {
      const wasEmpty = updateMessagesCache(undefined);
      if (wasEmpty) {
        needsRefetch = true;
      }
    }
    
    // 4. КРИТИЧЕСКИ ВАЖНО: Принудительно обновляем все активные запросы для этой компании
    // Это гарантирует, что компоненты перерисуются с новыми данными сразу
    if (messageCompanyCode) {
      // Инвалидируем запросы без refetch - просто обновляем компоненты
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages(messageCompanyCode),
        exact: false,
        refetchType: 'none', // Не делаем refetch, просто обновляем компоненты с новыми данными из кэша
      });
    }
    
    // 5. ЗАЩИТА: Если кэш был пустой, делаем один точечный refetch для активных запросов
    // Это гарантирует, что мы получим все сообщения, а не только одно
    // Но делаем это только если кэш был действительно пустой (защита от пропущенных сообщений)
    if (needsRefetch && messageCompanyCode) {
      // Делаем refetch только для активных запросов этой компании
      // Это один запрос, не массовый - только для того компонента, который сейчас отображается
      queryClient.refetchQueries({ 
        queryKey: queryKeys.messages(messageCompanyCode),
        exact: false,
        type: 'active', // Только активные запросы (те, что используются в компонентах)
      }, { 
        cancelRefetch: false,
      });
    }
    
    // 5. Дополнительная защита: естественные refetch (mount, focus, reconnect) подхватят пропущенные сообщения
    // Не делаем дополнительных запросов здесь - это защитит от лишней нагрузки
    // Если WebSocket событие не пришло, данные обновятся при следующем:
    // - refetchOnMount (при открытии страницы)
    // - refetchOnWindowFocus (при возврате на вкладку)
    // - refetchOnReconnect (при переподключении)
    
    // Инвалидируем статистику (она может обновиться позже, не критично)
    queryClient.invalidateQueries({ 
      queryKey: ['stats'],
      refetchType: 'active', // Только активные запросы статистики
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
    // Пытаемся получить сокет, если его нет - пытаемся создать
    let socket = getSocket(false);
    
    // Если сокета нет, пытаемся создать его принудительно
    if (!socket) {
      // Проверяем, есть ли токен
      const { getToken } = require('../utils/cookies');
      const token = getToken();
      
      if (!token) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[WebSocket] Socket not available - token is missing');
        }
        return;
      }
      
      // Если токен есть, но сокета нет - создаем его принудительно
      socket = getSocket(true);
      if (!socket) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[WebSocket] Failed to create socket even with token');
        }
        return;
      }
    }
    
    const joinRoom = (code?: string | null) => {
      if (!socket) return;
      
      // Проверяем подключение перед попыткой join
      if (!socket.connected) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[WebSocket] Cannot join room - socket not connected');
        }
        return;
      }
      
      const nextRoom = code ? code.toUpperCase() : null;
      if (roomRef.current && roomRef.current !== nextRoom) {
        // Отправляем полное имя комнаты с префиксом для leave
        socket.emit('leave', `company:${roomRef.current}`);
        if (process.env.NODE_ENV === 'development') {
          console.log('[WebSocket] Left room:', `company:${roomRef.current}`);
        }
      }
      if (nextRoom && roomRef.current !== nextRoom) {
        // Отправляем код компании без префикса, бэкенд сам добавит префикс "company:"
        socket.emit('join', nextRoom);
        roomRef.current = nextRoom;
        if (process.env.NODE_ENV === 'development') {
          console.log('[WebSocket] Joining room with code:', nextRoom);
        }
      }
    };
    
    // Функция для подписки на события
    const subscribeToEvents = () => {
      if (!socket) return;
      
      // Проверяем подключение
      if (!socket.connected) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[WebSocket] Cannot subscribe - socket not connected');
        }
        return;
      }
      
      // Подписываемся на события
      const onNewMessage = (msg: Message) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[WebSocket] message:new event received:', msg.id, 'for company:', msg.companyCode);
        }
        handleNewMessage(msg);
      };
      
      socket.on('message:new', onNewMessage);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[WebSocket] Subscribed to message:new events, companyCode:', companyCode, 'socket connected:', socket.connected);
      }
      socket.on('message:updated', handleMessageUpdate);
      socket.on('message:deleted', handleMessageDelete);
      
      // Подписываемся на подтверждение подключения к комнате
      socket.on('room:joined', (data: { room: string }) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[WebSocket] Successfully joined room:', data.room);
        }
      });
      
      socket.on('room:join:error', (data: { room: string; error: string }) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('[WebSocket] Failed to join room:', data.room, 'error:', data.error);
        }
      });
      
      // Входим в комнату компании для получения только своих сообщений
      joinRoom(companyCode);
      
      // Сохраняем обработчик для очистки
      (socket as any)._onNewMessage = onNewMessage;
    };
    
    // Обработчик подключения
    const onConnect = () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[WebSocket] Connected, subscribing to events for companyCode:', companyCode);
      }
      subscribeToEvents();
    };
    
    // Обработчик ошибки подключения
    const onConnectError = (error: Error) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[WebSocket] Connection error:', error);
      }
    };
    
    // Обработчик отключения
    const onDisconnect = (reason: string) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[WebSocket] Disconnected:', reason);
      }
    };
    
    // Если уже подключен, подписываемся сразу
    if (socket.connected) {
      subscribeToEvents();
    } else {
      // Если не подключен, ждем подключения
      socket.once('connect', onConnect);
    }
    
    // Подписываемся на события подключения/отключения для переподключения
    socket.on('connect', onConnect);
    socket.on('connect_error', onConnectError);
    socket.on('disconnect', onDisconnect);

    // Очистка при размонтировании
    return () => {
      if (socket) {
        if (roomRef.current && socket.connected) {
          socket.emit('leave', `company:${roomRef.current}`);
          if (process.env.NODE_ENV === 'development') {
            console.log('[WebSocket] Left room on cleanup:', `company:${roomRef.current}`);
          }
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
        socket.off('room:joined');
        socket.off('room:join:error');
        socket.off('connect', onConnect);
        socket.off('connect_error', onConnectError);
        socket.off('disconnect', onDisconnect);
      }
    };
  }, [companyCode, handleNewMessage, handleMessageUpdate, handleMessageDelete]);
};



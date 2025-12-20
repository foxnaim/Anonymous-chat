/**
 * WebSocket клиент для real-time обновлений
 * Использует динамический импорт для избежания проблем с SSR
 */

import type { Socket } from 'socket.io-client';
import { getToken } from '../utils/cookies';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

let socket: Socket | null = null;
let socketIOModule: typeof import('socket.io-client') | null = null;
let socketIOLoading = false;

// Загружаем socket.io-client только на клиенте
const loadSocketIO = (): typeof import('socket.io-client') | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  if (socketIOModule) {
    return socketIOModule;
  }
  
  if (socketIOLoading) {
    return null;
  }
  
  try {
    // Используем require для динамической загрузки
    // Next.js webpack настроен исключать это из серверного бандла
    socketIOModule = require('socket.io-client');
    return socketIOModule;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[WebSocket] Failed to load socket.io-client:', error);
    }
    return null;
  }
};

export const getSocket = (forceReconnect = false): Socket | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  // Если нужно принудительно переподключиться (например, после логина)
  if (forceReconnect && socket) {
    disconnectSocket();
  }

  // Если уже подключен и не требуется переподключение, проверяем токен
  if (socket?.connected && !forceReconnect) {
    const currentToken = getToken();
    // Если токен изменился, переподключаемся
    if (!currentToken || (socket.auth as { token?: string })?.token !== currentToken) {
      disconnectSocket();
    } else {
      return socket;
    }
  }

  const token = getToken();

  // Если нет токена, не создаем подключение
  if (!token) {
    return null;
  }

  // Загружаем socket.io-client только на клиенте
  const socketIO = loadSocketIO();
  if (!socketIO) {
    return null;
  }

  const { io } = socketIO;

  // Создаем новый сокет только если его еще нет
  if (!socket) {
    socket = io(API_URL, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      autoConnect: true,
    });

    // Добавляем обработчики событий только один раз
    socket.on('connect', () => {
      // WebSocket connected
      if (process.env.NODE_ENV === 'development') {
        console.log('[WebSocket] Connected successfully');
      }
    });

    socket.on('disconnect', (reason) => {
      // WebSocket disconnected
      if (process.env.NODE_ENV === 'development') {
        console.log('[WebSocket] Disconnected:', reason);
      }
    });

    socket.on('connect_error', (error) => {
      // WebSocket connection error
      if (process.env.NODE_ENV === 'development') {
        console.error('[WebSocket] Connection error:', error);
      }
    });
  } else {
    // Если сокет уже существует, обновляем токен аутентификации
    socket.auth = { token: token };
    // Если сокет не подключен, подключаемся
    if (!socket.connected) {
      socket.connect();
    }
  }

  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    // Удаляем все обработчики событий перед отключением
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
};

export const reconnectSocket = (): void => {
  disconnectSocket();
  // Небольшая задержка перед переподключением, чтобы токен успел сохраниться
  setTimeout(() => {
    getSocket(true);
  }, 100);
};


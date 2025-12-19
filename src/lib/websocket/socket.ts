/**
 * WebSocket клиент для real-time обновлений
 */

import { io, Socket } from 'socket.io-client';
import { getToken } from '../utils/cookies';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

let socket: Socket | null = null;

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

  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
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


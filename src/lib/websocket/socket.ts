/**
 * WebSocket клиент для real-time обновлений
 */

import { io, Socket } from 'socket.io-client';
import { getToken } from '../utils/cookies';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export const getSocket = (): Socket | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  if (socket?.connected) {
    return socket;
  }

  const token = getToken();

  socket = io(API_URL, {
    auth: {
      token: token || undefined,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('WebSocket connected');
  });

  socket.on('disconnect', (reason) => {
    console.log('WebSocket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error);
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
  getSocket();
};


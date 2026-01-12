/**
 * Утилиты для отладки WebSocket подключения
 * Используйте в консоли браузера: window.checkWebSocket()
 * 
 * Этот файл инициализируется только на клиенте
 */

declare global {
  interface Window {
    checkWebSocket?: () => void;
    getWebSocketStatus?: () => {
      connected: boolean;
      id: string | null;
      url: string;
    };
  }
}

// Инициализация только на клиенте
if (typeof window !== 'undefined') {
  // Динамический импорт, чтобы избежать проблем с SSR
  const initDebug = async () => {
    const { getSocket } = await import('./socket');
    
    window.checkWebSocket = () => {
      const socket = getSocket();
      if (!socket) {
        console.error('❌ WebSocket: Not initialized (no token)');
        return;
      }
      
      // WebSocket status check - logging removed
    };
    
    window.getWebSocketStatus = () => {
      const socket = getSocket();
      return {
        connected: socket?.connected || false,
        id: socket?.id || null,
        url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      };
    };
    
    // Debug tools available but logging removed
  };
  
  // Инициализируем асинхронно
  initDebug().catch(() => {
    // Игнорируем ошибки при инициализации
  });
}

// Экспорт для того, чтобы файл считался модулем TypeScript
export {};


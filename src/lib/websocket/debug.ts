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
        console.log('❌ WebSocket: Not initialized (no token)');
        return;
      }
      
      console.log('📡 WebSocket Status:');
      console.log('  Connected:', socket.connected);
      console.log('  ID:', socket.id || 'Not connected');
      console.log('  URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');
      console.log('  Auth:', socket.auth);
      
      if (socket.connected) {
        console.log('✅ WebSocket is connected and ready');
      } else {
        console.log('⚠️ WebSocket is not connected');
      }
    };
    
    window.getWebSocketStatus = () => {
      const socket = getSocket();
      return {
        connected: socket?.connected || false,
        id: socket?.id || null,
        url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      };
    };
    
    // Показываем подсказку только в development
    if (process.env.NODE_ENV === 'development') {
      // Используем setTimeout, чтобы не блокировать рендеринг
      setTimeout(() => {
        console.log('💡 WebSocket debug tools available:');
        console.log('  - window.checkWebSocket() - Check connection status');
        console.log('  - window.getWebSocketStatus() - Get status object');
      }, 1000);
    }
  };
  
  // Инициализируем асинхронно
  initDebug().catch(() => {
    // Игнорируем ошибки при инициализации
  });
}

// Экспорт для того, чтобы файл считался модулем TypeScript
export {};


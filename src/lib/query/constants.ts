/**
 * Константы для React Query
 */

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  TIMEOUT: 2000, // Уменьшено с 10000 до 2000ms для быстрой работы моковых данных
  RETRY_ATTEMPTS: 3,
} as const;

// Оптимизированные задержки для разных типов запросов
export const DELAYS = {
  // Для моков держим почти ноль, чтобы админка отвечала мгновенно
  FAST: 0,
  NORMAL: 0,
  SLOW: 50,
  STATS: 0,
} as const;


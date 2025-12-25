/**
 * Константы для React Query
 */

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  TIMEOUT: 30000, // 30 секунд для операций, которые могут занимать время (отправка email и т.д.)
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


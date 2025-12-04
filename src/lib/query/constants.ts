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
  FAST: 50,       // Быстрые запросы (getById, простые фильтры) - уменьшено с 100ms
  NORMAL: 150,    // Обычные запросы (getAll, списки) - уменьшено с 300ms
  SLOW: 300,      // Медленные запросы (создание, обновление) - уменьшено с 500ms
  STATS: 50,      // Статистика (очень быстрая, т.к. это вычисления) - уменьшено с 200ms
} as const;


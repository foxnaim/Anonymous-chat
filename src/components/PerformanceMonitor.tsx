'use client';

import { useEffect } from 'react';
import { PerformanceMonitor } from '@/lib/performance/monitor';

export function PerformanceMonitorComponent() {
  useEffect(() => {
    // Логируем метрики в development
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        PerformanceMonitor.logMetrics();
      }, 3000);
    }

    // Отслеживаем Web Vitals
    if (typeof window !== 'undefined') {
      // Можно интегрировать с аналитикой (Google Analytics, etc.)
      // const vitals = PerformanceMonitor.getWebVitals();
      // Performance warnings removed
    }
  }, []);

  return null;
}








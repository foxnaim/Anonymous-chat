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
      const vitals = PerformanceMonitor.getWebVitals();
      if (vitals.lcp && vitals.lcp > 2500) {
        console.warn('⚠️ LCP превышает рекомендуемое значение (2.5s)');
      }
      if (vitals.fid && vitals.fid > 100) {
        console.warn('⚠️ FID превышает рекомендуемое значение (100ms)');
      }
      if (vitals.cls && vitals.cls > 0.1) {
        console.warn('⚠️ CLS превышает рекомендуемое значение (0.1)');
      }
    }
  }, []);

  return null;
}







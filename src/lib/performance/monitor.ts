/**
 * Performance monitoring utilities
 */

export class PerformanceMonitor {
  private static marks: Map<string, number> = new Map();

  /**
   * Начать измерение производительности
   */
  static startMark(name: string): void {
    if (typeof window !== 'undefined' && window.performance) {
      this.marks.set(name, performance.now());
      performance.mark(`${name}-start`);
    }
  }

  /**
   * Завершить измерение и получить результат
   */
  static endMark(name: string): number | null {
    if (typeof window !== 'undefined' && window.performance) {
      const startTime = this.marks.get(name);
      if (startTime) {
        const duration = performance.now() - startTime;
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
        this.marks.delete(name);
        return duration;
      }
    }
    return null;
  }

  /**
   * Измерить время выполнения функции
   */
  static async measureAsync<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    this.startMark(name);
    const result = await fn();
    const duration = this.endMark(name) || 0;
    return { result, duration };
  }

  /**
   * Измерить время выполнения синхронной функции
   */
  static measureSync<T>(
    name: string,
    fn: () => T
  ): { result: T; duration: number } {
    this.startMark(name);
    const result = fn();
    const duration = this.endMark(name) || 0;
    return { result, duration };
  }

  /**
   * Получить метрики Web Vitals
   */
  static getWebVitals(): {
    fcp?: number;
    lcp?: number;
    fid?: number;
    cls?: number;
    ttfb?: number;
  } {
    if (typeof window === 'undefined') return {};

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigation) return {};

    return {
      ttfb: navigation.responseStart - navigation.requestStart,
      fcp: this.getMetric('first-contentful-paint'),
      lcp: this.getMetric('largest-contentful-paint'),
      fid: this.getMetric('first-input-delay'),
      cls: this.getMetric('cumulative-layout-shift'),
    };
  }

  private static getMetric(name: string): number | undefined {
    try {
      const entries = performance.getEntriesByName(name);
      if (entries.length > 0) {
        return (entries[0] as PerformanceEntry).duration;
      }
    } catch {
      // Metric not available
    }
    return undefined;
  }

  /**
   * Логировать метрики производительности
   */
  static logMetrics(): void {
    // Metrics logging removed
  }
}








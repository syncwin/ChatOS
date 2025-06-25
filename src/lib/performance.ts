/**
 * Performance monitoring and optimization utilities
 * Provides metrics collection, memory management, and performance insights
 */

import { logger } from './logger';
import { DEV_CONFIG } from './config';

// Performance metrics interface
interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'render' | 'api' | 'memory' | 'user_interaction' | 'cache';
  metadata?: Record<string, unknown>;
}

// Extended PerformanceEntry for LCP
interface LargestContentfulPaintEntry extends PerformanceEntry {
  element?: Element;
  size?: number;
}

// Extended Performance interface for memory
interface PerformanceWithMemory extends Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

// Extended Window interface for gc
interface WindowWithGC extends Window {
  gc?: () => void;
}

// Memory usage interface
interface MemoryUsage {
  used: number;
  total: number;
  percentage: number;
  timestamp: number;
}

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  SLOW_RENDER: 16, // 16ms (60fps)
  SLOW_API: 2000, // 2 seconds
  HIGH_MEMORY: 0.8, // 80% of available memory
  CACHE_HIT_RATE: 0.7, // 70% cache hit rate
} as const;

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000;
  private observers: PerformanceObserver[] = [];
  private memoryCheckInterval?: NodeJS.Timeout;
  private isEnabled = DEV_CONFIG.ENABLE_PERFORMANCE_MONITORING;

  constructor() {
    if (this.isEnabled && typeof window !== 'undefined') {
      this.initializeObservers();
      this.startMemoryMonitoring();
    }
  }

  private initializeObservers() {
    try {
      // Observe navigation timing
      if ('PerformanceObserver' in window) {
        const navigationObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              this.recordMetric('page_load', navEntry.loadEventEnd - navEntry.startTime, 'render', {
                domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.startTime,
                firstPaint: navEntry.loadEventStart - navEntry.startTime,
              });
            }
          }
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navigationObserver);

        // Observe paint timing
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric(entry.name, entry.startTime, 'render');
          }
        });
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(paintObserver);

        // Observe largest contentful paint
        const lcpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const lcpEntry = entry as LargestContentfulPaintEntry;
            this.recordMetric('largest_contentful_paint', entry.startTime, 'render', {
              element: lcpEntry.element?.tagName,
              size: lcpEntry.size,
            });
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      }
    } catch (error) {
      logger.warn('Failed to initialize performance observers', { error });
    }
  }

  private startMemoryMonitoring() {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      this.memoryCheckInterval = setInterval(() => {
        const memory = (performance as PerformanceWithMemory).memory;
        if (memory) {
          const usage: MemoryUsage = {
            used: memory.usedJSHeapSize,
            total: memory.totalJSHeapSize,
            percentage: memory.usedJSHeapSize / memory.totalJSHeapSize,
            timestamp: Date.now(),
          };

          this.recordMetric('memory_usage', usage.percentage, 'memory', usage);

          // Warn if memory usage is high
          if (usage.percentage > PERFORMANCE_THRESHOLDS.HIGH_MEMORY) {
            logger.warn('High memory usage detected', usage);
          }
        }
      }, 10000); // Check every 10 seconds
    }
  }

  // Record a performance metric
  recordMetric(
    name: string,
    value: number,
    category: PerformanceMetric['category'],
    metadata?: Record<string, unknown>
  ) {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      category,
      metadata,
    };

    this.metrics.push(metric);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log slow operations
    this.checkThresholds(metric);
  }

  private checkThresholds(metric: PerformanceMetric) {
    switch (metric.category) {
      case 'render':
        if (metric.value > PERFORMANCE_THRESHOLDS.SLOW_RENDER) {
          logger.warn(`Slow render detected: ${metric.name}`, {
            duration: metric.value,
            threshold: PERFORMANCE_THRESHOLDS.SLOW_RENDER,
          });
        }
        break;
      case 'api':
        if (metric.value > PERFORMANCE_THRESHOLDS.SLOW_API) {
          logger.warn(`Slow API call detected: ${metric.name}`, {
            duration: metric.value,
            threshold: PERFORMANCE_THRESHOLDS.SLOW_API,
          });
        }
        break;
    }
  }

  // Measure function execution time
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    category: PerformanceMetric['category'] = 'user_interaction',
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.recordMetric(name, duration, category, { ...metadata, success: true });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(name, duration, category, { ...metadata, success: false, error: String(error) });
      throw error;
    }
  }

  // Measure synchronous function execution time
  measure<T>(
    name: string,
    fn: () => T,
    category: PerformanceMetric['category'] = 'user_interaction',
    metadata?: Record<string, unknown>
  ): T {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      this.recordMetric(name, duration, category, { ...metadata, success: true });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(name, duration, category, { ...metadata, success: false, error: String(error) });
      throw error;
    }
  }

  // Get performance summary
  getSummary(category?: PerformanceMetric['category'], timeRange?: number) {
    const now = Date.now();
    const cutoff = timeRange ? now - timeRange : 0;
    
    const relevantMetrics = this.metrics.filter(metric => {
      if (category && metric.category !== category) return false;
      if (metric.timestamp < cutoff) return false;
      return true;
    });

    if (relevantMetrics.length === 0) {
      return { count: 0, average: 0, min: 0, max: 0, p95: 0 };
    }

    const values = relevantMetrics.map(m => m.value).sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const p95Index = Math.floor(values.length * 0.95);

    return {
      count: values.length,
      average: sum / values.length,
      min: values[0],
      max: values[values.length - 1],
      p95: values[p95Index] || 0,
    };
  }

  // Get all metrics
  getMetrics(category?: PerformanceMetric['category']): PerformanceMetric[] {
    if (category) {
      return this.metrics.filter(m => m.category === category);
    }
    return [...this.metrics];
  }

  // Clear metrics
  clearMetrics() {
    this.metrics = [];
  }

  // Export metrics for analysis
  exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics,
      summary: {
        render: this.getSummary('render'),
        api: this.getSummary('api'),
        memory: this.getSummary('memory'),
        userInteraction: this.getSummary('user_interaction'),
        cache: this.getSummary('cache'),
      },
      timestamp: Date.now(),
    }, null, 2);
  }

  // Cleanup resources
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = undefined;
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for component performance monitoring
export const usePerformanceMonitor = () => {
  const measureRender = (componentName: string, metadata?: Record<string, unknown>) => {
    return performanceMonitor.measure(
      `render_${componentName}`,
      () => {},
      'render',
      metadata
    );
  };

  const measureAsyncAction = async <T>(
    actionName: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> => {
    return performanceMonitor.measureAsync(
      actionName,
      fn,
      'user_interaction',
      metadata
    );
  };

  return {
    measureRender,
    measureAsyncAction,
    getSummary: performanceMonitor.getSummary.bind(performanceMonitor),
    getMetrics: performanceMonitor.getMetrics.bind(performanceMonitor),
  };
};

// Memory management utilities
export const memoryUtils = {
  // Force garbage collection (if available)
  forceGC: () => {
    if (typeof window !== 'undefined' && 'gc' in window) {
      (window as WindowWithGC).gc?.();
      logger.performance('Manual garbage collection triggered', 0);
    }
  },

  // Get current memory usage
  getMemoryUsage: (): MemoryUsage | null => {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as PerformanceWithMemory).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: memory.usedJSHeapSize / memory.totalJSHeapSize,
        timestamp: Date.now(),
      };
    }
    return null;
  },

  // Check if memory usage is high
  isMemoryHigh: (): boolean => {
    const usage = memoryUtils.getMemoryUsage();
    return usage ? usage.percentage > PERFORMANCE_THRESHOLDS.HIGH_MEMORY : false;
  },
};
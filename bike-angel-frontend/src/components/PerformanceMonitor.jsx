import { useEffect, useState } from 'react';

/**
 * Performance monitoring component for development
 * Tracks page load time, API response times, and resource usage
 */
function PerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    pageLoadTime: 0,
    domContentLoaded: 0,
    firstPaint: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    if (import.meta.env.MODE !== 'development') {
      return;
    }

    // Collect performance metrics
    const collectMetrics = () => {
      if (window.performance) {
        const perfData = window.performance.timing;
        const navigation = window.performance.getEntriesByType('navigation')[0];
        
        setMetrics({
          pageLoadTime: perfData.loadEventEnd - perfData.navigationStart,
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.navigationStart,
          firstPaint: navigation?.responseStart - navigation?.requestStart || 0,
          firstContentfulPaint: 0,
          largestContentfulPaint: 0,
        });

        // Get paint metrics
        const paintEntries = window.performance.getEntriesByType('paint');
        paintEntries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            setMetrics((prev) => ({
              ...prev,
              firstContentfulPaint: entry.startTime,
            }));
          }
        });

        // Get LCP
        if ('PerformanceObserver' in window) {
          try {
            const lcpObserver = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              const lastEntry = entries[entries.length - 1];
              setMetrics((prev) => ({
                ...prev,
                largestContentfulPaint: lastEntry.startTime,
              }));
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
          } catch (e) {
            console.log('LCP observer not supported');
          }
        }
      }
    };

    // Wait for page to fully load
    if (document.readyState === 'complete') {
      collectMetrics();
    } else {
      window.addEventListener('load', collectMetrics);
      return () => window.removeEventListener('load', collectMetrics);
    }
  }, []);

  // Don't render in production
  if (import.meta.env.MODE !== 'development') {
    return null;
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-20 left-4 bg-purple-600 text-white p-2 rounded-full shadow-lg hover:bg-purple-700 transition-colors z-50 text-xs"
        aria-label="Show performance metrics"
      >
        📊
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 left-4 bg-white rounded-lg shadow-xl p-4 w-80 z-50 text-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-purple-600">Performance Metrics</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Close performance metrics"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2">
        <MetricRow
          label="Page Load"
          value={metrics.pageLoadTime}
          threshold={3000}
        />
        <MetricRow
          label="DOM Content Loaded"
          value={metrics.domContentLoaded}
          threshold={2000}
        />
        <MetricRow
          label="First Contentful Paint"
          value={metrics.firstContentfulPaint}
          threshold={1800}
        />
        <MetricRow
          label="Largest Contentful Paint"
          value={metrics.largestContentfulPaint}
          threshold={2500}
        />
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
        <p>🟢 Good | 🟡 Needs Improvement | 🔴 Poor</p>
      </div>
    </div>
  );
}

function MetricRow({ label, value, threshold }) {
  const formatTime = (ms) => {
    if (ms === 0) return 'N/A';
    return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`;
  };

  const getStatus = () => {
    if (value === 0) return '⚪';
    if (value < threshold * 0.7) return '🟢';
    if (value < threshold) return '🟡';
    return '🔴';
  };

  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-700">{label}</span>
      <span className="font-mono">
        {getStatus()} {formatTime(value)}
      </span>
    </div>
  );
}

export default PerformanceMonitor;

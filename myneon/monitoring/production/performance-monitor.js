// Enterprise Performance Monitoring
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            loadTime: 0,
            firstPaint: 0,
            firstContentfulPaint: 0,
            largestContentfulPaint: 0,
            cumulativeLayoutShift: 0,
            firstInputDelay: 0
        };
        
        this.thresholds = {
            loadTime: 3000, // 3 seconds
            firstPaint: 1000, // 1 second
            firstContentfulPaint: 1500, // 1.5 seconds
            largestContentfulPaint: 2500, // 2.5 seconds
            cumulativeLayoutShift: 0.1, // 0.1 max
            firstInputDelay: 100 // 100ms
        };
        
        this.init();
    }
    
    init() {
        // Core Web Vitals monitoring
        this.setupPerformanceObservers();
        
        // Custom metrics
        this.measureLoadTime();
        this.monitorNetworkRequests();
        this.trackMemoryUsage();
    }
    
    setupPerformanceObservers() {
        // Largest Contentful Paint
        if ('PerformanceObserver' in window) {
            try {
                // LCP
                const lcpObserver = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    this.metrics.largestContentfulPaint = lastEntry.startTime;
                    this.checkThreshold('largestContentfulPaint', lastEntry.startTime);
                });
                lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
                
                // CLS
                let clsValue = 0;
                let clsEntries = [];
                
                const clsObserver = new PerformanceObserver((entryList) => {
                    for (const entry of entryList.getEntries()) {
                        if (!entry.hadRecentInput) {
                            clsEntries.push(entry);
                            clsValue += entry.value;
                            this.metrics.cumulativeLayoutShift = clsValue;
                            this.checkThreshold('cumulativeLayoutShift', clsValue);
                        }
                    }
                });
                clsObserver.observe({ type: 'layout-shift', buffered: true });
                
                // FID
                const fidObserver = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    entries.forEach(entry => {
                        this.metrics.firstInputDelay = entry.processingStart - entry.startTime;
                        this.checkThreshold('firstInputDelay', this.metrics.firstInputDelay);
                    });
                });
                fidObserver.observe({ type: 'first-input', buffered: true });
                
            } catch (e) {
                console.warn('Performance monitoring limited:', e);
            }
        }
    }
    
    measureLoadTime() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const timing = performance.timing;
                this.metrics.loadTime = timing.loadEventEnd - timing.navigationStart;
                this.metrics.firstPaint = timing.responseEnd - timing.navigationStart;
                
                this.checkThreshold('loadTime', this.metrics.loadTime);
                this.checkThreshold('firstPaint', this.metrics.firstPaint);
                
                this.sendPerformanceMetrics();
            }, 0);
        });
    }
    
    monitorNetworkRequests() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
                        this.trackRequestPerformance(entry);
                    }
                });
            });
            observer.observe({ entryTypes: ['resource'] });
        }
    }
    
    trackRequestPerformance(entry) {
        const request = {
            name: entry.name,
            duration: entry.duration,
            size: entry.transferSize || 0,
            type: entry.initiatorType,
            startTime: entry.startTime
        };
        
        // Alert on slow requests
        if (entry.duration > 1000) { // 1 second
            console.warn(`Slow request detected: ${entry.name} (${entry.duration}ms)`);
        }
    }
    
    trackMemoryUsage() {
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                if (memory.usedJSHeapSize > 500000000) { // 500MB
                    console.warn('High memory usage:', memory.usedJSHeapSize);
                }
            }, 30000); // Check every 30 seconds
        }
    }
    
    checkThreshold(metric, value) {
        const threshold = this.thresholds[metric];
        if (value > threshold) {
            console.warn(`âš ï¸ ${metric} threshold exceeded: ${value}ms (threshold: ${threshold}ms)`);
            
            // Send alert for critical metrics
            if (metric === 'loadTime' || metric === 'largestContentfulPaint') {
                this.sendPerformanceAlert(metric, value, threshold);
            }
        }
    }
    
    sendPerformanceMetrics() {
        const metrics = {
            ...this.metrics,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            } : null
        };
        
        // Send to analytics
        if (window.location.hostname !== 'localhost') {
            fetch('https://orion-d5rc.onrender.com/api/performance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(metrics)
            }).catch(() => {
                // Silently fail if analytics is down
            });
        }
    }
    
    sendPerformanceAlert(metric, value, threshold) {
        const alert = {
            type: 'PERFORMANCE_ALERT',
            metric,
            value,
            threshold,
            url: window.location.href,
            timestamp: new Date().toISOString()
        };
        
        console.warn('Performance alert:', alert);
        
        // In production, send to alerting system
        if (window.performanceAlertWebhook) {
            fetch(window.performanceAlertWebhook, {
                method: 'POST',
                body: JSON.stringify(alert)
            });
        }
    }
    
    getMetrics() {
        return { ...this.metrics };
    }
    
    getPerformanceScore() {
        let score = 100;
        
        // Deduct points for each exceeded threshold
        Object.keys(this.thresholds).forEach(metric => {
            if (this.metrics[metric] > this.thresholds[metric]) {
                score -= 10;
            }
        });
        
        return Math.max(0, score);
    }
}

// Initialize performance monitor
window.performanceMonitor = new PerformanceMonitor();

// Performance dashboard
window.showPerformanceDashboard = function() {
    const metrics = window.performanceMonitor.getMetrics();
    const score = window.performanceMonitor.getPerformanceScore();
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #1a1f2e;
        border: 1px solid #2a2f3e;
        border-radius: 8px;
        padding: 20px;
        color: white;
        z-index: 10000;
        min-width: 400px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    `;
    
    let html = `
        <h3 style="margin-top: 0; color: #0066ff;">í³Š Performance Dashboard</h3>
        <div style="margin-bottom: 20px; padding: 10px; background: ${score > 80 ? '#00cc6633' : score > 60 ? '#ff990033' : '#ff333333'}; border-radius: 6px;">
            <strong>Performance Score:</strong> ${score}/100
        </div>
        <table style="width: 100%; border-collapse: collapse;">
    `;
    
    Object.keys(metrics).forEach(key => {
        const value = metrics[key];
        const threshold = window.performanceMonitor.thresholds[key];
        const isGood = value <= threshold;
        
        html += `
            <tr style="border-bottom: 1px solid #2a2f3e;">
                <td style="padding: 8px 0;">${key}</td>
                <td style="padding: 8px 0; text-align: right;">
                    <span style="color: ${isGood ? '#00cc66' : '#ff3333'}">
                        ${typeof value === 'number' ? value.toFixed(2) : value}
                        ${typeof value === 'number' && key.includes('Time') ? 'ms' : ''}
                    </span>
                </td>
            </tr>
        `;
    });
    
    html += `
        </table>
        <div style="margin-top: 20px; text-align: right;">
            <button onclick="this.parentElement.parentElement.remove()" style="padding: 8px 16px; background: #2a2f3e; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Close
            </button>
        </div>
    `;
    
    modal.innerHTML = html;
    document.body.appendChild(modal);
};

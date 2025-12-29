// Enterprise Analytics & Telemetry
class DashboardAnalytics {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.userId = this.getUserId();
        this.startTime = Date.now();
        this.events = [];
        this.pageViews = 0;
        
        this.trackingEnabled = window.location.hostname !== 'localhost';
        
        this.init();
    }
    
    init() {
        // Track initial page view
        this.trackPageView();
        
        // Track user interactions
        this.setupInteractionTracking();
        
        // Track dashboard usage patterns
        this.setupUsageTracking();
        
        // Periodic heartbeat
        this.startHeartbeat();
    }
    
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    getUserId() {
        // Generate anonymous user ID
        let userId = localStorage.getItem('dashboard_user_id');
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('dashboard_user_id', userId);
        }
        return userId;
    }
    
    trackPageView() {
        this.pageViews++;
        
        const pageView = {
            type: 'PAGE_VIEW',
            sessionId: this.sessionId,
            userId: this.userId,
            url: window.location.href,
            referrer: document.referrer,
            timestamp: new Date().toISOString(),
            pageViews: this.pageViews
        };
        
        this.events.push(pageView);
        this.sendEvent(pageView);
    }
    
    trackEvent(eventName, properties = {}) {
        const event = {
            type: 'CUSTOM_EVENT',
            name: eventName,
            sessionId: this.sessionId,
            userId: this.userId,
            properties,
            timestamp: new Date().toISOString()
        };
        
        this.events.push(event);
        this.sendEvent(event);
    }
    
    trackMetricInteraction(metricName, action, value) {
        this.trackEvent('METRIC_INTERACTION', {
            metric: metricName,
            action,
            value
        });
    }
    
    trackTradingAction(action, details) {
        this.trackEvent('TRADING_ACTION', {
            action,
            ...details,
            riskLevel: details.riskLevel || 'medium',
            timestamp: new Date().toISOString()
        });
    }
    
    setupInteractionTracking() {
        // Track button clicks
        document.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (button) {
                this.trackEvent('BUTTON_CLICK', {
                    buttonText: button.textContent.trim(),
                    id: button.id || button.className
                });
            }
        });
        
        // Track metric views (when they become visible)
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const metric = entry.target.getAttribute('data-metric');
                    if (metric) {
                        this.trackEvent('METRIC_VIEW', { metric });
                    }
                }
            });
        }, { threshold: 0.5 });
        
        // Observe all metric elements
        document.querySelectorAll('[data-metric]').forEach(el => {
            observer.observe(el);
        });
        
        // Track AJAX/fetch requests
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            const startTime = Date.now();
            return originalFetch.apply(this, args).then(response => {
                const duration = Date.now() - startTime;
                if (window.dashboardAnalytics) {
                    window.dashboardAnalytics.trackEvent('API_REQUEST', {
                        url: args[0],
                        method: args[1]?.method || 'GET',
                        status: response.status,
                        duration
                    });
                }
                return response;
            });
        };
    }
    
    setupUsageTracking() {
        // Track active time
        let lastActive = Date.now();
        let activeTime = 0;
        
        const activityEvents = ['mousemove', 'keydown', 'click', 'scroll'];
        activityEvents.forEach(event => {
            document.addEventListener(event, () => {
                const now = Date.now();
                activeTime += now - lastActive;
                lastActive = now;
            }, { passive: true });
        });
        
        // Send usage data every minute
        setInterval(() => {
            this.trackEvent('USAGE_SNAPSHOT', {
                activeTime,
                sessionDuration: Date.now() - this.startTime,
                eventsCount: this.events.length
            });
        }, 60000);
    }
    
    startHeartbeat() {
        // Send heartbeat every 30 seconds
        setInterval(() => {
            this.sendEvent({
                type: 'HEARTBEAT',
                sessionId: this.sessionId,
                userId: this.userId,
                timestamp: new Date().toISOString(),
                memory: performance.memory ? {
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize
                } : null
            });
        }, 30000);
    }
    
    sendEvent(event) {
        if (!this.trackingEnabled) {
            return;
        }
        
        // Add batch ID for grouping
        event.batchId = this.sessionId;
        
        // Send to analytics endpoint
        fetch('https://orion-d5rc.onrender.com/api/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event),
            keepalive: true // Ensure delivery even if page closes
        }).catch(error => {
            console.warn('Analytics delivery failed:', error);
            // Queue for retry
            this.queueForRetry(event);
        });
    }
    
    queueForRetry(event) {
        const queue = JSON.parse(localStorage.getItem('analytics_queue') || '[]');
        queue.push(event);
        localStorage.setItem('analytics_queue', JSON.stringify(queue.slice(-100))); // Keep last 100
    }
    
    retryQueue() {
        const queue = JSON.parse(localStorage.getItem('analytics_queue') || '[]');
        if (queue.length > 0) {
            queue.forEach(event => this.sendEvent(event));
            localStorage.removeItem('analytics_queue');
        }
    }
    
    getSessionReport() {
        return {
            sessionId: this.sessionId,
            userId: this.userId,
            startTime: new Date(this.startTime).toISOString(),
            duration: Date.now() - this.startTime,
            pageViews: this.pageViews,
            events: this.events.length,
            eventsByType: this.groupEventsByType()
        };
    }
    
    groupEventsByType() {
        const groups = {};
        this.events.forEach(event => {
            groups[event.type] = (groups[event.type] || 0) + 1;
        });
        return groups;
    }
}

// Initialize analytics
window.dashboardAnalytics = new DashboardAnalytics();

// Analytics dashboard
window.showAnalyticsDashboard = function() {
    const report = window.dashboardAnalytics.getSessionReport();
    
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
        min-width: 500px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    `;
    
    let html = `
        <h3 style="margin-top: 0; color: #0066ff;">í³ˆ Analytics Dashboard</h3>
        <div style="margin-bottom: 20px; font-size: 0.9em; color: #94a3b8;">
            Session: ${report.sessionId}
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
            <div style="background: #0a0f1c; padding: 15px; border-radius: 6px;">
                <div style="font-size: 0.9em; color: #94a3b8;">Session Duration</div>
                <div style="font-size: 1.5em; font-weight: bold;">${Math.round(report.duration / 60000)}min</div>
            </div>
            <div style="background: #0a0f1c; padding: 15px; border-radius: 6px;">
                <div style="font-size: 0.9em; color: #94a3b8;">Page Views</div>
                <div style="font-size: 1.5em; font-weight: bold;">${report.pageViews}</div>
            </div>
            <div style="background: #0a0f1c; padding: 15px; border-radius: 6px;">
                <div style="font-size: 0.9em; color: #94a3b8;">Events Tracked</div>
                <div style="font-size: 1.5em; font-weight: bold;">${report.events}</div>
            </div>
            <div style="background: #0a0f1c; padding: 15px; border-radius: 6px;">
                <div style="font-size: 0.9em; color: #94a3b8;">User ID</div>
                <div style="font-size: 0.9em; font-family: monospace;">${report.userId}</div>
            </div>
        </div>
        
        <h4 style="margin-top: 20px; margin-bottom: 10px;">Event Types</h4>
        <div style="background: #0a0f1c; border-radius: 6px; padding: 15px;">
    `;
    
    Object.entries(report.eventsByType).forEach(([type, count]) => {
        html += `
            <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #2a2f3e;">
                <span>${type}</span>
                <span style="color: #00cc66;">${count}</span>
            </div>
        `;
    });
    
    html += `
        </div>
        <div style="margin-top: 20px; text-align: right;">
            <button onclick="window.dashboardAnalytics.retryQueue()" style="padding: 8px 16px; background: #2a2f3e; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">
                Retry Queue
            </button>
            <button onclick="this.parentElement.parentElement.remove()" style="padding: 8px 16px; background: #2a2f3e; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Close
            </button>
        </div>
    `;
    
    modal.innerHTML = html;
    document.body.appendChild(modal);
};

// Enterprise Error Handling System
class DashboardErrorHandler {
    constructor() {
        this.errorCount = 0;
        this.maxErrors = 10;
        this.errorListeners = [];
        
        // Global error handler
        window.addEventListener('error', this.handleGlobalError.bind(this));
        window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
    }
    
    handleGlobalError(event) {
        const error = {
            type: 'GLOBAL_ERROR',
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        };
        
        this.logError(error);
        this.showFallbackUI();
        return false; // Prevent default error display
    }
    
    handlePromiseRejection(event) {
        const error = {
            type: 'PROMISE_REJECTION',
            reason: event.reason?.message || event.reason,
            timestamp: new Date().toISOString()
        };
        
        this.logError(error);
    }
    
    logError(error) {
        this.errorCount++;
        
        // Console logging
        console.error('Ì∫® Dashboard Error:', error);
        
        // Send to error tracking service (in production)
        if (window.location.hostname !== 'localhost') {
            this.sendToErrorTracking(error);
        }
        
        // Check if we need to trigger emergency mode
        if (this.errorCount > this.maxErrors) {
            this.triggerEmergencyMode();
        }
    }
    
    showFallbackUI() {
        // Create emergency fallback UI
        const fallback = document.createElement('div');
        fallback.id = 'dashboard-emergency-fallback';
        fallback.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: #0a0f1c;
            color: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            padding: 20px;
            text-align: center;
        `;
        
        fallback.innerHTML = `
            <h1 style="color: #ff6b6b; margin-bottom: 20px;">‚ö†Ô∏è Dashboard Recovery Mode</h1>
            <p style="margin-bottom: 30px; max-width: 600px;">
                The dashboard encountered an error and has entered recovery mode.
                Basic functionality is still available.
            </p>
            <div style="display: grid; gap: 15px; max-width: 400px; width: 100%;">
                <button onclick="location.reload()" style="padding: 12px; background: #0066ff; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    ‚Üª Reload Dashboard
                </button>
                <button onclick="showBasicMetrics()" style="padding: 12px; background: #1a1f2e; color: white; border: 1px solid #2a2f3e; border-radius: 6px; cursor: pointer;">
                    Ì≥ä Show Basic Metrics
                </button>
                <button onclick="exportErrorReport()" style="padding: 12px; background: transparent; color: #94a3b8; border: 1px solid #2a2f3e; border-radius: 6px; cursor: pointer;">
                    Ì≥ã Export Error Report
                </button>
            </div>
            <p style="margin-top: 30px; color: #666; font-size: 0.9em;">
                Error count: ${this.errorCount}
            </p>
        `;
        
        document.body.appendChild(fallback);
    }
    
    sendToErrorTracking(error) {
        // Send to your error tracking service (Sentry, LogRocket, etc.)
        const payload = {
            dashboard: 'AION_ARCHITECT_v4.0',
            environment: 'production',
            error: error,
            url: window.location.href,
            timestamp: new Date().toISOString()
        };
        
        // Example: Send to backend
        fetch('https://orion-d5rc.onrender.com/api/errors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(() => {
            // Silently fail if error tracking is down
        });
    }
    
    triggerEmergencyMode() {
        console.warn('ÔøΩÔøΩ EMERGENCY MODE ACTIVATED - Too many errors');
        
        // Implement emergency procedures
        this.disableComplexFeatures();
        this.enableMinimalMode();
        this.notifyAdmins();
    }
    
    disableComplexFeatures() {
        // Disable non-essential features
        const complexElements = document.querySelectorAll('[data-complex-feature]');
        complexElements.forEach(el => {
            el.style.opacity = '0.5';
            el.style.pointerEvents = 'none';
        });
    }
    
    enableMinimalMode() {
        // Switch to minimal, reliable view
        document.body.setAttribute('data-emergency-mode', 'true');
    }
    
    notifyAdmins() {
        // Notify admin team (in production)
        console.log('Ì≥ß Notifying admin team of emergency mode...');
    }
}

// Initialize error handler
window.dashboardErrorHandler = new DashboardErrorHandler();

// Global helper functions
window.showBasicMetrics = function() {
    alert('Basic metrics display would show here');
};

window.exportErrorReport = function() {
    const report = {
        errors: window.dashboardErrorHandler.errorCount,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-error-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

// Enterprise Accessibility Enhancements
class AccessibilityManager {
    constructor() {
        this.features = {
            highContrast: false,
            fontSize: 'medium',
            reduceMotion: false,
            screenReader: false
        };
        
        this.init();
    }
    
    init() {
        // Detect screen reader usage
        this.detectScreenReader();
        
        // Setup keyboard navigation
        this.setupKeyboardNavigation();
        
        // Add ARIA attributes dynamically
        this.enhanceARIA();
        
        // Setup accessibility controls
        this.setupAccessibilityControls();
    }
    
    detectScreenReader() {
        // Check for screen reader hints
        const isScreenReader = 
            window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
            document.documentElement.getAttribute('data-screenreader') === 'true' ||
            navigator.userAgent.includes('NVDA') ||
            navigator.userAgent.includes('JAWS');
        
        this.features.screenReader = isScreenReader;
        
        if (isScreenReader) {
            document.documentElement.setAttribute('data-screenreader', 'true');
            this.enableScreenReaderMode();
        }
    }
    
    enableScreenReaderMode() {
        // Add screen reader specific enhancements
        document.body.classList.add('screen-reader-optimized');
        
        // Add skip links
        this.addSkipLinks();
        
        // Enhance focus indicators
        this.enhanceFocusIndicators();
    }
    
    addSkipLinks() {
        const skipLinks = document.createElement('div');
        skipLinks.innerHTML = `
            <a href="#main-content" class="skip-link">Skip to main content</a>
            <a href="#dashboard-metrics" class="skip-link">Skip to metrics</a>
            <a href="#dashboard-controls" class="skip-link">Skip to controls</a>
        `;
        skipLinks.style.cssText = `
            position: absolute;
            top: -40px;
            left: 0;
            background: #0066ff;
            color: white;
            padding: 8px;
            z-index: 10000;
        `;
        
        skipLinks.querySelectorAll('.skip-link').forEach(link => {
            link.style.cssText = `
                color: white;
                padding: 4px 8px;
                margin-right: 10px;
            `;
        });
        
        document.body.prepend(skipLinks);
    }
    
    enhanceFocusIndicators() {
        const style = document.createElement('style');
        style.textContent = `
            *:focus {
                outline: 3px solid #0066ff !important;
                outline-offset: 2px !important;
            }
            
            button:focus, 
            a:focus, 
            input:focus, 
            select:focus {
                box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.5) !important;
            }
            
            .focus-highlight {
                position: relative;
            }
            
            .focus-highlight::after {
                content: '';
                position: absolute;
                top: -2px;
                left: -2px;
                right: -2px;
                bottom: -2px;
                border: 2px solid #0066ff;
                border-radius: 4px;
                pointer-events: none;
            }
        `;
        document.head.appendChild(style);
    }
    
    setupKeyboardNavigation() {
        // Make all interactive elements keyboard accessible
        document.addEventListener('keydown', (e) => {
            // Tab navigation enhancements
            if (e.key === 'Tab') {
                this.highlightFocusedElement(e.target);
            }
            
            // Enter/space for buttons
            if ((e.key === 'Enter' || e.key === ' ') && e.target.tagName === 'BUTTON') {
                e.preventDefault();
                e.target.click();
            }
            
            // Arrow key navigation for metric grids
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                this.handleArrowNavigation(e);
            }
        });
    }
    
    highlightFocusedElement(element) {
        // Remove previous highlights
        document.querySelectorAll('.focus-highlight').forEach(el => {
            el.classList.remove('focus-highlight');
        });
        
        // Add highlight to current element
        if (element && element.closest('[tabindex]')) {
            element.classList.add('focus-highlight');
        }
    }
    
    handleArrowNavigation(event) {
        const focusable = Array.from(document.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )).filter(el => !el.disabled && el.offsetParent !== null);
        
        const currentIndex = focusable.indexOf(document.activeElement);
        let nextIndex = currentIndex;
        
        switch(event.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                nextIndex = (currentIndex + 1) % focusable.length;
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                nextIndex = currentIndex > 0 ? currentIndex - 1 : focusable.length - 1;
                break;
        }
        
        if (nextIndex !== currentIndex) {
            focusable[nextIndex].focus();
            event.preventDefault();
        }
    }
    
    enhanceARIA() {
        // Add ARIA attributes to dynamic content
        const metrics = document.querySelectorAll('.metric-card');
        metrics.forEach((card, index) => {
            if (!card.id) {
                card.id = `metric-${index}`;
            }
            
            card.setAttribute('role', 'region');
            card.setAttribute('aria-labelledby', `metric-title-${index}`);
            
            const title = card.querySelector('.metric-title, .metric-label, h3, h4');
            if (title && !title.id) {
                title.id = `metric-title-${index}`;
            }
        });
        
        // Add live regions for dynamic updates
        this.addLiveRegions();
    }
    
    addLiveRegions() {
        const liveRegion = document.createElement('div');
        liveRole="status" aria-live="polite" aria-atomic="true";
        liveRegion.style.cssText = `
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        `;
        liveRegion.id = 'dashboard-live-region';
        document.body.appendChild(liveRegion);
        
        // Monitor for important updates
        this.monitorForLiveUpdates();
    }
    
    monitorForLiveUpdates() {
        // Watch for metric changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'characterData' || 
                    mutation.type === 'childList' ||
                    mutation.type === 'attributes') {
                    
                    // Check if this is an important metric update
                    const target = mutation.target;
                    if (target.classList && (
                        target.classList.contains('metric-value') ||
                        target.classList.contains('metric-change') ||
                        target.getAttribute('data-important') === 'true'
                    )) {
                        this.announceUpdate(target.textContent);
                    }
                }
            });
        });
        
        // Observe all metric elements
        document.querySelectorAll('.metric-value, .metric-change, [data-important]').forEach(el => {
            observer.observe(el, { 
                characterData: true, 
                childList: true, 
                subtree: true,
                attributes: true
            });
        });
    }
    
    announceUpdate(message) {
        const liveRegion = document.getElementById('dashboard-live-region');
        if (liveRegion) {
            liveRegion.textContent = message;
            // Clear after announcement
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        }
    }
    
    setupAccessibilityControls() {
        // Create accessibility toolbar
        this.createAccessibilityToolbar();
        
        // Load saved preferences
        this.loadPreferences();
    }
    
    createAccessibilityToolbar() {
        const toolbar = document.createElement('div');
        toolbar.id = 'accessibility-toolbar';
        toolbar.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #1a1f2e;
            border: 1px solid #2a2f3e;
            border-radius: 8px;
            padding: 10px;
            z-index: 9999;
            display: flex;
            gap: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        
        toolbar.innerHTML = `
            <button onclick="window.accessibilityManager.toggleHighContrast()" 
                    title="Toggle high contrast mode"
                    style="padding: 8px; background: #2a2f3e; border: none; border-radius: 4px; color: white; cursor: pointer;">
                Ìæ®
            </button>
            <button onclick="window.accessibilityManager.increaseFontSize()" 
                    title="Increase font size"
                    style="padding: 8px; background: #2a2f3e; border: none; border-radius: 4px; color: white; cursor: pointer;">
                Ì¥ç+
            </button>
            <button onclick="window.accessibilityManager.decreaseFontSize()" 
                    title="Decrease font size"
                    style="padding: 8px; background: #2a2f3e; border: none; border-radius: 4px; color: white; cursor: pointer;">
                Ì¥ç-
            </button>
            <button onclick="window.accessibilityManager.toggleReduceMotion()" 
                    title="Reduce motion"
                    style="padding: 8px; background: #2a2f3e; border: none; border-radius: 4px; color: white; cursor: pointer;">
                ‚è∏Ô∏è
            </button>
            <button onclick="window.showAccessibilityReport()" 
                    title="Accessibility report"
                    style="padding: 8px; background: #0066ff; border: none; border-radius: 4px; color: white; cursor: pointer;">
                ‚ôø
            </button>
        `;
        
        document.body.appendChild(toolbar);
    }
    
    toggleHighContrast() {
        this.features.highContrast = !this.features.highContrast;
        document.body.classList.toggle('high-contrast', this.features.highContrast);
        this.savePreferences();
        
        // Add high contrast styles
        if (this.features.highContrast) {
            const style = document.createElement('style');
            style.id = 'high-contrast-styles';
            style.textContent = `
                .high-contrast {
                    --primary: #0000ff;
                    --success: #00ff00;
                    --warning: #ffff00;
                    --danger: #ff0000;
                    --text: #000000;
                    --card-bg: #ffffff;
                }
                
                .high-contrast * {
                    color: #000000 !important;
                    background-color: #ffffff !important;
                    border-color: #000000 !important;
                }
                
                .high-contrast .metric-card {
                    border: 3px solid #000000 !important;
                }
            `;
            document.head.appendChild(style);
        } else {
            document.getElementById('high-contrast-styles')?.remove();
        }
    }
    
    increaseFontSize() {
        const sizes = ['small', 'medium', 'large', 'x-large'];
        const current = this.features.fontSize;
        const index = sizes.indexOf(current);
        if (index < sizes.length - 1) {
            this.features.fontSize = sizes[index + 1];
            document.documentElement.style.fontSize = this.getFontSizeValue(this.features.fontSize);
            this.savePreferences();
        }
    }
    
    decreaseFontSize() {
        const sizes = ['small', 'medium', 'large', 'x-large'];
        const current = this.features.fontSize;
        const index = sizes.indexOf(current);
        if (index > 0) {
            this.features.fontSize = sizes[index - 1];
            document.documentElement.style.fontSize = this.getFontSizeValue(this.features.fontSize);
            this.savePreferences();
        }
    }
    
    getFontSizeValue(size) {
        const sizes = {
            'small': '14px',
            'medium': '16px',
            'large': '18px',
            'x-large': '20px'
        };
        return sizes[size] || '16px';
    }
    
    toggleReduceMotion() {
        this.features.reduceMotion = !this.features.reduceMotion;
        document.body.classList.toggle('reduce-motion', this.features.reduceMotion);
        this.savePreferences();
        
        if (this.features.reduceMotion) {
            const style = document.createElement('style');
            style.id = 'reduce-motion-styles';
            style.textContent = `
                .reduce-motion * {
                    animation-duration: 0.001ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.001ms !important;
                }
            `;
            document.head.appendChild(style);
        } else {
            document.getElementById('reduce-motion-styles')?.remove();
        }
    }
    
    savePreferences() {
        localStorage.setItem('dashboard_accessibility', JSON.stringify(this.features));
    }
    
    loadPreferences() {
        const saved = localStorage.getItem('dashboard_accessibility');
        if (saved) {
            this.features = JSON.parse(saved);
            
            // Apply loaded preferences
            if (this.features.highContrast) {
                document.body.classList.add('high-contrast');
                this.toggleHighContrast(); // Re-apply styles
            }
            
            if (this.features.reduceMotion) {
                document.body.classList.add('reduce-motion');
                this.toggleReduceMotion(); // Re-apply styles
            }
            
            if (this.features.fontSize !== 'medium') {
                document.documentElement.style.fontSize = this.getFontSizeValue(this.features.fontSize);
            }
        }
    }
}

// Initialize accessibility manager
window.accessibilityManager = new AccessibilityManager();

// Accessibility report
window.showAccessibilityReport = function() {
    const issues = [];
    const checks = [
        {
            name: 'Image Alt Text',
            check: () => {
                const images = document.querySelectorAll('img');
                return Array.from(images).filter(img => !img.alt).length;
            },
            message: (count) => `${count} images missing alt text`
        },
        {
            name: 'Form Labels',
            check: () => {
                const inputs = document.querySelectorAll('input, select, textarea');
                return Array.from(inputs).filter(input => {
                    return !input.id || !document.querySelector(`label[for="${input.id}"]`);
                }).length;
            },
            message: (count) => `${count} form elements missing labels`
        },
        {
            name: 'Color Contrast',
            check: () => {
                // Simplified check - in production use axe-core or similar
                const lowContrast = document.querySelectorAll('[style*="color:#"], [style*="color:rgb"], [style*="color:hsl"]');
                return lowContrast.length; // This would need actual contrast checking
            },
            message: (count) => `${count} potential contrast issues`
        },
        {
            name: 'Keyboard Navigation',
            check: () => {
                const focusable = document.querySelectorAll('button, [href], input, select, textarea, [tabindex]');
                const notFocusable = Array.from(focusable).filter(el => 
                    el.tabIndex < 0 && !el.disabled
                );
                return notFocusable.length;
            },
            message: (count) => `${count} elements not keyboard accessible`
        }
    ];
    
    checks.forEach(check => {
        const count = check.check();
        if (count > 0) {
            issues.push({
                name: check.name,
                count,
                message: check.message(count)
            });
        }
    });
    
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
        <h3 style="margin-top: 0; color: #0066ff;">‚ôø Accessibility Report</h3>
        <div style="margin-bottom: 20px; color: #94a3b8;">
            Generated: ${new Date().toLocaleString()}
        </div>
    `;
    
    if (issues.length === 0) {
        html += `
            <div style="background: #00cc6633; padding: 20px; border-radius: 6px; text-align: center;">
                <div style="font-size: 2em;">‚úÖ</div>
                <div style="font-weight: bold; margin-top: 10px;">No accessibility issues found!</div>
                <div style="margin-top: 5px; font-size: 0.9em;">The dashboard meets basic accessibility requirements.</div>
            </div>
        `;
    } else {
        html += `
            <div style="background: #ff990033; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                <strong>Found ${issues.length} accessibility issues:</strong>
            </div>
            <div style="background: #0a0f1c; border-radius: 6px; padding: 15px;">
        `;
        
        issues.forEach((issue, index) => {
            html += `
                <div style="padding: 10px 0; border-bottom: ${index < issues.length - 1 ? '1px solid #2a2f3e' : 'none'};">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>${issue.name}</strong>
                            <div style="font-size: 0.9em; color: #94a3b8;">${issue.message}</div>
                        </div>
                        <button onclick="window.accessibilityManager.fixIssue('${issue.name}')" 
                                style="padding: 6px 12px; background: #2a2f3e; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9em;">
                            Fix
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += `
            </div>
        `;
    }
    
    html += `
        <div style="margin-top: 20px; text-align: right;">
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="padding: 8px 16px; background: #2a2f3e; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Close
            </button>
        </div>
    `;
    
    modal.innerHTML = html;
    document.body.appendChild(modal);
};

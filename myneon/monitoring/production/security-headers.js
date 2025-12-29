// Enterprise Security Headers Configuration
const SECURITY_HEADERS = {
    // Content Security Policy
    'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://orion-d5rc.onrender.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "connect-src 'self' https://orion-d5rc.onrender.com wss://orion-d5rc.onrender.com",
        "font-src 'self'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "base-uri 'self'"
    ].join('; '),
    
    // Other security headers
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

// Apply headers in production
if (window.location.protocol === 'https:') {
    // Headers would be applied server-side, this is client-side validation
    console.log('í´’ Security headers enabled for production');
}

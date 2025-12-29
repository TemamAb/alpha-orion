const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.ico': 'image/x-icon'
};

// Path to the production dashboard
const DASHBOARD_PATH = path.join(__dirname, 'myneon', 'monitoring', 'production', 'PRODUCTIONDASHBOARD.HTML.html');

const server = http.createServer((req, res) => {
  console.log(`í³¡ ${req.method} ${req.url}`);
  
  const parsedUrl = url.parse(req.url);
  let pathname = path.join(__dirname, parsedUrl.pathname);
  
  // Always serve the dashboard for root or any route
  if (req.url === '/' || req.url === '/dashboard' || req.url === '/index.html') {
    serveDashboard(res);
    return;
  }
  
  // For other files, check if they exist
  fs.exists(pathname, (exists) => {
    if (!exists) {
      // If file doesn't exist, still serve the dashboard
      serveDashboard(res);
      return;
    }
    
    serveFile(pathname, res);
  });
});

function serveDashboard(res) {
  fs.exists(DASHBOARD_PATH, (exists) => {
    if (exists) {
      console.log(`í¾¯ Serving dashboard: ${DASHBOARD_PATH}`);
      serveFile(DASHBOARD_PATH, res);
    } else {
      // If dashboard not found, list available files
      res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Dashboard Not Found</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
            .error { color: #dc2626; font-size: 1.2em; margin: 20px 0; }
            .path { background: #f3f4f6; padding: 10px; border-radius: 5px; font-family: monospace; }
          </style>
        </head>
        <body>
          <h1>íº¨ Dashboard File Not Found</h1>
          <p class="error">Expected path: <span class="path">${DASHBOARD_PATH}</span></p>
          <p>Looking for: myneon/monitoring/production/PRODUCTIONDASHBOARD.HTML.html</p>
          <p><a href="/">Try again</a></p>
        </body>
        </html>
      `);
    }
  });
}

function serveFile(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end('<h1>500 - Internal Server Error</h1>');
      return;
    }
    
    const ext = path.parse(filePath).ext.toLowerCase();
    const contentType = MIME_TYPES[ext] || 'text/plain';
    
    res.writeHead(200, { 
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.end(data);
  });
}

server.listen(PORT, () => {
  console.log(`íº€ Production Dashboard Server`);
  console.log(`í³¡ Port: ${PORT}`);
  console.log(`í¾¯ Dashboard: ${DASHBOARD_PATH}`);
  
  // Verify dashboard exists
  fs.exists(DASHBOARD_PATH, (exists) => {
    if (exists) {
      console.log(`âœ… Dashboard file found: ${DASHBOARD_PATH}`);
      console.log(`í³Š Ready to serve production dashboard`);
    } else {
      console.log(`âŒ Dashboard file NOT FOUND at: ${DASHBOARD_PATH}`);
      console.log(`í³ Current directory: ${__dirname}`);
      console.log(`í³„ Available files in myneon/monitoring/production/:`);
      
      const prodDir = path.join(__dirname, 'myneon', 'monitoring', 'production');
      if (fs.existsSync(prodDir)) {
        const files = fs.readdirSync(prodDir);
        files.forEach(file => console.log(`   â†’ ${file}`));
      }
    }
  });
});

process.on('SIGTERM', () => {
  console.log('Shutting down dashboard server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

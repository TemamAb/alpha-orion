const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.json': 'application/json'
};

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  
  // Parse URL
  const parsedUrl = url.parse(req.url);
  let pathname = path.join(__dirname, parsedUrl.pathname);
  
  // Default to index.html for root
  if (pathname === __dirname + '/') {
    pathname = path.join(__dirname, 'index.html');
  }
  
  // Check if file exists
  fs.exists(pathname, (exists) => {
    if (!exists) {
      // Try to find any HTML file
      fs.readdir(__dirname, (err, files) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'text/html' });
          res.end('<h1>Server Error</h1>');
          return;
        }
        
        const htmlFiles = files.filter(f => f.endsWith('.html') || f.endsWith('.HTML'));
        if (htmlFiles.length > 0) {
          // Redirect to first HTML file
          res.writeHead(302, { 'Location': `/${htmlFiles[0]}` });
          res.end();
        } else {
          // Show directory listing
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <body style="font-family: Arial, sans-serif; padding: 40px;">
                <h1>Dashboard Server</h1>
                <p>No HTML files found. Available files:</p>
                <ul>${files.map(f => `<li>${f}</li>`).join('')}</ul>
              </body>
            </html>
          `);
        }
      });
      return;
    }
    
    // Read and serve the file
    fs.readFile(pathname, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<h1>Server Error</h1>');
        return;
      }
      
      // Get file extension and set Content-Type
      const ext = path.parse(pathname).ext;
      const contentType = MIME_TYPES[ext] || 'text/plain';
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log(`íº€ Server running on port ${PORT}`);
  console.log(`í³ Serving from: ${__dirname}`);
  
  // List HTML files
  fs.readdir(__dirname, (err, files) => {
    if (!err) {
      const htmlFiles = files.filter(f => f.endsWith('.html') || f.endsWith('.HTML'));
      console.log(`í³„ HTML files: ${htmlFiles.join(', ') || 'None found'}`);
    }
  });
});

// Handle shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

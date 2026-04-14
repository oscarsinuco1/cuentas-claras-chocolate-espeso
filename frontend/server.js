const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');

console.log('Starting server...');
console.log('PORT:', PORT);
console.log('DIST_DIR:', DIST_DIR);

// Check if dist exists
if (!fs.existsSync(DIST_DIR)) {
  console.error('ERROR: dist folder does not exist!');
  process.exit(1);
}

// Check if index.html exists
const indexPath = path.join(DIST_DIR, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('ERROR: index.html does not exist!');
  process.exit(1);
}

console.log('index.html exists:', fs.existsSync(indexPath));

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0]; // Remove query strings
  console.log('Request:', req.method, url);
  
  let filePath = path.join(DIST_DIR, url === '/' ? 'index.html' : url);
  
  // If file doesn't exist or has no extension, serve index.html (SPA routing)
  const exists = fs.existsSync(filePath);
  const hasExt = path.extname(filePath) !== '';
  
  if (!exists || !hasExt) {
    filePath = indexPath;
  }
  
  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  
  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 
      'Content-Type': contentType,
      'Content-Length': content.length,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000'
    });
    res.end(content);
    console.log('Served:', filePath, content.length, 'bytes');
  } catch (err) {
    console.error('Error reading file:', filePath, err.message);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error: ' + err.message);
  }
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
  console.log('Ready to serve requests');
});

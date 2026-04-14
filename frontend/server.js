const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');

console.log('Starting Express server...');
console.log('PORT:', PORT);
console.log('DIST_DIR:', DIST_DIR);

// Serve static files from dist
app.use(express.static(DIST_DIR, {
  maxAge: '1y',
  etag: true
}));

// SPA fallback - serve index.html for all routes
app.get('*', (req, res) => {
  console.log('Request:', req.method, req.url);
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Express server listening on http://0.0.0.0:${PORT}`);
});


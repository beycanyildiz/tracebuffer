const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const reportsMap = new Map();

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // Ingestion Endpoint: POST /api/reports
  if (req.method === 'POST' && pathname === '/api/reports') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        reportsMap.set(payload.id, payload);
        console.log(`[Server] Received Error Report: ID=${payload.id} | Msg="${payload.error?.message}" | Events=${payload.events?.length || 0}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', id: payload.id }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // Get Reports List: GET /api/reports
  if (req.method === 'GET' && pathname === '/api/reports') {
    const list = Array.from(reportsMap.values()).map(r => ({
      id: r.id,
      timestamp: r.timestamp,
      url: r.url,
      userAgent: r.userAgent,
      error: r.error,
      eventCount: r.events ? r.events.length : 0,
    }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(list));
    return;
  }

  // Get Specific Report: GET /api/reports/:id
  if (req.method === 'GET' && pathname.startsWith('/api/reports/')) {
    const id = pathname.replace('/api/reports/', '');
    const report = reportsMap.get(id);
    if (report) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(report));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Report not found' }));
    }
    return;
  }

  // Serve static files for Dashboard / SDK bundle
  let filePath = path.join(__dirname, '..', pathname);
  if (pathname === '/' || pathname === '/dashboard') {
    filePath = path.join(__dirname, '..', 'dashboard', 'index.html');
  } else if (pathname === '/demo') {
    filePath = path.join(__dirname, '..', 'demo', 'index.html');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
    };
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Session Replayer Ingestion Server running at:`);
  console.log(`   ➜ Local: http://localhost:${PORT}`);
  console.log(`   ➜ Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`   ➜ Demo App:  http://localhost:${PORT}/demo`);
  console.log(`=======================================================`);
});

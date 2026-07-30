const fs = require('fs');
const path = require('path');

const TMP_FILE = path.join('/tmp', 'tracebuffer_reports.json');

// Helper to read stored reports
function getReports() {
  try {
    if (fs.existsSync(TMP_FILE)) {
      const data = fs.readFileSync(TMP_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading tmp store:', e);
  }

  // Pre-seeded demo reports if store is empty
  return {
    'demo_err_01': {
      id: 'demo_err_01',
      timestamp: Date.now() - 15000,
      url: 'https://tracebuffer.vercel.app/demo',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      viewport: { width: 1280, height: 720 },
      error: {
        message: "TypeError: Cannot read properties of null (reading 'nonExistentMethod')",
        stack: "TypeError: Cannot read properties of null (reading 'nonExistentMethod')\n    at triggerNullError (https://tracebuffer.vercel.app/demo:284:11)\n    at HTMLButtonElement.onclick (https://tracebuffer.vercel.app/demo:148:65)",
        type: 'uncaught_exception'
      },
      initialSnapshot: {
        id: 1,
        tagName: 'html',
        attributes: {},
        children: [
          { id: 2, tagName: 'head', attributes: {}, children: [] },
          { id: 3, tagName: 'body', attributes: { style: 'background: #0b0f19; color: #fff; padding: 40px; font-family: sans-serif;' }, children: [
            { id: 4, tagName: 'h1', attributes: { style: 'color: #a5b4fc;' }, children: ['E-Commerce Test Demo App'] },
            { id: 5, tagName: 'p', attributes: { style: 'color: #9ca3af;' }, children: ['User typed password (masked) and clicked failing button.'] },
            { id: 6, tagName: 'button', attributes: { style: 'background: #ef4444; color: #fff; padding: 12px 20px; border-radius: 6px; border: none;' }, children: ['💥 Uncaught Null Exception'] }
          ]}
        ]
      },
      events: [
        { id: 'ev1', type: 'MOUSE_MOVE', timestamp: Date.now() - 9000, data: { x: 150, y: 120 } },
        { id: 'ev2', type: 'CLICK', timestamp: Date.now() - 8000, data: { x: 150, y: 120, tagName: 'INPUT' } },
        { id: 'ev3', type: 'INPUT', timestamp: Date.now() - 7000, data: { targetId: 6, value: '***' } },
        { id: 'ev4', type: 'NETWORK', timestamp: Date.now() - 5000, data: { url: '/api/fake-failing-endpoint-500', method: 'POST', status: 500, duration: 140 } },
        { id: 'ev5', type: 'MOUSE_MOVE', timestamp: Date.now() - 3000, data: { x: 220, y: 180 } },
        { id: 'ev6', type: 'CLICK', timestamp: Date.now() - 1000, data: { x: 220, y: 180, tagName: 'BUTTON' } }
      ]
    }
  };
}

function saveReports(reports) {
  try {
    fs.writeFileSync(TMP_FILE, JSON.stringify(reports), 'utf8');
  } catch (e) {
    console.error('Error writing tmp store:', e);
  }
}

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const url = req.url || '';

  // POST /api/reports
  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }

    if (!body || !body.id) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const reports = getReports();
    reports[body.id] = body;
    saveReports(reports);

    console.log(`[Vercel Ingestion] Report saved: ID=${body.id}`);
    return res.status(200).json({ status: 'ok', id: body.id });
  }

  // GET /api/reports/:id
  if (req.method === 'GET' && url.includes('/api/reports/')) {
    const id = url.split('/api/reports/')[1]?.split('?')[0];
    const reports = getReports();
    if (reports[id]) {
      return res.status(200).json(reports[id]);
    }
    return res.status(404).json({ error: 'Report not found' });
  }

  // GET /api/reports
  if (req.method === 'GET') {
    const reports = getReports();
    const list = Object.values(reports).map(r => ({
      id: r.id,
      timestamp: r.timestamp,
      url: r.url,
      userAgent: r.userAgent,
      error: r.error,
      eventCount: r.events ? r.events.length : 0,
    }));
    return res.status(200).json(list);
  }

  return res.status(404).json({ error: 'Not Found' });
};
